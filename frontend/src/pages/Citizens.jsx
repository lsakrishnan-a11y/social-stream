import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const DISTRICTS = ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivaganga', 'Virudhunagar', 'Namakkal', 'Kancheepuram', 'Udhagamandalam', 'Krishnagiri', 'Ariyalur', 'Dharmapuri', 'Cuddalore', 'Nagapattinam', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'The Nilgiris', 'Theni', 'Tiruppur', 'Tiruvannamalai', 'Tiruvarur', 'Villupuram'];

const emptyForm = { name: '', aadhaar: '', phone: '', email: '', address: '', district: '', taluk: '', village: '', dob: '', gender: '' };

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

export default function Citizens() {
  const [citizens, setCitizens] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [detail, setDetail] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getCitizens({ search, district, page, limit: 15 })
      .then(d => { setCitizens(d.data); setTotal(d.total); })
      .finally(() => setLoading(false));
  }, [search, district, page]);

  useEffect(() => { load(); }, [load]);

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(c) { setEditing(c); setForm({ ...c }); setShowModal(true); }

  async function save() {
    try {
      if (editing) await api.updateCitizen(editing.id, form);
      else await api.createCitizen(form);
      setShowModal(false);
      setMsg({ type: 'success', text: editing ? 'Citizen updated!' : 'Citizen registered!' });
      load();
    } catch (e) {
      setMsg({ type: 'danger', text: e.message });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  async function viewDetail(id) {
    const d = await api.getCitizen(id);
    setDetail(d);
  }

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Citizens</div>
          <div className="page-subtitle">{total} registered citizens</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Register Citizen
        </button>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="card">
        <div className="filters">
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input className="form-control" placeholder="Search by name, phone, Aadhaar…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="filter-select" value={district} onChange={e => { setDistrict(e.target.value); setPage(1); }}>
            <option value="">All Districts</option>
            {DISTRICTS.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="table-wrapper">
          {loading ? <div className="loading"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Aadhaar</th>
                  <th>Phone</th>
                  <th>District</th>
                  <th>Gender</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {citizens.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><h3>No citizens found</h3></div></td></tr>
                ) : citizens.map(c => (
                  <tr key={c.id}>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{c.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{c.village}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{c.aadhaar || '—'}</td>
                    <td>{c.phone}</td>
                    <td>{c.district}</td>
                    <td>{c.gender || '—'}</td>
                    <td style={{ color: '#6b7280', fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => viewDetail(c.id)}>View</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
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

      {showModal && (
        <Modal
          title={editing ? 'Edit Citizen' : 'Register New Citizen'}
          onClose={() => setShowModal(false)}
          footer={<>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </>}
        >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Enter full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit mobile number" />
            </div>
            <div className="form-group">
              <label className="form-label">Aadhaar No.</label>
              <input className="form-control" value={form.aadhaar} onChange={e => setForm(f => ({ ...f, aadhaar: e.target.value }))} placeholder="XXXX-XXXX-XXXX" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input className="form-control" type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-control" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
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
              <input className="form-control" value={form.taluk} onChange={e => setForm(f => ({ ...f, taluk: e.target.value }))} placeholder="Taluk name" />
            </div>
            <div className="form-group">
              <label className="form-label">Village / Town</label>
              <input className="form-control" value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} placeholder="Village or town" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-control" rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title="Citizen Details" onClose={() => setDetail(null)}
          footer={<button className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>}>
          <div className="detail-grid" style={{ marginBottom: 16 }}>
            {[
              ['Name', detail.name], ['Aadhaar', detail.aadhaar || '—'], ['Phone', detail.phone],
              ['Email', detail.email || '—'], ['Gender', detail.gender || '—'], ['DOB', detail.dob || '—'],
              ['District', detail.district || '—'], ['Taluk', detail.taluk || '—'],
              ['Village', detail.village || '—'], ['Address', detail.address || '—'],
            ].map(([l, v]) => (
              <div key={l} className="detail-item">
                <div className="detail-label">{l}</div>
                <div className="detail-value">{v}</div>
              </div>
            ))}
          </div>
          {detail.applications?.length > 0 && <>
            <div className="card-title">Applications ({detail.applications.length})</div>
            {detail.applications.map(a => (
              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e5e7eb', fontSize: 13 }}>
                <span style={{ fontFamily: 'monospace', color: '#1a56db' }}>{a.application_no}</span>
                <span>{a.service_name}</span>
                <span className={`badge badge-${a.status}`}>{a.status}</span>
              </div>
            ))}
          </>}
        </Modal>
      )}
    </div>
  );
}
