const router = require('express').Router();

const pool = require('../config/db');
const { authRequired } = require('../middleware/auth.middleware');

function normalizeNotification(row) {
  return {
    notification_id: row.notification_id,
    type: row.type,
    title: row.title,
    message: row.message,
    order_id: row.order_id,
    is_read: Boolean(row.is_read),
    created_at: row.created_at,
    read_at: row.read_at,
  };
}

router.get('/', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        notification_id,
        type,
        title,
        message,
        order_id,
        is_read,
        created_at,
        read_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.user_id]
    );

    return res.json({
      notifications: rows.map(normalizeNotification),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi lấy thông báo',
      error: error.message,
    });
  }
});

router.get('/unread-count', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [req.user.user_id]
    );

    return res.json({
      unread_count: Number(rows[0]?.unread_count || 0),
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi lấy số thông báo',
      error: error.message,
    });
  }
});

router.patch('/:id/read', authRequired, async (req, res) => {
  try {
    const [result] = await pool.query(
      `UPDATE notifications
       SET is_read = 1, read_at = COALESCE(read_at, NOW())
       WHERE notification_id = ? AND user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy thông báo',
      });
    }

    return res.json({
      message: 'Đã đánh dấu đã đọc',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi cập nhật thông báo',
      error: error.message,
    });
  }
});

router.patch('/read-all', authRequired, async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications
       SET is_read = 1, read_at = COALESCE(read_at, NOW())
       WHERE user_id = ? AND is_read = 0`,
      [req.user.user_id]
    );

    return res.json({
      message: 'Đã đánh dấu tất cả là đã đọc',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi cập nhật thông báo',
      error: error.message,
    });
  }
});

router.delete('/:id', authRequired, async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE FROM notifications
       WHERE notification_id = ? AND user_id = ?`,
      [req.params.id, req.user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy thông báo',
      });
    }

    return res.json({
      message: 'Đã xóa thông báo',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Lỗi xóa thông báo',
      error: error.message,
    });
  }
});

module.exports = router;
