require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, 'stockflow.db'));
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    default_low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK(default_low_stock_threshold >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sku TEXT NOT NULL COLLATE NOCASE,
    description TEXT NOT NULL DEFAULT '',
    quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
    cost_price REAL,
    selling_price REAL,
    low_stock_threshold INTEGER CHECK(low_stock_threshold IS NULL OR low_stock_threshold >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, sku),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
  );
`);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: dataDir }),
  secret: process.env.SESSION_SECRET || 'development-only-change-me-before-deploying',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 1000 * 60 * 60 * 8 }
}));
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  res.locals.formatMoney = value => value == null ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
  next();
});

function setFlash(req, type, message) { req.session.flash = { type, message }; }
function requireAuth(req, res, next) {
  if (!req.session.user) {
    setFlash(req, 'error', 'Please log in to continue.');
    return res.redirect('/login');
  }
  next();
}
function parseOptionalMoney(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}
function parseThreshold(value) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
}
function getProductForOrg(productId, orgId) {
  return db.prepare('SELECT * FROM products WHERE id = ? AND organization_id = ?').get(productId, orgId);
}
function getThreshold(product, defaultThreshold) {
  return product.low_stock_threshold == null ? defaultThreshold : product.low_stock_threshold;
}

app.get('/', (req, res) => res.redirect(req.session.user ? '/dashboard' : '/login'));
app.get('/signup', (req, res) => res.render('signup', { title: 'Create account', errors: [], values: {} }));
app.post('/signup', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    const organizationName = String(req.body.organizationName || '').trim();
    const errors = [];
    if (!organizationName || organizationName.length > 80) errors.push('Organization name is required (maximum 80 characters).');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) errors.push('Enter a valid email address.');
    if (password.length < 8 || password.length > 128) errors.push('Password must be at least 8 characters long.');
    if (password !== confirmPassword) errors.push('Passwords do not match.');
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) errors.push('An account with this email already exists.');
    if (errors.length) return res.status(400).render('signup', { title: 'Create account', errors, values: { email, organizationName } });

    const passwordHash = await bcrypt.hash(password, 12);
    const createAccount = db.transaction(() => {
      const org = db.prepare('INSERT INTO organizations (name) VALUES (?)').run(organizationName);
      const user = db.prepare('INSERT INTO users (organization_id, email, password_hash) VALUES (?, ?, ?)').run(org.lastInsertRowid, email, passwordHash);
      return { id: Number(user.lastInsertRowid), organizationId: Number(org.lastInsertRowid), email, organizationName };
    });
    const user = createAccount();
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.user = user;
      setFlash(req, 'success', 'Welcome to StockFlow! Your workspace is ready.');
      res.redirect('/dashboard');
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).render('signup', { title: 'Create account', errors: ['That email or organization account already exists.'], values: { email: req.body.email, organizationName: req.body.organizationName } });
    next(error);
  }
});

app.get('/login', (req, res) => res.render('login', { title: 'Log in', errors: [], email: '' }));
app.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const userRow = db.prepare(`SELECT users.id, users.organization_id, users.email, users.password_hash, organizations.name AS organization_name
      FROM users JOIN organizations ON organizations.id = users.organization_id WHERE users.email = ?`).get(email);
    if (!userRow || !(await bcrypt.compare(password, userRow.password_hash))) {
      return res.status(401).render('login', { title: 'Log in', errors: ['Invalid email or password.'], email });
    }
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.user = { id: userRow.id, organizationId: userRow.organization_id, email: userRow.email, organizationName: userRow.organization_name };
      setFlash(req, 'success', 'You are now logged in.');
      res.redirect('/dashboard');
    });
  } catch (error) { next(error); }
});
app.post('/logout', requireAuth, (req, res, next) => req.session.destroy(err => err ? next(err) : res.redirect('/login')));

app.get('/dashboard', requireAuth, (req, res) => {
  const orgId = req.session.user.organizationId;
  const settings = db.prepare('SELECT default_low_stock_threshold FROM organizations WHERE id = ?').get(orgId);
  const totals = db.prepare('SELECT COUNT(*) AS product_count, COALESCE(SUM(quantity), 0) AS unit_count FROM products WHERE organization_id = ?').get(orgId);
  const products = db.prepare('SELECT * FROM products WHERE organization_id = ? ORDER BY name COLLATE NOCASE').all(orgId);
  const lowStock = products.filter(p => p.quantity <= getThreshold(p, settings.default_low_stock_threshold));
  res.render('dashboard', { title: 'Dashboard', totals, lowStock, defaultThreshold: settings.default_low_stock_threshold });
});

app.get('/products', requireAuth, (req, res) => {
  const orgId = req.session.user.organizationId;
  const settings = db.prepare('SELECT default_low_stock_threshold FROM organizations WHERE id = ?').get(orgId);
  const products = db.prepare('SELECT * FROM products WHERE organization_id = ? ORDER BY updated_at DESC, name COLLATE NOCASE').all(orgId);
  res.render('products', { title: 'Products', products, defaultThreshold: settings.default_low_stock_threshold, query: String(req.query.q || '') });
});
app.get('/products/new', requireAuth, (req, res) => res.render('product-form', { title: 'Add product', product: {}, errors: [], formAction: '/products', submitLabel: 'Create product' }));
app.post('/products', requireAuth, (req, res, next) => {
  const orgId = req.session.user.organizationId;
  const product = readProductForm(req.body);
  const errors = validateProduct(product);
  if (errors.length) return res.status(400).render('product-form', { title: 'Add product', product, errors, formAction: '/products', submitLabel: 'Create product' });
  try {
    db.prepare(`INSERT INTO products (organization_id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(orgId, product.name, product.sku, product.description, product.quantity, product.costPrice, product.sellingPrice, product.threshold);
    setFlash(req, 'success', 'Product created successfully.');
    res.redirect('/products');
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).render('product-form', { title: 'Add product', product, errors: ['That SKU is already used in your organization.'], formAction: '/products', submitLabel: 'Create product' });
    next(error);
  }
});
app.get('/products/:id/edit', requireAuth, (req, res) => {
  const product = getProductForOrg(Number(req.params.id), req.session.user.organizationId);
  if (!product) { setFlash(req, 'error', 'Product not found.'); return res.redirect('/products'); }
  res.render('product-form', { title: 'Edit product', product: { ...product, costPrice: product.cost_price, sellingPrice: product.selling_price, threshold: product.low_stock_threshold }, errors: [], formAction: `/products/${product.id}/edit`, submitLabel: 'Save changes' });
});
app.post('/products/:id/edit', requireAuth, (req, res, next) => {
  const orgId = req.session.user.organizationId;
  const existing = getProductForOrg(Number(req.params.id), orgId);
  if (!existing) { setFlash(req, 'error', 'Product not found.'); return res.redirect('/products'); }
  const product = readProductForm(req.body);
  const errors = validateProduct(product);
  if (errors.length) return res.status(400).render('product-form', { title: 'Edit product', product: { ...product, id: existing.id }, errors, formAction: `/products/${existing.id}/edit`, submitLabel: 'Save changes' });
  try {
    db.prepare(`UPDATE products SET name = ?, sku = ?, description = ?, quantity = ?, cost_price = ?, selling_price = ?, low_stock_threshold = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND organization_id = ?`).run(product.name, product.sku, product.description, product.quantity, product.costPrice, product.sellingPrice, product.threshold, existing.id, orgId);
    setFlash(req, 'success', 'Product updated successfully.');
    res.redirect('/products');
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).render('product-form', { title: 'Edit product', product: { ...product, id: existing.id }, errors: ['That SKU is already used in your organization.'], formAction: `/products/${existing.id}/edit`, submitLabel: 'Save changes' });
    next(error);
  }
});
app.post('/products/:id/delete', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ? AND organization_id = ?').run(Number(req.params.id), req.session.user.organizationId);
  setFlash(req, result.changes ? 'success' : 'error', result.changes ? 'Product deleted.' : 'Product not found.');
  res.redirect('/products');
});
function readProductForm(body) {
  return {
    name: String(body.name || '').trim(), sku: String(body.sku || '').trim().toUpperCase(),
    description: String(body.description || '').trim(), quantity: Number(body.quantity),
    costPrice: parseOptionalMoney(body.costPrice), sellingPrice: parseOptionalMoney(body.sellingPrice),
    threshold: parseThreshold(body.threshold)
  };
}
function validateProduct(p) {
  const errors = [];
  if (!p.name || p.name.length > 120) errors.push('Product name is required (maximum 120 characters).');
  if (!p.sku || p.sku.length > 60 || !/^[A-Z0-9._/-]+$/.test(p.sku)) errors.push('SKU is required and may contain letters, numbers, dots, underscores, slashes, and hyphens.');
  if (!Number.isInteger(p.quantity) || p.quantity < 0 || p.quantity > 1000000000) errors.push('Quantity must be a non-negative whole number.');
  if (Number.isNaN(p.costPrice)) errors.push('Cost price must be blank or a non-negative number.');
  if (Number.isNaN(p.sellingPrice)) errors.push('Selling price must be blank or a non-negative number.');
  if (Number.isNaN(p.threshold)) errors.push('Low-stock threshold must be blank or a non-negative whole number.');
  if (p.description.length > 1000) errors.push('Description must be 1000 characters or fewer.');
  return errors;
}

app.get('/settings', requireAuth, (req, res) => {
  const settings = db.prepare('SELECT name, default_low_stock_threshold FROM organizations WHERE id = ?').get(req.session.user.organizationId);
  res.render('settings', { title: 'Settings', settings, errors: [] });
});
app.post('/settings', requireAuth, (req, res) => {
  const threshold = Number(req.body.defaultThreshold);
  const settings = db.prepare('SELECT name, default_low_stock_threshold FROM organizations WHERE id = ?').get(req.session.user.organizationId);
  const errors = [];
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 1000000) errors.push('Default threshold must be a non-negative whole number.');
  if (errors.length) return res.status(400).render('settings', { title: 'Settings', settings, errors });
  db.prepare('UPDATE organizations SET default_low_stock_threshold = ? WHERE id = ?').run(threshold, req.session.user.organizationId);
  setFlash(req, 'success', 'Settings saved.');
  res.redirect('/settings');
});

app.use((req, res) => res.status(404).render('404', { title: 'Page not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).render('error', { title: 'Something went wrong', message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message });
});

app.listen(PORT, () => console.log(`StockFlow is running at http://localhost:${PORT}`));
