# Modern Shop — Multi-Vendor E-Commerce Platform

A production-grade, multi-vendor e-commerce marketplace built with **Django REST Framework (DRF)** and **React 19 + TypeScript + Tailwind CSS**, designed around the **Blocksy Modern Shop** aesthetic (`#0a0500`, `#ffcd05`, `#504e4a`).

The platform provides unified cart checkouts, autonomous merchant management, and comprehensive marketplace administration.

---

## Portals & Core Modules

### 1. Customer Marketplace
- **Curated Catalog:** Faceted filtering by category, merchant store, price thresholds, stock availability, and rating.
- **Unified Multi-Vendor Cart:** Grouped shopping cart allowing items from multiple independent vendors to be purchased in a single checkout transaction.
- **Payment Verification:** Resilient Razorpay integration with automated sandbox simulator fallback for rapid local development without real merchant credentials.
- **Order & Dispatch Tracking:** Real-time fulfillment status per package (`CONFIRMED` &rarr; `PROCESSING` &rarr; `SHIPPED` &rarr; `DELIVERED`).
- **Profile & Local Media:** Customer account settings with direct local image avatar uploads.

### 2. Merchant Operations Portal (`/vendor/*`)
- **Executive Merchant Dashboard:** Real-time gross volume, net payout calculations (gross minus platform commission), and low-stock alerts.
- **7-Day Velocity Chart:** High-contrast trajectory chart tracking daily net payouts and package volumes.
- **Inventory & Media Governance:** Full CRUD for catalog listings with native local device photo upload dropzones (JPEG, PNG, WEBP, GIF up to 5MB).
- **Fulfillment & Logistics:** Order split management with carrier selection (`FedEx`, `UPS`, `DHL`, `BlueDart`), tracking number assignment, and printable packing slips.
- **Settlement Ledger:** Timestamped historical payout breakdown and one-click master CSV export.
- **Storefront Branding:** Local logo and banner uploads, store bio, and banking/tax payout configuration.

### 3. Marketplace Administration (`/admin/*`)
- **Executive Command Center:** Operational moderation queue, live 7-day platform GMV vs. commission split chart, and taxonomy distribution.
- **Merchant Onboarding & Audit:** Merchant dossier inspection (bank accounts, routing numbers, Tax ID, warehouse locations), and rationale-based suspensions with automated email dispatch.
- **Catalog Governance:** Faceted catalog filters by merchant and category, product dossier modal, and bulk moderation actions (Approve, Delist, Feature).
- **Taxonomy Architecture:** Category hierarchy management with native local cover photo upload dropzones.
- **Settlement Reconciliation & Escrow:** Individual vendor sub-order payout release with banking reference IDs (`UTR`, `NEFT`, `ACH`) and master platform CSV ledger export.
- **User Directory & RBAC:** Comprehensive platform user directory with lifetime customer spend metrics, order history, and one-click role elevation (`CUSTOMER` &harr; `VENDOR` &harr; `ADMIN`).
- **Notification Audit Log:** Real-time log of all platform transactional emails dispatched via live SMTP.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, Lucide Icons, React Router 7, Axios |
| **Backend** | Python 3.13, Django 5.1, Django REST Framework, SimpleJWT, CORS Headers, drf-spectacular |
| **Database** | PostgreSQL (with automatic SQLite fallback for zero-config local testing) |
| **Payments** | Razorpay SDK + Automated Local Sandbox Simulator |
| **Notifications** | Django SMTP with live HTML/plain-text email templates |

---

## Quick Start & Local Setup

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to project root
cd D:\projects\Nexacraft\E-Commerce

# Activate virtual environment
.\.venv\Scripts\activate

# Apply migrations
python backend\manage.py migrate

# Seed database with sample vendors, categories, products, and orders
python backend\seed_data.py

# Run unit tests
python backend\manage.py test apps.accounts apps.products apps.orders apps.analytics

# Start backend server
python backend\manage.py runserver 127.0.0.1:8000
```

### 3. Frontend Setup
```bash
# In a new terminal window
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The application will be live at:
- **Marketplace Web App:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)
- **Backend API & Admin:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)

---

## Verified Demo Accounts

| Role | Email | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `sanjaisam63@gmail.com` | `Admin@123` | Full superuser access to `/admin/*`, executive analytics, and payouts. |
| **Secondary Administrator** | `admin@modernshop.internal` | `Admin@123` | Internal operational administrator. |
| **Primary Merchant** | `sanjaidhonicsk@gmail.com` | `Vendor@123` | **Sanjai Modern Tech & Audio** storefront owner. |
| **Demo Merchant** | `vendor@example.com` | `Vendor@123` | **TechNova Electronics** storefront owner. |
| **Customer Shopper** | `customer@example.com` | `Customer@123` | Buyer account with pre-filled shopping bag and order history. |

---

## Repository Structure

```
├── backend/
│   ├── apps/
│   │   ├── accounts/          # User authentication, RBAC, merchant profiles
│   │   ├── analytics/         # Platform GMV velocity and vendor metrics
│   │   ├── orders/            # Unified cart, checkout splits, payments, emails
│   │   └── products/          # Catalog governance, taxonomy, local uploads
│   ├── marketplace_core/      # Django settings, WSGI/ASGI, root router
│   ├── media/                 # Local device uploads (avatars, stores, products)
│   ├── manage.py
│   └── seed_data.py
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components (Modern Shop palette)
│   │   ├── context/           # Auth and Cart reactive providers
│   │   ├── pages/
│   │   │   ├── admin/         # 6-page Admin portal suite
│   │   │   ├── vendor/        # Merchant operational views
│   │   │   ├── customer/      # Marketplace buyer pages
│   │   │   └── auth/          # Authentication flows
│   │   ├── services/          # Typed API client with auto token refresh
│   │   └── types/             # Shared TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── docs/                      # Technical specifications & architecture diagrams
└── README.md
```

---

## License & Attribution
Developed for the Nexacraft Multi-Vendor E-Commerce Platform. Built with modern engineering best practices, atomic database transactions (`select_for_update`), and accessible design standards.
