import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';

const DirectoryPage = ({ type }) => {
  const plural = type === 'lab' ? 'labs' : 'clinics';
  const [items, setItems] = useState([]); const [search, setSearch] = useState(''); const [verificationStatus, setVerificationStatus] = useState(''); const [error, setError] = useState('');
  useEffect(() => {
    const params = new URLSearchParams({ page: '1', limit: '50' });
    if (search) params.set('q', search); if (verificationStatus) params.set('verificationStatus', verificationStatus);
    const path = type === 'lab' ? '/api/admin/labs' : '/api/admin/directory/clinics';
    apiRequest(`${path}?${params}`).then((data) => setItems(data[plural] || [])).catch((e) => setError(e.message));
  }, [plural, search, type, verificationStatus]);
  return <><header className="admin-page-head"><div><span className="eyebrow">Organization directory</span><h1>{type === 'lab' ? 'Labs' : 'Clinics'}</h1><p>Browse account details, verification status, and case volume.</p></div>{type === 'clinic' ? <Link className="primary-link" to="/clinics/new"><Plus size={17} />Add clinic</Link> : null}</header>
    <section className="data-panel"><div className="table-tools"><label className="search-box"><Search size={17} /><input aria-label={`Search ${plural}`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${plural}`} /></label><select aria-label="Verification status" value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value)}><option value="">All verification states</option><option>Pending</option><option>Under Review</option><option>Verified</option><option>Rejected</option></select></div>
      {error ? <div className="form-error">{error}</div> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Location</th><th>Verification</th><th>Cases</th><th /></tr></thead><tbody>{items.map((item) => { const name = type === 'lab' ? item.labName : item.clinicName; const email = type === 'lab' ? item.email : item.clinicEmail; return <tr key={item._id}><td><strong>{name}</strong></td><td>{email}</td><td>{item.location}</td><td><span className={`status ${String(item.registrationStatus).toLowerCase().replaceAll(' ', '-')}`}>{item.registrationStatus}</span></td><td>{item.totalCaseCount}</td><td><Link to={`/${plural}/${item._id}`}>View</Link></td></tr>; })}{!items.length ? <tr><td colSpan="6" className="empty">No {plural} found.</td></tr> : null}</tbody></table></div>}
    </section></>;
};
export default DirectoryPage;
