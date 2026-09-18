import { useCachedQuery, QueryNotice } from "../hooks/useCachedQuery";
import React from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api';

const EntityDetailPage = ({ type }) => {
  const { id } = useParams(); const error = '';
  const query = useCachedQuery([type === 'lab' ? `/api/admin/labs/${id}` : `/api/admin/directory/clinics/${id}`], async () => {
    const data = await apiRequest(type === 'lab' ? `/api/admin/labs/${id}` : `/api/admin/directory/clinics/${id}`);
    return data;
  });
  const data = query.data ?? null;
  
  if (query.error && query.data === undefined) return <QueryNotice error={query.error} refresh={query.refresh} hasData={false} />;
  if (error && !data) return <div className="form-error">{error}</div>; if (!data) return <div className="loading-card">Loading account…</div>;
  const entity = data[type]; const name = type === 'lab' ? entity.labName : entity.clinicName; const email = type === 'lab' ? entity.email : entity.clinicEmail;
  return <><QueryNotice error={query.error} refresh={query.refresh} hasData={query.data !== undefined} /><header className="admin-page-head"><div><span className="eyebrow">{type} profile</span><h1>{name}</h1><p>{email}</p></div><span className={`status ${String(entity.registrationStatus).toLowerCase().replaceAll(' ', '-')}`}>{entity.registrationStatus}</span></header>
    <div className="detail-grid"><section className="data-panel"><h2>Account details</h2><dl><dt>Location</dt><dd>{entity.location}</dd><dt>Contact</dt><dd>{entity.contactNumber}</dd><dt>Account status</dt><dd>{entity.status}</dd><dt>Joined</dt><dd>{new Date(entity.createdAt).toLocaleDateString()}</dd></dl></section>
      <section className="data-panel"><h2>Case activity</h2><div className="case-counts"><div><strong>{data.caseCounts.total}</strong><span>Total</span></div><div><strong>{data.caseCounts.regular}</strong><span>Regular</span></div><div><strong>{data.caseCounts.surgical}</strong><span>Surgical</span></div></div></section></div>
    <section className="data-panel"><h2>Verification history</h2>{data.verificationHistory.length ? data.verificationHistory.map((submission) => <div className="history-row" key={submission._id}><span>Submission {submission.version}</span><span className={`status ${submission.status.toLowerCase().replaceAll(' ', '-')}`}>{submission.status}</span><span>{new Date(submission.submittedAt).toLocaleString()}</span></div>) : <p>No submissions yet.</p>}</section></>;
};
export default EntityDetailPage;
