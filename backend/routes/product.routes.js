const router = require('express').Router();
const pool = require('../config/db');
const { authRequired, allowRoles } = require('../middleware/auth.middleware');

function normalizeRating(value) {
  const rating = Number(value);

  if (!Number.isFinite(rating)) return 0;
  return Math.round(rating * 10) / 10;
}

async function listCategories(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT category_id, category_name, description
       FROM categories
       WHERE status = 'active'
       ORDER BY category_name`
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải danh mục',
      error: error.message,
    });
  }
}

async function listProducts(req, res) {
  try {
    const { q = '', category_id } = req.query;

    const params = [];
    let where = `WHERE p.status = 'active'`;

    if (q) {
      where += ` AND (p.product_name LIKE ? OR p.description LIKE ? OR sp.store_name LIKE ?)`;
      params.push('%' + q + '%', '%' + q + '%', '%' + q + '%');
    }

    if (category_id) {
      where += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    const [rows] = await pool.query(
      `SELECT
        p.product_id,
        p.seller_id,
        sp.store_name,
        p.category_id,
        c.category_name,
        p.product_name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.status,
        COALESCE(ROUND(AVG(pr.rating), 1), 0) AS avg_rating,
        COUNT(pr.review_id) AS review_count
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       JOIN seller_profiles sp ON sp.user_id = p.seller_id
       LEFT JOIN product_reviews pr ON pr.product_id = p.product_id
       ${where}
       GROUP BY
        p.product_id,
        p.seller_id,
        sp.store_name,
        p.category_id,
        c.category_name,
        p.product_name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.status,
        p.created_at
       ORDER BY p.created_at DESC`,
      params
    );

    return res.json(rows.map(function (item) {
      return {
        ...item,
        avg_rating: normalizeRating(item.avg_rating),
        review_count: Number(item.review_count || 0),
      };
    }));
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải danh sách sản phẩm',
      error: error.message,
    });
  }
}

async function getProduct(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        p.product_id,
        p.seller_id,
        sp.store_name,
        sp.store_description,
        sp.store_status,
        u.full_name AS seller_name,
        u.phone AS seller_phone,
        u.address AS seller_address,
        p.category_id,
        c.category_name,
        p.product_name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.status,
        COALESCE(ROUND(AVG(pr.rating), 1), 0) AS avg_rating,
        COUNT(pr.review_id) AS review_count
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       JOIN seller_profiles sp ON sp.user_id = p.seller_id
       JOIN users u ON u.user_id = p.seller_id
       LEFT JOIN product_reviews pr ON pr.product_id = p.product_id
       WHERE p.product_id = ? AND p.status = 'active'
       GROUP BY
        p.product_id,
        p.seller_id,
        sp.store_name,
        sp.store_description,
        sp.store_status,
        u.full_name,
        u.phone,
        u.address,
        p.category_id,
        c.category_name,
        p.product_name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.status
       LIMIT 1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm',
      });
    }

    return res.json({
      ...rows[0],
      avg_rating: normalizeRating(rows[0].avg_rating),
      review_count: Number(rows[0].review_count || 0),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải chi tiết sản phẩm',
      error: error.message,
    });
  }
}

async function listProductReviews(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        pr.review_id,
        pr.product_id,
        pr.customer_id,
        u.full_name AS customer_name,
        pr.rating,
        pr.review_text,
        pr.created_at,
        pr.updated_at
       FROM product_reviews pr
       JOIN users u ON u.user_id = pr.customer_id
       WHERE pr.product_id = ?
       ORDER BY pr.created_at DESC
       LIMIT 30`,
      [req.params.id]
    );

    return res.json({
      reviews: rows.map(function (item) {
        return {
          ...item,
          rating: Number(item.rating || 0),
        };
      }),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải đánh giá sản phẩm',
      error: error.message,
    });
  }
}

