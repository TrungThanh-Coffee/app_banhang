const router = require('express').Router();
const pool = require('../config/db');
const { authRequired, allowRoles } = require('../middleware/auth.middleware');

router.use(authRequired, allowRoles('SELLER', 'ADMIN'));

// async function dashboard(req, res) {
//   try {
//     const sellerId = req.user.user_id;

//     const [productRows] = await pool.query(
//       `SELECT 
//         COUNT(*) AS total_products,
//         COALESCE(SUM(stock), 0) AS total_stock
//       FROM products
//       WHERE seller_id = ? AND status = 'active'`,
//       [sellerId]
//     );

//     const [orderRows] = await pool.query(
//       `SELECT 
//         COUNT(DISTINCT oi.order_id) AS total_orders,
//         COALESCE(SUM(oi.subtotal), 0) AS revenue
//       FROM order_items oi
//       JOIN orders o ON o.order_id = oi.order_id
//       WHERE oi.seller_id = ? 
//       AND o.order_status <> 'CANCELLED'`,
//       [sellerId]
//     );

//     return res.json({
//       total_products: productRows[0].total_products,
//       total_stock: productRows[0].total_stock,
//       total_orders: orderRows[0].total_orders,
//       revenue: orderRows[0].revenue,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       message: 'Lỗi tải dashboard người bán',
//       error: error.message,
//     });
//   }
// }

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

async function deleteProduct(req, res) {
  try {
    const productId = req.params.id;

    const [result] = await pool.query(
      `UPDATE products
       SET status = 'inactive'
       WHERE product_id = ? AND seller_id = ?`,
      [productId, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm của người bán',
      });
    }

    return res.json({
      message: 'Đã ẩn sản phẩm',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi ẩn sản phẩm',
      error: error.message,
    });
  }
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

async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id;
    const { order_status } = req.body;

    const allowedStatuses = ['CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

    if (!allowedStatuses.includes(order_status)) {
      return res.status(400).json({
        message: 'Trạng thái đơn hàng không hợp lệ',
      });
    }

    const [owns] = await pool.query(
      `SELECT order_item_id
       FROM order_items
       WHERE order_id = ? AND seller_id = ?
       LIMIT 1`,
      [orderId, req.user.user_id]
    );

    if (owns.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng của người bán',
      });
    }

    await pool.query(
      `UPDATE orders
       SET order_status = ?
       WHERE order_id = ?`,
      [order_status, orderId]
    );

    return res.json({
      message: 'Đã cập nhật trạng thái đơn hàng',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi cập nhật trạng thái đơn hàng',
      error: error.message,
    });
  }
}

router.get('/products', listMyProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/orders', listOrders);
router.get('/orders/:id', orderDetail);
router.patch('/orders/:id/status', updateOrderStatus);

module.exports = router;