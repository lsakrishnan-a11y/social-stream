import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import NotificationBell from './components/NotificationBell';
import Dashboard from './pages/Dashboard';
import Citizens from './pages/Citizens';
import Applications from './pages/Applications';
import Services from './pages/Services';
import Operators from './pages/Operators';
import Reports from './pages/Reports';
import { api } from './api';

export default function App() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    function load() {
      api.getDashboardStats().then(d => setPendingCount(d.pendingApplications)).catch(() => {});
    }
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar pendingCount={pendingCount} />
        <div className="main">
          <div className="india-stripe" />
          <div className="topbar">
            <div className="topbar-left">
              <div>
                <div className="topbar-title">Digital Seva CRM</div>
                <div className="topbar-subtitle">eServai — Government Service Management</div>
              </div>
            </div>
            <div className="topbar-right">
              <div className="topbar-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                Auto-Refresh ON
              </div>
              <NotificationBell />
              <div className="user-chip">
                <div className="user-avatar">AD</div>
                <span className="user-name">Admin</span>
              </div>
            </div>
          </div>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/citizens" element={<Citizens />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/services" element={<Services />} />
            <Route path="/operators" element={<Operators />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
