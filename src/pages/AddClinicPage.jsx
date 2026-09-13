import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';

const AddClinicPage = () => {
  const navigate = useNavigate(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState({ clinicName: '', clinicEmail: '', password: '', location: '', contactNumber: '' });
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { await apiRequest('/api/admin/add', { method: 'POST', body: JSON.stringify(form) }); navigate('/clinics'); } catch (e) { setError(e.message); setBusy(false); } };
  return <><header className="admin-page-head"><div><span className="eyebrow">Organization onboarding</span><h1>Add clinic</h1><p>Create a clinic account that can sign in and submit verification documents.</p></div></header><form className="data-panel admin-form" onSubmit={submit}>{error ? <div className="form-error">{error}</div> : null}{[['clinicName','Clinic name','text'],['clinicEmail','Email','email'],['password','Temporary password','password'],['location','Location','text'],['contactNumber','Contact number','text']].map(([name,label,type]) => <label key={name}>{label}<input name={name} type={type} value={form[name]} onChange={change} required /></label>)}<button className="approve-button" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create clinic'}</button></form></>;
};
export default AddClinicPage;
