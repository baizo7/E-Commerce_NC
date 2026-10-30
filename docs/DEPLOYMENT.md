# Modern Shop — Production Cloud Deployment Guide

This guide covers deploying the **Modern Shop Multi-Vendor Marketplace** (React 19 + TypeScript frontend, Django REST Framework backend, and PostgreSQL database) to **Render** using the turnkey Blueprint specification (`render.yaml`).

---

## Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │          RENDER CLOUD PLATFORM       │
                      │                                      │
  Users / Shoppers ──▶│  [Frontend Static Site]             │
                      │  https://modernshop-frontend.onrender.com
                      │         │ (rewrites /api/*)          │
                      │         ▼                            │
                      │  [Django REST Backend Web Service]   │
                      │  https://modernshop-backend.onrender.com
                      │         │                            │
                      │         ▼                            │
                      │  [Render Managed PostgreSQL]         │
                      │  modernshop-db                       │
                      └──────────────────────────────────────┘
```

---

## Method 1: Turnkey Blueprint Deployment via Render (Recommended)

The repository includes a ready-to-use [`render.yaml`](file:///D:/projects/Nexacraft/E-Commerce/render.yaml) that automatically provisions:
1. **Managed PostgreSQL Database** (`modernshop-db`)
2. **Django Gunicorn Web Service** (`modernshop-backend`) with automated migrations, WhiteNoise static files, and database seeding
3. **React Single Page App** (`modernshop-frontend`) with built-in path rewrites to `/api/` and client-side routing

### Step-by-Step Instructions:

1. **Push your code to GitHub:**
   Ensure all changes are pushed to your remote repository (e.g., `https://github.com/baizo7/E-Commerce_NC`).

2. **Log in to Render:**
   Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in with your GitHub account.

3. **Deploy with Blueprint:**
   * Click **New +** in the top right corner.
   * Select **Blueprint**.
   * Connect your GitHub repository (`E-Commerce_NC`).
   * Render will automatically detect [`render.yaml`](file:///D:/projects/Nexacraft/E-Commerce/render.yaml) and display the 3 services:
     - `modernshop-db` (PostgreSQL)
     - `modernshop-backend` (Django API)
     - `modernshop-frontend` (Static React Site)
   * Click **Apply**.

4. **Automated Provisioning:**
   Render will now:
   * Create the PostgreSQL database.
   * Run [`build.sh`](file:///D:/projects/Nexacraft/E-Commerce/build.sh) on the backend (installs dependencies, collects static assets via WhiteNoise, runs migrations, and populates initial categories, vendors, and products via `seed_data.py`).
   * Start Gunicorn on `0.0.0.0:$PORT`.
   * Build the React frontend bundle (`npm run build`) and serve it through Render's global CDN.

---

## Method 2: Manual Service Creation on Render

If you prefer to configure each service manually in the Render dashboard:

### 1. Database (PostgreSQL)
* Click **New +** &rarr; **PostgreSQL**.
* **Name:** `modernshop-db`
* **Database:** `marketplace_db`
* **User:** `postgres`
* **Plan:** Free
* Click **Create Database**. Copy the **Internal Database URL** once provisioned.

### 2. Backend (Web Service)
* Click **New +** &rarr; **Web Service**.
* Connect your GitHub repository.
* **Name:** `modernshop-backend`
* **Runtime:** `Python 3`
* **Build Command:** `./build.sh`
* **Start Command:** `gunicorn --chdir backend marketplace_core.wsgi:application --bind 0.0.0.0:$PORT --workers 3 --timeout 60`
* **Environment Variables:**
  * `PYTHON_VERSION`: `3.12.8`
  * `DEBUG`: `False`
  * `DJANGO_SECRET_KEY`: *(click generate)*
  * `DATABASE_URL`: *(paste Internal Database URL from Step 1)*
  * `CELERY_TASK_ALWAYS_EAGER`: `True`
  * `USE_REDIS_CACHE`: `False`
  * `ALLOWED_HOSTS`: `*`
  * `CSRF_TRUSTED_ORIGINS`: `https://*.onrender.com`
* Click **Create Web Service**.

### 3. Frontend (Static Site)
* Click **New +** &rarr; **Static Site**.
* Connect your GitHub repository.
* **Name:** `modernshop-frontend`
* **Build Command:** `cd frontend && npm install && npm run build`
* **Publish Directory:** `./frontend/dist`
* **Redirects / Rewrites:**
  * Route 1:
    * **Type:** `Rewrite`
    * **Source:** `/api/*`
    * **Destination:** `https://your-backend-name.onrender.com/api/*`
  * Route 2:
    * **Type:** `Rewrite`
    * **Source:** `/media/*`
    * **Destination:** `https://your-backend-name.onrender.com/media/*`
  * Route 3:
    * **Type:** `Rewrite`
    * **Source:** `/*`
    * **Destination:** `/index.html`
* Click **Create Static Site**.

---

## Post-Deployment Verification

### Default Accounts Seeded Automatically:

| Role | Email | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| **Platform Administrator** | `sanjaisam63@gmail.com` | `Admin@123` | Full superuser access to `/admin/*`, payouts, and audit logs |
| **Primary Merchant** | `sanjaidhonicsk@gmail.com` | `Vendor@123` | **Sanjai Modern Tech & Audio** storefront owner |
| **Demo Merchant** | `vendor@example.com` | `Vendor@123` | **TechNova Electronics** storefront owner |
| **Customer Shopper** | `customer@example.com` | `Customer@123` | Pre-configured buyer with shopping bag items |

### Health Check URLs:
* **Frontend App:** `https://your-frontend.onrender.com/`
* **Interactive API Documentation:** `https://your-backend.onrender.com/api/docs/`
* **OpenAPI Schema:** `https://your-backend.onrender.com/api/schema/`
* **Django Admin:** `https://your-backend.onrender.com/admin/`

---

## Method 3: Local / VPS Docker Compose Deployment

To deploy on a Virtual Private Server (AWS EC2, DigitalOcean Droplet, Hetzner, Linode) using Docker:

```bash
# 1. Clone repository on the server
git clone https://github.com/baizo7/E-Commerce_NC.git
cd E-Commerce_NC

# 2. Start all containers in detached mode
docker compose up -d --build

# 3. Apply baseline seed data (optional)
docker compose exec web python seed_data.py
```

The application will be live at `http://your-server-ip:5173` with Nginx and Gunicorn reverse proxies running automatically.
