const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/daily', (req, res) => {
  const rows = db.prepare('SELECT * FROM daily_reports ORDER BY report_date DESC LIMIT 30').all();
  res.json(rows);
});

router.get('/automation-rules', (req, res) => {
  res.json(db.prepare('SELECT * FROM automation_rules ORDER BY id').all());
});

router.put('/automation-rules/:id/toggle', (req, res) => {
  const rule = db.prepare('SELECT is_active FROM automation_rules WHERE id=?').get(req.params.id);
  if (!rule) return res.status(404).json({ error: 'Rule not found' });
  db.prepare('UPDATE automation_rules SET is_active=? WHERE id=?').run(rule.is_active ? 0 : 1, req.params.id);
  res.json({ message: 'Toggled', is_active: !rule.is_active });
});

router.get('/activity-log', (req, res) => {
  const { application_id, limit = 50 } = req.query;
  let query = `
    SELECT l.*, a.application_no, c.name as citizen_name
    FROM activity_log l
    JOIN applications a ON l.application_id = a.id
    JOIN citizens c ON a.citizen_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (application_id) { query += ' AND l.application_id = ?'; params.push(application_id); }
  query += ` ORDER BY l.created_at DESC LIMIT ${limit}`;
  res.json(db.prepare(query).all(...params));
});

router.get('/export/applications', (req, res) => {
  const { status, from_date, to_date } = req.query;
  let where = '1=1';
  const params = [];
  if (status) { where += ' AND a.status=?'; params.push(status); }
  if (from_date) { where += ' AND date(a.submitted_at) >= ?'; params.push(from_date); }
  if (to_date) { where += ' AND date(a.submitted_at) <= ?'; params.push(to_date); }

  const rows = db.prepare(`
    SELECT a.application_no, c.name as citizen_name, c.phone, c.aadhaar,
           s.name as service_name, s.department, o.center_name, o.center_code,
           a.status, a.priority, a.fee, a.payment_status, a.payment_mode,
           a.submitted_at, a.updated_at, a.completed_at, a.remarks
    FROM applications a
    JOIN citizens c ON a.citizen_id = c.id
    JOIN service_categories s ON a.service_id = s.id
    JOIN operators o ON a.operator_id = o.id
    WHERE ${where}
    ORDER BY a.submitted_at DESC
  `).all(...params);

  const headers = ['Application No', 'Citizen Name', 'Phone', 'Aadhaar', 'Service', 'Department', 'Center', 'Center Code', 'Status', 'Priority', 'Fee', 'Payment Status', 'Payment Mode', 'Submitted At', 'Updated At', 'Completed At', 'Remarks'];
  const escape = v => v == null ? '' : `"${String(v).replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map(r => [r.application_no, r.citizen_name, r.phone, r.aadhaar, r.service_name, r.department, r.center_name, r.center_code, r.status, r.priority, r.fee, r.payment_status, r.payment_mode, r.submitted_at, r.updated_at, r.completed_at, r.remarks].map(escape).join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="applications-${new Date().toISOString().slice(0,10)}.csv"`);
  res.send(csv);
});

router.get('/summary', (req, res) => {
  const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM applications GROUP BY status").all();
  const byDistrict = db.prepare(`
    SELECT c.district, COUNT(*) as count, COALESCE(SUM(a.fee),0) as revenue
    FROM applications a JOIN citizens c ON a.citizen_id=c.id
    GROUP BY c.district ORDER BY count DESC LIMIT 10
  `).all();
  const byService = db.prepare(`
    SELECT s.name, s.department, COUNT(*) as count, COALESCE(SUM(a.fee),0) as revenue
    FROM applications a JOIN service_categories s ON a.service_id=s.id
    GROUP BY s.id ORDER BY count DESC LIMIT 10
  `).all();
  const byOperator = db.prepare(`
    SELECT o.name, o.center_name, o.district,
           COUNT(*) as total,
           SUM(CASE WHEN a.status='completed' THEN 1 ELSE 0 END) as completed,
           COALESCE(SUM(CASE WHEN a.payment_status='paid' THEN a.fee ELSE 0 END),0) as revenue
    FROM applications a JOIN operators o ON a.operator_id=o.id
    GROUP BY o.id ORDER BY total DESC
  `).all();
  res.json({ byStatus, byDistrict, byService, byOperator });
});

// Bulk status update
router.put('/bulk/status', (req, res) => {
  const { ids, status, remarks } = req.body;
  if (!ids?.length || !status) return res.status(400).json({ error: 'ids and status required' });
  const completed_at = status === 'completed' ? new Date().toISOString() : null;
  const update = db.prepare('UPDATE applications SET status=?, remarks=?, updated_at=CURRENT_TIMESTAMP, completed_at=? WHERE id=?');
  const logStmt = db.prepare('INSERT INTO activity_log (application_id, action, old_value, new_value, triggered_by) VALUES (?, ?, ?, ?, ?)');
  const current = db.prepare('SELECT id, status FROM applications WHERE id=?');

  db.transaction(() => {
    ids.forEach(id => {
      const app = current.get(id);
      if (app) {
        update.run(status, remarks || null, completed_at, id);
        logStmt.run(id, 'status_change', app.status, status, 'bulk_action');
      }
    });
  })();

  res.json({ message: `Updated ${ids.length} application(s) to ${status}` });
});

module.exports = router;
