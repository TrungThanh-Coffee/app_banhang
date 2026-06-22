const router = require('express').Router();

const pool = require('../config/db');
const { authRequired } = require('../middleware/auth.middleware');

function buildOrderNotification(order) {
  let title = 'Cập nhật đơn hàng';
  let message = `Đơn hàng #${order.order_id} hiện đang ở trạng thái ${order.order_status}.`;
  let type = 'ORDER_STATUS';

  if (order.order_status === 'PENDING') {
    title = 'Đặt hàng thành công';
    message = `Bạn đã đặt hàng thành công đơn #${order.order_id}. Tổng tiền: ${Number(order.total_amount).toLocaleString('vi-VN')}đ.`;
    type = 'ORDER_CREATED';
  }

  if (order.order_status === 'CONFIRMED') {
    title = 'Đơn hàng đã được xác nhận';
    message = `Đơn hàng #${order.order_id} đã được người bán xác nhận.`;
  }

  if (order.order_status === 'SHIPPING') {
    title = 'Đơn hàng đang được giao';
    message = `Đơn hàng #${order.order_id} đang trên đường giao đến bạn.`;
  }

  if (order.order_status === 'COMPLETED') {
    title = 'Đơn hàng đã giao thành công';
    message = `Đơn hàng #${order.order_id} đã được giao thành công.`;
  }

  if (order.order_status === 'CANCELLED') {
    title = 'Đơn hàng đã bị hủy';
    message = `Đơn hàng #${order.order_id} đã bị hủy.`;
    type = 'ORDER_CANCELLED';
  }

  return {
    notification_id: `ORDER-${order.order_id}-${order.order_status}`,
    type,
    order_id: order.order_id,
    title,
    message,
    is_read: false,
    created_at: order.updated_at || order.created_at,
    updated_at: order.updated_at,
  };
}

router.get('/', authRequired, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT order_id, customer_id, total_amount, order_status, created_at, updated_at
       FROM orders
       WHERE customer_id = ?
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 30`,
      [req.user.user_id]
    );

    const notifications = orders.map(buildOrderNotification);

    return res.json({
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi lấy thông báo đơn hàng',
      error: error.message,
    });
  }
});

router.get('/unread-count', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS unread_count
       FROM orders
       WHERE customer_id = ?
         AND order_status IN ('PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED')`,
      [req.user.user_id]
    );

    return res.json({
      unread_count: Number(rows[0]?.unread_count || 0),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi lấy số thông báo',
      error: error.message,
    });
  }
});

module.exports = router;