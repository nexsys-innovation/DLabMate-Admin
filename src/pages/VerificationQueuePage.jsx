import { useCachedQuery, QueryNotice } from "../hooks/useCachedQuery";
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';

const VerificationQueuePage = () => {
  const [ownerType, setOwnerType] = useState(''); const error = '';
  const query = useCachedQuery([`/api/admin/verification-submissions${ownerType ? `?ownerType=${ownerType}` : ''}`], async () => {
    const data = await apiRequest(`/api/admin/verification-submissions${ownerType ? `?ownerType=${ownerType}` : ''}`);
    return data.queue || [];
  });
  const queue = query.data ?? [];
  
  return <><QueryNotice error={query.error} refresh={query.refresh} hasData={query.data !== undefined} /><header className="admin-page-head"><div><span className="eyebrow">Trust and compliance</span><h1>Verification requests</h1><p>Review company registration and PAN/VAT documents.</p></div></header>
    <section className="data-panel"><div className="table-tools"><select aria-label="Account type" value={ownerType} onChange={(e) => setOwnerType(e.target.value)}><option value="">Labs and clinics</option><option>Lab</option><option>Clinic</option></select></div>{error ? <div className="form-error">{error}</div> : <div className="table-wrap"><table><thead><tr><th>Organization</th><th>Type</th><th>Email</th><th>Version</th><th>Submitted</th><th /></tr></thead><tbody>{queue.map((item) => <tr key={item.id}><td><strong>{item.ownerName}</strong></td><td>{item.ownerType}</td><td>{item.ownerEmail}</td><td>{item.version}</td><td>{new Date(item.submittedAt).toLocaleString()}</td><td><Link to={`/verification/${item.id}`}>Review</Link></td></tr>)}{!queue.length ? <tr><td colSpan="6" className="empty">No verification requests are waiting.</td></tr> : null}</tbody></table></div>}</section></>;
};
export default VerificationQueuePage;
