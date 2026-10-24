const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory data store (resets on restart; perfect for fast demos)
let menu = [
  { id: 1, name: 'Hot Samosa', price: 15, category: 'ready', available: true, prepTime: '< 30s' },
  { id: 2, name: 'Paneer Patty', price: 25, category: 'ready', available: true, prepTime: '< 30s' },
  { id: 3, name: 'Cutting Chai', price: 10, category: 'ready', available: true, prepTime: '< 1 min' },
  { id: 4, name: 'Cold Coffee (Bottle)', price: 35, category: 'ready', available: true, prepTime: 'Instant' },
  { id: 5, name: 'Veg Maggi', price: 40, category: 'custom', available: true, prepTime: '6-8 mins' },
  { id: 6, name: 'Paneer Kathi Roll', price: 60, category: 'custom', available: true, prepTime: '8-10 mins' },
  { id: 7, name: 'Aloo Paratha (2pc)', price: 50, category: 'custom', available: false, prepTime: '10-12 mins' }
];

let orders = [];
let tokenCounter = 101;

// API: Get current menu
app.get('/api/menu', (req, res) => {
  res.json(menu);
});

// API: Toggle item availability (Vendor action)
app.post('/api/menu/:id/toggle', (req, res) => {
  const item = menu.find(m => m.id === parseInt(req.params.id));
  if (item) {
    item.available = !item.available;
    return res.json({ success: true, item });
  }
  res.status(404).json({ error: 'Item not found' });
});

// API: Place a new order (Student action)
app.post('/api/orders', (req, res) => {
  const { studentIdentifier, items, totalAmount } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items selected' });
  }

  const newOrder = {
    id: `ORD-${Date.now()}`,
    token: `S-${tokenCounter++}`,
    studentIdentifier: studentIdentifier || 'Student',
    items,
    totalAmount,
    status: 'PLACED', // PLACED -> READY -> COLLECTED
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };

  orders.unshift(newOrder);
  res.status(201).json(newOrder);
});

// API: Get all active orders (Vendor view)
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// API: Check single order status (Student polling)
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// API: Update order status (Vendor action)
app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  if (order && ['PLACED', 'READY', 'COLLECTED'].includes(status)) {
    order.status = status;
    return res.json({ success: true, order });
  }
  res.status(400).json({ error: 'Invalid order or status' });
});

// Start local server if not running in a serverless environment (e.g. Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`FlashBite server running on port ${PORT}`);
  });
}

// Export for Vercel serverless function wrapper
module.exports = app;