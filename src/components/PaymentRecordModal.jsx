import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Download, ExternalLink, ZoomIn, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import './PaymentRecordModal.css';

const ProofView = ({ proof, requestAccess, autoPreview = false }) => {
  const [access, setAccess] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(100);

  const load = useCallback(async () => {
    setBusy(true); setError('');
    try { setAccess(await requestAccess('preview')); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }, [requestAccess]);

  useEffect(() => { if (autoPreview) load(); }, [autoPreview, load]);

  const download = async () => {
    setBusy(true); setError('');
    try { const result = await requestAccess('download'); window.location.assign(result.url); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="payment-proof" style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <FileText size={20} color="#64748b" />
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', color: '#1e293b' }}>{proof.originalFileName}</strong>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{Math.ceil(proof.sizeBytes / 1024)} KB · {proof.mimeType === 'application/pdf' ? 'PDF' : 'Screenshot'}</span>
        </div>
      </div>
      
      <div className="payment-record-actions">
        <button disabled={busy} onClick={load} className="btn">
          <Eye size={16} /> {access ? 'Reload preview' : proof.mimeType === 'application/pdf' ? 'View PDF' : 'View proof'}
        </button>
        <button disabled={busy} onClick={download} className="btn">
          <Download size={16} /> Download
        </button>
        {access && (
          <a href={access.url} target="_blank" rel="noopener noreferrer" className="btn">
            <ExternalLink size={16} /> Open in new tab
          </a>
        )}
      </div>

      {error && <p role="alert"><AlertCircle size={16} /> {error}</p>}
      
      {access && (
        <div style={{ marginTop: '16px' }}>
          <small style={{ color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Preview links expire after five minutes. Use Reload preview if needed.</small>
          {proof.mimeType === 'application/pdf' ? (
            <>
              <iframe title={`Payment proof: ${proof.originalFileName}`} src={access.url} className="payment-proof-pdf" />
              <p style={{ marginTop: '8px', fontSize: '13px' }}>If your browser cannot display this PDF, use Open in new tab or Download.</p>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                  <ZoomIn size={16} /> Image zoom 
                  <input type="range" min="50" max="200" step="25" value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ width: '120px' }} />
                </label>
                <button onClick={() => setZoom(100)} className="btn" style={{ padding: '4px 10px', fontSize: '12px' }}>Fit to screen</button>
              </div>
              <div className="payment-proof-image">
                <img src={access.url} alt={`Payment receipt: ${proof.originalFileName}`} style={{ width: `${zoom}%`, maxWidth: 'none' }} onError={() => setError('Preview unavailable or expired. Reload the preview to try again.')} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const Submission = ({ submission, current, api, orderId }) => {
  const access = useCallback(intent => api(`/orders/${orderId}/payment-submissions/${submission._id}/proof-access`, { method: 'POST', body: JSON.stringify({ intent }) }), [api, orderId, submission._id]);
  return (
    <section className="payment-record-submission">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3>Submission {submission.submissionNumber} {current && <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px' }}>Latest</span>}</h3>
        <span style={{ fontSize: '13px', color: '#64748b' }}>{new Date(submission.submittedAt).toLocaleString()}</span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '14px', marginBottom: '16px' }}>
        <span style={{ fontWeight: 600, color: '#475569' }}>Status:</span>
        <span style={{ fontWeight: 700, textTransform: 'capitalize', color: submission.reviewStatus === 'approved' ? '#15803d' : submission.reviewStatus === 'rejected' ? '#b91c1c' : '#b45309' }}>{submission.reviewStatus}</span>
        
        <span style={{ fontWeight: 600, color: '#475569' }}>Reference:</span>
        <span style={{ fontFamily: 'monospace', fontSize: '15px', color: '#1e293b' }}>{submission.paymentReference}</span>
      </div>

      {submission.paymentNote && (
        <div style={{ marginBottom: '16px' }}>
          <strong style={{ fontSize: '13px', color: '#475569' }}>Note from Lab:</strong>
          <div className="payment-record-note">{submission.paymentNote}</div>
        </div>
      )}
      
      {submission.rejectionReason && (
        <div style={{ marginBottom: '16px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
          <strong>Rejection reason:</strong> {submission.rejectionReason}
        </div>
      )}
      
      {submission.proof ? (
        <ProofView proof={submission.proof} requestAccess={access} autoPreview={current && submission.proof.mimeType.startsWith('image/')} />
      ) : (
        <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>No proof attached</p>
      )}
    </section>
  );
};

const PaymentRecordModal = ({ orderId, apiBase, token, admin = false, onClose, onApprove, onReject }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const closeRef = useRef(null);
  const dialogRef = useRef(null);

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(`${apiBase}/api/${admin ? 'admin/billing' : 'billing'}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to load payment record.');
    return result;
  }, [apiBase, token, admin]);

  useEffect(() => {
    let active = true;
    api(`/orders/${orderId}`).then(result => { if (active) setData(result); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [api, orderId]);

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const keydown = event => {
      if (event.key === 'Escape' && !reviewing) onClose();
      if (event.key === 'Tab') {
        const elements = [...dialogRef.current.querySelectorAll('button:not(:disabled), a[href], input, textarea, iframe')];
        const first = elements[0]; const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus?.(); };
  }, [onClose, reviewing]);

  const review = async approve => {
    setReviewing(true); setError('');
    try { await (approve ? onApprove(data.order) : onReject(data.order, reason)); }
    catch (err) { setError(err.message); }
    finally { setReviewing(false); }
  };

  const invoiceAccess = async () => {
    const tab = window.open('', '_blank');
    if (tab) tab.opener = null;
    try {
      const response = await fetch(`${apiBase}/api/billing/invoices/${data.invoice._id}/download`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Unable to open invoice.');
      const url = URL.createObjectURL(await response.blob());
      if (tab) tab.location.href = url;
      else { URL.revokeObjectURL(url); throw new Error('Allow pop-ups to view the invoice.'); }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) { tab?.close(); setError(err.message); }
  };

  const order = data?.order;

  return (
    <div className="payment-record-overlay">
      <div ref={dialogRef} className="payment-record-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-record-title">
        <header>
          <h2 id="payment-record-title">Payment Record {order && <span style={{ color: '#64748b', fontSize: '18px', fontWeight: 600 }}>#{order.orderNumber}</span>}</h2>
          <button ref={closeRef} disabled={reviewing} onClick={onClose} className="btn-close"><XCircle size={20} /> Close</button>
        </header>

        {error && <p role="alert"><AlertCircle size={20} /> {error}</p>}
        {!data && !error && <p role="status" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading payment record…</p>}
        
        {order && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Order Item</span>
                <strong style={{ fontSize: '16px', color: '#0f172a' }}>{order.items?.[0]?.name || order.orderType}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Amount</span>
                <strong style={{ fontSize: '16px', color: '#0f172a' }}>NPR {(order.totalAmountPaisa / 100).toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Status</span>
                <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, textTransform: 'capitalize', background: order.status === 'paid' ? '#dcfce7' : order.status === 'payment_submitted' ? '#dbeafe' : '#fee2e2', color: order.status === 'paid' ? '#15803d' : order.status === 'payment_submitted' ? '#1d4ed8' : '#b91c1c' }}>
                  {order.status.replaceAll('_', ' ')}
                </span>
              </div>
              {data.lab?.labName && (
                <div>
                  <span style={{ display: 'block', fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Lab</span>
                  <strong style={{ fontSize: '16px', color: '#0f172a' }}>{data.lab.labName}</strong>
                </div>
              )}
            </div>

            <div style={{ padding: '0 4px' }}>
              <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>Payment Method</h3>
              <p><strong>Method:</strong> {order.paymentDetailsSnapshot?.name || (order.paymentMethod === 'khalti' ? 'Khalti' : 'Bank transfer')}</p>
              {order.paymentDetailsSnapshot?.accountNumber && (
                <div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>
                    <strong>Receiving Bank:</strong> {order.paymentDetailsSnapshot.bankName} <br/>
                    <strong>Holder:</strong> {order.paymentDetailsSnapshot.accountHolder} <br/>
                    <strong>Account:</strong> <span style={{ fontFamily: 'monospace' }}>{order.paymentDetailsSnapshot.accountNumber}</span> <br/>
                    <strong>Branch:</strong> {order.paymentDetailsSnapshot.branch}
                  </p>
                </div>
              )}
              
              {!admin && data.invoice && (
                <button onClick={invoiceAccess} className="btn" style={{ marginTop: '16px' }}>
                  <FileText size={16} /> View invoice {data.invoice.invoiceNumber}
                </button>
              )}
            </div>

            {!data.submissions.length && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '16px', color: '#1e293b', marginBottom: '12px' }}>Payment Information</h3>
                <p><strong>Reference:</strong> {order.paymentReference || 'Not submitted'}</p>
                {order.metadata?.paymentNote && <p><strong>Note:</strong> {order.metadata.paymentNote}</p>}
                {order.rejectionReason && <p style={{ color: '#b91c1c' }}><strong>Rejection:</strong> {order.rejectionReason}</p>}
                {/^https?:\/\//.test(order.paymentProofUrl || '') ? (
                  <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="btn" style={{ marginTop: '12px' }}>
                    <ExternalLink size={16} /> View legacy receipt
                  </a>
                ) : <p style={{ fontStyle: 'italic', color: '#94a3b8' }}>No proof attached</p>}
              </div>
            )}

            {data.submissions.map(submission => (
              <Submission key={submission._id} submission={submission} current={submission._id === order.currentPaymentSubmissionId} api={api} orderId={order._id} />
            ))}

            {admin && order.currentPaymentSubmissionId && order.status === 'payment_submitted' && (
              <section className="admin-review-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                  <CheckCircle size={20} color="#0e7c86" /> Admin Review
                </h3>
                <p style={{ fontSize: '14px' }}>Check the actual bank transfer before approving this submission.</p>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button disabled={reviewing} onClick={() => review(true)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                    Approve & Fulfill
                  </button>
                </div>
                
                <div style={{ marginTop: '24px', padding: '16px', background: '#fef2f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#991b1b', marginBottom: '8px' }}>
                    Rejection Reason
                  </label>
                  <textarea 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    maxLength={2000} 
                    placeholder="Enter reason for rejection..."
                    style={{ borderColor: '#fca5a5' }}
                  />
                  <button disabled={reviewing || !reason.trim()} onClick={() => review(false)} className="btn btn-danger" style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}>
                    Reject Submission
                  </button>
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentRecordModal;
