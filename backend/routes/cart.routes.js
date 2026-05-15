const router = require('express').Router();
const pool = require('../config/db');
const { authRequired, allowRoles } = require('../middleware/auth.middleware');

router.use(authRequired, allowRoles('CUSTOMER'));

async function getOrCreateCart(userId) {
  const [rows] = await pool.query(
    `SELECT cart_id FROM carts WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  if (rows.length > 0) {
    return rows[0].cart_id;
  }

  const [result] = await pool.query(
    `INSERT INTO carts (user_id) VALUES (?)`,
    [userId]
  );

  return result.insertId;
}

async function getCart(req, res) {
  try {
    const cartId = await getOrCreateCart(req.user.user_id);

    const [items] = await pool.query(
      `SELECT 
        ci.cart_item_id,
        ci.product_id,
        ci.quantity,
        p.product_name,
        p.price,
        p.stock,
        p.image_url,
        p.status,
        (ci.quantity * p.price) AS subtotal
      FROM cart_items ci
      JOIN products p ON p.product_id = ci.product_id
      WHERE ci.cart_id = ?
      ORDER BY ci.updated_at DESC`,
      [cartId]
    );

    let total = 0;

    for (let i = 0; i < items.length; i++) {
      total = total + Number(items[i].subtotal);
    }

    return res.json({
      cart_id: cartId,
      items: items,
      total: total,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải giỏ hàng',
      error: error.message,
    });
  }
}

async function addItem(req, res) {
  try {
    const { product_id, quantity } = req.body;
    const itemQuantity = Number(quantity || 1);

    if (!product_id || itemQuantity <= 0) {
      return res.status(400).json({
        message: 'Sản phẩm hoặc số lượng không hợp lệ',
      });
    }

    const [products] = await pool.query(
      `SELECT product_id, stock, status 
       FROM products 
       WHERE product_id = ? 
       LIMIT 1`,
      [product_id]
    );

    const product = products[0];

    if (!product || product.status !== 'active') {
      return res.status(404).json({
        message: 'Sản phẩm không tồn tại hoặc đã ngừng bán',
      });
    }

    if (product.stock < itemQuantity) {
      return res.status(400).json({
        message: 'Số lượng vượt quá tồn kho',
      });
    }

    const cartId = await getOrCreateCart(req.user.user_id);

    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       quantity = quantity + VALUES(quantity),
       updated_at = CURRENT_TIMESTAMP`,
      [cartId, product_id, itemQuantity]
    );

    return res.status(201).json({
      message: 'Đã thêm sản phẩm vào giỏ hàng',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi thêm sản phẩm vào giỏ hàng',
      error: error.message,
    });
  }
}

async function updateItem(req, res) {
  try {
    const productId = req.params.productId;
    const quantity = Number(req.body.quantity);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        message: 'Số lượng không hợp lệ',
      });
    }

    const [products] = await pool.query(
      `SELECT stock 
       FROM products 
       WHERE product_id = ? 
       LIMIT 1`,
      [productId]
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm',
      });
    }

    if (products[0].stock < quantity) {
      return res.status(400).json({
        message: 'Số lượng vượt quá tồn kho',
      });
    }

    const cartId = await getOrCreateCart(req.user.user_id);

    const [result] = await pool.query(
      `UPDATE cart_items
       SET quantity = ?, updated_at = CURRENT_TIMESTAMP
       WHERE cart_id = ? AND product_id = ?`,
      [quantity, cartId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Sản phẩm chưa có trong giỏ hàng',
      });
    }

    return res.json({
      message: 'Đã cập nhật số lượng sản phẩm',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi cập nhật giỏ hàng',
      error: error.message,
    });
  }
}

async function removeItem(req, res) {
  try {
    const productId = req.params.productId;
    const cartId = await getOrCreateCart(req.user.user_id);

    const [result] = await pool.query(
      `DELETE FROM cart_items
       WHERE cart_id = ? AND product_id = ?`,
      [cartId, productId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Sản phẩm không tồn tại trong giỏ hàng',
      });
    }

    return res.json({
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi xóa sản phẩm khỏi giỏ hàng',
      error: error.message,
    });
  }
}

async function clearCart(req, res) {
  try {
    const cartId = await getOrCreateCart(req.user.user_id);

    await pool.query(
      `DELETE FROM cart_items WHERE cart_id = ?`,
      [cartId]
    );

    return res.json({
      message: 'Đã xóa toàn bộ giỏ hàng',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi xóa giỏ hàng',
      error: error.message,
    });
  }
}

router.get('/', getCart);
router.post('/items', addItem);
router.put('/items/:productId', updateItem);
router.delete('/items/:productId', removeItem);
router.delete('/clear', clearCart);

module.exports = router;