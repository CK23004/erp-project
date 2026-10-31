#!/bin/bash
# ── SmartBiz ERP — Database Seed Script ──────────────────────────────────
# Run this after docker compose up to populate all three databases with
# initial sample data so the UI has something to display.
#
# Usage:
#   chmod +x scripts/seed-db.sh
#   ./scripts/seed-db.sh
#
# Requirements: Docker must be running with container named smartbiz-mongo

set -e

echo "Seeding SmartBiz ERP databases..."

docker exec smartbiz-mongo mongosh --quiet --eval "

// ═══════════════════════════════════════════════════════
// 1. smartbiz_users — Admin user + departments + employee
// ═══════════════════════════════════════════════════════
db = db.getSiblingDB('smartbiz_users');

// Clear existing seed data to make script idempotent
db.users.deleteMany({ email: { \$in: ['admin@smartbiz.com', 'manager@smartbiz.com'] } });
db.departments.deleteMany({});
db.employees.deleteMany({});

// BCrypt hash of 'admin123' (cost 10) — generated with BCryptPasswordEncoder
db.users.insertMany([
  {
    name: 'Admin User',
    email: 'admin@smartbiz.com',
    password: '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    role: 'ADMIN',
    active: true,
    createdAt: new Date()
  },
  {
    name: 'John Manager',
    email: 'manager@smartbiz.com',
    password: '\$2a\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    role: 'MANAGER',
    active: true,
    createdAt: new Date()
  }
]);

db.departments.insertMany([
  { name: 'Engineering',  description: 'Software Engineering',  createdAt: new Date() },
  { name: 'Sales',        description: 'Sales & Business Dev',  createdAt: new Date() },
  { name: 'HR',           description: 'Human Resources',       createdAt: new Date() }
]);

var engDept = db.departments.findOne({ name: 'Engineering' })._id.toString();

db.employees.insertOne({
  firstName: 'Alice',
  lastName:  'Johnson',
  email:     'alice@smartbiz.com',
  phone:     '555-1001',
  departmentId: engDept,
  position:  'Senior Developer',
  joiningDate: new Date('2023-01-15'),
  salary:    85000,
  active:    true,
  createdAt: new Date()
});

print('✅ smartbiz_users: ' + db.users.countDocuments() + ' users, ' + db.departments.countDocuments() + ' departments, ' + db.employees.countDocuments() + ' employees');

// ═══════════════════════════════════════════════════════
// 2. smartbiz_inventory — Categories + Suppliers + Products
// ═══════════════════════════════════════════════════════
db = db.getSiblingDB('smartbiz_inventory');

db.categories.deleteMany({});
db.suppliers.deleteMany({});
db.products.deleteMany({});
db.purchases.deleteMany({});

db.categories.insertMany([
  { name: 'Electronics',  description: 'Electronic devices and accessories', createdAt: new Date() },
  { name: 'Office',       description: 'Office supplies and furniture',       createdAt: new Date() },
  { name: 'Software',     description: 'Software licenses and subscriptions', createdAt: new Date() }
]);

db.suppliers.insertMany([
  { name: 'Tech Supplies Co',  email: 'orders@techsupplies.com',  phone: '555-2001', address: '123 Supply St, Tech City', createdAt: new Date() },
  { name: 'Office World Ltd',  email: 'orders@officeworld.com',   phone: '555-2002', address: '456 Office Blvd, Commerce City', createdAt: new Date() }
]);

var elecCat  = db.categories.findOne({ name: 'Electronics' })._id.toString();
var offCat   = db.categories.findOne({ name: 'Office' })._id.toString();
var techSup  = db.suppliers.findOne({ name: 'Tech Supplies Co' })._id.toString();
var offSup   = db.suppliers.findOne({ name: 'Office World Ltd' })._id.toString();

