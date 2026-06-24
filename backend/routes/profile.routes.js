const router = require('express').Router();
const multer = require('multer');

const pool = require('../config/db');
const { authRequired } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // tối đa 2MB để tránh DB bị nặng
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

router.use(authRequired);

router.get('/', async function (req, res) {
  try {
    const user = await getUserById(req.user.user_id);

    if (!user) {
      return res.status(404).json({
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi tải profile',
      error: error.message,
    });
  }
});

router.patch('/', async function (req, res) {
  logger.line('CẬP NHẬT PROFILE');
  logger.input('Body nhận vào', req.body);
  logger.input('User từ token', req.user);

  try {
    const { full_name, phone, address } = req.body;

    if (!full_name || !String(full_name).trim()) {
      const response = {
        message: 'Họ tên không được bỏ trống',
      };

      logger.response(400, response);
      return res.status(400).json(response);
    }

    logger.step('Bắt đầu cập nhật thông tin cá nhân');

    await pool.query(
      `UPDATE users
       SET full_name = ?, phone = ?, address = ?
       WHERE user_id = ?`,
      [
        String(full_name).trim(),
        phone || null,
        address || null,
        req.user.user_id,
      ]
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
      const response = {
        message: 'Số điện thoại đã được tài khoản khác sử dụng',
      };

      logger.response(409, response);
      return res.status(409).json(response);
    }

    const response = {
      message: 'Lỗi cập nhật thông tin cá nhân',
      error: error.message,
    };

    logger.response(500, response);
    return res.status(500).json(response);
  }
});

router.post('/avatar', function (req, res) {
  upload.single('avatar')(req, res, async function (uploadError) {
    logger.line('UPLOAD AVATAR');
    logger.input('User từ token', req.user);

    try {
      if (uploadError) {
        logger.fail('Lỗi multer khi upload avatar', uploadError);

        if (uploadError.code === 'LIMIT_FILE_SIZE') {
          const response = {
            message: 'Ảnh đại diện quá lớn. Vui lòng chọn ảnh dưới 2MB.',
          };

          logger.response(400, response);
          return res.status(400).json(response);
        }

        const response = {
          message: uploadError.message || 'File upload không hợp lệ',
        };

        logger.response(400, response);
        return res.status(400).json(response);
      }

      if (!req.file) {
        const response = {
          message: 'Vui lòng chọn ảnh đại diện',
        };

        logger.response(400, response);
        return res.status(400).json(response);
      }

      logger.step('Thông tin file nhận được', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      const base64Image = req.file.buffer.toString('base64');
      const avatarDataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

      logger.step('Lưu ảnh đại diện trực tiếp vào cột users.avatar_url', {
        user_id: req.user.user_id,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      await pool.query(
        `UPDATE users
         SET avatar_url = ?
         WHERE user_id = ?`,
        [avatarDataUrl, req.user.user_id]
      );

      const user = await getUserById(req.user.user_id);

      const response = {
        message: 'Cập nhật ảnh đại diện thành công',
        avatar_url: avatarDataUrl,
        user,
      };

      logger.success('Avatar đã lưu vào database thành công', {
        user_id: user.user_id,
        full_name: user.full_name,
        avatar_saved_in: 'users.avatar_url',
      });

      logger.response(200, {
        message: response.message,
        user: {
          ...user,
          avatar_url: '[BASE64_IMAGE_DATA]',
        },
      });

      return res.json(response);
    } catch (error) {
      logger.fail('Lỗi upload avatar', error);

      const response = {
        message: 'Lỗi cập nhật ảnh đại diện',
        error: error.message,
      };

      logger.response(500, response);
      return res.status(500).json(response);
    }
  });
});

module.exports = router;