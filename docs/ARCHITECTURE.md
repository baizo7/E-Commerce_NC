# Modern Shop Multi-Vendor Architecture Specification

This document provides a comprehensive technical architecture and data design specification for the **Modern Shop Multi-Vendor E-Commerce Marketplace**, developed with React, Vite, TypeScript, Django REST Framework (DRF), and PostgreSQL.

---

## 1. System Architecture Overview

The system is designed as a decoupled, multi-tiered web architecture adhering to the 12-Factor App methodology.

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (React 19 + TypeScript + Vite)"]
        CP["Customer Portal\n- Catalog Browsing\n- Multi-Vendor Cart\n- Checkout & Tracking"]
        VP["Vendor Portal\n- Storefront Management\n- Product CRUD & Inventory\n- Sub-Order Fulfillment"]
        AP["Admin Portal\n- Vendor Moderation\n- Product Moderation\n- GMV & Platform Ledger"]
    end

    subgraph Gateway ["API Gateway & Transport"]
        ViteProxy["Vite Reverse Proxy / Nginx\n(:5173 / :80)"]
        CORS["Django CORS Headers Middleware"]
        JWT["JWT Authentication & RBAC Filter"]
    end

    subgraph ServiceLayer ["Django REST Framework Backend (:8000)"]
        subgraph AccountsApp ["apps.accounts"]
            AuthService["User & Token Service"]
            VendorService["Vendor Profile & Moderation"]
        end
        subgraph ProductsApp ["apps.products"]
            CatalogService["Category & Product Management"]
            ReviewService["Product Reviews & Aggregation"]
        end
        subgraph OrdersApp ["apps.orders"]
            CartService["Multi-Vendor Shopping Cart"]
            OrderService["Atomic Checkout Engine\n(select_for_update locking)"]
            SplitService["Multi-Vendor Sub-Order Splitter"]
        end
        subgraph AnalyticsApp ["apps.analytics"]
            VendorAnalytics["Vendor Earnings & Sales Metrics"]
            AdminAnalytics["Platform GMV & Commission Ledger"]
        end
    end

    subgraph DatabaseLayer ["Persistence & Storage Layer"]
        PostgresDB[("PostgreSQL Database\n(Transactional Engine)")]
        MediaStorage[("Media & Static Assets")]
    end

    CP --> ViteProxy
    VP --> ViteProxy
    AP --> ViteProxy
    ViteProxy --> CORS --> JWT
    JWT --> AuthService
    JWT --> VendorService
    JWT --> CatalogService
    JWT --> ReviewService
    JWT --> CartService
    JWT --> OrderService
    JWT --> SplitService
    JWT --> VendorAnalytics
    JWT --> AdminAnalytics

    AuthService --> PostgresDB
    VendorService --> PostgresDB
    CatalogService --> PostgresDB
    OrderService --> PostgresDB
    SplitService --> PostgresDB
    CatalogService --> MediaStorage
