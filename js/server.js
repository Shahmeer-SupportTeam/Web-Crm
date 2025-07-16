// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// CORS middleware (allow all origins for dev)
app.use(cors());
app.use(bodyParser.json());

// Dummy user for demonstration
const users = [
  { email: 'test@example.com', password: 'password123', shopName: 'TestShop' }
];

// LOGIN endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ success: true, message: 'Login successful', shopName: user.shopName });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// SIGNUP endpoint
app.post('/api/signup', (req, res) => {
  const { email, password, shopName } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ success: false, message: 'Email already exists' });
  }
  users.push({ email, password, shopName });
  res.json({ success: true, message: 'Signup successful' });
});

// Catch-all for unsupported methods
app.all('/api/login', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
  next();
});
app.all('/api/signup', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});