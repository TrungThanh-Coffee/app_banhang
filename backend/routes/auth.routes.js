const router = require('express').Router();
const pool = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { authRequired } = require('../middleware/auth.middleware');

function cleanUser(user) {
  return {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    status: user.status,
  };
}

async function registerCustomer(req, res) {
  try {
    const { full_name, email, password, phone, address } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập họ tên, email và mật khẩu',
      });
    }

    const passwordHash = await hashPassword(password);

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, address, role)
       VALUES (?, ?, ?, ?, ?, 'CUSTOMER')`,
      [full_name, email, passwordHash, phone || null, address || null]
    );

    const user = {
      user_id: result.insertId,
      full_name,
      email,
      phone: phone || null,
      address: address || null,
      role: 'CUSTOMER',
      status: 'active',
    };

    return res.status(201).json({
      message: 'Đăng ký khách hàng thành công',
      user,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Email hoặc số điện thoại đã tồn tại',
      });
    }

    return res.status(500).json({
      message: 'Lỗi đăng ký',
      error: error.message,
    });
  }
}

async function registerSeller(req, res) {
  const conn = await pool.getConnection();

  try {
    const {
      full_name,
      email,
      password,
      phone,
      address,
      store_name,
      store_description,
    } = req.body;

    if (!full_name || !email || !password || !store_name) {
      return res.status(400).json({
        message: 'Vui lòng nhập đủ thông tin người bán và tên cửa hàng',
      });
    }

    const passwordHash = await hashPassword(password);

    await conn.beginTransaction();

    const [userResult] = await conn.query(
      `INSERT INTO users (full_name, email, password_hash, phone, address, role)
       VALUES (?, ?, ?, ?, ?, 'SELLER')`,
      [full_name, email, passwordHash, phone || null, address || null]
    );

    await conn.query(
      `INSERT INTO seller_profiles (user_id, store_name, store_description)
       VALUES (?, ?, ?)`,
      [userResult.insertId, store_name, store_description || null]
    );

    await conn.commit();

    const user = {
      user_id: userResult.insertId,
      full_name,
      email,
      phone: phone || null,
      address: address || null,
      role: 'SELLER',
      status: 'active',
    };

    return res.status(201).json({
      message: 'Đăng ký người bán thành công',
      user,
    });
  } catch (error) {
    await conn.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Email hoặc số điện thoại đã tồn tại',
      });
    }

    return res.status(500).json({
      message: 'Lỗi đăng ký người bán',
      error: error.message,
    });
  } finally {
    conn.release();
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Vui lòng nhập email và mật khẩu',
      });
    }

    const [rows] = await pool.query(
      `SELECT user_id, full_name, email, password_hash, phone, address, role, status
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        message: 'Tài khoản đang bị khóa',
      });
    }

    return res.json({
      message: 'Đăng nhập thành công',
      user: cleanUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi đăng nhập',
      error: error.message,
    });
  }
}

function me(req, res) {
  return res.json(req.user);
}

router.post('/register', registerCustomer);
router.post('/register-seller', registerSeller);
router.post('/login', login);
router.get('/me', authRequired, me);

module.exports = router;