```

---

## 2. Entity-Relationship Diagram (ERD)

The database schema models the multi-vendor marketplace with explicit order splitting, snapshot preservation, and vendor ledger calculations.

```mermaid
erDiagram
    User ||--o| VendorProfile : "owns (1:1 if vendor)"
    User ||--o| Cart : "owns"
    User ||--o{ Order : "places"
    User ||--o{ Review : "writes"

    VendorProfile ||--o{ Product : "sells"
    VendorProfile ||--o{ VendorOrder : "fulfills"
    VendorProfile ||--o{ OrderItem : "supplies"

    Category ||--o{ Product : "classifies"

    Product ||--o{ ProductImage : "has images"
    Product ||--o{ Review : "receives"
    Product ||--o{ CartItem : "in cart"
    Product ||--o{ OrderItem : "ordered"

    Cart ||--o{ CartItem : "contains"

    Order ||--o{ VendorOrder : "splits into"
    Order ||--o{ OrderItem : "contains master items"

    VendorOrder ||--o{ OrderItem : "contains merchant items"

    User {
        int id PK
        string email UK
        string role "CUSTOMER | VENDOR | ADMIN"
        string first_name
        string last_name
        string phone
        string address
        string city
        string postal_code
    }

    VendorProfile {
        int id PK
        int user_id FK
        string store_name UK
        string slug UK
        string description
        string logo_url
        string banner_url
        string status "PENDING | APPROVED | REJECTED | SUSPENDED"
        decimal commission_rate
        decimal rating
        decimal total_sales
    }

    Category {
        int id PK
        string name
        string slug UK
        string description
        string image_url
        boolean is_active
    }

    Product {
        int id PK
        int vendor_id FK
        int category_id FK
        string title
        string slug UK
        decimal price
        decimal compare_at_price
        string sku
        int inventory_count
        int low_stock_threshold
        boolean is_active
        boolean is_approved
        boolean is_featured
        decimal rating
        int review_count
    }

    Order {
        int id PK
        string order_number UK
        int customer_id FK
        decimal total_items_amount
        decimal shipping_amount
        decimal tax_amount
        decimal grand_total
        string status "CONFIRMED | PROCESSING | SHIPPED | DELIVERED"
        string payment_status "PAID | PENDING | FAILED"
        string payment_method
        string shipping_name
        string shipping_address
    }

    VendorOrder {
        int id PK
        int order_id FK
        int vendor_id FK
        decimal subtotal
        decimal commission_rate
        decimal commission_amount
        decimal net_vendor_amount
        string status "PROCESSING | SHIPPED | DELIVERED"
        string tracking_number
        string carrier
        datetime shipped_at
    }

    OrderItem {
        int id PK
        int order_id FK
        int vendor_order_id FK
        int product_id FK
        int vendor_id FK
        string product_title
        decimal price
        int quantity
        decimal subtotal
    }
```

---

## 3. Multi-Vendor Transactional Order Splitting Lifecycle

When a customer completes checkout with items from multiple distinct merchants, the system executes an atomic transaction with concurrency locks.

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Frontend as React Client
    participant OrderAPI as Order Checkout API
    participant DB as PostgreSQL Transaction
    actor Vendor1 as Vendor A (TechNova)
    actor Vendor2 as Vendor B (Artisan Living)

    Customer->>Frontend: Clicks "Place Order"
    Frontend->>OrderAPI: POST /api/orders/checkout/ (Shipping & Payment)
    Note over OrderAPI,DB: BEGIN transaction.atomic()
    OrderAPI->>DB: Product.objects.select_for_update().filter(id__in=...)
    DB-->>OrderAPI: Locked Product Rows Acquired
    OrderAPI->>OrderAPI: Validate inventory_count >= quantity for each item
    OrderAPI->>DB: Create Master Order (ORD-20261026-XXXX)
    
    rect rgb(240, 248, 255)
        Note over OrderAPI,DB: Vendor A Sub-Order Processing
        OrderAPI->>DB: Calculate Vendor A Subtotal & Platform Commission (10%)
        OrderAPI->>DB: Create VendorOrder A (Status: PROCESSING)
        OrderAPI->>DB: Create OrderItem A (Snapshot title, price)
        OrderAPI->>DB: Decrement Vendor A Product Stock
        OrderAPI->>DB: Increment Vendor A Total Sales
    end

    rect rgb(255, 248, 240)
        Note over OrderAPI,DB: Vendor B Sub-Order Processing
        OrderAPI->>DB: Calculate Vendor B Subtotal & Platform Commission (12%)
        OrderAPI->>DB: Create VendorOrder B (Status: PROCESSING)
        OrderAPI->>DB: Create OrderItem B (Snapshot title, price)
        OrderAPI->>DB: Decrement Vendor B Product Stock
        OrderAPI->>DB: Increment Vendor B Total Sales
    end

    OrderAPI->>DB: Clear Customer Cart Items
    Note over OrderAPI,DB: COMMIT Transaction
    OrderAPI-->>Frontend: HTTP 201 Created (Full Order with Split Sub-Orders)
    Frontend-->>Customer: Display Order Success & Itemized Packages

    par Independent Merchant Fulfillment
        Vendor1->>OrderAPI: PATCH /api/vendor/orders/1/status/ (Shipped with FedEx Tracking)
        and
        Vendor2->>OrderAPI: PATCH /api/vendor/orders/2/status/ (Shipped with UPS Tracking)
    end
```

---

## 4. Security & Role-Based Access Control (RBAC)

1. **Authentication:**
   - Stateless JWT authentication via `djangorestframework-simplejwt`.
   - Access tokens stored in client browser storage and passed in HTTP header: `Authorization: Bearer <token>`.
2. **Server-Side Permission Matrices:**
   - `IsAdminUserRole`: Restricts vendor approvals, category administration, and platform-wide order audits.
   - `IsVendorUser`: Ensures only approved vendors can access vendor APIs.
   - `IsVendorOwnerOrReadOnly`: Verifies that vendors can modify only products and fulfillment orders that belong to their own store.
3. **Transactional Integrity:**
   - Database row-level locking via `select_for_update()` inside `transaction.atomic()` blocks prevents overselling and race conditions during high-concurrency checkouts.
