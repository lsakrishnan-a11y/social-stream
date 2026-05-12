import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

function Modal({ title, onClose, children, footer, large }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal${large ? ' modal-lg' : ''}`}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

const STATUS_COLORS = { pending: 'badge-pending', processing: 'badge-processing', completed: 'badge-completed', cancelled: 'badge-cancelled' };

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [detail, setDetail] = useState(null);
  const [citizens, setCitizens] = useState([]);
  const [services, setServices] = useState([]);
  const [operators, setOperators] = useState([]);
  const [msg, setMsg] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('processing');
  const [form, setForm] = useState({ citizen_id: '', service_id: '', operator_id: '', fee: '', payment_mode: '', remarks: '', priority: 'normal' });

  const load = useCallback(() => {
    setLoading(true);
    setSelected([]);
    api.getApplications({ search, status, page, limit: 15 })
      .then(d => { setApps(d.data); setTotal(d.total); })
      .finally(() => setLoading(false));
  }, [search, status, page]);

  async function doBulkUpdate() {
    if (!selected.length) return;
    await api.bulkUpdateStatus({ ids: selected, status: bulkStatus });
    setBulkModal(false);
    setSelected([]);
    setMsg({ type: 'success', text: `${selected.length} application(s) updated to ${bulkStatus}.` });
    load();
    setTimeout(() => setMsg(null), 3000);
  }

  function toggleSelect(id) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  function toggleAll() {
    setSelected(s => s.length === apps.length ? [] : apps.map(a => a.id));
  }

  function exportCSV() {
    window.open(api.exportApplicationsCSV({ status, from_date: '', to_date: '' }), '_blank');
  }

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (showNew) {
      api.getCitizens({ limit: 1000 }).then(d => setCitizens(d.data));
      api.getServices({ status: 'active' }).then(setServices);
      api.getOperators().then(setOperators);
    }
  }, [showNew]);

  function selectService(id) {
    const svc = services.find(s => s.id == id);
    setForm(f => ({ ...f, service_id: id, fee: svc ? svc.fee : '' }));
  }

  async function submitApp() {
    try {
      await api.createApplication({ ...form, citizen_id: Number(form.citizen_id), service_id: Number(form.service_id), operator_id: Number(form.operator_id), fee: Number(form.fee) });
      setShowNew(false);
      setForm({ citizen_id: '', service_id: '', operator_id: '', fee: '', payment_mode: '', remarks: '', priority: 'normal' });
      setMsg({ type: 'success', text: 'Application submitted!' });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    setTimeout(() => setMsg(null), 3000);
  }

  async function updateStatus() {
    await api.updateStatus(statusModal.id, { status: statusModal.newStatus, remarks: statusModal.remarks });
    setStatusModal(null);
    load();
  }

  async function openDetail(id) {
    const d = await api.getApplication(id);
    setDetail(d);
  }

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Applications</div>
          <div className="page-subtitle">{total} total applications</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportCSV} title="Export CSV">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3"/></svg>
            Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New Application
          </button>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', 'pending', 'processing', 'completed', 'cancelled'].map(s => (
          <button key={s} className={`btn ${status === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setStatus(s); setPage(1); }}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {selected.length > 0 && (
        <div style={{ background: '#1a56db', color: '#fff', padding: '10px 16px', borderRadius: 10, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600 }}>{selected.length} application(s) selected</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setBulkModal(true)}>Bulk Update Status</button>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}>Export Selected</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      <div className="card">
        <div className="filters">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input className="form-control" placeholder="Search by app no, citizen name, phone…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? <div className="loading"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 32 }}><input type="checkbox" checked={selected.length === apps.length && apps.length > 0} onChange={toggleAll} /></th>
                  <th>App No.</th>
                  <th>Citizen</th>
                  <th>Service</th>
                  <th>Center</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Fee</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {apps.length === 0 ? (
                  <tr><td colSpan={10}><div className="empty-state"><h3>No applications found</h3></div></td></tr>
                ) : apps.map(a => (
                  <tr key={a.id} style={{ background: selected.includes(a.id) ? '#eff6ff' : undefined }}>
                    <td><input type="checkbox" checked={selected.includes(a.id)} onChange={() => toggleSelect(a.id)} /></td>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1a56db', fontSize: 12 }}>{a.application_no}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.citizen_name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{a.citizen_phone}</div>
                    </td>
                    <td style={{ maxWidth: 160 }}>{a.service_name}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{a.center_name}</td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{new Date(a.submitted_at).toLocaleDateString('en-IN')}</td>
                    <td><span className={`badge ${STATUS_COLORS[a.status] || 'badge-pending'}`}>{a.status}</span></td>
                    <td>₹{a.fee}</td>
                    <td><span className={`badge badge-${a.payment_status === 'paid' ? 'paid' : 'unpaid'}`}>{a.payment_status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openDetail(a.id)}>View</button>
                        {a.status !== 'completed' && a.status !== 'cancelled' && (
                          <button className="btn btn-primary btn-sm" onClick={() => setStatusModal({ id: a.id, current: a.status, newStatus: 'completed', remarks: '' })}>Update</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}
      </div>

      {showNew && (
        <Modal title="New Application" large onClose={() => setShowNew(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitApp}>Submit Application</button>
          </>}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Citizen *</label>
              <select className="form-control" value={form.citizen_id} onChange={e => setForm(f => ({ ...f, citizen_id: e.target.value }))}>
                <option value="">Select citizen</option>
                {citizens.map(c => <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Service *</label>
              <select className="form-control" value={form.service_id} onChange={e => selectService(e.target.value)}>
                <option value="">Select service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.fee})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Operator/Center *</label>
              <select className="form-control" value={form.operator_id} onChange={e => setForm(f => ({ ...f, operator_id: e.target.value }))}>
                <option value="">Select operator</option>
                {operators.map(o => <option key={o.id} value={o.id}>{o.name} — {o.center_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fee (₹)</label>
              <input className="form-control" type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: e.target.value }))} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select className="form-control" value={form.payment_mode} onChange={e => setForm(f => ({ ...f, payment_mode: e.target.value }))}>
                <option value="">Not paid yet</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="netbanking">Net Banking</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea className="form-control" rows={2} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Any additional notes..." />
          </div>
        </Modal>
      )}

      {statusModal && (
        <Modal title="Update Application Status" onClose={() => setStatusModal(null)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setStatusModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={updateStatus}>Update</button>
          </>}>
          <div className="form-group">
            <label className="form-label">New Status</label>
            <select className="form-control" value={statusModal.newStatus} onChange={e => setStatusModal(s => ({ ...s, newStatus: e.target.value }))}>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Remarks</label>
            <textarea className="form-control" rows={3} value={statusModal.remarks} onChange={e => setStatusModal(s => ({ ...s, remarks: e.target.value }))} placeholder="Reason or notes..." />
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title={`Application: ${detail.application_no}`} large onClose={() => setDetail(null)}
          footer={<button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className={`badge ${STATUS_COLORS[detail.status]}`} style={{ fontSize: 13 }}>{detail.status?.toUpperCase()}</span>
            <span className={`badge badge-${detail.payment_status === 'paid' ? 'paid' : 'unpaid'}`} style={{ fontSize: 13 }}>Payment: {detail.payment_status}</span>
            {detail.priority === 'urgent' && <span className="badge badge-urgent">URGENT</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div>
              <div className="card-title" style={{ fontSize: 13 }}>Citizen Information</div>
              <div className="detail-grid">
                {[['Name', detail.citizen_name], ['Phone', detail.citizen_phone], ['Aadhaar', detail.aadhaar || '—'], ['Address', detail.address || '—']].map(([l, v]) => (
                  <div key={l} className="detail-item">
                    <div className="detail-label">{l}</div>
                    <div className="detail-value">{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="card-title" style={{ fontSize: 13 }}>Service Details</div>
              <div className="detail-grid">
                {[['Service', detail.service_name], ['Tamil', detail.name_tamil || '—'], ['Dept.', detail.department], ['Processing', `${detail.processing_days} days`]].map(([l, v]) => (
                  <div key={l} className="detail-item">
                    <div className="detail-label">{l}</div>
                    <div className="detail-value">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div className="card-title" style={{ fontSize: 13 }}>Center / Operator</div>
              <div className="detail-grid">
                {[['Operator', detail.operator_name], ['Center', detail.center_name], ['Code', detail.center_code], ['Phone', detail.operator_phone]].map(([l, v]) => (
                  <div key={l} className="detail-item">
                    <div className="detail-label">{l}</div>
                    <div className="detail-value">{v || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="card-title" style={{ fontSize: 13 }}>Payment</div>
              <div className="detail-grid">
                {[['Fee', `₹${detail.fee}`], ['Mode', detail.payment_mode || 'Not paid'], ['Date', detail.submitted_at ? new Date(detail.submitted_at).toLocaleDateString('en-IN') : '—'], ['Completed', detail.completed_at ? new Date(detail.completed_at).toLocaleDateString('en-IN') : 'Pending']].map(([l, v]) => (
                  <div key={l} className="detail-item">
                    <div className="detail-label">{l}</div>
                    <div className="detail-value">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {detail.remarks && <div style={{ marginTop: 16 }}>
            <div className="detail-label">Remarks</div>
            <div className="detail-value">{detail.remarks}</div>
          </div>}
        </Modal>
      )}

      {bulkModal && (
        <Modal title={`Bulk Update ${selected.length} Application(s)`} onClose={() => setBulkModal(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setBulkModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={doBulkUpdate}>Apply</button>
          </>}>
          <div className="alert alert-info">You are about to update {selected.length} application(s) at once.</div>
          <div className="form-group">
            <label className="form-label">New Status</label>
            <select className="form-control" value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}
