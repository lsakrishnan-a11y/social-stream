const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM service_categories';
  if (status) query += ` WHERE status = '${status}'`;
  query += ' ORDER BY name';
  res.json(db.prepare(query).all());
});

router.post('/', (req, res) => {
  const { name, name_tamil, department, description, fee, processing_days } = req.body;
  if (!name || !department) return res.status(400).json({ error: 'Name and department required' });
  const result = db.prepare(`
    INSERT INTO service_categories (name, name_tamil, department, description, fee, processing_days)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, name_tamil, department, description, fee || 0, processing_days || 7);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { name, name_tamil, department, description, fee, processing_days, status } = req.body;
  db.prepare(`
    UPDATE service_categories SET name=?, name_tamil=?, department=?, description=?, fee=?, processing_days=?, status=? WHERE id=?
  `).run(name, name_tamil, department, description, fee, processing_days, status, req.params.id);
  res.json({ message: 'Updated' });
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE service_categories SET status = ? WHERE id = ?').run('inactive', req.params.id);
  res.json({ message: 'Deactivated' });
});

module.exports = router;
