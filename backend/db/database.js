const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'seva.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    application_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    triggered_by TEXT DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_date TEXT UNIQUE NOT NULL,
    total_applications INTEGER DEFAULT 0,
    new_applications INTEGER DEFAULT 0,
    completed_applications INTEGER DEFAULT 0,
    pending_applications INTEGER DEFAULT 0,
    overdue_applications INTEGER DEFAULT 0,
    total_revenue REAL DEFAULT 0,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS automation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    condition_field TEXT,
    condition_value TEXT,
    action_type TEXT NOT NULL,
    action_value TEXT,
    is_active INTEGER DEFAULT 1,
    last_run DATETIME,
    run_count INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS operators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    center_name TEXT NOT NULL,
    center_code TEXT UNIQUE NOT NULL,
    district TEXT NOT NULL,
    taluk TEXT,
    village TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS citizens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    aadhaar TEXT UNIQUE,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    district TEXT,
    taluk TEXT,
    village TEXT,
    dob TEXT,
    gender TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS service_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_tamil TEXT,
    department TEXT NOT NULL,
    description TEXT,
    fee REAL DEFAULT 0,
    processing_days INTEGER DEFAULT 7,
    status TEXT DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_no TEXT UNIQUE NOT NULL,
    citizen_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    operator_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    fee REAL DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    payment_mode TEXT,
    remarks TEXT,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (citizen_id) REFERENCES citizens(id),
    FOREIGN KEY (service_id) REFERENCES service_categories(id),
    FOREIGN KEY (operator_id) REFERENCES operators(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    mode TEXT NOT NULL,
    reference_no TEXT,
    status TEXT DEFAULT 'success',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id)
  );
`);

// Seed service categories
const servicesCount = db.prepare('SELECT COUNT(*) as count FROM service_categories').get();
if (servicesCount.count === 0) {
  const insertService = db.prepare(`
    INSERT INTO service_categories (name, name_tamil, department, description, fee, processing_days)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const services = [
    ['Birth Certificate', 'பிறப்பு சான்றிதழ்', 'Revenue Department', 'Official birth registration certificate', 50, 7],
    ['Death Certificate', 'இறப்பு சான்றிதழ்', 'Revenue Department', 'Official death registration certificate', 50, 7],
    ['Income Certificate', 'வருமான சான்றிதழ்', 'Revenue Department', 'Annual family income certificate', 100, 10],
    ['Community Certificate', 'சாதி சான்றிதழ்', 'Revenue Department', 'Caste/community certificate', 100, 15],
    ['Nativity Certificate', 'சொந்த ஊர் சான்றிதழ்', 'Revenue Department', 'Place of origin certificate', 50, 7],
    ['Residence Certificate', 'வசிப்பிட சான்றிதழ்', 'Revenue Department', 'Permanent residence certificate', 50, 7],
    ['Ration Card (New)', 'ரேஷன் கார்டு', 'Food & Civil Supplies', 'New ration card application', 0, 30],
    ['Aadhaar Enrollment', 'ஆதார் பதிவு', 'UIDAI', 'New Aadhaar card enrollment', 0, 90],
    ['Aadhaar Update', 'ஆதார் திருத்தம்', 'UIDAI', 'Update Aadhaar details', 50, 30],
    ['PAN Card', 'பான் கார்டு', 'Income Tax Dept', 'Permanent Account Number card', 107, 15],
    ['Passport Application', 'பாஸ்போர்ட்', 'MEA', 'New passport application assistance', 200, 45],
    ['Driving Licence', 'ஓட்டுநர் உரிமம்', 'Transport Dept', 'New driving licence application', 200, 30],
    ['Vehicle Registration', 'வாகன பதிவு', 'Transport Dept', 'Motor vehicle registration', 500, 15],
    ['Land Records', 'நில பதிவேடு', 'Revenue Department', 'Patta/Chitta/Adangal records', 30, 3],
    ['Electricity Bill Payment', 'மின்சார கட்டணம்', 'TNEB', 'Electricity bill payment', 0, 1],
    ['Water Bill Payment', 'தண்ணீர் கட்டணம்', 'TWAD', 'Water supply bill payment', 0, 1],
    ['Property Tax', 'சொத்து வரி', 'Local Body', 'Property tax payment', 0, 1],
    ['Old Age Pension', 'முதியோர் ஓய்வூதியம்', 'Social Welfare', 'Old age pension scheme application', 0, 45],
    ['Widow Pension', 'விதவை ஓய்வூதியம்', 'Social Welfare', 'Widow pension scheme application', 0, 45],
    ['Disability Certificate', 'மாற்றுத்திறனாளி சான்றிதழ்', 'Health Dept', 'Disability certification', 0, 30],
  ];
  services.forEach(s => insertService.run(...s));
}

