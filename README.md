# stockflow-mvp
StockFlow is a multi-tenant inventory management system built to demonstrate user authentication, product management, database operations, and organization-level data isolation.
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
