# NexaMarket – Multi-Vendor E-Commerce Marketplace

An enterprise-grade, scalable **Multi-Vendor E-Commerce Marketplace** built with **React, Vite, TypeScript, Django REST Framework (DRF), and PostgreSQL**.

The platform provides three independent portals:
1. **Customer Portal:** Catalog search & filtering, persistent cart with multi-vendor grouping, transactional checkout with atomic row-level inventory locks, and shipment tracking.
2. **Vendor Portal:** Store profile branding, product catalog management (CRUD), low-stock warnings, multi-vendor sub-order fulfillment with carrier tracking codes, and payout earnings ledger.
3. **Admin Portal:** Merchant onboarding moderation (Approve / Reject / Suspend), platform fee rate adjustments, catalog moderation, global order audit, and platform GMV & commission metrics.

---

## Architecture & Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM, Axios.
- **Backend:** Python 3.13, Django 5.1, Django REST Framework (DRF), SimpleJWT, Django CORS Headers, drf-spectacular (OpenAPI 3 / Swagger).
- **Database:** PostgreSQL (with automated fallback to SQLite for immediate zero-config local testing).
- **Security:** Stateless JWT authentication, role-based access control (RBAC), and `select_for_update()` transactional concurrency locking.

---

## Quick Demo Credentials (Pre-seeded)

Use the top banner **One-Click Quick Persona** buttons or sign in manually with these pre-seeded accounts:

| Portal / Role | Email | Password | Details |
|---|---|---|---|
| **Customer** | `customer@example.com` | `Customer@123` | Active customer with previous purchase history and cart. |
| **Vendor** | `vendor@example.com` | `Vendor@123` | **TechNova Electronics** (High-tech audio & computing store). |
| **Vendor 2** | `vendor2@example.com` | `Vendor@123` | **Artisan Living & Home** (Handcrafted ceramics & decor). |
| **Vendor 3** | `vendor3@example.com` | `Vendor@123` | **Aura Apparel & Style** (Designer streetwear & leather goods). |
| **Platform Admin** | `admin@example.com` | `Admin@123` | Full superuser with moderation and ledger access. |

---

## Getting Started

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend and create virtual environment
cd backend
python -m venv ../.venv
../.venv/Scripts/pip install -r requirements.txt

# Run migrations
../.venv/Scripts/python manage.py migrate

# Seed database with demo vendors, products, reviews, and split orders
../.venv/Scripts/python seed_data.py

# Run backend test suite
../.venv/Scripts/python manage.py test

# Start Django Development Server
../.venv/Scripts/python manage.py runserver 127.0.0.1:8000
```

### 3. Frontend Setup
```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

Visit the platform in your browser at: **`http://127.0.0.1:5173/`**  
Access interactive Swagger API documentation at: **`http://127.0.0.1:8000/api/docs/`**  
Django Admin panel at: **`http://127.0.0.1:8000/admin/`**

---

## Key Multi-Vendor Innovations

- **Multi-Vendor Order Splitting:** When a shopper checks out items from multiple independent stores, the platform generates a master `Order` and automatically splits line items into autonomous `VendorOrder` sub-orders.
- **Atomic Stock Reservation:** Avoids race conditions and over-selling by acquiring row-level database locks using `select_for_update()` inside `transaction.atomic()` during checkout.
- **Independent Merchant Fulfillment:** Each vendor manages only their slice of an order, provides their own courier tracking number, and receives their net payout after platform commission (10–12%) deduction.
- **Unified Customer Experience:** Shoppers enjoy a single cart, one payment transaction, and transparent multi-package delivery tracking.

---

## Technical Documentation

- [Architecture & ERD Diagrams](docs/ARCHITECTURE.md)
- [REST API Specifications](docs/API_SPEC.md)
- [Deployment & 10-Day MVP Timeline](docs/DEPLOYMENT.md)
