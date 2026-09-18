import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, XCircle, Clock, Search, RefreshCw } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const BillingOrdersQueuePage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('payment_submitted');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [feedback, setFeedback] = useState(null);

  const token = localStorage.getItem('adminToken');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/api/admin/billing/orders${filterStatus ? `?status=${filterStatus}` : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Failed to fetch billing orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const handleVerify = async (orderId) => {
    if (!window.confirm("Confirm payment verification and fulfill subscription/credits for this lab?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/billing/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: "Verified by Admin" }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Order ${data.order.orderNumber} verified and fulfilled!` });
        fetchOrders();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to verify payment.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Error verifying payment.' });
    }
  };

  const handleReject = async (orderId) => {
    if (!rejectReason.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/billing/orders/${orderId}/reject-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: 'success', message: `Payment reference rejected.` });
        setRejectingId(null);
        setRejectReason('');
        fetchOrders();
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to reject payment.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Error rejecting payment.' });
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>Billing & Payment Queue</h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '14px' }}>Verify payment references and activate subscriptions. Khalti payments are auto-verified.</p>
        </div>
        <button
          onClick={fetchOrders}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
        >
          <RefreshCw size={16} /> Refresh Queue
        </button>
      </div>

      {feedback && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', background: feedback.type === 'success' ? '#dcfce7' : '#fee2e2', color: feedback.type === 'success' ? '#166534' : '#991b1b', display: 'flex', justifyContent: 'space-between' }}>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['payment_submitted', 'pending_payment', 'paid', 'payment_failed', ''].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              padding: '8px 16px',
              borderRadius: '999px',
              border: '1px solid',
              borderColor: filterStatus === st ? '#2563eb' : '#cbd5e1',
              background: filterStatus === st ? '#2563eb' : '#ffffff',
              color: filterStatus === st ? '#ffffff' : '#475569',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {st ? st.replace('_', ' ').toUpperCase() : 'ALL ORDERS'}
          </button>
        ))}
      </div>

      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
              <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Order No</th>
              <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Dental Lab</th>
              <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Order Item</th>
              <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Amount</th>
              <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Payment Ref</th>
              <th style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>Loading billing queue...</td></tr>
            ) : orders.length ? (
              orders.map((ord) => (
                <tr key={ord._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, whiteSpace: 'nowrap' }}>{ord.orderNumber}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{ord.labId?.labName || 'Lab'}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>PAN: {ord.labId?.panNumber || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{ord.items?.[0]?.name || ord.orderType}</td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700 }}>NPR {(ord.totalAmountPaisa / 100).toLocaleString()}</div>
                    {(ord.prorationDiscountPaisa > 0 || ord.discountPaisa > 0) && (
                      <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>
                        Discount: -NPR {((ord.prorationDiscountPaisa || ord.discountPaisa) / 100).toLocaleString()} ({ord.remainingCreditsDiscounted || ord.metadata?.remainingCreditsDiscounted || 0} credits)
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '1px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: ord.paymentMethod === 'khalti' ? '#E0E7FF' : '#FEF3C7',
                        color: ord.paymentMethod === 'khalti' ? '#3730A3' : '#92400E',
                        marginBottom: '2px',
                      }}>
                        {ord.paymentMethod === 'khalti' ? '⚡ Khalti' : ord.paymentMethod === 'manual_bank_qr' ? '🏦 Bank QR' : (ord.paymentMethod || 'Manual').toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: '#1d4ed8' }}>{ord.paymentReference || 'N/A'}</div>
                    {ord.metadata?.paymentNote && <div style={{ fontSize: '12px', color: '#64748b' }}>{ord.metadata.paymentNote}</div>}
                    {ord.paymentMethod === 'khalti' && ord.metadata?.khaltiPidx && <div style={{ fontSize: '11px', color: '#94a3b8' }}>PIDX: {ord.metadata.khaltiPidx.slice(0, 12)}...</div>}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '2px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: ord.status === 'paid' ? '#dcfce7' : ord.status === 'payment_submitted' ? '#dbeafe' : '#fee2e2',
                      color: ord.status === 'paid' ? '#15803d' : ord.status === 'payment_submitted' ? '#1d4ed8' : '#b91c1c',
                    }}>{ord.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {ord.status === 'payment_submitted' || ord.status === 'pending_payment' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => handleVerify(ord._id)}
                          style={{
                            padding: '6px 12px',
                            background: ord.paymentMethod === 'khalti' ? '#4338CA' : '#16a34a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ord.paymentMethod === 'khalti' ? '⚡ Re-verify Khalti' : 'Approve & Fulfill'}
                        </button>
                        <button
                          onClick={() => setRejectingId(ord._id)}
                          style={{ padding: '6px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '12px', whiteSpace: 'nowrap' }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>Processed</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No billing orders found for filter status.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', maxWidth: '400px', width: '100%' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>Reject Payment Reference</h3>
            <textarea
              placeholder="Enter reason for rejection (e.g. Reference not found in bank statement)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setRejectingId(null)} style={{ padding: '8px 16px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleReject(rejectingId)} disabled={!rejectReason.trim()} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Confirm Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingOrdersQueuePage;
