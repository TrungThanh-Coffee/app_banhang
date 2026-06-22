const router = require('express').Router();
const pool = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { generateToken } = require('../utils/token');
const { authRequired } = require('../middleware/auth.middleware');

const ALLOWED_REGISTER_ROLES = ['CUSTOMER', 'SELLER'];

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

function normalizeRole(role) {
  if (!role) {
    return 'CUSTOMER';
  }

  return String(role).trim().toUpperCase();
}

function validateRegisterPayload(payload) {
  const role = normalizeRole(payload.role);

  if (!ALLOWED_REGISTER_ROLES.includes(role)) {
    return {
      valid: false,
      message: 'Vai trò đăng ký không hợp lệ',
    };
  }

  if (!payload.full_name || !payload.email || !payload.password) {
    return {
      valid: false,
      message: 'Vui lòng nhập họ tên, email và mật khẩu',
    };
  }

  if (role === 'SELLER' && !payload.store_name) {
    return {
      valid: false,
      message: 'Người bán cần nhập tên cửa hàng',
    };
  }

  return {
    valid: true,
    role,
  };
}

async function register(req, res) {
  const validation = validateRegisterPayload(req.body);

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message,
    });
  }

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

    const role = validation.role;
    const passwordHash = await hashPassword(password);

    await conn.beginTransaction();

    const [userResult] = await conn.query(
      `INSERT INTO users (full_name, email, password_hash, phone, address, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, email, passwordHash, phone || null, address || null, role]
    );

    if (role === 'SELLER') {
      await conn.query(
        `INSERT INTO seller_profiles (user_id, store_name, store_description)
         VALUES (?, ?, ?)`,
        [userResult.insertId, store_name, store_description || null]
      );
    }

    await conn.commit();

    const user = {
      user_id: userResult.insertId,
      full_name,
      email,
      phone: phone || null,
      address: address || null,
      role,
      status: 'active',
    };

    return res.status(201).json({
      message: 'Đăng ký thành công',
      user,
      token: generateToken(user),
    });
  } catch (error) {
    await conn.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Email hoặc số điện thoại đã tồn tại',
      });
    }

    return res.status(500).json({
      message: 'Lỗi đăng ký',
      error: error.message,
    });
  } finally {
    conn.release();
  }
}

async function registerSeller(req, res) {
  req.body.role = 'SELLER';
  return register(req, res);
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

    const cleanLoggedInUser = cleanUser(user);

    return res.json({
      message: 'Đăng nhập thành công',
      user: cleanLoggedInUser,
      token: generateToken(cleanLoggedInUser),
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

router.post('/register', register);
router.post('/register-seller', registerSeller);
router.post('/login', login);
router.get('/me', authRequired, me);

module.exports = router;