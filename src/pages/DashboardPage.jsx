import React, { useEffect, useState } from 'react';
import { Activity, Building2, Clock3, FlaskConical, FolderKanban, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { apiRequest('/api/admin/overview').then((data) => setStats(data.stats)).catch((e) => setError(e.message)); }, []);
  const cards = stats ? [
    ['Labs', stats.labs, FlaskConical, '/labs'], ['Clinics', stats.clinics, Building2, '/clinics'],
    ['All cases', stats.totalCases, FolderKanban, null], ['Regular cases', stats.regularCases, Activity, null],
    ['Surgical cases', stats.surgicalCases, ShieldCheck, null], ['Pending reviews', stats.pendingVerifications, Clock3, '/verification'],
  ] : [];
  return <><header className="admin-page-head"><div><span className="eyebrow">Platform overview</span><h1>Dashboard</h1><p>Current organization, case, and verification activity.</p></div></header>
    {error ? <div className="form-error">{error}</div> : null}
    {!stats ? <div className="loading-card">Loading platform totals…</div> : <div className="stat-grid">{cards.map(([label, value, Icon, link]) => {
      const card = <div className="stat-card"><Icon /><span>{label}</span><strong>{value}</strong></div>;
      return link ? <Link key={label} to={link}>{card}</Link> : <div key={label}>{card}</div>;
    })}</div>}
  </>;
};
export default DashboardPage;
