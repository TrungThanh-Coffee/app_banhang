const pool = require('../config/db');
const { verifyToken } = require('../utils/token');

function getBearerToken(req) {
  const authorization = req.headers.authorization || '';
  const parts = authorization.split(' ');

  if (parts.length === 2 && parts[0] === 'Bearer' && parts[1]) {
    return parts[1];
  }

  return null;
}

async function authRequired(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        message: 'Bạn cần đăng nhập',
      });
    }

    let payload;

    try {
      payload = verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        message: 'Token không hợp lệ hoặc đã hết hạn',
      });
    }

    const [rows] = await pool.query(
      `SELECT user_id, full_name, email, phone, address, role, status
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
      [payload.user_id]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Tài khoản không tồn tại',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        message: 'Tài khoản đang bị khóa',
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi xác thực người dùng',
      error: error.message,
    });
  }
}

function allowRoles() {
  const roles = Array.from(arguments);

  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập chức năng này',
      });
    }

    return next();
  };
}

module.exports = {
  authRequired,
  allowRoles,
};