db.products.insertMany([
  { name: 'Laptop Pro 15',    description: 'High performance 15\" laptop',  categoryId: elecCat, supplierId: techSup, sku: 'LAP-001', price: 1299.99, quantity: 25, lowStockThreshold: 5,  createdAt: new Date() },
  { name: 'Wireless Mouse',   description: 'Ergonomic wireless mouse',      categoryId: elecCat, supplierId: techSup, sku: 'MOU-001', price: 29.99,   quantity: 3,  lowStockThreshold: 10, createdAt: new Date() },
  { name: 'Mechanical Keyboard', description: 'RGB mechanical keyboard',    categoryId: elecCat, supplierId: techSup, sku: 'KEY-001', price: 89.99,   quantity: 15, lowStockThreshold: 5,  createdAt: new Date() },
  { name: 'Office Chair',     description: 'Ergonomic office chair',        categoryId: offCat,  supplierId: offSup,  sku: 'CHR-001', price: 349.00,  quantity: 8,  lowStockThreshold: 3,  createdAt: new Date() },
  { name: 'Standing Desk',    description: 'Height adjustable standing desk',categoryId: offCat, supplierId: offSup,  sku: 'DSK-001', price: 599.00,  quantity: 2,  lowStockThreshold: 2,  createdAt: new Date() }
]);

print('✅ smartbiz_inventory: ' + db.products.countDocuments() + ' products, ' + db.categories.countDocuments() + ' categories, ' + db.suppliers.countDocuments() + ' suppliers');

// ═══════════════════════════════════════════════════════
// 3. smartbiz_sales — Customers + Orders + Invoices
// ═══════════════════════════════════════════════════════
db = db.getSiblingDB('smartbiz_sales');

db.customers.deleteMany({});
db.orders.deleteMany({});
db.invoices.deleteMany({});
db.payments.deleteMany({});

db.customers.insertMany([
  { name: 'Acme Corporation',  email: 'orders@acme.com',     phone: '555-3001', address: '100 Acme Way, Business Park',    createdAt: new Date() },
  { name: 'TechStart Inc',     email: 'purchasing@techstart.io', phone: '555-3002', address: '200 Innovation Dr, Tech Hub', createdAt: new Date() },
  { name: 'Global Traders',    email: 'buy@globaltraders.com',   phone: '555-3003', address: '300 Trade St, Commerce City', createdAt: new Date() }
]);

var cust1 = db.customers.findOne({ name: 'Acme Corporation' })._id.toString();
var cust2 = db.customers.findOne({ name: 'TechStart Inc' })._id.toString();

// Sample confirmed orders
db.orders.insertMany([
  {
    customerId: cust1,
    items: [
      { productId: 'demo-p1', productName: 'Laptop Pro 15',  quantity: 2, unitPrice: 1299.99, subtotal: 2599.98 },
      { productId: 'demo-p2', productName: 'Wireless Mouse', quantity: 2, unitPrice: 29.99,   subtotal: 59.98  }
    ],
    totalAmount: 2659.96,
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)  // 7 days ago
  },
  {
    customerId: cust2,
    items: [
      { productId: 'demo-p3', productName: 'Mechanical Keyboard', quantity: 5, unitPrice: 89.99, subtotal: 449.95 }
    ],
    totalAmount: 449.95,
    status: 'DELIVERED',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)  // 3 days ago
  }
]);

var order1 = db.orders.findOne({ customerId: cust1 })._id.toString();
var order2 = db.orders.findOne({ customerId: cust2 })._id.toString();

db.invoices.insertMany([
  {
    orderId:    order1,
    customerId: cust1,
    amount:     2659.96,
    status:     'UNPAID',
    issuedAt:   new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dueDate:    new Date(Date.now() + 23 * 24 * 60 * 60 * 1000)
  },
  {
    orderId:    order2,
    customerId: cust2,
    amount:     449.95,
    status:     'PAID',
    issuedAt:   new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    dueDate:    new Date(Date.now() + 27 * 24 * 60 * 60 * 1000)
  }
]);

var inv2 = db.invoices.findOne({ status: 'PAID' })._id.toString();

db.payments.insertOne({
  invoiceId:  inv2,
  customerId: cust2,
  amount:     449.95,
  method:     'BANK_TRANSFER',
  paidAt:     new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
});

print('✅ smartbiz_sales: ' + db.customers.countDocuments() + ' customers, ' + db.orders.countDocuments() + ' orders, ' + db.invoices.countDocuments() + ' invoices, ' + db.payments.countDocuments() + ' payments');
print('');
print('🎉 All databases seeded! Refresh Mongo Express at http://localhost:8090');
print('   Login to the ERP at http://localhost with admin@smartbiz.com / admin123');
"

echo ""
echo "Done. Open http://localhost:8090 to browse databases."
echo "Login to the app: http://localhost — admin@smartbiz.com / admin123"
