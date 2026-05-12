import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

const TYPE_ICON = {
  success: { bg: '#d1fae5', color: '#065f46', symbol: '✓' },
  warning: { bg: '#fef3c7', color: '#92400e', symbol: '!' },
  info:    { bg: '#dbeafe', color: '#1e40af', symbol: 'i' },
  danger:  { bg: '#fee2e2', color: '#991b1b', symbol: '✕' },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef();

  function load() {
    api.getNotifications({ limit: 20 }).then(d => {
      setNotifications(d.data);
      setUnread(d.unread);
    }).catch(() => {});
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markAllRead() {
    await api.markAllNotificationsRead();
    load();
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary btn-icon"
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        style={{ position: 'relative' }}
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: '#f05252', color: '#fff',
            borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, fontWeight: 700, border: '2px solid #fff'
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 360,
          background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)', zIndex: 300, overflow: 'hidden'
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Notifications {unread > 0 && <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 20, padding: '1px 7px', fontSize: 11 }}>{unread}</span>}</div>
            {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark all read</button>}
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No notifications</div>
            ) : notifications.map(n => {
              const style = TYPE_ICON[n.type] || TYPE_ICON.info;
              return (
                <div key={n.id} style={{
                  padding: '12px 16px', borderBottom: '1px solid #f3f4f6',
                  background: n.is_read ? '#fff' : '#f8faff',
                  display: 'flex', gap: 10, cursor: 'pointer'
                }} onClick={() => { api.markNotificationRead(n.id); load(); }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {style.symbol}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.is_read ? 500 : 700, fontSize: 13 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('en-IN')}</div>
                  </div>
                  {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a56db', flexShrink: 0, marginTop: 4 }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
