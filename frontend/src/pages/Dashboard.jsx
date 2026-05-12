import { useState, useEffect } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';

function StatCard({ icon, value, label, color, bg }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <div className="stat-info">
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [serviceStats, setServiceStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getDashboardStats(),
      api.getRecentApplications(),
      api.getServiceStats(),
      api.getMonthlyStats(),
    ]).then(([s, r, sv, m]) => {
      setStats(s); setRecent(r); setServiceStats(sv); setMonthlyStats(m);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const maxBar = Math.max(...serviceStats.map(s => s.count), 1);
  const maxRevBar = Math.max(...monthlyStats.map(m => m.revenue), 1);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Digital Seva Center — Overview</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/applications" className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7-7 7 7"/></svg>
            New Application
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2" value={stats.totalApplications} label="Total Applications" color="#1a56db" bg="#ebf5ff" />
        <StatCard icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" value={stats.pendingApplications} label="Pending" color="#92400e" bg="#fef3c7" />
        <StatCard icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" value={stats.completedApplications} label="Completed" color="#065f46" bg="#d1fae5" />
        <StatCard icon="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8" value={stats.totalCitizens} label="Registered Citizens" color="#5b21b6" bg="#ede9fe" />
        <StatCard icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" value={`₹${stats.totalRevenue.toLocaleString()}`} label="Total Revenue" color="#065f46" bg="#d1fae5" />
        <StatCard icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" value={stats.todayApplications} label="Today's Applications" color="#1e40af" bg="#dbeafe" />
        <StatCard icon="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" value={stats.processingApplications} label="In Processing" color="#1e40af" bg="#dbeafe" />
        <StatCard icon="M16 7a4 4 0 11-8 0 4 4 0 018 0 M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" value={stats.totalOperators} label="Active Operators" color="#7c3aed" bg="#ede9fe" />
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="card-title">Applications by Service</div>
          <div className="bar-chart">
            {serviceStats.map((s, i) => (
              <div key={i} className="bar-item">
                <div className="bar-val">{s.count}</div>
                <div className="bar-fill" style={{ height: `${(s.count / maxBar) * 110}px`, background: `hsl(${210 + i * 20},70%,50%)` }} />
                <div className="bar-label">{s.name.split(' ').slice(0, 2).join(' ')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Monthly Revenue (₹)</div>
          <div className="bar-chart">
            {monthlyStats.slice(-8).map((m, i) => (
              <div key={i} className="bar-item">
                <div className="bar-val">{m.revenue > 0 ? `₹${m.revenue}` : '0'}</div>
                <div className="bar-fill" style={{ height: `${(m.revenue / maxRevBar) * 110}px`, background: '#0e9f6e' }} />
                <div className="bar-label">{m.month?.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ margin: 0 }}>Recent Applications</div>
          <Link to="/applications" className="btn btn-secondary btn-sm">View All</Link>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>App No.</th>
                <th>Citizen</th>
                <th>Service</th>
                <th>Operator</th>
                <th>Date</th>
                <th>Status</th>
                <th>Fee</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(a => (
                <tr key={a.id}>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1a56db' }}>{a.application_no}</span></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.citizen_name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{a.citizen_phone}</div>
                  </td>
                  <td>{a.service_name}</td>
                  <td>{a.operator_name}</td>
                  <td style={{ color: '#6b7280' }}>{new Date(a.submitted_at).toLocaleDateString('en-IN')}</td>
                  <td>{statusBadge(a.status)}</td>
                  <td>₹{a.fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
