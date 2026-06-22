const router = require('express').Router();
const pool = require('../config/db');
const { authRequired, allowRoles } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

router.use(authRequired, allowRoles('CUSTOMER'));

async function getOrderDetailForCustomer(orderId, customerId, conn) {
  const db = conn || pool;

  const [orders] = await db.query(
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
      created_at,
      updated_at
    FROM orders
    WHERE order_id = ? AND customer_id = ?
    LIMIT 1`,
    [orderId, customerId]
  );

  if (orders.length === 0) return null;

  const [items] = await db.query(
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

  return {
    order: orders[0],
    items,
  };
}

async function createOrder(req, res) {
  logger.line('TẠO ĐƠN HÀNG');
  logger.input('Body nhận vào', req.body);
  logger.input('User từ token', req.user);

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
      const response = { message: 'Vui lòng nhập đầy đủ thông tin nhận hàng' };
      logger.response(400, response);
      return res.status(400).json(response);
    }

    if (!['COD', 'BANKING', 'E-WALLET'].includes(finalPaymentMethod)) {
      const response = { message: 'Phương thức thanh toán không hợp lệ' };
      logger.response(400, response);
      return res.status(400).json(response);
    }

    logger.step('Bắt đầu transaction tạo đơn hàng');
    await conn.beginTransaction();

    logger.step('Lấy sản phẩm trong giỏ hàng và khóa tồn kho FOR UPDATE');
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

    logger.step('Danh sách sản phẩm trong giỏ hàng', items);

    if (items.length === 0) {
      await conn.rollback();
      const response = { message: 'Giỏ hàng đang trống' };
      logger.response(400, response);
      return res.status(400).json(response);
    }

    for (let i = 0; i < items.length; i++) {
      if (items[i].stock < items[i].quantity) {
        await conn.rollback();
        const response = {
          message: 'Sản phẩm "' + items[i].product_name + '" không đủ tồn kho',
          product_id: items[i].product_id,
          stock: items[i].stock,
          requested_quantity: items[i].quantity,
        };
        logger.response(400, response);
        return res.status(400).json(response);
      }
    }

    logger.step('Tính tổng tiền đơn hàng');
    const totalAmount = items.reduce(function (sum, item) {
      return sum + Number(item.price) * Number(item.quantity);
    }, 0);

    logger.step('Tổng tiền đã tính', { total_amount: totalAmount });

    const paymentStatus = finalPaymentMethod === 'COD' ? 'UNPAID' : 'PAID';

    logger.step('Insert bảng orders');
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
        paymentStatus,
        'PENDING',
      ]
    );

    const orderId = orderResult.insertId;
    logger.step('Order ID vừa tạo', { order_id: orderId });

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const subtotal = Number(item.price) * Number(item.quantity);

      logger.step('Insert order_items', {
        order_id: orderId,
        product_id: item.product_id,
        seller_id: item.seller_id,
        quantity: item.quantity,
        subtotal,
      });

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

      logger.step('Trừ tồn kho sản phẩm', {
        product_id: item.product_id,
        minus_quantity: item.quantity,
      });

      await conn.query(
        `UPDATE products
         SET stock = stock - ?
         WHERE product_id = ?`,
        [item.quantity, item.product_id]
      );
    }

    logger.step('Insert bảng payments');
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
        paymentStatus,
        finalPaymentMethod === 'COD' ? null : new Date(),
      ]
    );

    logger.step('Tạo thông báo cho buyer sau khi đặt hàng thành công');
    const [notificationResult] = await conn.query(
      `INSERT INTO notifications
      (
        user_id,
        type,
        title,
        message,
        order_id
      )
      VALUES (?, 'ORDER_CREATED', ?, ?, ?)`,
      [
        userId,
        'Đặt hàng thành công',
        'Đơn hàng #' + orderId + ' đã được tạo thành công. Shop sẽ sớm xác nhận đơn của bạn.',
        orderId,
      ]
    );

    logger.step('Xóa giỏ hàng sau khi tạo đơn thành công');
    await conn.query(
      `DELETE ci
       FROM cart_items ci
       JOIN carts c ON c.cart_id = ci.cart_id
       WHERE c.user_id = ?`,
      [userId]
    );

    const orderDetail = await getOrderDetailForCustomer(orderId, userId, conn);
    await conn.commit();

    const response = {
      message: 'Đặt hàng thành công',
      order_id: orderId,
      total_amount: totalAmount,
      notification_id: notificationResult.insertId,
      data: orderDetail,
    };

    logger.success('Tạo đơn hàng thành công', response);
    logger.response(201, response);
    return res.status(201).json(response);
  } catch (error) {
    await conn.rollback();
    logger.fail('Lỗi đặt hàng, rollback transaction', error);

    const response = { message: 'Lỗi đặt hàng', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  } finally {
    conn.release();
  }
}

async function myOrders(req, res) {
  logger.line('LẤY LỊCH SỬ ĐƠN HÀNG CỦA BUYER');
  logger.input('User từ token', req.user);

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
        created_at,
        updated_at
      FROM orders
      WHERE customer_id = ?
      ORDER BY created_at DESC`,
      [req.user.user_id]
    );

    logger.success('Danh sách đơn hàng', { total: orders.length, orders });
    logger.response(200, orders);
    return res.json(orders);
  } catch (error) {
    logger.fail('Lỗi tải lịch sử đơn hàng', error);
    const response = { message: 'Lỗi tải lịch sử đơn hàng', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
}

async function orderDetail(req, res) {
  logger.line('LẤY CHI TIẾT ĐƠN HÀNG BUYER');
  logger.input('Params', req.params);
  logger.input('User từ token', req.user);

  try {
    const orderId = req.params.id;
    const detail = await getOrderDetailForCustomer(orderId, req.user.user_id);

    if (!detail) {
      const response = { message: 'Không tìm thấy đơn hàng' };
      logger.response(404, response);
      return res.status(404).json(response);
    }

    logger.success('Chi tiết đơn hàng', detail);
    logger.response(200, detail);
    return res.json(detail);
  } catch (error) {
    logger.fail('Lỗi tải chi tiết đơn hàng', error);
    const response = { message: 'Lỗi tải chi tiết đơn hàng', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
}

async function payOrder(req, res) {
  logger.line('THANH TOÁN ĐƠN HÀNG');
  logger.input('Params', req.params);
  logger.input('User từ token', req.user);

  try {
    const orderId = req.params.id;

    logger.step('Update orders.payment_status = PAID');
    const [result] = await pool.query(
      `UPDATE orders
       SET payment_status = 'PAID'
       WHERE order_id = ? 
       AND customer_id = ? 
       AND payment_status = 'UNPAID'`,
      [orderId, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      const response = { message: 'Không tìm thấy đơn hàng cần thanh toán' };
      logger.response(404, response);
      return res.status(404).json(response);
    }

    logger.step('Update payments.payment_status = PAID');
    await pool.query(
      `UPDATE payments
       SET payment_status = 'PAID', paid_at = NOW()
       WHERE order_id = ?`,
      [orderId]
    );

    const detail = await getOrderDetailForCustomer(orderId, req.user.user_id);
    const response = {
      message: 'Thanh toán thành công',
      data: detail,
    };

    logger.success('Thanh toán thành công', response);
    logger.response(200, response);
    return res.json(response);
  } catch (error) {
    logger.fail('Lỗi thanh toán đơn hàng', error);
    const response = { message: 'Lỗi thanh toán đơn hàng', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
}

router.post('/', createOrder);
router.get('/my', myOrders);
router.get('/:id', orderDetail);
router.patch('/:id/pay', payOrder);

module.exports = router;
