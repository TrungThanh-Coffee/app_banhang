require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const sellerRoutes = require('./routes/seller.routes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', function (req, res) {
  res.json({
    message: 'AppBanHang backend is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seller', sellerRoutes);

app.use(function (req, res) {
  res.status(404).json({
    message: 'API không tồn tại',
  });
});

app.listen(port, function () {
  console.log('API running at http://localhost:' + port);
});