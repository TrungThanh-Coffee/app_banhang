const path = require('path');
const fs = require('fs');
const router = require('express').Router();
const multer = require('multer');

const pool = require('../config/db');
const { authRequired } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars');

if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, avatarDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, 'user-' + req.user.user_id + '-' + Date.now() + safeExt);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: function (_req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      cb(new Error('File tải lên phải là hình ảnh'));
      return;
    }

    cb(null, true);
  },
});

function cleanUser(row) {
  return {
    user_id: row.user_id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    avatar_url: row.avatar_url || null,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getUserById(userId) {
  const [rows] = await pool.query(
    `SELECT user_id, full_name, email, phone, address, avatar_url, role, status, created_at, updated_at
     FROM users
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] ? cleanUser(rows[0]) : null;
}

function buildAvatarUrl(req, filename) {
  return req.protocol + '://' + req.get('host') + '/uploads/avatars/' + filename;
}

router.use(authRequired);

router.get('/', async function (req, res) {
  logger.line('LẤY PROFILE');
  logger.input('User từ token', req.user);

  try {
    const user = await getUserById(req.user.user_id);

    if (!user) {
      const response = { message: 'Không tìm thấy người dùng' };
      logger.response(404, response);
      return res.status(404).json(response);
    }

    logger.success('Lấy profile thành công', user);
    logger.response(200, user);
    return res.json(user);
  } catch (error) {
    logger.fail('Lỗi lấy profile', error);
    const response = { message: 'Lỗi tải profile', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
});

router.patch('/', async function (req, res) {
  logger.line('CẬP NHẬT PROFILE');
  logger.input('Body nhận vào', req.body);
  logger.input('User từ token', req.user);

  try {
    const { full_name, phone, address } = req.body;

    if (!full_name || !String(full_name).trim()) {
      const response = { message: 'Họ tên không được bỏ trống' };
      logger.response(400, response);
      return res.status(400).json(response);
    }

    logger.step('Bắt đầu cập nhật users.full_name / phone / address');

    await pool.query(
      `UPDATE users
       SET full_name = ?, phone = ?, address = ?
       WHERE user_id = ?`,
      [String(full_name).trim(), phone || null, address || null, req.user.user_id]
    );

    const user = await getUserById(req.user.user_id);
    const response = {
      message: 'Cập nhật thông tin cá nhân thành công',
      user,
    };

    logger.success('Profile sau khi cập nhật', user);
    logger.response(200, response);
    return res.json(response);
  } catch (error) {
    logger.fail('Lỗi cập nhật profile', error);

    if (error.code === 'ER_DUP_ENTRY') {
      const response = { message: 'Số điện thoại đã được tài khoản khác sử dụng' };
      logger.response(409, response);
      return res.status(409).json(response);
    }

    const response = { message: 'Lỗi cập nhật thông tin cá nhân', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
});

router.post('/avatar', upload.single('avatar'), async function (req, res) {
  logger.line('UPLOAD AVATAR');
  logger.input('User từ token', req.user);
  logger.step('Thông tin file nhận được', req.file ? {
    originalname: req.file.originalname,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  } : null);

  try {
    if (!req.file) {
      const response = { message: 'Vui lòng chọn ảnh đại diện' };
      logger.response(400, response);
      return res.status(400).json(response);
    }

    const avatarUrl = buildAvatarUrl(req, req.file.filename);

    logger.step('Lưu avatar_url vào bảng users', {
      user_id: req.user.user_id,
      avatar_url: avatarUrl,
    });

    await pool.query(
      `UPDATE users
       SET avatar_url = ?
       WHERE user_id = ?`,
      [avatarUrl, req.user.user_id]
    );

    const user = await getUserById(req.user.user_id);
    const response = {
      message: 'Cập nhật ảnh đại diện thành công',
      avatar_url: avatarUrl,
      user,
    };

    logger.success('Avatar đã cập nhật', response);
    logger.response(200, response);
    return res.json(response);
  } catch (error) {
    logger.fail('Lỗi upload avatar', error);
    const response = { message: 'Lỗi cập nhật ảnh đại diện', error: error.message };
    logger.response(500, response);
    return res.status(500).json(response);
  }
});

module.exports = router;
