import React, { useCallback, useEffect, useState } from 'react';
import { apiRequest, apiUrl, adminHeaders } from '../api';
import { PlusCircle, Edit2, CheckCircle, XCircle, CreditCard, Landmark, Banknote, QrCode } from 'lucide-react';

const emptyAccount = { bankName: '', accountHolder: '', accountNumber: '', branch: '', enabled: false, isDefault: false };
const base = '/api/admin/billing';

const PaymentSettingsPage = () => {
  const [methods, setMethods] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [draft, setDraft] = useState(emptyAccount);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState('methods');

  const load = useCallback(async () => {
    const [m, a] = await Promise.all([apiRequest(`${base}/payment-methods`), apiRequest(`${base}/bank-accounts`)]);
    setMethods(m.methods); setAccounts(a.accounts);
  }, []);

  useEffect(() => { load().catch(error => setMessage(error.message)); }, [load]);

  const run = async task => {
    setBusy(true); setMessage('');
    try { await task(); await load(); setMessage('Payment settings saved. Changes apply to new payments.'); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const handleBankSubmit = (e) => {
    e.preventDefault();
    run(async () => {
      await apiRequest(`${base}/bank-accounts${draft._id ? `/${draft._id}` : ''}`, { 
        method: draft._id ? 'PATCH' : 'POST', 
        body: JSON.stringify(draft) 
      });
      setDraft(emptyAccount);
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#095b63', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CreditCard size={32} /> Payment Configurations
          </h1>
          <p style={{ color: '#708084', margin: 0, fontSize: '15px' }}>Configure accepted payment methods and receiving bank accounts for client billing.</p>
        </div>
      </div>

      {message && (
        <div style={{ padding: '16px 20px', borderRadius: '12px', background: message.includes('failed') || message.includes('unavailable') ? '#fff0ed' : '#e4f5ed', color: message.includes('failed') || message.includes('unavailable') ? '#983d2a' : '#207654', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          {message.includes('failed') || message.includes('unavailable') ? <XCircle size={20} /> : <CheckCircle size={20} />}
          {message}
        </div>
      )}

      {!methods.some(m => m.available) && (
        <div style={{ padding: '16px 20px', borderRadius: '12px', background: '#fff3d8', color: '#8b651b', fontWeight: '600', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <XCircle size={20} /> New payments are unavailable until a configured method is enabled.
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #dde7e7' }}>
        <button 
          onClick={() => setActiveTab('methods')} 
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'methods' ? '3px solid #0e7c86' : '3px solid transparent', color: activeTab === 'methods' ? '#095b63' : '#708084', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <CreditCard size={18} /> Checkout Methods
        </button>
        <button 
          onClick={() => setActiveTab('banks')} 
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'banks' ? '3px solid #0e7c86' : '3px solid transparent', color: activeTab === 'banks' ? '#095b63' : '#708084', fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Landmark size={18} /> Bank Accounts
        </button>
      </div>

      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
        
        {activeTab === 'methods' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {methods.map(method => (
              <section key={method.code} style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #dde7e7', boxShadow: '0 12px 28px rgba(31,70,74,0.05)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', color: '#26383c', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {method.code === 'khalti' ? <Banknote color="#5C2D91" size={24} /> : <Landmark color="#0e7c86" size={24} />}
                    {method.name}
                  </h2>
                  <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', background: !method.ready ? '#fff3d8' : method.enabled ? '#e4f5ed' : '#edf3f3', color: !method.ready ? '#8b651b' : method.enabled ? '#207654' : '#5e6e71' }}>
                    {!method.ready ? 'Setup Required' : method.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>

                {!method.ready && (
                  <p style={{ color: '#d97706', fontSize: '13px', background: '#fef3c7', padding: '10px 14px', borderRadius: '8px', margin: '0 0 20px 0', fontWeight: '600' }}>
                    {method.code === 'khalti' ? 'Configure Khalti credentials and API URL on the server first.' : 'Create an enabled default bank account first.'}
                  </p>
                )}

                <div className="admin-form" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  <label style={{ display: 'grid', gap: '8px', fontWeight: '600', fontSize: '14px', color: '#26383c' }}>
                    Display Name
                    <input style={{ width: '100%', height: '44px', borderRadius: '10px', border: '1px solid #dde7e7', padding: '0 14px', fontSize: '14px', background: '#f9fbfb', transition: 'border 0.2s' }} value={method.name} maxLength={100} onChange={e => setMethods(ms => ms.map(m => m.code === method.code ? { ...m, name: e.target.value } : m))} />
                  </label>
                  
                  <label style={{ display: 'grid', gap: '8px', fontWeight: '600', fontSize: '14px', color: '#26383c' }}>
                    Display Order
                    <input style={{ width: '100%', height: '44px', borderRadius: '10px', border: '1px solid #dde7e7', padding: '0 14px', fontSize: '14px', background: '#f9fbfb' }} type="number" min="0" max="1000" value={method.sortOrder} onChange={e => setMethods(ms => ms.map(m => m.code === method.code ? { ...m, sortOrder: Number(e.target.value) } : m))} />
                  </label>

                  <label style={{ display: 'grid', gap: '8px', fontWeight: '600', fontSize: '14px', color: '#26383c' }}>
                    Payment Instructions
                    <textarea style={{ width: '100%', minHeight: '90px', borderRadius: '10px', border: '1px solid #dde7e7', padding: '12px 14px', fontSize: '14px', background: '#f9fbfb', resize: 'vertical' }} maxLength={2000} value={method.instructions} onChange={e => setMethods(ms => ms.map(m => m.code === method.code ? { ...m, instructions: e.target.value } : m))} />
                  </label>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid #dde7e7' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '700', color: '#26383c' }}>
                    <div style={{ position: 'relative', width: '44px', height: '24px' }}>
                      <input type="checkbox" checked={method.enabled} disabled={!method.ready && !method.enabled} onChange={e => setMethods(ms => ms.map(m => m.code === method.code ? { ...m, enabled: e.target.checked } : m))} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: method.enabled ? '#0e7c86' : '#dde7e7', transition: '.4s', borderRadius: '34px', opacity: (!method.ready && !method.enabled) ? 0.5 : 1 }}>
                        <span style={{ position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%', transform: method.enabled ? 'translateX(20px)' : 'translateX(0)' }}></span>
                      </span>
                    </div>
                    Enable Method
                  </label>

                  <button 
                    onClick={() => run(() => apiRequest(`${base}/payment-methods/${method.code}`, { method: 'PATCH', body: JSON.stringify({ name: method.name, instructions: method.instructions, sortOrder: method.sortOrder, enabled: method.enabled }) }))}
                    style={{ background: '#0e7c86', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 20px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#095b63'}
                    onMouseOut={e => e.currentTarget.style.background = '#0e7c86'}
                  >
                    Save Changes
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}

        {activeTab === 'banks' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: '20px' }}>
              {accounts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', border: '1px dashed #dde7e7', color: '#708084' }}>
                  <Landmark size={48} opacity={0.3} style={{ marginBottom: '16px' }} />
                  <h3>No Bank Accounts</h3>
                  <p>Add a receiving bank account using the form.</p>
                </div>
              )}
              {accounts.map(account => (
                <section key={account._id} style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #dde7e7', boxShadow: '0 8px 20px rgba(31,70,74,0.04)', position: 'relative', overflow: 'hidden' }}>
                  {account.isDefault && (
                    <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#e4f5ed', color: '#207654', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <CheckCircle size={14} /> Default
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#095b63', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Landmark size={20} /> {account.bankName}
                      </h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px 16px', fontSize: '14px', marginBottom: '20px' }}>
                        <span style={{ color: '#708084', fontWeight: '600' }}>Holder:</span>
                        <strong style={{ color: '#26383c' }}>{account.accountHolder}</strong>
                        <span style={{ color: '#708084', fontWeight: '600' }}>Account:</span>
                        <strong style={{ color: '#26383c', fontFamily: 'monospace', fontSize: '15px' }}>{account.accountNumber}</strong>
                        {account.branch && (
                          <>
                            <span style={{ color: '#708084', fontWeight: '600' }}>Branch:</span>
                            <strong style={{ color: '#26383c' }}>{account.branch}</strong>
                          </>
                        )}
                        <span style={{ color: '#708084', fontWeight: '600' }}>Status:</span>
                        <span style={{ color: account.enabled ? '#207654' : '#983d2a', fontWeight: '700' }}>{account.enabled ? 'Active' : 'Disabled'}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => setDraft(account)} style={{ background: '#f4f8f8', color: '#095b63', border: '1px solid #dde7e7', borderRadius: '8px', padding: '8px 16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#eef3f3'} onMouseOut={e => e.currentTarget.style.background = '#f4f8f8'}>
                          <Edit2 size={16} /> Edit Account
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ width: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '140px', height: '140px', background: '#f9fbfb', border: '1px dashed #dde7e7', borderRadius: '12px', display: 'grid', placeItems: 'center', overflow: 'hidden', padding: account.qrUrl ? '8px' : '0' }}>
                        {account.qrUrl ? (
                          <img src={account.qrUrl} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <QrCode size={40} color="#dde7e7" />
                        )}
                      </div>
                      
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#0e7c86', cursor: 'pointer', textAlign: 'center', width: '100%' }}>
                        <div style={{ background: '#e3f4f2', padding: '6px 12px', borderRadius: '6px', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#cce8e5'} onMouseOut={e => e.currentTarget.style.background = '#e3f4f2'}>
                          {account.qrUrl ? 'Replace QR Code' : 'Upload QR Code'}
                        </div>
                        <input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={e => {
                          const file = e.target.files[0]; if (!file) return;
                          run(async () => {
                            const form = new FormData(); form.append('qr', file);
                            const response = await fetch(apiUrl(`${base}/bank-accounts/${account._id}/qr`), { method: 'POST', headers: adminHeaders(false), body: form });
                            const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || 'QR upload failed.');
                          }); e.target.value = '';
                        }} />
                      </label>
                    </div>
                  </div>
                </section>
              ))}
            </div>

            <form style={{ background: '#fff', borderRadius: '16px', padding: '28px', border: '1px solid #dde7e7', boxShadow: '0 24px 60px rgba(20,67,72,0.08)', position: 'sticky', top: '24px' }} onSubmit={handleBankSubmit}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', color: '#095b63', display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid #dde7e7' }}>
                {draft._id ? <Edit2 size={20} /> : <PlusCircle size={20} />}
                {draft._id ? 'Edit Account Details' : 'Add Bank Account'}
              </h3>
              
              <div className="admin-form" style={{ display: 'grid', gap: '16px' }}>
                {Object.entries({ bankName: 'Bank Name', accountHolder: 'Account Holder Name', accountNumber: 'Account Number', branch: 'Branch Name (Optional)' }).map(([key, label]) => (
                  <label key={key} style={{ display: 'grid', gap: '6px', fontWeight: '600', fontSize: '13px', color: '#26383c' }}>
                    {label}
                    <input 
                      required={key !== 'branch'} 
                      maxLength={key === 'accountNumber' ? 100 : 150} 
                      value={draft[key]} 
                      onChange={e => setDraft({ ...draft, [key]: e.target.value })}
                      style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #dde7e7', padding: '0 12px', fontSize: '14px', background: '#f9fbfb', transition: 'border 0.2s', outline: 'none' }}
                      onFocus={e => e.currentTarget.style.borderColor = '#0e7c86'}
                      onBlur={e => e.currentTarget.style.borderColor = '#dde7e7'}
                    />
                  </label>
                ))}
                
                <div style={{ display: 'flex', gap: '20px', marginTop: '8px', padding: '16px', background: '#f4f8f8', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', color: '#26383c' }}>
                    <input type="checkbox" checked={draft.enabled} onChange={e => setDraft({ ...draft, enabled: e.target.checked, isDefault: e.target.checked && draft.isDefault })} style={{ width: '18px', height: '18px', accentColor: '#0e7c86' }} /> Active
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', color: '#26383c' }}>
                    <input type="checkbox" checked={draft.isDefault} onChange={e => setDraft({ ...draft, isDefault: e.target.checked, enabled: e.target.checked || draft.enabled })} style={{ width: '18px', height: '18px', accentColor: '#0e7c86' }} /> Default Account
                  </label>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button type="submit" style={{ flex: 1, background: '#0e7c86', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#095b63'} onMouseOut={e => e.currentTarget.style.background = '#0e7c86'}>
                    {draft._id ? 'Update Account' : 'Save Account'}
                  </button>
                  {draft._id && (
                    <button type="button" onClick={() => setDraft(emptyAccount)} style={{ padding: '12px 20px', background: '#fff0ed', color: '#a5422d', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#fadcd7'} onMouseOut={e => e.currentTarget.style.background = '#fff0ed'}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}
      </fieldset>
    </div>
  );
};

export default PaymentSettingsPage;
