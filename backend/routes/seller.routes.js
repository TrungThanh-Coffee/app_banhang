const router = require('express').Router();
const pool = require('../config/db');
const { authRequired, allowRoles } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

router.use(authRequired, allowRoles('SELLER', 'ADMIN'));

function toMysqlDate(date) {
  return date.toISOString().slice(0, 10);
}

function buildLastSevenDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);

    days.push({
      date: toMysqlDate(date),
      label: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      revenue: 0,
    });
  }

  return days;
}


async function getSellerProfile(req, res) {
  try {
    const sellerId = req.user.user_id;

    const [rows] = await pool.query(
      `SELECT
        sp.seller_id,
        sp.user_id,
        sp.store_name,
        sp.store_description,
        sp.store_status,
        sp.created_at,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        COALESCE(ps.total_products, 0) AS total_products,
        COALESCE(ps.active_products, 0) AS active_products,
        COALESCE(rs.avg_rating, 0) AS avg_rating,
        COALESCE(rs.review_count, 0) AS review_count,
        COALESCE(os.total_sold, 0) AS total_sold
       FROM seller_profiles sp
       JOIN users u ON u.user_id = sp.user_id
       LEFT JOIN (
        SELECT
          seller_id,
          COUNT(*) AS total_products,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_products
        FROM products
        GROUP BY seller_id
       ) ps ON ps.seller_id = sp.user_id
       LEFT JOIN (
        SELECT
          seller_id,
          ROUND(AVG(rating), 1) AS avg_rating,
          COUNT(*) AS review_count
        FROM product_reviews
        GROUP BY seller_id
       ) rs ON rs.seller_id = sp.user_id
       LEFT JOIN (
        SELECT oi.seller_id, SUM(oi.quantity) AS total_sold
        FROM order_items oi
        JOIN orders o ON o.order_id = oi.order_id
        WHERE o.order_status <> 'CANCELLED'
        GROUP BY oi.seller_id
       ) os ON os.seller_id = sp.user_id
       WHERE sp.user_id = ?
       LIMIT 1`,
      [sellerId]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Không tìm thấy thông tin shop của người bán',
      });
    }

    const row = rows[0];

    return res.json({
      seller_id: row.seller_id,
      user_id: row.user_id,
      store_name: row.store_name,
      store_description: row.store_description || '',
      store_status: row.store_status,
      created_at: row.created_at,
      owner: {
        full_name: row.full_name,
        email: row.email,
        phone: row.phone,
        address: row.address,
      },
      stats: {
        total_products: Number(row.total_products || 0),
        active_products: Number(row.active_products || 0),
        avg_rating: Number(row.avg_rating || 0),
        review_count: Number(row.review_count || 0),
        total_sold: Number(row.total_sold || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải thông tin shop người bán',
      error: error.message,
    });
  }
}

async function updateSellerShopProfile(req, res) {
  try {
    const sellerId = req.user.user_id;
    const { store_name, store_description } = req.body;

    if (!store_name || !String(store_name).trim()) {
      return res.status(400).json({
        message: 'Tên shop không được bỏ trống',
      });
    }

    await pool.query(
      `INSERT INTO seller_profiles
        (user_id, store_name, store_description, store_status)
       VALUES (?, ?, ?, 'approved')
       ON DUPLICATE KEY UPDATE
        store_name = VALUES(store_name),
        store_description = VALUES(store_description)`,
      [
        sellerId,
        String(store_name).trim(),
        store_description ? String(store_description).trim() : null,
      ]
    );

    const [rows] = await pool.query(
      `SELECT
        seller_id,
        user_id,
        store_name,
        store_description,
        store_status,
        created_at
       FROM seller_profiles
       WHERE user_id = ?
       LIMIT 1`,
      [sellerId]
    );

    return res.json({
      message: 'Đã cập nhật thông tin shop',
      shop: rows[0],
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi cập nhật thông tin shop',
      error: error.message,
    });
  }
}