// Seed operators
const opsCount = db.prepare('SELECT COUNT(*) as count FROM operators').get();
if (opsCount.count === 0) {
  const insertOp = db.prepare(`
    INSERT INTO operators (name, email, phone, center_name, center_code, district, taluk, village)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['Ravi Kumar', 'ravi@example.com', '9876543210', 'Seva Center - Koyambedu', 'CSC-CHN-001', 'Chennai', 'Aminjikarai', 'Koyambedu'],
    ['Lakshmi Devi', 'lakshmi@example.com', '9876543211', 'Seva Center - Tambaram', 'CSC-CHN-002', 'Chennai', 'Tambaram', 'Tambaram'],
    ['Murugan S', 'murugan@example.com', '9876543212', 'Seva Center - Coimbatore', 'CSC-CBE-001', 'Coimbatore', 'Coimbatore North', 'RS Puram'],
    ['Priya R', 'priya@example.com', '9876543213', 'Seva Center - Madurai', 'CSC-MDU-001', 'Madurai', 'Madurai East', 'Mattuthavani'],
  ].forEach(o => insertOp.run(...o));
}

// Seed citizens
const citizensCount = db.prepare('SELECT COUNT(*) as count FROM citizens').get();
if (citizensCount.count === 0) {
  const insertCitizen = db.prepare(`
    INSERT INTO citizens (name, aadhaar, phone, email, address, district, taluk, village, dob, gender)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['Anand Kumar', '1234-5678-9012', '9500012345', 'anand@email.com', '12, Gandhi Nagar, Chennai', 'Chennai', 'Aminjikarai', 'Koyambedu', '1985-06-15', 'Male'],
    ['Meena Sundaram', '2345-6789-0123', '9500023456', 'meena@email.com', '45, Anna Nagar, Chennai', 'Chennai', 'Aminjikarai', 'Anna Nagar', '1990-03-22', 'Female'],
    ['Vijay S', '3456-7890-1234', '9500034567', '', '78, RS Puram, Coimbatore', 'Coimbatore', 'Coimbatore North', 'RS Puram', '1978-11-08', 'Male'],
    ['Kavitha M', '4567-8901-2345', '9500045678', 'kavitha@email.com', '23, KK Nagar, Madurai', 'Madurai', 'Madurai East', 'KK Nagar', '1995-07-30', 'Female'],
    ['Selvam R', '5678-9012-3456', '9500056789', '', '56, Nehru Street, Salem', 'Salem', 'Salem West', 'Fairlands', '1972-04-12', 'Male'],
    ['Saranya P', '6789-0123-4567', '9500067890', 'saranya@email.com', '34, Gandhiji Road, Trichy', 'Tiruchirappalli', 'Srirangam', 'Thillai Nagar', '1988-09-18', 'Female'],
  ].forEach(c => insertCitizen.run(...c));
}

// Seed applications
const appsCount = db.prepare('SELECT COUNT(*) as count FROM applications').get();
if (appsCount.count === 0) {
  const insertApp = db.prepare(`
    INSERT INTO applications (application_no, citizen_id, service_id, operator_id, status, fee, payment_status, payment_mode, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date();
  const apps = [
    ['DS-2024-000001', 1, 3, 1, 'completed', 100, 'paid', 'cash', '2024-01-10 10:30:00'],
    ['DS-2024-000002', 2, 1, 1, 'completed', 50, 'paid', 'upi', '2024-01-12 11:15:00'],
    ['DS-2024-000003', 3, 5, 3, 'processing', 50, 'paid', 'cash', '2024-01-15 09:00:00'],
    ['DS-2024-000004', 4, 4, 4, 'pending', 100, 'pending', null, '2024-01-16 14:30:00'],
    ['DS-2024-000005', 5, 2, 1, 'completed', 50, 'paid', 'upi', '2024-01-18 10:00:00'],
    ['DS-2024-000006', 6, 10, 2, 'processing', 107, 'paid', 'card', '2024-01-20 15:45:00'],
    ['DS-2024-000007', 1, 15, 1, 'completed', 0, 'paid', 'cash', '2024-02-05 09:30:00'],
    ['DS-2024-000008', 2, 7, 2, 'pending', 0, 'pending', null, '2024-02-08 11:00:00'],
    ['DS-2024-000009', 3, 12, 3, 'processing', 200, 'paid', 'upi', '2024-02-10 10:15:00'],
    ['DS-2024-000010', 4, 18, 4, 'completed', 0, 'paid', 'cash', '2024-02-12 14:00:00'],
  ];
  apps.forEach(a => insertApp.run(...a));
}

// Seed automation rules
const rulesCount = db.prepare('SELECT COUNT(*) as count FROM automation_rules').get();
if (rulesCount.count === 0) {
  const insertRule = db.prepare(`
    INSERT INTO automation_rules (name, trigger_event, condition_field, condition_value, action_type, action_value, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  [
    ['Auto-Escalate Pending', 'schedule_hourly', 'pending_hours', '2', 'change_status', 'processing', 1],
    ['Flag Overdue Applications', 'schedule_6h', 'overdue_days', '0', 'flag_overdue', 'urgent', 1],
    ['Daily Summary Report', 'schedule_daily', null, null, 'generate_report', null, 1],
    ['Notify on Completion', 'status_change', 'new_status', 'completed', 'send_notification', 'Application completed! Visit the center to collect your certificate.', 1],
    ['Notify New Submission', 'new_application', null, null, 'send_notification', 'Your application has been received and is being processed.', 1],
    ['Auto-Complete Bill Payments', 'schedule_hourly', 'service_type', 'bill_payment', 'change_status', 'completed', 1],
  ].forEach(r => insertRule.run(...r));
}

module.exports = db;
