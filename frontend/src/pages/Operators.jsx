import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const DISTRICTS = ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivaganga', 'Virudhunagar', 'Namakkal', 'Kancheepuram'];
const emptyForm = { name: '', email: '', phone: '', center_name: '', center_code: '', district: '', taluk: '', village: '', status: 'active' };

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

export default function Operators() {
  const [operators, setOperators] = useState([]);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    api.getOperators({ search, district }).then(setOperators);
  }, [search, district]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(o) { setEditing(o); setForm({ ...o }); setShowModal(true); }

  async function save() {
    try {
      if (editing) await api.updateOperator(editing.id, form);
      else await api.createOperator(form);
      setShowModal(false);
      setMsg({ type: 'success', text: 'Operator saved!' });
      load();
    } catch (e) { setMsg({ type: 'danger', text: e.message }); }
    setTimeout(() => setMsg(null), 3000);
  }

  async function viewDetail(id) {
    const d = await api.getOperator(id);
    setDetail(d);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Operators & Centers</div>
          <div className="page-subtitle">{operators.length} service centers registered</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Operator
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card">
        <div className="filters">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input className="form-control" placeholder="Search by name, center, code…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={district} onChange={e => setDistrict(e.target.value)}>
            <option value="">All Districts</option>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Operator</th>
                <th>Center</th>
                <th>Center Code</th>
                <th>District</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {operators.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><h3>No operators found</h3></div></td></tr>
              ) : operators.map(o => (
                <tr key={o.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1a56db', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                        {o.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{o.name}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{o.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{o.center_name}</td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: 12, background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{o.center_code}</span></td>
                  <td>{o.district}</td>
                  <td>{o.phone}</td>
                  <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => viewDetail(o.id)}>Stats</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(o)}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Operator' : 'Add Operator'} onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </>}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Operator full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit mobile" />
            </div>
            <div className="form-group">
              <label className="form-label">Center Code *</label>
              <input className="form-control" value={form.center_code} onChange={e => setForm(f => ({ ...f, center_code: e.target.value }))} placeholder="e.g. CSC-CHN-001" disabled={!!editing} />
            </div>
            <div className="form-group">
              <label className="form-label">Center Name</label>
              <input className="form-control" value={form.center_name} onChange={e => setForm(f => ({ ...f, center_name: e.target.value }))} placeholder="Seva Center name" />
            </div>
            <div className="form-group">
              <label className="form-label">District</label>
              <select className="form-control" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                <option value="">Select district</option>
                {DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Taluk</label>
              <input className="form-control" value={form.taluk} onChange={e => setForm(f => ({ ...f, taluk: e.target.value }))} placeholder="Taluk" />
            </div>
            <div className="form-group">
              <label className="form-label">Village / Town</label>
              <input className="form-control" value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} placeholder="Village or town" />
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
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title={`${detail.center_name} — Statistics`} onClose={() => setDetail(null)}
          footer={<button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              ['Total Applications', detail.stats?.total || 0, '#1a56db', '#ebf5ff'],
              ['Completed', detail.stats?.completed || 0, '#065f46', '#d1fae5'],
              ['Pending', detail.stats?.pending || 0, '#92400e', '#fef3c7'],
              ['Revenue', `₹${detail.stats?.revenue || 0}`, '#7c3aed', '#ede9fe'],
            ].map(([l, v, c, bg]) => (
              <div key={l} style={{ background: bg, padding: 16, borderRadius: 10, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: c }}>{v}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
          <div className="detail-grid">
            {[['Name', detail.name], ['Email', detail.email], ['Phone', detail.phone], ['Center Code', detail.center_code], ['District', detail.district], ['Taluk', detail.taluk || '—'], ['Village', detail.village || '—'], ['Status', detail.status]].map(([l, v]) => (
              <div key={l} className="detail-item">
                <div className="detail-label">{l}</div>
                <div className="detail-value">{v}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
