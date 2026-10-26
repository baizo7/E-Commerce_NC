# NexaMarket REST API Specification

The API is fully documented via OpenAPI 3.0 and interactive Swagger UI at `/api/docs/`.

Base URL: `http://127.0.0.1:8000/api`

---

## 1. Authentication & User Profile

### `POST /auth/register/`
Registers a new customer or vendor account.
- **Request Body (Customer):**
```json
{
  "email": "customer@example.com",
  "password": "Password@123",
  "first_name": "Sarah",
  "last_name": "Jenkins",
  "role": "CUSTOMER",
  "phone": "+1 (555) 234-5678"
}
```
- **Request Body (Vendor):**
```json
{
  "email": "vendor@example.com",
  "password": "Password@123",
  "first_name": "Alex",
  "last_name": "Chen",
  "role": "VENDOR",
  "store_name": "TechNova Electronics",
  "store_description": "Curated electronics and audio gear."
}
```
- **Response:** `201 Created`

### `POST /auth/token/`
Obtains JWT access and refresh token pair.
- **Request Body:**
```json
{
  "email": "customer@example.com",
  "password": "Password@123"
}
```
- **Response:** `200 OK`
```json
{
  "access": "eyJhbGciOi...",
  "refresh": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "email": "customer@example.com",
    "role": "CUSTOMER"
  }
}
```

### `GET /auth/me/`
Returns the authenticated user's profile and vendor profile (if applicable).
- **Headers:** `Authorization: Bearer <access_token>`

---

## 2. Product Catalog & Categories

### `GET /categories/`
Retrieves all active product categories with live product count aggregations.
- **Response:** `200 OK`

### `GET /products/`
Retrieves products approved by administrators and belonging to active vendors.
- **Query Parameters:**
  - `search` (string): Title, description, or vendor name keyword
  - `category` (string): Category slug or ID
  - `vendor` (string): Vendor slug or ID
  - `min_price`, `max_price` (numeric)
  - `in_stock` (boolean)
  - `featured` (boolean)
  - `sort`: `newest` (default), `price_asc`, `price_desc`, `rating`
- **Response:** `200 OK` (Paginated)

### `GET /products/<slug>/`
Detailed view of a product, including high-resolution images, vendor details, and customer reviews.

### `POST /products/<slug>/reviews/`
Submits a customer rating and review for a product.
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "rating": 5,
  "title": "Exceptional sound quality",
  "comment": "Crisp acoustic resolution and superb active noise cancellation."
}
```

---

## 3. Cart & Multi-Vendor Checkout

### `GET /cart/`
Retrieves current customer's shopping cart grouped by participating vendors.
- **Headers:** `Authorization: Bearer <token>`
- **Response:** `200 OK`
```json
{
  "id": 1,
  "items": [...],
  "total_items": 2,
  "subtotal": "249.99",
  "vendors_involved": [
    {
      "id": 1,
      "store_name": "TechNova Electronics",
      "items_count": 1,
      "subtotal": 249.99
    }
  ]
}
```

### `POST /cart/`
Adds an item or increments quantity in customer's cart.
- **Request Body:** `{"product_id": 2, "quantity": 1}`

### `PATCH /cart/items/<id>/`
Updates quantity of a specific cart item (`0` deletes the item).

### `POST /orders/checkout/`
Executes transactional checkout with atomic row-level inventory locking and automatic multi-vendor order splitting.
- **Request Body:**
```json
{
  "shipping_name": "Sarah Jenkins",
  "shipping_email": "customer@example.com",
  "shipping_phone": "+1 (555) 234-5678",
  "shipping_address": "742 Evergreen Terrace",
  "shipping_city": "Springfield",
  "shipping_state": "OR",
  "shipping_postal_code": "97477",
  "shipping_country": "United States",
  "payment_method": "CREDIT_CARD"
}
```
- **Response:** `201 Created` (Master Order + `vendor_orders` sub-orders)

---

## 4. Vendor Portal Endpoints

- `GET /vendor/products/` - List products belonging to authenticated vendor.
- `POST /vendor/products/` - Create a new product listing with image URLs.
- `PATCH /vendor/products/<id>/` - Update product details or restock inventory.
- `DELETE /vendor/products/<id>/` - Remove product from store catalog.
- `GET /vendor/orders/` - Retrieve sub-orders allocated to this vendor.
- `PATCH /vendor/orders/<id>/status/` - Fulfill sub-order with carrier and tracking number:
  ```json
  {
    "status": "SHIPPED",
    "carrier": "FedEx Express",
    "tracking_number": "FDX-9988776655"
  }
  ```
- `GET /vendor/analytics/` - Gross sales, net payouts after commission, and inventory alerts.

---

## 5. Admin Portal Endpoints

- `GET /admin/vendors/` - Review vendor accounts with status filter.
- `PATCH /admin/vendors/<id>/status/` - Approve, Suspend, or Reject vendor, set platform fee rate:
  ```json
  {
    "status": "APPROVED",
    "commission_rate": 10.00
  }
  ```
- `GET /admin/products/` - Platform-wide product moderation.
- `PATCH /admin/products/<id>/moderate/` - Delist, approve, or feature products.
- `GET /admin/orders/` - Global platform order monitoring and audit.
- `GET /admin/analytics/` - Overall GMV, total commissions collected, and merchant leaderboard.
