const cron = require('node-cron');
const db = require('./db/database');

function notify(type, title, message, application_id = null) {
  db.prepare('INSERT INTO notifications (type, title, message, application_id) VALUES (?, ?, ?, ?)')
    .run(type, title, message, application_id);
}

function logActivity(application_id, action, old_value, new_value, triggered_by = 'automation') {
  db.prepare('INSERT INTO activity_log (application_id, action, old_value, new_value, triggered_by) VALUES (?, ?, ?, ?, ?)')
    .run(application_id, action, old_value, new_value, triggered_by);
}

function touchRule(name) {
  db.prepare("UPDATE automation_rules SET last_run=CURRENT_TIMESTAMP, run_count=run_count+1 WHERE name=?").run(name);
}

// ── Every hour: escalate pending → processing (pending > 2 hours)
function autoEscalatePending() {
  const rule = db.prepare("SELECT * FROM automation_rules WHERE name='Auto-Escalate Pending' AND is_active=1").get();
  if (!rule) return;

  const stale = db.prepare(`
    SELECT a.id, a.application_no, a.status, s.name as service_name, s.fee
    FROM applications a
    JOIN service_categories s ON a.service_id = s.id
    WHERE a.status = 'pending'
      AND datetime(a.submitted_at) <= datetime('now', '-2 hours')
  `).all();

  if (stale.length > 0) {
    const update = db.prepare("UPDATE applications SET status='processing', updated_at=CURRENT_TIMESTAMP WHERE id=?");
    stale.forEach(app => {
      update.run(app.id);
      logActivity(app.id, 'status_change', 'pending', 'processing');
      notify('info', 'Application Escalated', `Application ${app.application_no} (${app.service_name}) auto-moved to Processing.`, app.id);
    });
    console.log(`[Automation] Auto-escalated ${stale.length} pending application(s) to processing.`);
  }
  touchRule('Auto-Escalate Pending');
}

// ── Every hour: auto-complete bill payment services (processing_days = 1)
function autoCompleteBillPayments() {
  const rule = db.prepare("SELECT * FROM automation_rules WHERE name='Auto-Complete Bill Payments' AND is_active=1").get();
  if (!rule) return;

  const bills = db.prepare(`
    SELECT a.id, a.application_no, s.name as service_name
    FROM applications a
    JOIN service_categories s ON a.service_id = s.id
    WHERE a.status = 'processing'
      AND s.processing_days <= 1
      AND a.payment_status = 'paid'
      AND datetime(a.updated_at) <= datetime('now', '-1 hours')
  `).all();

  if (bills.length > 0) {
    const update = db.prepare("UPDATE applications SET status='completed', completed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?");
    bills.forEach(app => {
      update.run(app.id);
      logActivity(app.id, 'status_change', 'processing', 'completed');
      notify('success', 'Service Completed', `${app.service_name} (${app.application_no}) has been auto-completed.`, app.id);
    });
    console.log(`[Automation] Auto-completed ${bills.length} bill payment(s).`);
  }
  touchRule('Auto-Complete Bill Payments');
}

// ── Every 6 hours: flag overdue applications as urgent
function flagOverdueApplications() {
  const rule = db.prepare("SELECT * FROM automation_rules WHERE name='Flag Overdue Applications' AND is_active=1").get();
  if (!rule) return;

  const overdue = db.prepare(`
    SELECT a.id, a.application_no, s.name as service_name, s.processing_days,
           CAST((julianday('now') - julianday(a.submitted_at)) AS INTEGER) as days_elapsed
    FROM applications a
    JOIN service_categories s ON a.service_id = s.id
    WHERE a.status IN ('pending', 'processing')
      AND a.priority != 'urgent'
      AND CAST((julianday('now') - julianday(a.submitted_at)) AS INTEGER) > s.processing_days
  `).all();

  if (overdue.length > 0) {
    const update = db.prepare("UPDATE applications SET priority='urgent', updated_at=CURRENT_TIMESTAMP WHERE id=?");
    overdue.forEach(app => {
      update.run(app.id);
      logActivity(app.id, 'priority_change', 'normal', 'urgent');
      notify('warning', 'Application Overdue', `${app.application_no} (${app.service_name}) is overdue by ${app.days_elapsed - app.processing_days} day(s). Marked URGENT.`, app.id);
    });
    console.log(`[Automation] Flagged ${overdue.length} overdue application(s) as urgent.`);
  }
  touchRule('Flag Overdue Applications');
}

// ── Daily at 08:00: generate daily summary report
function generateDailyReport() {
  const rule = db.prepare("SELECT * FROM automation_rules WHERE name='Daily Summary Report' AND is_active=1").get();
  if (!rule) return;

  const today = new Date().toISOString().slice(0, 10);
  const existing = db.prepare("SELECT id FROM daily_reports WHERE report_date = ?").get(today);
  if (existing) return;

  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM applications) as total_applications,
      (SELECT COUNT(*) FROM applications WHERE date(submitted_at) = date('now')) as new_applications,
      (SELECT COUNT(*) FROM applications WHERE date(completed_at) = date('now')) as completed_applications,
      (SELECT COUNT(*) FROM applications WHERE status = 'pending') as pending_applications,
      (SELECT COUNT(*) FROM applications WHERE priority = 'urgent' AND status NOT IN ('completed','cancelled')) as overdue_applications,
      (SELECT COALESCE(SUM(fee), 0) FROM applications WHERE payment_status='paid' AND date(submitted_at) = date('now')) as total_revenue
  `).get();

  db.prepare(`
    INSERT OR REPLACE INTO daily_reports (report_date, total_applications, new_applications, completed_applications, pending_applications, overdue_applications, total_revenue)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(today, stats.total_applications, stats.new_applications, stats.completed_applications, stats.pending_applications, stats.overdue_applications, stats.total_revenue);

  notify('info', 'Daily Report Generated', `Report for ${today}: ${stats.new_applications} new, ${stats.completed_applications} completed, ₹${stats.total_revenue} revenue.`);
  touchRule('Daily Summary Report');
  console.log(`[Automation] Daily report generated for ${today}.`);
}

function startScheduler() {
  console.log('[Automation] Starting scheduler...');

  // Every hour at :00
  cron.schedule('0 * * * *', () => {
    console.log('[Automation] Running hourly jobs...');
    autoEscalatePending();
    autoCompleteBillPayments();
  });

  // Every 6 hours
  cron.schedule('0 */6 * * *', () => {
    console.log('[Automation] Running 6-hourly jobs...');
    flagOverdueApplications();
  });

  // Daily at 08:00
  cron.schedule('0 8 * * *', () => {
    console.log('[Automation] Running daily jobs...');
    generateDailyReport();
  });

  // Run once at startup for demo
  setTimeout(() => {
    autoEscalatePending();
    autoCompleteBillPayments();
    flagOverdueApplications();
    generateDailyReport();
  }, 1500);

  console.log('[Automation] Scheduler running: hourly escalation, 6h overdue check, 8am daily report.');
}

module.exports = { startScheduler, autoEscalatePending, autoCompleteBillPayments, flagOverdueApplications, generateDailyReport, notify, logActivity };
