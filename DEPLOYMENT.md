# FlowDesk AI — Production Deployment Guide

This document outlines the step-by-step instructions for deploying FlowDesk AI to production:
- **Backend API**: Hosted on [Render](https://render.com)
- **Frontend SPA**: Hosted on [Vercel](https://vercel.com)
- **Database**: PostgreSQL hosted on [Supabase](https://supabase.com)

---

## 1. Prerequisites

1. A [GitHub](https://github.com) account with repository access to `FlowDeskAi`.
2. A [Render](https://render.com) account.
3. A [Vercel](https://vercel.com) account.
4. A [Supabase](https://supabase.com) account with an active PostgreSQL project.
5. Node.js 20+ installed locally for administrative operations.

---

## 2. Supabase PostgreSQL Database Setup

1. In the Supabase project dashboard, navigate to **Project Settings** &rarr; **Database**.
2. Under **Connection string**, select **URI** and choose **Session** or **Transaction** pooler mode (port `5432` or `6543`).
3. Example URI format:
   ```text
   postgresql://postgres.[project-ref]:[db-password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require
   ```
4. Verify database migration status locally before deployment:
   ```bash
   cd server
   npx prisma migrate status
   ```
   *Note: Never run `prisma migrate reset` in production.*

---

## 3. Render Backend Deployment

FlowDesk AI includes a `render.yaml` blueprint at the repository root. You can deploy either using the Blueprint or as a standard Web Service.

### Option A: Manual Web Service Setup
1. In Render Dashboard, click **New +** &rarr; **Web Service**.
2. Connect your `FlowDeskAi` GitHub repository.
3. Configure the service settings:
   - **Name**: `flowdesk-api`
   - **Region**: Frankfurt / London (select the region nearest to your Supabase region, e.g. `eu-west-1`)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/api/health`
4. Add the following **Environment Variables**:

| Variable | Value / Description |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` (Render default) |
| `CLIENT_ORIGIN` | `https://your-app.vercel.app` (Your production Vercel frontend URL) |
| `DATABASE_URL` | Your Supabase connection string with `?sslmode=require` |
| `DEMO_WORKSPACE_ID` | `00000000-0000-0000-0000-000000000001` |
| `JWT_ACCESS_SECRET` | 64-character random hex string (`crypto.randomBytes(32).toString('hex')`) |
| `JWT_ACCESS_EXPIRES_IN`| `15m` |
| `JWT_REFRESH_SECRET` | 64-character random hex string (`crypto.randomBytes(32).toString('hex')`) |
| `JWT_REFRESH_EXPIRES_IN`| `7d` |

5. Click **Create Web Service**. Wait for the build and health check to pass.
6. Note your Render URL (e.g. `https://flowdesk-api.onrender.com`).

---

## 4. Vercel Frontend Deployment

1. In Vercel Dashboard, click **Add New...** &rarr; **Project**.
2. Import your `FlowDeskAi` GitHub repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client` (Click "Edit" and select `client`)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Configure **Environment Variables**:

| Variable | Value / Description |
| :--- | :--- |
| `VITE_API_URL` | `https://flowdesk-api.onrender.com/api` (Render backend URL with `/api`) |

5. Click **Deploy**.
6. The `client/vercel.json` file in the repository will automatically handle SPA rewrites (`/(.*) -> /index.html`) and long-term asset caching.
7. Once deployed, copy your production domain (e.g., `https://flowdesk-ai.vercel.app`).
8. Return to Render and update the backend's `CLIENT_ORIGIN` environment variable to match this exact domain (no trailing slash).

---

## 5. Cookie & Cross-Origin Security Configuration

In production (`NODE_ENV=production`):
- `SameSite`: Configured to `'none'` to allow cross-site cookie transmission between the Vercel frontend domain and Render backend domain.
- `Secure`: `true` (HTTPS only).
- `HttpOnly`: `true` (Tokens cannot be accessed via JavaScript/XSS).
- `trust proxy`: Enabled in Express (`app.set('trust proxy', 1)`) so Render reverse proxies properly forward client IPs and HTTPS protocols.

---

## 6. Production Health Check & Verification

Once deployed, verify the system:

1. **API Health Endpoint**:
   ```bash
   curl -i https://your-backend-api.onrender.com/api/health
   ```
   Expected response: HTTP 200 with:
   ```json
   {
     "status": "healthy",
     "services": {
       "api": "operational",
       "database": "connected"
     }
   }
   ```
2. **Frontend UI Smoke Test**:
   - Open `https://your-frontend.vercel.app`.
   - Register a new organization workspace or login with demo credentials.
   - Navigate to **Overview**, **Leads**, **Customers**, **Enquiries**, and **Follow-ups**.
   - Navigate to **Settings** &rarr; Verify your user profile and workspace role.
   - Test invitation link generation and acceptance.
   - Log out and verify the refresh session cookie is cleared.

---

## 7. Troubleshooting Common Deployment Errors

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **CORS blocked error in browser** | `CLIENT_ORIGIN` does not match the frontend domain. | Ensure `CLIENT_ORIGIN` on Render exactly matches `https://your-frontend.vercel.app` (including `https://`, no trailing slash). |
| **401 on refresh token / auth** | Browser blocked third-party cookies or HTTPS mismatch. | Ensure both frontend and backend are served over HTTPS. Verify `SameSite: 'none'` and `Secure: true`. |
| **404 on page refresh in Vercel** | Missing SPA rewrite rule. | Ensure `client/vercel.json` exists with the `rewrites` configuration for `/index.html`. |
| **Prisma connection timeout** | Direct database port 5432 blocked or pooler saturated. | Use the Supabase pooled connection string (port 5432 or 6543) with `?sslmode=require`. |
| **Backend crash on startup** | Missing or short JWT secrets in production. | Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set and at least 16 characters long. |

