const express = require('express');
const cors = require('cors');
const { startScheduler } = require('./automation');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/citizens', require('./routes/citizens'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/services', require('./routes/services'));
app.use('/api/operators', require('./routes/operators'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'Digital Seva CRM API', time: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Digital Seva CRM API running on port ${PORT}`);
  startScheduler();
});
