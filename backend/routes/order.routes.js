const router = require('express').Router();
const pool = require('../config/db');
const { authRequired, allowRoles } = require('../middleware/auth.middleware');

router.use(authRequired, allowRoles('CUSTOMER'));

async function createOrder(req, res) {
  const conn = await pool.getConnection();

  try {
    const userId = req.user.user_id;

    const {
      receiver_name,
      receiver_phone,
      shipping_address,
      payment_method,
    } = req.body;

    const finalPaymentMethod = payment_method || 'COD';

    if (!receiver_name || !receiver_phone || !shipping_address) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ thông tin nhận hàng',
      });
    }

    await conn.beginTransaction();

    const [items] = await conn.query(
      `SELECT 
        ci.product_id,
        ci.quantity,
        p.seller_id,
        p.product_name,
        p.price,
        p.stock,
        p.status
      FROM carts c
      JOIN cart_items ci ON ci.cart_id = c.cart_id
      JOIN products p ON p.product_id = ci.product_id
      WHERE c.user_id = ? AND p.status = 'active'
      FOR UPDATE`,
      [userId]
    );

    if (items.length === 0) {
      await conn.rollback();

      return res.status(400).json({
        message: 'Giỏ hàng đang trống',
      });
    }

    for (let i = 0; i < items.length; i++) {
      if (items[i].stock < items[i].quantity) {
        await conn.rollback();

        return res.status(400).json({
          message: 'Sản phẩm "' + items[i].product_name + '" không đủ tồn kho',
        });
      }
    }

    let totalAmount = 0;

    for (let i = 0; i < items.length; i++) {
      totalAmount = totalAmount + Number(items[i].price) * Number(items[i].quantity);
    }

    const [orderResult] = await conn.query(
      `INSERT INTO orders
      (
        customer_id,
        receiver_name,
        receiver_phone,
        shipping_address,
        total_amount,
        payment_method,
        payment_status,
        order_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        receiver_name,
        receiver_phone,
        shipping_address,
        totalAmount,
        finalPaymentMethod,
        finalPaymentMethod === 'COD' ? 'UNPAID' : 'PAID',
        'PENDING',
      ]
    );

    const orderId = orderResult.insertId;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const subtotal = Number(item.price) * Number(item.quantity);

      await conn.query(
        `INSERT INTO order_items
        (
          order_id,
          product_id,
          seller_id,
          product_name,
          unit_price,
          quantity,
          subtotal
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.seller_id,
          item.product_name,
          item.price,
          item.quantity,
          subtotal,
        ]
      );

      await conn.query(
        `UPDATE products
         SET stock = stock - ?
         WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    await conn.query(
      `INSERT INTO payments
      (
        order_id,
        amount,
        payment_method,
        payment_status,
        paid_at
      )
      VALUES (?, ?, ?, ?, ?)`,
      [
        orderId,
        totalAmount,
        finalPaymentMethod,
        finalPaymentMethod === 'COD' ? 'UNPAID' : 'PAID',
        finalPaymentMethod === 'COD' ? null : new Date(),
      ]
    );

    await conn.query(
      `DELETE ci
       FROM cart_items ci
       JOIN carts c ON c.cart_id = ci.cart_id
       WHERE c.user_id = ?`,
      [userId]
    );

    await conn.commit();

    return res.status(201).json({
      message: 'Đặt hàng thành công',
      order_id: orderId,
      total_amount: totalAmount,
    });
  } catch (error) {
    await conn.rollback();

    return res.status(500).json({
      message: 'Lỗi đặt hàng',
      error: error.message,
    });
  } finally {
    conn.release();
  }
}

async function myOrders(req, res) {
  try {
    const [orders] = await pool.query(
      `SELECT 
        order_id,
        receiver_name,
        receiver_phone,
        shipping_address,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        created_at
      FROM orders
      WHERE customer_id = ?
      ORDER BY created_at DESC`,
      [req.user.user_id]
    );

    return res.json(orders);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải lịch sử đơn hàng',
      error: error.message,
    });
  }
}

async function orderDetail(req, res) {
  try {
    const orderId = req.params.id;

    const [orders] = await pool.query(
      `SELECT 
        order_id,
        customer_id,
        receiver_name,
        receiver_phone,
        shipping_address,
        total_amount,
        payment_method,
        payment_status,
        order_status,
        created_at
      FROM orders
      WHERE order_id = ? AND customer_id = ?
      LIMIT 1`,
      [orderId, req.user.user_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng',
      });
    }

    const [items] = await pool.query(
      `SELECT 
        order_item_id,
        product_id,
        seller_id,
        product_name,
        unit_price,
        quantity,
        subtotal
      FROM order_items
      WHERE order_id = ?`,
      [orderId]
    );

    return res.json({
      order: orders[0],
      items: items,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải chi tiết đơn hàng',
      error: error.message,
    });
  }
}

async function payOrder(req, res) {
  try {
    const orderId = req.params.id;

    const [result] = await pool.query(
      `UPDATE orders
       SET payment_status = 'PAID'
       WHERE order_id = ? 
       AND customer_id = ? 
       AND payment_status = 'UNPAID'`,
      [orderId, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng cần thanh toán',
      });
    }

    await pool.query(
      `UPDATE payments
       SET payment_status = 'PAID', paid_at = NOW()
       WHERE order_id = ?`,
      [orderId]
    );

    return res.json({
      message: 'Thanh toán thành công',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi thanh toán đơn hàng',
      error: error.message,
    });
  }
}

router.post('/', createOrder);
router.get('/my', myOrders);
router.get('/:id', orderDetail);
router.patch('/:id/pay', payOrder);

module.exports = router;