import { useState, useEffect } from 'react';
import { api } from '../api';

function Toggle({ checked, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 12, background: checked ? '#1a56db' : '#d1d5db',
      position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }} />
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState('summary');
  const [summary, setSummary] = useState(null);
  const [dailyReports, setDailyReports] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportStatus, setExportStatus] = useState('');

  useEffect(() => {
    Promise.all([
      api.getReportSummary(),
      api.getDailyReports(),
      api.getAutomationRules(),
      api.getActivityLog({ limit: 30 }),
    ]).then(([s, d, r, a]) => {
      setSummary(s); setDailyReports(d); setAutomationRules(r); setActivityLog(a);
    }).finally(() => setLoading(false));
  }, []);

  async function toggleRule(id) {
    await api.toggleAutomationRule(id);
    api.getAutomationRules().then(setAutomationRules);
  }

  function doExport() {
    window.open(api.exportApplicationsCSV({ status: exportStatus, from_date: exportFrom, to_date: exportTo }), '_blank');
  }

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const TABS = [
    { id: 'summary', label: 'Summary' },
    { id: 'automation', label: 'Automation Rules' },
    { id: 'daily', label: 'Daily Reports' },
    { id: 'activity', label: 'Activity Log' },
    { id: 'export', label: 'Export Data' },
  ];

  const TRIGGER_LABELS = {
    schedule_hourly: 'Every Hour',
    schedule_6h: 'Every 6 Hours',
    schedule_daily: 'Daily 8:00 AM',
    status_change: 'On Status Change',
    new_application: 'On New Application',
  };

  const ACTION_LABELS = {
    change_status: 'Change Status',
    flag_overdue: 'Flag as Urgent',
    generate_report: 'Generate Report',
    send_notification: 'Send Notification',
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Automation</div>
          <div className="page-subtitle">Analytics, automation rules, activity tracking, and data export</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '9px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === t.id ? 700 : 500, fontSize: 13.5, color: tab === t.id ? '#1a56db' : '#6b7280',
            borderBottom: tab === t.id ? '2px solid #1a56db' : '2px solid transparent', marginBottom: -1
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'summary' && summary && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {summary.byStatus.map(s => (
              <div key={s.status} className="stat-card">
                <div>
                  <div className="stat-value">{s.count}</div>
                  <div className="stat-label">{s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="charts-grid">
            <div className="card">
              <div className="card-title">Top Services by Volume</div>
              {summary.byService.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, width: 160, color: '#374151', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.name}>{s.name}</div>
                  <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 10 }}>
                    <div style={{ width: `${(s.count / (summary.byService[0]?.count || 1)) * 100}%`, background: '#1a56db', borderRadius: 4, height: '100%' }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, width: 24, textAlign: 'right' }}>{s.count}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', width: 60, textAlign: 'right' }}>₹{s.revenue}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title">Top Districts</div>
              {summary.byDistrict.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, width: 120, color: '#374151', flexShrink: 0 }}>{d.district}</div>
                  <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 10 }}>
                    <div style={{ width: `${(d.count / (summary.byDistrict[0]?.count || 1)) * 100}%`, background: '#0e9f6e', borderRadius: 4, height: '100%' }} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, width: 24, textAlign: 'right' }}>{d.count}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', width: 60, textAlign: 'right' }}>₹{d.revenue}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title">Performance by Operator / Center</div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Operator</th>
                    <th>Center</th>
                    <th>District</th>
                    <th>Total</th>
                    <th>Completed</th>
                    <th>Completion %</th>
                    <th>Revenue (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.byOperator.map((o, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{o.name}</td>
                      <td>{o.center_name}</td>
                      <td>{o.district}</td>
                      <td>{o.total}</td>
                      <td>{o.completed}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 8 }}>
                            <div style={{ width: `${o.total ? (o.completed / o.total) * 100 : 0}%`, background: '#0e9f6e', borderRadius: 4, height: '100%' }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{o.total ? Math.round((o.completed / o.total) * 100) : 0}%</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{o.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'automation' && (
        <div className="card">
          <div className="card-title">Automation Rules</div>
          <div className="alert alert-info" style={{ marginBottom: 16 }}>
            Rules run automatically on their schedule. Toggle to enable or disable each rule.
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Trigger</th>
                  <th>Action</th>
                  <th>Condition</th>
                  <th>Last Run</th>
                  <th>Run Count</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {automationRules.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td><span className="badge badge-processing">{TRIGGER_LABELS[r.trigger_event] || r.trigger_event}</span></td>
                    <td><span className="badge badge-active">{ACTION_LABELS[r.action_type] || r.action_type}</span></td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {r.condition_field ? `${r.condition_field} = ${r.condition_value}` : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {r.last_run ? new Date(r.last_run).toLocaleString('en-IN') : 'Never'}
                    </td>
                    <td style={{ fontWeight: 600, color: '#1a56db' }}>{r.run_count}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Toggle checked={!!r.is_active} onChange={() => toggleRule(r.id)} />
                        <span style={{ fontSize: 12, color: r.is_active ? '#065f46' : '#9ca3af' }}>{r.is_active ? 'ON' : 'OFF'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'daily' && (
        <div className="card">
          <div className="card-title">Daily Summary Reports</div>
          {dailyReports.length === 0 ? (
            <div className="empty-state"><h3>No reports yet</h3><p>Reports are auto-generated daily at 8:00 AM</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>New</th>
                    <th>Completed</th>
                    <th>Pending</th>
                    <th>Overdue</th>
                    <th>Revenue (₹)</th>
                    <th>Total</th>
                    <th>Generated At</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyReports.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700 }}>{r.report_date}</td>
                      <td style={{ color: '#1a56db', fontWeight: 600 }}>{r.new_applications}</td>
                      <td style={{ color: '#065f46', fontWeight: 600 }}>{r.completed_applications}</td>
                      <td style={{ color: '#92400e', fontWeight: 600 }}>{r.pending_applications}</td>
                      <td style={{ color: r.overdue_applications > 0 ? '#f05252' : '#6b7280', fontWeight: 600 }}>{r.overdue_applications}</td>
                      <td style={{ fontWeight: 700 }}>₹{r.total_revenue}</td>
                      <td>{r.total_applications}</td>
                      <td style={{ fontSize: 12, color: '#6b7280' }}>{new Date(r.generated_at).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="card">
          <div className="card-title">Activity Log</div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>App No.</th>
                  <th>Citizen</th>
                  <th>Action</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Triggered By</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><h3>No activity yet</h3></div></td></tr>
                ) : activityLog.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{new Date(a.created_at).toLocaleString('en-IN')}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#1a56db', fontWeight: 700 }}>{a.application_no}</td>
                    <td>{a.citizen_name}</td>
                    <td><span className="badge badge-processing" style={{ fontSize: 11 }}>{a.action}</span></td>
                    <td style={{ color: '#6b7280' }}>{a.old_value || '—'}</td>
                    <td style={{ fontWeight: 600, color: '#065f46' }}>{a.new_value || '—'}</td>
                    <td>
                      <span className={`badge ${a.triggered_by === 'automation' ? 'badge-processing' : a.triggered_by === 'bulk_action' ? 'badge-pending' : 'badge-active'}`} style={{ fontSize: 11 }}>
                        {a.triggered_by}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'export' && (
        <div style={{ maxWidth: 560 }}>
          <div className="card">
            <div className="card-title">Export Applications to CSV</div>
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              Download application data as a spreadsheet-compatible CSV file.
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">From Date</label>
                <input type="date" className="form-control" value={exportFrom} onChange={e => setExportFrom(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">To Date</label>
                <input type="date" className="form-control" value={exportTo} onChange={e => setExportTo(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Filter by Status</label>
              <select className="form-control" value={exportStatus} onChange={e => setExportStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={doExport}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3"/></svg>
              Download CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
