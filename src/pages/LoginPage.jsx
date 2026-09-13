import React, { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiUrl } from '../api';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(apiUrl('/api/admin/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, passcode }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Sign in failed.');
      localStorage.setItem('adminToken', data.token);
      const target = location.state?.from?.pathname;
      navigate(target?.startsWith('/') ? target : '/dashboard', { replace: true });
    } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };
  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="login-mark"><LockKeyhole /></div><span className="eyebrow">Secure administration</span>
        <h1>DLabMate Admin</h1><p>Review platform activity, organizations, and verification documents.</p>
        {error ? <div className="form-error" role="alert">{error}</div> : null}
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Passcode<input type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} required /></label>
        <button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
};
export default LoginPage;
