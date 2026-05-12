import { useState, useEffect } from 'react';
import { api } from '../api';

const emptyForm = { name: '', name_tamil: '', department: '', description: '', fee: 0, processing_days: 7, status: 'active' };

function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
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

const DEPTS = ['Revenue Department', 'Food & Civil Supplies', 'UIDAI', 'Income Tax Dept', 'MEA', 'Transport Dept', 'Local Body', 'Social Welfare', 'Health Dept', 'TNEB', 'TWAD', 'Other'];

export default function Services() {
  const [services, setServices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  function load() { api.getServices().then(setServices); }
  useEffect(() => { load(); }, []);

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(s) { setEditing(s); setForm({ ...s }); setShowModal(true); }

  async function save() {
    try {
      if (editing) await api.updateService(editing.id, form);
      else await api.createService(form);
      setShowModal(false);
      setMsg({ type: 'success', text: 'Service saved!' });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    setTimeout(() => setMsg(null), 3000);
  }

  async function deactivate(id) {
    if (!confirm('Deactivate this service?')) return;
    await api.deleteService(id);
    load();
  }

  const filtered = services.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.department.toLowerCase().includes(search.toLowerCase()));
  const grouped = filtered.reduce((acc, s) => { (acc[s.department] = acc[s.department] || []).push(s); return acc; }, {});

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Services</div>
          <div className="page-subtitle">{services.length} government services available</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Service
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <input className="form-control" placeholder="Search services or department…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
      </div>

      {Object.entries(grouped).map(([dept, svcs]) => (
        <div key={dept} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ background: '#ebf5ff', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#1a56db' }}>{dept}</div>
            <span style={{ color: '#6b7280', fontSize: 12 }}>{svcs.length} services</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Tamil Name</th>
                  <th>Fee (₹)</th>
                  <th>Processing Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {svcs.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.description && <div style={{ fontSize: 11, color: '#6b7280' }}>{s.description}</div>}
                    </td>
                    <td style={{ fontFamily: 'serif' }}>{s.name_tamil || '—'}</td>
                    <td style={{ fontWeight: 600 }}>₹{s.fee}</td>
                    <td>{s.processing_days} days</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        {s.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => deactivate(s.id)}>Deactivate</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {showModal && (
        <Modal title={editing ? 'Edit Service' : 'Add Service'} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </>}>
          <div className="form-group">
            <label className="form-label">Service Name (English) *</label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Birth Certificate" />
          </div>
          <div className="form-group">
            <label className="form-label">Service Name (Tamil)</label>
            <input className="form-control" value={form.name_tamil} onChange={e => setForm(f => ({ ...f, name_tamil: e.target.value }))} placeholder="தமிழ் பெயர்" style={{ fontFamily: 'serif' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Department *</label>
            <select className="form-control" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
              <option value="">Select department</option>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Fee (₹)</label>
              <input className="form-control" type="number" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: Number(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Processing Days</label>
              <input className="form-control" type="number" value={form.processing_days} onChange={e => setForm(f => ({ ...f, processing_days: Number(e.target.value) }))} />
            </div>
          </div>
          {editing && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