async function dashboard(req, res) {
  try {
    const sellerId = req.user.user_id;

    const [productRows] = await pool.query(
      `SELECT
        COUNT(*) AS total_products,
        COALESCE(SUM(stock), 0) AS total_stock
       FROM products
       WHERE seller_id = ? AND status = 'active'`,
      [sellerId]
    );

    const [orderRows] = await pool.query(
      `SELECT
        COUNT(DISTINCT o.order_id) AS total_orders,
        COUNT(DISTINCT CASE WHEN o.order_status = 'PENDING' THEN o.order_id END) AS pending_orders,
        COUNT(DISTINCT CASE WHEN o.order_status = 'CONFIRMED' THEN o.order_id END) AS confirmed_orders,
        COUNT(DISTINCT CASE WHEN o.order_status = 'SHIPPING' THEN o.order_id END) AS shipping_orders,
        COUNT(DISTINCT CASE WHEN o.order_status = 'COMPLETED' THEN o.order_id END) AS completed_orders,
        COUNT(DISTINCT CASE WHEN o.order_status = 'CANCELLED' THEN o.order_id END) AS cancelled_orders,
        COALESCE(SUM(CASE WHEN o.order_status = 'COMPLETED' THEN oi.subtotal ELSE 0 END), 0) AS revenue
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       WHERE oi.seller_id = ?`,
      [sellerId]
    );

    const [trendRows] = await pool.query(
      `SELECT
        DATE_FORMAT(o.created_at, '%Y-%m-%d') AS order_date,
        COALESCE(SUM(oi.subtotal), 0) AS revenue
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       WHERE oi.seller_id = ?
        AND o.order_status = 'COMPLETED'
        AND DATE(o.created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m-%d')
       ORDER BY DATE_FORMAT(o.created_at, '%Y-%m-%d') ASC`,
      [sellerId]
    );

    const [topProductRows] = await pool.query(
      `SELECT
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) AS sold_quantity,
        COALESCE(SUM(oi.subtotal), 0) AS revenue
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       WHERE oi.seller_id = ?
        AND o.order_status <> 'CANCELLED'
       GROUP BY oi.product_id, oi.product_name
       ORDER BY sold_quantity DESC, revenue DESC
       LIMIT 5`,
      [sellerId]
    );

    const trendMap = new Map(
      trendRows.map(function (row) {
        return [String(row.order_date).slice(0, 10), Number(row.revenue || 0)];
      })
    );

    const revenueTrend = buildLastSevenDays().map(function (item) {
      return {
        ...item,
        revenue: trendMap.get(item.date) || 0,
      };
    });

    const products = productRows[0] || {};
    const orders = orderRows[0] || {};

    return res.json({
      summary: {
        total_products: Number(products.total_products || 0),
        total_stock: Number(products.total_stock || 0),
        total_orders: Number(orders.total_orders || 0),
        pending_orders: Number(orders.pending_orders || 0),
        confirmed_orders: Number(orders.confirmed_orders || 0),
        shipping_orders: Number(orders.shipping_orders || 0),
        completed_orders: Number(orders.completed_orders || 0),
        cancelled_orders: Number(orders.cancelled_orders || 0),
        revenue: Number(orders.revenue || 0),
      },
      revenue_trend: revenueTrend,
      order_status_chart: [
        { key: 'PENDING', label: 'Chờ xử lý', value: Number(orders.pending_orders || 0), color: '#F59E0B' },
        { key: 'CONFIRMED', label: 'Đã xác nhận', value: Number(orders.confirmed_orders || 0), color: '#6366F1' },
        { key: 'SHIPPING', label: 'Đang giao', value: Number(orders.shipping_orders || 0), color: '#3B82F6' },
        { key: 'COMPLETED', label: 'Đã giao', value: Number(orders.completed_orders || 0), color: '#10B981' },
        { key: 'CANCELLED', label: 'Đã hủy', value: Number(orders.cancelled_orders || 0), color: '#EF4444' },
      ],
      top_products: topProductRows.map(function (item) {
        return {
          product_id: item.product_id,
          product_name: item.product_name,
          sold_quantity: Number(item.sold_quantity || 0),
          revenue: Number(item.revenue || 0),
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải dashboard người bán',
      error: error.message,
    });
  }
}

async function listMyProducts(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        p.product_id,
        p.seller_id,
        p.category_id,
        c.category_name,
        p.product_name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.status,
        p.created_at,
        p.updated_at
      FROM products p
      JOIN categories c ON c.category_id = p.category_id
      WHERE p.seller_id = ?
      ORDER BY p.created_at DESC`,
      [req.user.user_id]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải sản phẩm của người bán',
      error: error.message,
    });
  }
}

async function createProduct(req, res) {
  try {
    const {
      category_id,
      product_name,
      description,
      price,
      stock,
      image_url,
    } = req.body;

    if (!category_id || !product_name || price === undefined || stock === undefined) {
      return res.status(400).json({
        message: 'Vui lòng nhập danh mục, tên sản phẩm, giá và tồn kho',
      });
    }

    if (Number(price) < 0 || Number(stock) < 0) {
      return res.status(400).json({
        message: 'Giá và tồn kho không được nhỏ hơn 0',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO products
      (
        seller_id,
        category_id,
        product_name,
        description,
        price,
        stock,
        image_url,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        req.user.user_id,
        category_id,
        product_name,
        description || null,
        price,
        stock,
        image_url || null,
      ]
    );

    return res.status(201).json({
      message: 'Đã thêm sản phẩm',
      product_id: result.insertId,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi thêm sản phẩm',
      error: error.message,
    });
  }
}

async function updateProduct(req, res) {
  try {
    const productId = req.params.id;

    const {
      category_id,
      product_name,
      description,
      price,
      stock,
      image_url,
      status,
    } = req.body;

    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({
        message: 'Giá sản phẩm không hợp lệ',
      });
    }

    if (stock !== undefined && Number(stock) < 0) {
      return res.status(400).json({
        message: 'Tồn kho không hợp lệ',
      });
    }

    if (status && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        message: 'Trạng thái sản phẩm không hợp lệ',
      });
    }

    const [result] = await pool.query(
      `UPDATE products
       SET 
        category_id = COALESCE(?, category_id),
        product_name = COALESCE(?, product_name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        stock = COALESCE(?, stock),
        image_url = COALESCE(?, image_url),
        status = COALESCE(?, status)
       WHERE product_id = ? AND seller_id = ?`,
      [
        category_id || null,
        product_name || null,
        description || null,
        price === undefined ? null : price,
        stock === undefined ? null : stock,
        image_url || null,
        status || null,
        productId,
        req.user.user_id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm của người bán',
      });
    }

    return res.json({
      message: 'Đã cập nhật sản phẩm',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi cập nhật sản phẩm',
      error: error.message,
    });
  }
}

async function setProductVisibility(req, res, status, successMessage, errorMessage) {
  try {
    const productId = req.params.id;

    const [result] = await pool.query(
      `UPDATE products
       SET status = ?, updated_at = NOW()
       WHERE product_id = ? AND seller_id = ?`,
      [status, productId, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm của người bán',
      });
    }

    return res.json({
      message: successMessage,
      product_id: Number(productId),
      status,
    });
  } catch (error) {
    return res.status(500).json({
      message: errorMessage,
      error: error.message,
    });
  }
}

async function deleteProduct(req, res) {
  return setProductVisibility(
    req,
    res,
    'inactive',
    'Đã ẩn sản phẩm',
    'Lỗi ẩn sản phẩm'
  );
}

async function restoreProduct(req, res) {
  return setProductVisibility(
    req,
    res,
    'active',
    'Đã hiện sản phẩm',
    'Lỗi hiện sản phẩm'
  );
}

async function listOrders(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT 
        o.order_id,
        o.receiver_name,
        o.receiver_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,
        SUM(oi.subtotal) AS seller_total
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.order_id
      WHERE oi.seller_id = ?
      GROUP BY 
        o.order_id,
        o.receiver_name,
        o.receiver_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at
      ORDER BY o.created_at DESC`,
      [req.user.user_id]
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải đơn hàng của người bán',
      error: error.message,
    });
  }
}

async function orderDetail(req, res) {
  try {
    const orderId = req.params.id;

    const [orders] = await pool.query(
      `SELECT 
        o.order_id,
        o.receiver_name,
        o.receiver_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,
        SUM(oi.subtotal) AS seller_total
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.order_id
      WHERE o.order_id = ? AND oi.seller_id = ?
      GROUP BY 
        o.order_id,
        o.receiver_name,
        o.receiver_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at
      LIMIT 1`,
      [orderId, req.user.user_id]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng của người bán',
      });
    }

    const [items] = await pool.query(
      `SELECT 
        oi.order_item_id,
        oi.product_id,
        oi.product_name,
        oi.unit_price,
        oi.quantity,
        oi.subtotal
      FROM order_items oi
      WHERE oi.order_id = ? AND oi.seller_id = ?`,
      [orderId, req.user.user_id]
    );

    return res.json({
      order: orders[0],
      items: items,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải chi tiết đơn hàng người bán',
      error: error.message,
    });
  }
}

