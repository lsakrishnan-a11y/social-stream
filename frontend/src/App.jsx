import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Citizens from './pages/Citizens';
import Applications from './pages/Applications';
import Services from './pages/Services';
import Operators from './pages/Operators';
import { api } from './api';

export default function App() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    api.getDashboardStats().then(d => setPendingCount(d.pendingApplications)).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar pendingCount={pendingCount} />
        <div className="main">
          <div className="india-stripe" />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/citizens" element={<Citizens />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/services" element={<Services />} />
            <Route path="/operators" element={<Operators />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