async function createProductReview(req, res) {
  const conn = await pool.getConnection();

  try {
    const productId = req.params.id;
    const customerId = req.user.user_id;
    const rating = Number(req.body.rating);
    const reviewText = String(req.body.review_text || '').trim();

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Số sao phải từ 1 đến 5',
      });
    }

    if (reviewText.length > 1000) {
      return res.status(400).json({
        message: 'Nội dung đánh giá tối đa 1000 ký tự',
      });
    }

    await conn.beginTransaction();

    const [products] = await conn.query(
      `SELECT
        p.product_id,
        p.seller_id,
        p.product_name,
        sp.store_name
       FROM products p
       JOIN seller_profiles sp ON sp.user_id = p.seller_id
       WHERE p.product_id = ? AND p.status = 'active'
       LIMIT 1
       FOR UPDATE`,
      [productId]
    );

    const product = products[0];

    if (!product) {
      await conn.rollback();
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm để đánh giá',
      });
    }

    if (Number(product.seller_id) === Number(customerId)) {
      await conn.rollback();
      return res.status(400).json({
        message: 'Người bán không thể tự đánh giá sản phẩm của mình',
      });
    }

    await conn.query(
      `INSERT INTO product_reviews
      (
        product_id,
        customer_id,
        seller_id,
        rating,
        review_text
      )
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        review_text = VALUES(review_text),
        updated_at = CURRENT_TIMESTAMP`,
      [
        product.product_id,
        customerId,
        product.seller_id,
        rating,
        reviewText || null,
      ]
    );

    await conn.query(
      `INSERT INTO notifications
      (
        user_id,
        type,
        title,
        message,
        order_id
      )
      VALUES (?, 'SYSTEM', ?, ?, NULL)`,
      [
        product.seller_id,
        'Đánh giá sản phẩm mới',
        req.user.full_name + ' vừa đánh giá ' + rating + ' sao cho sản phẩm "' + product.product_name + '".',
      ]
    );

    const [summaryRows] = await conn.query(
      `SELECT
        COALESCE(ROUND(AVG(rating), 1), 0) AS avg_rating,
        COUNT(*) AS review_count
       FROM product_reviews
       WHERE product_id = ?`,
      [productId]
    );

    await conn.commit();

    const summary = summaryRows[0] || {};

    return res.status(201).json({
      message: 'Đã gửi đánh giá sản phẩm',
      avg_rating: normalizeRating(summary.avg_rating),
      review_count: Number(summary.review_count || 0),
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({
      message: 'Lỗi gửi đánh giá sản phẩm',
      error: error.message,
    });
  } finally {
    conn.release();
  }
}

async function getShop(req, res) {
  try {
    const sellerId = req.params.sellerId;

    const [rows] = await pool.query(
      `SELECT
        sp.user_id AS seller_id,
        sp.store_name,
        sp.store_description,
        sp.store_status,
        sp.created_at,
        u.full_name AS seller_name,
        u.phone AS seller_phone,
        u.address AS seller_address,
        COALESCE(ps.total_products, 0) AS total_products,
        COALESCE(rs.avg_rating, 0) AS avg_rating,
        COALESCE(rs.review_count, 0) AS review_count,
        COALESCE(os.total_sold, 0) AS total_sold
       FROM seller_profiles sp
       JOIN users u ON u.user_id = sp.user_id
       LEFT JOIN (
        SELECT seller_id, COUNT(*) AS total_products
        FROM products
        WHERE status = 'active'
        GROUP BY seller_id
       ) ps ON ps.seller_id = sp.user_id
       LEFT JOIN (
        SELECT seller_id, ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
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
       WHERE sp.user_id = ? AND sp.store_status = 'approved'
       LIMIT 1`,
      [sellerId]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Không tìm thấy shop',
      });
    }

    return res.json({
      ...rows[0],
      total_products: Number(rows[0].total_products || 0),
      avg_rating: normalizeRating(rows[0].avg_rating),
      review_count: Number(rows[0].review_count || 0),
      total_sold: Number(rows[0].total_sold || 0),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải thông tin shop',
      error: error.message,
    });
  }
}

async function listShopProducts(req, res) {
  try {
    const sellerId = req.params.sellerId;

    const [rows] = await pool.query(
      `SELECT
        p.product_id,
        p.seller_id,
        sp.store_name,
        p.category_id,
        c.category_name,
        p.product_name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.status,
        COALESCE(ROUND(AVG(pr.rating), 1), 0) AS avg_rating,
        COUNT(pr.review_id) AS review_count
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       JOIN seller_profiles sp ON sp.user_id = p.seller_id
       LEFT JOIN product_reviews pr ON pr.product_id = p.product_id
       WHERE p.seller_id = ?
        AND p.status = 'active'
        AND sp.store_status = 'approved'
       GROUP BY
        p.product_id,
        p.seller_id,
        sp.store_name,
        p.category_id,
        c.category_name,
        p.product_name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.status,
        p.created_at
       ORDER BY p.created_at DESC`,
      [sellerId]
    );

    return res.json(rows.map(function (item) {
      return {
        ...item,
        avg_rating: normalizeRating(item.avg_rating),
        review_count: Number(item.review_count || 0),
      };
    }));
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải sản phẩm của shop',
      error: error.message,
    });
  }
}

router.get('/categories', listCategories);
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.get('/products/:id/reviews', listProductReviews);
router.post('/products/:id/reviews', authRequired, allowRoles('CUSTOMER'), createProductReview);
router.get('/shops/:sellerId', getShop);
router.get('/shops/:sellerId/products', listShopProducts);

module.exports = router;
