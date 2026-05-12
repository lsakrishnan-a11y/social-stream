import { NavLink } from 'react-router-dom';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  citizens: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
  applications: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  services: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  operators: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8',
  transactions: 'M12 2v20 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  settings: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 8v4 M12 16h.01',
};

export default function Sidebar({ pendingCount }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <path d="M9 22V12h6v10" />
            </svg>
          </div>
          <div className="sidebar-logo-text">
            <h1>Digital Seva</h1>
            <p>eServai CRM</p>
          </div>
        </NavLink>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon d={icons.dashboard} />
            <span>Dashboard</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Operations</div>
          <NavLink to="/applications" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon d={icons.applications} />
            <span>Applications</span>
            {pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
          </NavLink>
          <NavLink to="/citizens" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon d={icons.citizens} />
            <span>Citizens</span>
          </NavLink>
        </div>

        <div className="nav-section">
          <div className="nav-section-title">Management</div>
          <NavLink to="/services" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon d={icons.services} />
            <span>Services</span>
          </NavLink>
          <NavLink to="/operators" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon d={icons.operators} />
            <span>Operators</span>
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <Icon d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            <span>Reports</span>
          </NavLink>
        </div>
      </nav>

      <div className="govt-label">
        Govt. of Tamil Nadu · Digital Seva
      </div>
    </aside>
  );
}
