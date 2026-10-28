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

# StockFlow — Inventory Management MVP

A simple inventory management web application that helps businesses manage products, track stock quantities, and identify low-stock items from a centralized dashboard.

## Overview

StockFlow is a multi-tenant inventory management system built to demonstrate user authentication, product management, database operations, and organization-level data isolation.

Each user has an organization, and product data is associated with that organization so that users can access only their own inventory.

## Features

- **User Authentication:** Sign up and log in using email and password.
- **Organization Management:** Create an organization during registration.
- **Product Management:** Add, view, edit, and delete products.
- **Inventory Tracking:** Manage stock quantities and product details.
- **Low-Stock Alerts:** Identify products whose quantity is at or below their configured threshold.
- **Dashboard:** View total products, total stock quantity, and low-stock items.
- **Search:** Find products by name or SKU.
- **Data Isolation:** Keep inventory records separated by organization.
- **Responsive Interface:** Access the application through a clean web interface.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Frontend:** HTML, CSS, EJS
- **Database:** SQLite
- **Authentication:** bcryptjs and express-session
- **Session Storage:** SQLite session store

## Product Information

Each product can contain the following information:

| Field | Description |
|---|---|
| Product Name | Name of the product |
| SKU | Unique stock-keeping unit within an organization |
| Description | Optional product description |
| Quantity | Current stock quantity |
| Cost Price | Optional product purchase cost |
| Selling Price | Optional selling price |
| Low-Stock Threshold | Quantity at which the product is considered low in stock |

A product is considered low in stock when:

`quantity <= low-stock threshold`

## Getting Started

### Prerequisites

Install the following before running the project:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- Git (optional, for cloning the repository)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/stockflow-mvp.git
cd stockflow-mvp
```

Replace `YOUR-USERNAME` with your GitHub username.

### 2. Install dependencies

```bash
npm install
```

### 3. Start the application

Check the `scripts` section in `package.json` for the configured start command. If it defines `start` as `node server.js`, run:

```bash
npm start
```

### 4. Open the application

Open the local URL shown in the terminal. For example, if the server uses port 3000:

`http://localhost:3000`

Register an account to begin managing inventory.

## Database

StockFlow uses SQLite for data storage.

The application is configured to store its database files in the `data/` directory:

- `stockflow.db` — application data, including users, organizations, and products.
- `sessions.db` — login session data.

The database files are generated locally by the application when initialized. Exact table creation and initialization behavior depends on the project code.

**Note:** Database files, environment secrets, and installed dependencies should not be committed to GitHub.

## Project Structure

```text
stockflow-mvp/
├── public/             # Static assets such as CSS
├── views/              # EJS templates
├── data/               # Local SQLite database files
├── server.js            # Express application entry point
├── package.json         # Dependencies and npm scripts
├── package-lock.json    # Dependency lock file
├── .gitignore           # Files excluded from Git
└── README.md            # Project documentation
```

## Security and Data Isolation

- Passwords are stored as password hashes rather than plain text.
- Product records are associated with an organization.
- Database files and environment secrets should remain local.
- Authentication and organization ownership checks should be enforced by the backend.

## Current Scope

This MVP focuses on authentication, product CRUD operations, inventory tracking, dashboard summaries, and low-stock identification.

The following are outside the initial scope:

- Multiple warehouses
- Product variants
- Purchase orders and sales orders
- Third-party integrations
- CSV import
- Email notifications
- Billing and subscription management
- Advanced role-based access control
- Audit logs

## Future Improvements

- Add automated tests for authentication and inventory operations.
- Add stock adjustment history.
- Add CSV import and export.
- Add notifications for low-stock products.
- Improve deployment and production configuration.
- Add support for multiple users per organization.

## Learning Outcomes

This project demonstrates practical experience with:

- REST-style application design and CRUD workflows
- Server-side rendering using EJS
- Relational data modeling with SQLite
- Password hashing and session-based authentication
- Organization-level data separation
- Dashboard calculations and inventory business logic

## License

This project is available for educational and portfolio purposes. Add a license file if you intend to distribute it under specific license terms.
