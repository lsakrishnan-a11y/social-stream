const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { notify, logActivity } = require('../automation');

function generateAppNo() {
  const year = new Date().getFullYear();
  const last = db.prepare("SELECT application_no FROM applications ORDER BY id DESC LIMIT 1").get();
  let seq = 1;
  if (last) {
    const parts = last.application_no.split('-');
    seq = parseInt(parts[2]) + 1;
  }
  return `DS-${year}-${String(seq).padStart(6, '0')}`;
}

router.get('/', (req, res) => {
  const { search, status, service_id, operator_id, page = 1, limit = 20 } = req.query;
  let where = '1=1';
  const params = [];
  if (search) { where += ' AND (a.application_no LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (status) { where += ' AND a.status = ?'; params.push(status); }
  if (service_id) { where += ' AND a.service_id = ?'; params.push(service_id); }
  if (operator_id) { where += ' AND a.operator_id = ?'; params.push(operator_id); }

  const countRow = db.prepare(`
    SELECT COUNT(*) as count FROM applications a
    JOIN citizens c ON a.citizen_id = c.id WHERE ${where}
  `).get(...params);

  const rows = db.prepare(`
    SELECT a.*, c.name as citizen_name, c.phone as citizen_phone,
           s.name as service_name, o.name as operator_name, o.center_name
    FROM applications a
    JOIN citizens c ON a.citizen_id = c.id
    JOIN service_categories s ON a.service_id = s.id
    JOIN operators o ON a.operator_id = o.id
    WHERE ${where}
    ORDER BY a.submitted_at DESC
    LIMIT ${limit} OFFSET ${(page - 1) * limit}
  `).all(...params);

  res.json({ data: rows, total: countRow.count, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT a.*, c.name as citizen_name, c.phone as citizen_phone, c.aadhaar,
           c.address, c.district as citizen_district,
           s.name as service_name, s.name_tamil, s.department, s.processing_days,
           o.name as operator_name, o.center_name, o.center_code, o.phone as operator_phone
    FROM applications a
    JOIN citizens c ON a.citizen_id = c.id
    JOIN service_categories s ON a.service_id = s.id
    JOIN operators o ON a.operator_id = o.id
    WHERE a.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Application not found' });
  const transactions = db.prepare('SELECT * FROM transactions WHERE application_id = ?').all(req.params.id);
  res.json({ ...row, transactions });
});

router.post('/', (req, res) => {
  const { citizen_id, service_id, operator_id, fee, payment_mode, remarks, priority } = req.body;
  if (!citizen_id || !service_id || !operator_id) return res.status(400).json({ error: 'citizen_id, service_id, operator_id required' });
  const app_no = generateAppNo();
  const payment_status = payment_mode ? 'paid' : 'pending';
  const result = db.prepare(`
    INSERT INTO applications (application_no, citizen_id, service_id, operator_id, fee, payment_status, payment_mode, remarks, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(app_no, citizen_id, service_id, operator_id, fee || 0, payment_status, payment_mode || null, remarks || null, priority || 'normal');

  if (payment_mode && fee > 0) {
    db.prepare('INSERT INTO transactions (application_id, amount, mode) VALUES (?, ?, ?)').run(result.lastInsertRowid, fee, payment_mode);
  }
  logActivity(result.lastInsertRowid, 'created', null, 'pending', 'manual');
  notify('success', 'New Application', `Application ${app_no} submitted successfully.`, result.lastInsertRowid);
  res.status(201).json({ id: result.lastInsertRowid, application_no: app_no, message: 'Application submitted successfully' });
});

router.put('/:id/status', (req, res) => {
  const { status, remarks } = req.body;
  const app = db.prepare('SELECT status, application_no FROM applications WHERE id=?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  const completed_at = status === 'completed' ? new Date().toISOString() : null;
  db.prepare('UPDATE applications SET status=?, remarks=?, updated_at=CURRENT_TIMESTAMP, completed_at=? WHERE id=?')
    .run(status, remarks || null, completed_at, req.params.id);
  logActivity(req.params.id, 'status_change', app.status, status, 'manual');
  if (status === 'completed') notify('success', 'Application Completed', `${app.application_no} has been marked as completed.`, req.params.id);
  res.json({ message: 'Status updated' });
});

router.put('/:id/payment', (req, res) => {
  const { payment_mode, amount, reference_no } = req.body;
  db.prepare("UPDATE applications SET payment_status='paid', payment_mode=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
    .run(payment_mode, req.params.id);
  db.prepare('INSERT INTO transactions (application_id, amount, mode, reference_no) VALUES (?, ?, ?, ?)').run(req.params.id, amount, payment_mode, reference_no || null);
  res.json({ message: 'Payment recorded' });
});

module.exports = router;
