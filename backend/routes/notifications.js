const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  const { limit = 30, unread_only } = req.query;
  let query = 'SELECT * FROM notifications';
  if (unread_only === 'true') query += ' WHERE is_read = 0';
  query += ` ORDER BY created_at DESC LIMIT ${limit}`;
  const rows = db.prepare(query).all();
  const unread = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get().count;
  res.json({ data: rows, unread });
});

router.put('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1').run();
  res.json({ message: 'All notifications marked as read' });
});

router.put('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Marked as read' });
});

router.delete('/clear', (req, res) => {
  db.prepare('DELETE FROM notifications WHERE is_read = 1').run();
  res.json({ message: 'Cleared read notifications' });
});

module.exports = router;
