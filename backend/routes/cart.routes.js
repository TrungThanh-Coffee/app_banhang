const router = require('express').Router();
const pool = require('../config/db');
const { authRequired, allowRoles } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

router.use(authRequired, allowRoles('CUSTOMER'));

async function getOrCreateCart(userId, conn) {
  const db = conn || pool;
  const [rows] = await db.query(
    `SELECT cart_id FROM carts WHERE user_id = ? LIMIT 1`,
    [userId]
  );

  if (rows.length > 0) {
    return rows[0].cart_id;
  }

  const [result] = await db.query(
    `INSERT INTO carts (user_id) VALUES (?)`,
    [userId]
  );

  return result.insertId;
}

async function getCartDetail(userId, conn) {
  const db = conn || pool;
  const cartId = await getOrCreateCart(userId, db);

  const [items] = await db.query(
    `SELECT 
      ci.cart_item_id,
      ci.product_id,
      ci.quantity,
      p.seller_id,
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

  const total = items.reduce(function (sum, item) {
    return sum + Number(item.subtotal || 0);
  }, 0);

  return {
    cart_id: cartId,
    items,
    total,
  };
}

async function getCart(req, res) {
  logger.line('LẤY GIỎ HÀNG');
  logger.input('User từ token', req.user);

  try {
    const cart = await getCartDetail(req.user.user_id);
    logger.success('Giỏ hàng hiện tại', cart);
    logger.response(200, cart);
    return res.json(cart);
  } catch (error) {
    logger.fail('Lỗi tải giỏ hàng', error);
    const response = { message: 'Lỗi tải giỏ hàng', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
}

async function addItem(req, res) {
  logger.line('THÊM GIỎ HÀNG');
  logger.input('Body nhận vào', req.body);
  logger.input('User từ token', req.user);

  try {
    const { product_id, quantity } = req.body;
    const itemQuantity = Number(quantity || 1);

    if (!product_id || itemQuantity <= 0) {
      const response = { message: 'Sản phẩm hoặc số lượng không hợp lệ' };
      logger.response(400, response);
      return res.status(400).json(response);
    }

    logger.step('Bắt đầu tìm sản phẩm theo product_id=' + product_id);

    const [products] = await pool.query(
      `SELECT product_id, seller_id, product_name, price, stock, image_url, status 
       FROM products 
       WHERE product_id = ? 
       LIMIT 1`,
      [product_id]
    );

    const product = products[0];
    logger.step('Kết quả tìm sản phẩm', product || null);

    if (!product || product.status !== 'active') {
      const response = { message: 'Sản phẩm không tồn tại hoặc đã ngừng bán' };
      logger.response(404, response);
      return res.status(404).json(response);
    }

    if (product.stock < itemQuantity) {
      const response = {
        message: 'Số lượng vượt quá tồn kho',
        product_stock: product.stock,
        requested_quantity: itemQuantity,
      };
      logger.response(400, response);
      return res.status(400).json(response);
    }

    logger.step('Lấy hoặc tạo giỏ hàng của người dùng');
    const cartId = await getOrCreateCart(req.user.user_id);

    logger.step('Insert hoặc cộng dồn số lượng trong cart_items', {
      cart_id: cartId,
      product_id,
      quantity: itemQuantity,
    });

    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       quantity = quantity + VALUES(quantity),
       updated_at = CURRENT_TIMESTAMP`,
      [cartId, product_id, itemQuantity]
    );

    logger.step('Tính lại tổng tiền sau khi thêm sản phẩm');
    const cart = await getCartDetail(req.user.user_id);
    const addedItem = cart.items.find(function (item) {
      return Number(item.product_id) === Number(product_id);
    });

    const response = {
      message: 'Đã thêm sản phẩm vào giỏ hàng',
      added_item: addedItem,
      cart,
    };

    logger.success('Thêm giỏ hàng thành công', response);
    logger.response(201, response);
    return res.status(201).json(response);
  } catch (error) {
    logger.fail('Lỗi thêm sản phẩm vào giỏ hàng', error);
    const response = { message: 'Lỗi thêm sản phẩm vào giỏ hàng', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
}

async function updateItem(req, res) {
  logger.line('CẬP NHẬT SỐ LƯỢNG GIỎ HÀNG');
  logger.input('Params', req.params);
  logger.input('Body nhận vào', req.body);
  logger.input('User từ token', req.user);

  try {
    const productId = req.params.productId;
    const quantity = Number(req.body.quantity);

    if (!quantity || quantity <= 0) {
      const response = { message: 'Số lượng không hợp lệ' };
      logger.response(400, response);
      return res.status(400).json(response);
    }

    logger.step('Kiểm tra tồn kho sản phẩm');
    const [products] = await pool.query(
      `SELECT product_id, product_name, stock 
       FROM products 
       WHERE product_id = ? 
       LIMIT 1`,
      [productId]
    );

    if (products.length === 0) {
      const response = { message: 'Không tìm thấy sản phẩm' };
      logger.response(404, response);
      return res.status(404).json(response);
    }

    logger.step('Thông tin tồn kho hiện tại', products[0]);

    if (products[0].stock < quantity) {
      const response = {
        message: 'Số lượng vượt quá tồn kho',
        product_stock: products[0].stock,
        requested_quantity: quantity,
      };
      logger.response(400, response);
      return res.status(400).json(response);
    }

    const cartId = await getOrCreateCart(req.user.user_id);

    logger.step('Update cart_items.quantity', { cart_id: cartId, product_id: productId, quantity });
    const [result] = await pool.query(
      `UPDATE cart_items
       SET quantity = ?, updated_at = CURRENT_TIMESTAMP
       WHERE cart_id = ? AND product_id = ?`,
      [quantity, cartId, productId]
    );

    if (result.affectedRows === 0) {
      const response = { message: 'Sản phẩm chưa có trong giỏ hàng' };
      logger.response(404, response);
      return res.status(404).json(response);
    }

    logger.step('Tính lại tổng tiền giỏ hàng sau update');
    const cart = await getCartDetail(req.user.user_id);
    const response = {
      message: 'Đã cập nhật số lượng sản phẩm',
      cart,
    };

    logger.success('Cập nhật giỏ hàng thành công', response);
    logger.response(200, response);
    return res.json(response);
  } catch (error) {
    logger.fail('Lỗi cập nhật giỏ hàng', error);
    const response = { message: 'Lỗi cập nhật giỏ hàng', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
}

async function removeItem(req, res) {
  logger.line('XÓA SẢN PHẨM KHỎI GIỎ HÀNG');
  logger.input('Params', req.params);
  logger.input('User từ token', req.user);

  try {
    const productId = req.params.productId;
    const cartId = await getOrCreateCart(req.user.user_id);

    logger.step('Xóa cart_items theo cart_id và product_id', { cart_id: cartId, product_id: productId });
    const [result] = await pool.query(
      `DELETE FROM cart_items
       WHERE cart_id = ? AND product_id = ?`,
      [cartId, productId]
    );

    if (result.affectedRows === 0) {
      const response = { message: 'Sản phẩm không tồn tại trong giỏ hàng' };
      logger.response(404, response);
      return res.status(404).json(response);
    }

    logger.step('Tính lại tổng tiền sau khi xóa sản phẩm');
    const cart = await getCartDetail(req.user.user_id);
    const response = {
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      cart,
    };

    logger.success('Xóa sản phẩm khỏi giỏ hàng thành công', response);
    logger.response(200, response);
    return res.json(response);
  } catch (error) {
    logger.fail('Lỗi xóa sản phẩm khỏi giỏ hàng', error);
    const response = { message: 'Lỗi xóa sản phẩm khỏi giỏ hàng', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
}

async function clearCart(req, res) {
  logger.line('XÓA TOÀN BỘ GIỎ HÀNG');
  logger.input('User từ token', req.user);

  try {
    const cartId = await getOrCreateCart(req.user.user_id);

    logger.step('Xóa toàn bộ cart_items', { cart_id: cartId });
    await pool.query(
      `DELETE FROM cart_items WHERE cart_id = ?`,
      [cartId]
    );

    const cart = await getCartDetail(req.user.user_id);
    const response = {
      message: 'Đã xóa toàn bộ giỏ hàng',
      cart,
    };

    logger.success('Giỏ hàng đã được làm trống', response);
    logger.response(200, response);
    return res.json(response);
  } catch (error) {
    logger.fail('Lỗi xóa giỏ hàng', error);
    const response = { message: 'Lỗi xóa giỏ hàng', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
}

router.get('/', getCart);
router.post('/items', addItem);
router.put('/items/:productId', updateItem);
router.delete('/items/:productId', removeItem);
router.delete('/clear', clearCart);

module.exports = router;
