# Interview walkthrough: StockFlow MVP

## 60-second explanation

"StockFlow is a small multi-tenant inventory management web application. A store owner can create an account and workspace, manage products and SKUs, update stock quantities, and see low-stock items on a dashboard. I used Node.js and Express for backend routes, EJS and CSS for the UI, and SQLite for persistence. Passwords are hashed with bcrypt, login state is maintained using sessions, and product queries are scoped to the signed-in user's organization. The low-stock rule is quantity less than or equal to a product-specific threshold, falling back to the organization's default when no product threshold is set."

## CRUD

- Create: `POST /products`
- Read/list: `GET /products`; dashboard reads inventory totals and low-stock rows.
- Update: `POST /products/:id/edit`
- Delete: `POST /products/:id/delete`

## Key design decisions

- SQLite keeps local setup simple for an MVP.
- EJS server-rendered templates reduce frontend build tooling.
- Passwords are stored as bcrypt hashes, never as plain text.
- The database enforces unique email and unique SKU per organization.
- Every product is attached to an organization ID; protected routes use the organization ID from the server-side session rather than trusting a form field.
- The database transaction creates the organization and user together.

## Questions to prepare for

1. **What is multi-tenancy?** Multiple customer workspaces share one application/database while their records remain isolated.
2. **How do you prevent cross-tenant access?** Derive organization ID from the authenticated session and include it in every product query and mutation.
3. **Why hash passwords?** A database leak should not expose users' original passwords; bcrypt stores a salted one-way hash.
4. **What is CRUD?** Create, Read, Update, Delete.
5. **Why is SKU unique per organization rather than globally?** Different stores may use the same SKU convention; the pair `(organization_id, sku)` must be unique.
6. **How is low stock calculated?** Use the product's threshold if set; otherwise use the organization's default; flag when quantity is less than or equal to that threshold.
7. **Why SQLite?** It is easy to set up and appropriate for a small demo. A larger production service may use PostgreSQL.
8. **What would you improve next?** Automated tests, CSRF protection, rate limiting, stock adjustment history, password reset, and production deployment configuration.

## Be transparent

Run and test the app before claiming all functionality works. If asked what you personally built, describe the parts you understand and can demonstrate. Do not claim features that are not implemented.
