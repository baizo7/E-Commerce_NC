# Modern Shop Deployment & 10-Day MVP Timeline Guide

---

## 1. 10-Working-Day MVP Development Timeline

| Day | Milestone / Focus | Deliverables Completed |
|---|---|---|
| **Day 1** | Requirements Analysis & DB Architecture | ERD design, schema definitions, model relationships (User, Vendor, Category, Product, Cart, Order, VendorOrder). |
| **Day 2** | Backend Foundation & Auth | Django setup, custom User model, JWT Authentication, CORS, and role-based permissions (`IsVendor`, `IsAdmin`). |
| **Day 3** | Vendor Onboarding & Management | VendorProfile model, vendor registration endpoint, approval workflow, and vendor self-profile management APIs. |
| **Day 4** | Product Catalog & Inventory | Category management, Product CRUD, image gallery relationships, search and multi-faceted filtering endpoints. |
| **Day 5** | Multi-Vendor Cart & Atomic Checkout | Cart APIs, transactional checkout with `select_for_update()` row-level locking, automated order splitting into `VendorOrder` sub-orders. |
| **Day 6** | Fulfillment & Commissions | Vendor tracking updates, carrier tagging, automated platform fee calculation (10% commission), customer shipment tracking. |
| **Day 7** | Frontend Setup & Customer Storefront | React + Vite + TypeScript setup, Tailwind CSS styling, responsive Navbar, Homepage, Product Catalog, and Detail pages. |
| **Day 8** | Customer Shopping & Checkout Flow | Cart state management with vendor package groupings, multi-step checkout form, payment method simulations, and order confirmation. |
| **Day 9** | Vendor & Admin Portals | Vendor Dashboard (KPIs, product inventory table, fulfillment updates, earnings ledger) and Admin Portal (vendor approvals, catalog moderation, global order audit). |
| **Day 10** | Integration Testing, Seeding & Polish | Automated DRF unit test suite (9 test cases passed), comprehensive demo seed data, OpenAPI 3 / Swagger docs, and production deployment scripts. |

---

## 2. Docker Compose Deployment Specification

Create a `docker-compose.yml` file in the project root:

```yaml
version: '3.9'

services:
  db:
    image: postgres:16-alpine
    container_name: nexamarket_db
    restart: always
    environment:
      POSTGRES_DB: marketplace_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_postgres_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: nexamarket_backend
    restart: always
    command: >
      sh -c "python manage.py migrate &&
             python seed_data.py &&
             gunicorn marketplace_core.wsgi:application --bind 0.0.0.0:8000 --workers 4"
    environment:
      - DEBUG=False
      - DJANGO_SECRET_KEY=production-secret-key-change-me
      - DB_ENGINE=postgresql
      - POSTGRES_DB=marketplace_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=secure_postgres_password
      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
    depends_on:
      - db
    ports:
      - "8000:8000"
    volumes:
      - ./backend/media:/app/media
      - ./backend/staticfiles:/app/staticfiles

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: nexamarket_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 3. Environment Variables Reference

Create a `.env` file in `backend/`:

```ini
# Django Settings
DJANGO_SECRET_KEY=production-secret-key-change-me
DEBUG=True

# Database Configuration (PostgreSQL)
DB_ENGINE=sqlite # Switch to 'postgresql' for production
POSTGRES_DB=marketplace_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

---

## 4. Production Checklist

1. **Security:**
   - Set `DEBUG=False` in production.
   - Restrict `ALLOWED_HOSTS` to your registered domain.
   - Configure HTTPS with Let's Encrypt SSL certificates.
2. **Database:**
   - Run on managed PostgreSQL (AWS RDS, Google Cloud SQL, or Supabase).
   - Enable automated backups and point-in-time recovery.
3. **Static & Media Files:**
   - Serve static assets via Amazon S3 or Google Cloud Storage using `django-storages`.
