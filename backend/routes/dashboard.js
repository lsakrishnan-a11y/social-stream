const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/stats', (req, res) => {
  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const pendingApplications = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'pending'").get().count;
  const processingApplications = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'processing'").get().count;
  const completedApplications = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'completed'").get().count;
  const totalCitizens = db.prepare('SELECT COUNT(*) as count FROM citizens').get().count;
  const totalOperators = db.prepare("SELECT COUNT(*) as count FROM operators WHERE status = 'active'").get().count;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(fee), 0) as total FROM applications WHERE payment_status = 'paid'").get().total;
  const todayApplications = db.prepare("SELECT COUNT(*) as count FROM applications WHERE date(submitted_at) = date('now')").get().count;

  res.json({
    totalApplications,
    pendingApplications,
    processingApplications,
    completedApplications,
    totalCitizens,
    totalOperators,
    totalRevenue,
    todayApplications,
  });
});

router.get('/recent-applications', (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, c.name as citizen_name, c.phone as citizen_phone,
           s.name as service_name, o.name as operator_name
    FROM applications a
    JOIN citizens c ON a.citizen_id = c.id
    JOIN service_categories s ON a.service_id = s.id
    JOIN operators o ON a.operator_id = o.id
    ORDER BY a.submitted_at DESC LIMIT 10
  `).all();
  res.json(rows);
});

router.get('/service-stats', (req, res) => {
  const rows = db.prepare(`
    SELECT s.name, COUNT(a.id) as count
    FROM service_categories s
    LEFT JOIN applications a ON s.id = a.service_id
    GROUP BY s.id ORDER BY count DESC LIMIT 8
  `).all();
  res.json(rows);
});

router.get('/monthly-stats', (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', submitted_at) as month,
           COUNT(*) as applications,
           COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN fee ELSE 0 END), 0) as revenue
    FROM applications
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all();
  res.json(rows.reverse());
});

module.exports = router;