function getOrderStatusText(status) {
  const labels = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đang chuẩn bị hàng',
    SHIPPING: 'Đang giao hàng',
    COMPLETED: 'Đã giao thành công',
    CANCELLED: 'Đã hủy',
  };

  return labels[status] || status;
}

async function updateOrderStatus(req, res) {
  logger.line('SELLER CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG');
  logger.input('Params', req.params);
  logger.input('Body nhận vào', req.body);
  logger.input('Seller từ token', req.user);

  const conn = await pool.getConnection();

  try {
    const orderId = req.params.id;
    const { order_status } = req.body;

    const allowedStatuses = ['CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

    if (!allowedStatuses.includes(order_status)) {
      const response = { message: 'Trạng thái đơn hàng không hợp lệ' };
      logger.response(400, response);
      return res.status(400).json(response);
    }

    await conn.beginTransaction();

    logger.step('Kiểm tra đơn hàng có sản phẩm thuộc seller này không');
    const [orders] = await conn.query(
      `SELECT
        o.order_id,
        o.customer_id,
        o.receiver_name,
        o.receiver_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status AS old_status,
        SUM(oi.subtotal) AS seller_total
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       WHERE o.order_id = ? AND oi.seller_id = ?
       GROUP BY
        o.order_id,
        o.customer_id,
        o.receiver_name,
        o.receiver_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status
       LIMIT 1
       FOR UPDATE`,
      [orderId, req.user.user_id]
    );

    const order = orders[0];
    logger.step('Thông tin đơn hàng trước khi update', order || null);

    if (!order) {
      await conn.rollback();
      const response = { message: 'Không tìm thấy đơn hàng của người bán' };
      logger.response(404, response);
      return res.status(404).json(response);
    }

    logger.step('Update orders.order_status', {
      order_id: orderId,
      from: order.old_status,
      to: order_status,
    });

    await conn.query(
      `UPDATE orders
       SET order_status = ?
       WHERE order_id = ?`,
      [order_status, orderId]
    );

    const statusText = getOrderStatusText(order_status);

    logger.step('Insert thông báo mới cho buyer', {
      buyer_user_id: order.customer_id,
      order_id: orderId,
      status: statusText,
    });

    const [notificationResult] = await conn.query(
      `INSERT INTO notifications
      (
        user_id,
        type,
        title,
        message,
        order_id
      )
      VALUES (?, 'ORDER_STATUS_UPDATED', ?, ?, ?)`,
      [
        order.customer_id,
        'Đơn hàng #' + orderId + ' đã cập nhật',
        'Trạng thái đơn hàng của bạn hiện là: ' + statusText + '.',
        orderId,
      ]
    );

    const [updatedRows] = await conn.query(
      `SELECT
        o.order_id,
        o.customer_id,
        o.receiver_name,
        o.receiver_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.updated_at,
        SUM(oi.subtotal) AS seller_total
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       WHERE o.order_id = ? AND oi.seller_id = ?
       GROUP BY
        o.order_id,
        o.customer_id,
        o.receiver_name,
        o.receiver_phone,
        o.shipping_address,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.updated_at
       LIMIT 1`,
      [orderId, req.user.user_id]
    );

    await conn.commit();

    const response = {
      message: 'Đã cập nhật trạng thái đơn hàng',
      notification_id: notificationResult.insertId,
      order: updatedRows[0],
    };

    logger.success('Cập nhật trạng thái và tạo thông báo thành công', response);
    logger.response(200, response);
    return res.json(response);
  } catch (error) {
    await conn.rollback();
    logger.fail('Lỗi cập nhật trạng thái đơn hàng, rollback transaction', error);

    const response = { message: 'Lỗi cập nhật trạng thái đơn hàng', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  } finally {
    conn.release();
  }
}

router.get('/profile', getSellerProfile);
router.patch('/profile/shop', updateSellerShopProfile);
router.get('/dashboard', dashboard);

router.get('/products', listMyProducts);
router.post('/products', createProduct);
router.patch('/products/:id/hide', deleteProduct);
router.patch('/products/:id/restore', restoreProduct);
router.put('/products/:id', updateProduct);

router.get('/orders', listOrders);
router.get('/orders/:id', orderDetail);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;