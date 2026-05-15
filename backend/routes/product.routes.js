const router = require('express').Router();
const pool = require('../config/db');

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
      where += ` AND (p.product_name LIKE ? OR p.description LIKE ?)`;
      params.push('%' + q + '%', '%' + q + '%');
    }

    if (category_id) {
      where += ` AND p.category_id = ?`;
      params.push(category_id);
    }

    const [rows] = await pool.query(
      `SELECT p.product_id, p.seller_id, sp.store_name, p.category_id,
              c.category_name, p.product_name, p.description, p.price,
              p.stock, p.image_url, p.status
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       JOIN seller_profiles sp ON sp.user_id = p.seller_id
       ${where}
       ORDER BY p.created_at DESC`,
      params
    );

    return res.json(rows);
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
      `SELECT p.product_id, p.seller_id, sp.store_name, p.category_id,
              c.category_name, p.product_name, p.description, p.price,
              p.stock, p.image_url, p.status
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       JOIN seller_profiles sp ON sp.user_id = p.seller_id
       WHERE p.product_id = ? AND p.status = 'active'
       LIMIT 1`,
      [req.params.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm',
      });
    }

    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải chi tiết sản phẩm',
      error: error.message,
    });
  }
}

router.get('/categories', listCategories);
router.get('/products', listProducts);
router.get('/products/:id', getProduct);

module.exports = router;