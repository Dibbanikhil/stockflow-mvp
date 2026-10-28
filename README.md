# StockFlow MVP — SaaS Inventory Management

A small multi-tenant inventory management application built for the SDE Intern assessment. It lets a store owner register, manage products, monitor stock levels, and configure a low-stock threshold.

## Features

- Email/password signup and login; passwords hashed with bcrypt.
- A separate organization is created for each account.
- Product CRUD: create, list, edit, and delete products.
- Product fields: name, SKU, description, quantity, cost price, selling price, and optional low-stock threshold.
- SKU uniqueness within an organization.
- Dashboard totals for product count and units in stock, plus a low-stock list.
- Search by product name or SKU.
- Organization-specific default low-stock threshold.
- Server-side validation, login sessions stored in SQLite, and organization-scoped product queries.
- Responsive layout for desktop and mobile.

## Tech stack

- Node.js + Express
- EJS templates, HTML, and CSS
- SQLite via `better-sqlite3`
- `bcryptjs` for password hashing
- `express-session` + `connect-sqlite3` for sessions
- Helmet for baseline HTTP security headers

## Requirements

- Node.js 18 or newer
- npm

## Run locally

1. Open a terminal in this project folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and set a strong `SESSION_SECRET`. On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Start the app:

   ```bash
   npm start
   ```

5. Visit <http://localhost:3000> and create an account. The SQLite database and session database are created automatically under `data/`.

For development with automatic server restart, run `npm run dev`.

## Demo walkthrough

1. Create an account with an organization name.
2. Add products such as `Wireless Mouse` / `MOUSE-001` / quantity `3` and `Keyboard` / `KEY-001` / quantity `20`.
3. Open the dashboard and confirm the mouse appears in Low-stock items (default threshold is 5).
4. Edit the mouse quantity to 12 and confirm it is no longer low stock.
5. Search for a product by name or SKU.
6. Change the default threshold in Settings.
7. Log out and log back in.

## Data model

- `organizations`: workspace name and default threshold.
- `users`: one owner account per organization, email, and password hash.
- `products`: inventory data with an organization foreign key and unique `(organization_id, sku)` constraint.

Every product read/update/delete query includes both product ID and the authenticated organization ID (or selects all products for that organization). This is the central tenant-isolation rule.

## Important implementation choices

- A blank product threshold inherits the organization's default threshold.
- Low stock is defined as `quantity <= threshold`.
- Quantity and threshold are non-negative integers. Prices are optional, non-negative numbers.
- Hard deletion is used for products, which is allowed by the assessment.
- No billing, supplier management, orders, warehouses, imports, integrations, or audit history are included because they are out of scope for this MVP.

## Security and production notes

This is an interview MVP, not a production-hardened SaaS deployment. Before production, add CSRF protection, rate limiting, stronger request logging, automated tests, secure production secrets, and a managed database/session strategy. Use HTTPS in production. The development fallback session secret must not be used for deployment.

## GitHub submission

Create an empty repository on GitHub, then from this folder run:

```bash
git init
git add .
git commit -m "Build StockFlow inventory management MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/stockflow-mvp.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. Do not commit `.env`, `node_modules`, or database files.
