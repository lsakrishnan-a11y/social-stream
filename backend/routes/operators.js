const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  const { search, district, status } = req.query;
  let query = 'SELECT * FROM operators WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (name LIKE ? OR center_name LIKE ? OR center_code LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (district) { query += ' AND district = ?'; params.push(district); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  res.json(db.prepare(query + ' ORDER BY name').all(...params));
});

router.get('/:id', (req, res) => {
  const op = db.prepare('SELECT * FROM operators WHERE id = ?').get(req.params.id);
  if (!op) return res.status(404).json({ error: 'Not found' });
  const stats = db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
           SUM(CASE WHEN payment_status='paid' THEN fee ELSE 0 END) as revenue
    FROM applications WHERE operator_id = ?
  `).get(req.params.id);
  res.json({ ...op, stats });
});

router.post('/', (req, res) => {
  const { name, email, phone, center_name, center_code, district, taluk, village } = req.body;
  if (!name || !email || !phone || !center_code) return res.status(400).json({ error: 'Required fields missing' });
  try {
    const result = db.prepare(`
      INSERT INTO operators (name, email, phone, center_name, center_code, district, taluk, village)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, phone, center_name, center_code, district, taluk, village);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(409).json({ error: 'Email or center code already exists' });
  }
});

router.put('/:id', (req, res) => {
  const { name, email, phone, center_name, district, taluk, village, status } = req.body;
  db.prepare('UPDATE operators SET name=?, email=?, phone=?, center_name=?, district=?, taluk=?, village=?, status=? WHERE id=?')
    .run(name, email, phone, center_name, district, taluk, village, status, req.params.id);
  res.json({ message: 'Updated' });
});

module.exports = router;
