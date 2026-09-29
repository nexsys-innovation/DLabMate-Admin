import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api';
import {
  Mail,
  BellRing,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Info,
  Truck,
  Receipt,
  UserCheck,
  BarChart3,
} from 'lucide-react';

export default function EmailSettingsPage() {
  const [settings, setSettings] = useState({
    welcomeEmailsEnabled: true,
    overdueEmailsEnabled: true,
    caseLifecycleEmailsEnabled: true,
    billingEmailsEnabled: true,
    verificationEmailsEnabled: true,
    weeklyDigestEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchEmailSettings = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await apiRequest('/api/admin/settings/email');
      if (res && res.data) {
        setSettings({
          welcomeEmailsEnabled: Boolean(res.data.welcomeEmailsEnabled),
          overdueEmailsEnabled: Boolean(res.data.overdueEmailsEnabled),
          caseLifecycleEmailsEnabled: Boolean(res.data.caseLifecycleEmailsEnabled ?? true),
          billingEmailsEnabled: Boolean(res.data.billingEmailsEnabled ?? true),
          verificationEmailsEnabled: Boolean(res.data.verificationEmailsEnabled ?? true),
          weeklyDigestEnabled: Boolean(res.data.weeklyDigestEnabled ?? true),
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load email settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmailSettings();
  }, [fetchEmailSettings]);

  const handleToggle = async (key, newValue) => {
    const updatedSettings = { ...settings, [key]: newValue };
    setSettings(updatedSettings);

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await apiRequest('/api/admin/settings/email', {
        method: 'PUT',
        body: JSON.stringify(updatedSettings),
      });

      if (res && res.data) {
        setSettings({
          welcomeEmailsEnabled: Boolean(res.data.welcomeEmailsEnabled),
          overdueEmailsEnabled: Boolean(res.data.overdueEmailsEnabled),
          caseLifecycleEmailsEnabled: Boolean(res.data.caseLifecycleEmailsEnabled ?? true),
          billingEmailsEnabled: Boolean(res.data.billingEmailsEnabled ?? true),
          verificationEmailsEnabled: Boolean(res.data.verificationEmailsEnabled ?? true),
          weeklyDigestEnabled: Boolean(res.data.weeklyDigestEnabled ?? true),
        });
        setSuccessMessage('Email delivery settings updated successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      // Revert local state on error
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      setErrorMessage(err.message || 'Failed to update email settings.');
    } finally {
      setSaving(false);
    }
  };

  const emailCards = [
    {
      key: 'welcomeEmailsEnabled',
      title: 'Welcome Emails',
      icon: <Mail size={24} />,
      iconBg: '#e0f2fe',
      iconColor: '#0369a1',
      description: 'Sends a branded welcome onboarding guide to dental labs and clinics immediately after they verify their email registration OTP.',
      sender: 'no-reply@dlabmate.com',
      recipient: 'New Verified Users',
      badge: 'Universal',
      details: 'Critical onboarding communication for newly verified clinic and lab partners.',
    },
    {
      key: 'overdueEmailsEnabled',
      title: 'Overdue Case Alerts',
      icon: <BellRing size={24} />,
      iconBg: '#fef3c7',
      iconColor: '#b45309',
      description: 'Global master switch for automated daily overdue case digest emails dispatched to clinics and labs.',
      sender: 'no-reply@dlabmate.com',
      recipient: 'Active Paid Subscribers',
      badge: 'Paid Subscribers Only',
      details: 'Gated feature: requires an active subscription term (Starter, Growth, or Pro). Top-up credit packs do not unlock this alert.',
    },
    {
      key: 'caseLifecycleEmailsEnabled',
      title: 'Case Lifecycle Alerts',
      icon: <Truck size={24} />,
      iconBg: '#dcfce7',
      iconColor: '#15803d',
      description: 'Instant event alerts for case creation, repeat/remake requests ($0 remake notices), and clinic dispatch notifications.',
      sender: 'no-reply@dlabmate.com',
      recipient: 'Labs & Partner Clinics',
      badge: 'Operational Triggers',
      details: 'High-value notifications informing labs of new/repeat orders and informing clinics when prosthetics are dispatched.',
    },
    {
      key: 'billingEmailsEnabled',
      title: 'Billing & Invoices',
      icon: <Receipt size={24} />,
      iconBg: '#f3e8ff',
      iconColor: '#7e22ce',
      description: 'Dispatches official VAT/PAN tax invoices, bank transfer payment receipts, and slip rejection resolution notices.',
      sender: 'billing@dlabmate.com',
      recipient: 'Dental Lab Accounts',
      badge: 'Financial & Legal',
      details: 'Official financial communications sent via dedicated billing channel with order references and downloadable receipts.',
    },
    {
      key: 'verificationEmailsEnabled',
      title: 'Compliance & Verification',
      icon: <UserCheck size={24} />,
      iconBg: '#cffafe',
      iconColor: '#0e7490',
      description: 'Sends official verification approval confirmations and document rejection reviewer feedback.',
      sender: 'support@dlabmate.com',
      recipient: 'Labs & Clinics in Review',
      badge: 'Trust & Compliance',
      details: 'Notifies organizations when their PAN/registration documents are approved or need re-uploading.',
    },
    {
      key: 'weeklyDigestEnabled',
      title: 'Weekly Executive Digest',
      icon: <BarChart3 size={24} />,
      iconBg: '#ede9fe',
      iconColor: '#6d28d9',
      description: 'Weekly Sunday executive report detailing completed cases, turnaround health, and repeat rate metrics.',
      sender: 'no-reply@dlabmate.com',
      recipient: 'Paid Lab Owners',
      badge: 'Weekly Analytics',
      details: 'Dispatched every Sunday at 08:00 AM NPT to active paid subscriber labs (Starter, Growth, Pro).',
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <span className="eyebrow">Platform Configuration</span>
          <h1>Email & Alerts Controls</h1>
          <p>Global switches to manage transactional welcome emails, case lifecycle updates, billing receipts, and analytics digests.</p>
        </div>
        <button
          type="button"
          onClick={fetchEmailSettings}
          disabled={loading || saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
            background: '#fff',
            fontWeight: '700',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {successMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 18px',
          marginBottom: '20px',
          borderRadius: '12px',
          background: '#e4f5ed',
          color: '#1a694a',
          fontWeight: '600',
          border: '1px solid #c2ebd7'
        }}>
          <CheckCircle2 size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="loading-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          Loading email configuration...
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px', maxWidth: '850px' }}>
          {emailCards.map((card) => {
            const isEnabled = Boolean(settings[card.key]);
            return (
              <div key={card.key} className="data-panel" style={{ margin: 0, padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: card.iconBg,
                      color: card.iconColor,
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}>
                      {card.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{card.title}</h3>
                        <span className={`status ${isEnabled ? 'verified' : 'rejected'}`}>
                          {isEnabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: '#f1f5f9',
                          color: '#475569'
                        }}>
                          {card.badge}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: 'var(--muted)', fontSize: '14px', lineHeight: '1.5' }}>
                        {card.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '13px', color: 'var(--muted)', flexWrap: 'wrap' }}>
                        <span>• Sender: <strong>{card.sender}</strong></span>
                        <span>• Recipient: <strong>{card.recipient}</strong></span>
                      </div>
                      <div style={{
                        marginTop: '10px',
                        padding: '8px 12px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#475569'
                      }}>
                        {card.details}
                      </div>
                    </div>
                  </div>

                  {/* Modern Toggle Switch */}
                  <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '28px', flexShrink: 0, cursor: saving ? 'not-allowed' : 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      disabled={saving}
                      onChange={(e) => handleToggle(card.key, e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: isEnabled ? '#0e7c86' : '#cbd5e1',
                      borderRadius: '34px',
                      transition: '0.3s',
                    }}>
                      <span style={{
                        position: 'absolute',
                        height: '20px',
                        width: '20px',
                        left: isEnabled ? '26px' : '4px',
                        bottom: '4px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: '0.3s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }} />
                    </span>
                  </label>
                </div>
              </div>
            );
          })}

          {/* Infrastructure & Multi-Sender Architecture Card */}
          <div className="data-panel" style={{ margin: 0, padding: '24px', background: '#fcfdfd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <ShieldCheck size={20} color="#0e7c86" />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>Email Delivery Infrastructure & Sender Routing</h4>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <div style={{ padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Primary Provider</span>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Resend API (REST)</strong>
              </div>
              <div style={{ padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>System Sender</span>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>no-reply@dlabmate.com</strong>
              </div>
              <div style={{ padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Billing Sender</span>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>billing@dlabmate.com</strong>
              </div>
              <div style={{ padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Support Sender</span>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>support@dlabmate.com</strong>
              </div>
              <div style={{ padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Domain Authentication</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#16a34a', fontWeight: '700' }}>
                  <CheckCircle2 size={14} /> SPF & DKIM Verified
                </span>
              </div>
              <div style={{ padding: '12px 14px', background: '#fff', border: '1px solid var(--line)', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>Executive Digest</span>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Sundays 08:00 AM NPT</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '12px', color: 'var(--muted)' }}>
              <Info size={14} />
              <span>Critical security emails (Registration OTP, 2FA codes, password resets) are always dispatched immediately and cannot be disabled by platform toggles.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
