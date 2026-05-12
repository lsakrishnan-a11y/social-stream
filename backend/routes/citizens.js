const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  const { search, district, page = 1, limit = 20 } = req.query;
  let query = 'SELECT * FROM citizens WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (name LIKE ? OR phone LIKE ? OR aadhaar LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (district) { query += ' AND district = ?'; params.push(district); }
  const total = db.prepare(query.replace('*', 'COUNT(*) as count')).get(...params).count;
  query += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`;
  const rows = db.prepare(query).all(...params);
  res.json({ data: rows, total, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const citizen = db.prepare('SELECT * FROM citizens WHERE id = ?').get(req.params.id);
  if (!citizen) return res.status(404).json({ error: 'Citizen not found' });
  const applications = db.prepare(`
    SELECT a.*, s.name as service_name, o.name as operator_name
    FROM applications a
    JOIN service_categories s ON a.service_id = s.id
    JOIN operators o ON a.operator_id = o.id
    WHERE a.citizen_id = ? ORDER BY a.submitted_at DESC
  `).all(req.params.id);
  res.json({ ...citizen, applications });
});

router.post('/', (req, res) => {
  const { name, aadhaar, phone, email, address, district, taluk, village, dob, gender } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });
  try {
    const result = db.prepare(`
      INSERT INTO citizens (name, aadhaar, phone, email, address, district, taluk, village, dob, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, aadhaar, phone, email, address, district, taluk, village, dob, gender);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Citizen registered successfully' });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Aadhaar already registered' });
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, phone, email, address, district, taluk, village, dob, gender } = req.body;
  db.prepare(`
    UPDATE citizens SET name=?, phone=?, email=?, address=?, district=?, taluk=?, village=?, dob=?, gender=?
    WHERE id=?
  `).run(name, phone, email, address, district, taluk, village, dob, gender, req.params.id);
  res.json({ message: 'Updated successfully' });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM citizens WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted successfully' });
});

module.exports = router;
