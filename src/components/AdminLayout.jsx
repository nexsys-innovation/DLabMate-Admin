import { clearQueryCache } from "../hooks/useCachedQuery";
import React, { useEffect } from 'react';
import { Building2, FlaskConical, Globe, LayoutDashboard, LogOut, ShieldCheck, CreditCard } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const links = [
  ['/dashboard', LayoutDashboard, 'Dashboard'],
  ['/labs', FlaskConical, 'Labs'],
  ['/clinics', Building2, 'Clinics'],
  ['/verification', ShieldCheck, 'Verification'],
  ['/billing-orders', CreditCard, 'Billing Orders'],
  ['/marketing', Globe, 'Marketing'],
];

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const expired = () => navigate('/login', { replace: true, state: { from: location } });
    window.addEventListener('dlabmate:admin-session-expired', expired);
    return () => window.removeEventListener('dlabmate:admin-session-expired', expired);
  }, [location, navigate]);
  const logout = () => { localStorage.removeItem('adminToken'); clearQueryCache(); navigate('/login', { replace: true }); };
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span>D</span><div><strong>DLabMate</strong><small>Platform administration</small></div></div>
        <nav>{links.map(([path, Icon, label]) => <NavLink key={path} to={path}><Icon size={18} />{label}</NavLink>)}</nav>
        <button type="button" className="admin-logout" onClick={logout}><LogOut size={18} />Sign out</button>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
};

export default AdminLayout;
