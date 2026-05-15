const router = require('express').Router();
const pool = require('../config/db');
const { authRequired, allowRoles } = require('../middlewares/auth.middleware');

router.use(authRequired, allowRoles('ADMIN'));

async function listUsers(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        user_id,
        full_name,
        email,
        phone,
        address,
        role,
        status,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải danh sách người dùng',
      error: error.message,
    });
  }
}

async function getUserDetail(req, res) {
  try {
    const userId = req.params.id;

    const [rows] = await pool.query(
      `SELECT 
        user_id,
        full_name,
        email,
        phone,
        address,
        role,
        status,
        created_at,
        updated_at
      FROM users
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải chi tiết người dùng',
      error: error.message,
    });
  }
}

async function updateUserRole(req, res) {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    if (!['CUSTOMER', 'SELLER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        message: 'Role không hợp lệ',
      });
    }

    const [result] = await pool.query(
      `UPDATE users 
       SET role = ?
       WHERE user_id = ?`,
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.json({
      message: 'Đã cập nhật role người dùng',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi cập nhật role',
      error: error.message,
    });
  }
}

async function updateUserStatus(req, res) {
  try {
    const userId = req.params.id;
    const { status } = req.body;

    if (!['active', 'locked'].includes(status)) {
      return res.status(400).json({
        message: 'Trạng thái tài khoản không hợp lệ',
      });
    }

    const [result] = await pool.query(
      `UPDATE users 
       SET status = ?
       WHERE user_id = ?`,
      [status, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.json({
      message: 'Đã cập nhật trạng thái tài khoản',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi cập nhật trạng thái tài khoản',
      error: error.message,
    });
  }
}

async function dashboard(req, res) {
  try {
    const [userRows] = await pool.query(
      `SELECT 
        COUNT(*) AS total_users,
        SUM(role = 'CUSTOMER') AS total_customers,
        SUM(role = 'SELLER') AS total_sellers,
        SUM(role = 'ADMIN') AS total_admins
      FROM users`
    );

    const [productRows] = await pool.query(
      `SELECT 
        COUNT(*) AS total_products,
        COALESCE(SUM(stock), 0) AS total_stock
      FROM products
      WHERE status = 'active'`
    );

    const [orderRows] = await pool.query(
      `SELECT 
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_amount), 0) AS total_revenue
      FROM orders
      WHERE order_status <> 'CANCELLED'`
    );

    return res.json({
      total_users: userRows[0].total_users,
      total_customers: userRows[0].total_customers,
      total_sellers: userRows[0].total_sellers,
      total_admins: userRows[0].total_admins,
      total_products: productRows[0].total_products,
      total_stock: productRows[0].total_stock,
      total_orders: orderRows[0].total_orders,
      total_revenue: orderRows[0].total_revenue,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải dashboard admin',
      error: error.message,
    });
  }
}

async function listOrders(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        o.order_id,
        u.full_name AS customer_name,
        u.email AS customer_email,
        o.receiver_name,
        o.receiver_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at
      FROM orders o
      JOIN users u ON u.user_id = o.customer_id
      ORDER BY o.created_at DESC`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải danh sách đơn hàng',
      error: error.message,
    });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const { order_status } = req.body;

    const allowedStatuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

    if (!allowedStatuses.includes(order_status)) {
      return res.status(400).json({
        message: 'Trạng thái đơn hàng không hợp lệ',
      });
    }

    const [result] = await pool.query(
      `UPDATE orders
       SET order_status = ?
       WHERE order_id = ?`,
      [order_status, orderId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng',
      });
    }

    return res.json({
      message: 'Admin đã cập nhật trạng thái đơn hàng',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi cập nhật trạng thái đơn hàng',
      error: error.message,
    });
  }
}

router.get('/dashboard', dashboard);
router.get('/users', listUsers);
router.get('/users/:id', getUserDetail);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.get('/orders', listOrders);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;