import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState('leads'); // 'leads' | 'settings' | 'faqs' | 'pages' | 'plans'

  // --- LEADS STATE ---
  const [leads, setLeads] = useState([]);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [leadFilterStatus, setLeadFilterStatus] = useState('all');
  const [leadFilterType, setLeadFilterType] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [leadStatusUpdating, setLeadStatusUpdating] = useState(false);
  const [leadNotesInput, setLeadNotesInput] = useState('');

  // --- SETTINGS STATE ---
  const [settings, setSettings] = useState({
    supportEmail: '',
    infoEmail: '',
    phone: '',
    whatsappNumber: '',
    whatsappText: '',
    heroHeadline: '',
    heroSubheadline: '',
    bannerNotice: '',
    isBannerActive: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');

  // --- FAQS STATE ---
  const [faqs, setFaqs] = useState([]);
  const [faqLoading, setFaqLoading] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '', category: 'general', sortOrder: 0, isPublished: true });
  const [faqSaving, setFaqSaving] = useState(false);

  // --- PAGES CMS STATE ---
  const [pages, setPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageForm, setPageForm] = useState({ title: '', metaDescription: '', contentMarkdown: '', headline: '', body: '', mission: '' });
  const [pageEditorTab, setPageEditorTab] = useState('write'); // 'write' | 'preview'
  const [pageSaving, setPageSaving] = useState(false);
  const [pageMessage, setPageMessage] = useState('');

  // --- PLANS & TOP-UPS STATE ---
  const [plans, setPlans] = useState([]);
  const [creditPacks, setCreditPacks] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({ code: '', name: '', description: '', monthlyPriceNpr: 1899, monthlyIncludedCredits: 300, displayOrder: 1 });
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [, setEditingPlan] = useState(null);
  const [editPlanForm, setEditPlanForm] = useState({ planId: '', code: '', name: '', description: '', monthlyPriceNpr: 1899, monthlyIncludedCredits: 300, displayOrder: 1 });
  const [planSaving, setPlanSaving] = useState(false);
  const [editingCreditPack, setEditingCreditPack] = useState(null);
  const [showCreditPackModal, setShowCreditPackModal] = useState(false);
  const [creditPackForm, setCreditPackForm] = useState({ name: 'Shared Top-Up Pack', creditsPerPack: 100, priceNpr: 1000, status: 'published' });

  // Load leads
  const fetchLeads = useCallback(async () => {
    setLeadLoading(true);
    setLeadError('');
    try {
      const queryParams = new URLSearchParams();
      if (leadFilterStatus !== 'all') queryParams.append('status', leadFilterStatus);
      if (leadFilterType !== 'all') queryParams.append('type', leadFilterType);

      const data = await apiRequest(`/api/admin/marketing/leads?${queryParams.toString()}`);
      setLeads(data.data || []);
    } catch (err) {
      setLeadError(err.message || 'Failed to load leads.');
    } finally {
      setLeadLoading(false);
    }
  }, [leadFilterStatus, leadFilterType]);

  // Load site settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const data = await apiRequest('/api/admin/marketing/site');
      if (data.data) {
        setSettings(data.data);
      }
    } catch (err) {
      console.error('Failed to load site settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Load FAQs
  const fetchFaqs = useCallback(async () => {
    setFaqLoading(true);
    try {
      const data = await apiRequest('/api/admin/marketing/faqs');
      setFaqs(data.data || []);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setFaqLoading(false);
    }
  }, []);

  const selectPageForEdit = useCallback((page) => {
    setSelectedPage(page);
    setPageForm({
      title: page.title || '',
      metaDescription: page.metaDescription || '',
      contentMarkdown: page.contentMarkdown || '',
      headline: page.sections?.headline || '',
      body: page.sections?.body || '',
      mission: page.sections?.mission || '',
    });
    setPageMessage('');
  }, []);

  // Load CMS Pages
  const fetchPages = useCallback(async () => {
    setPagesLoading(true);
    try {
      const data = await apiRequest('/api/admin/marketing/pages');
      const loadedPages = data.data || [];
      setPages(loadedPages);
      if (loadedPages.length > 0 && !selectedPage) {
        selectPageForEdit(loadedPages[0]);
      }
    } catch (err) {
      console.error('Failed to load marketing pages:', err);
    } finally {
      setPagesLoading(false);
    }
  }, [selectedPage, selectPageForEdit]);

  const insertMarkdownSnippet = (snippet) => {
    setPageForm((prev) => ({
      ...prev,
      contentMarkdown: prev.contentMarkdown ? `${prev.contentMarkdown}\n${snippet}` : snippet,
    }));
  };

  // Load Plans & Top-Up Credit Packs
  const fetchPlansAndCreditPacks = useCallback(async () => {
    setPlansLoading(true);
    try {
      const [plansData, creditPacksData] = await Promise.all([
        apiRequest('/api/admin/billing/plans'),
        apiRequest('/api/admin/billing/credit-packs'),
      ]);
      setPlans(plansData.plans || []);
      setCreditPacks(creditPacksData.packs || []);
    } catch (err) {
      console.error('Failed to load subscription plans & credit packs:', err);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'leads') fetchLeads();
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'faqs') fetchFaqs();
    if (activeTab === 'pages') fetchPages();
    if (activeTab === 'plans') fetchPlansAndCreditPacks();
  }, [activeTab, fetchLeads, fetchSettings, fetchFaqs, fetchPages, fetchPlansAndCreditPacks]);

  const handleUpdateLeadStatus = async (id, status, notes) => {
    setLeadStatusUpdating(true);
    try {
      const data = await apiRequest(`/api/admin/marketing/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      });
      const updatedLead = data.data || data.lead;
      if (updatedLead) {
        setSelectedLead(updatedLead);
        setLeadNotesInput(updatedLead.notes || '');
        setLeads((prevLeads) => prevLeads.map((l) => (l._id === id ? updatedLead : l)));
      }
    } catch (err) {
      alert(err.message || 'Failed to update lead status.');
    } finally {
      setLeadStatusUpdating(false);
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry lead?')) return;
    try {
      await apiRequest(`/api/admin/marketing/leads/${id}`, { method: 'DELETE' });
      setLeads(leads.filter((l) => l._id !== id));
      if (selectedLead && selectedLead._id === id) setSelectedLead(null);
    } catch (err) {
      alert(err.message || 'Failed to delete lead.');
    }
  };

  // Settings handlers
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMessage('');
    try {
      const data = await apiRequest('/api/admin/marketing/site', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (data.data) {
        setSettings(data.data);
        setSettingsMessage('Site settings saved successfully!');
      }
    } catch (err) {
      alert(err.message || 'Failed to save site settings.');
    } finally {
      setSettingsSaving(false);
    }
  };

  // FAQ handlers
  const startEditFaq = (faq) => {
    setEditingFaq(faq);
    setFaqForm({
      question: faq.question || '',
      answer: faq.answer || '',
      category: faq.category || 'general',
      sortOrder: faq.sortOrder || 0,
      isPublished: faq.isPublished !== undefined ? faq.isPublished : true,
    });
  };

  const handleSaveFaq = async (e) => {
    e.preventDefault();
    setFaqSaving(true);
    try {
      if (editingFaq && editingFaq._id) {
        const data = await apiRequest(`/api/admin/marketing/faqs/${editingFaq._id}`, {
          method: 'PATCH',
          body: JSON.stringify(faqForm),
        });
        setFaqs(faqs.map((f) => (f._id === editingFaq._id ? data.data : f)));
      } else {
        const data = await apiRequest('/api/admin/marketing/faqs', {
          method: 'POST',
          body: JSON.stringify(faqForm),
        });
        setFaqs([...faqs, data.data]);
      }
      setEditingFaq(null);
      setFaqForm({ question: '', answer: '', category: 'general', sortOrder: 0, isPublished: true });
    } catch (err) {
      alert(err.message || 'Failed to save FAQ.');
    } finally {
      setFaqSaving(false);
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      await apiRequest(`/api/admin/marketing/faqs/${id}`, { method: 'DELETE' });
      setFaqs(faqs.filter((f) => f._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete FAQ.');
    }
  };

  // Page CMS handler
  const handleSavePageContent = async (e) => {
    e.preventDefault();
    if (!selectedPage) return;
    setPageSaving(true);
    setPageMessage('');
    try {
      const payload = {
        title: pageForm.title,
        metaDescription: pageForm.metaDescription,
        contentMarkdown: pageForm.contentMarkdown,
        sections: {
          ...selectedPage.sections,
          headline: pageForm.headline,
          body: pageForm.body,
          mission: pageForm.mission,
        },
      };
      const data = await apiRequest(`/api/admin/marketing/pages/${selectedPage.slug}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (data.data) {
        setPages(pages.map((p) => (p.slug === selectedPage.slug ? data.data : p)));
        setSelectedPage(data.data);
        setPageMessage(`Page '${data.data.title}' updated successfully!`);
      }
    } catch (err) {
      alert(err.message || 'Failed to update page content.');
    } finally {
      setPageSaving(false);
    }
  };

  // Subscription Plan handlers
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setPlanSaving(true);
    try {
      const payload = {
        code: newPlanForm.code,
        name: newPlanForm.name,
        description: newPlanForm.description,
        monthlyPricePaisa: (Number(newPlanForm.monthlyPriceNpr) || 0) * 100,
        monthlyIncludedCredits: Number(newPlanForm.monthlyIncludedCredits) || 0,
        displayOrder: Number(newPlanForm.displayOrder) || 1,
      };
      const data = await apiRequest('/api/admin/billing/plans', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data.data && data.data.version) {
        // Automatically publish the initial version
        await apiRequest(`/api/admin/billing/plans/versions/${data.data.version._id}/publish`, {
          method: 'POST',
        });
      }
      setShowNewPlanModal(false);
      setNewPlanForm({ code: '', name: '', description: '', monthlyPriceNpr: 1899, monthlyIncludedCredits: 300, displayOrder: 1 });
      fetchPlansAndCreditPacks();
    } catch (err) {
      alert(err.message || 'Failed to create plan.');
    } finally {
      setPlanSaving(false);
    }
  };

  const openEditPlanModal = (planInfo, currentVersion) => {
    setEditingPlan({ planId: planInfo._id, code: planInfo.code });
    setEditPlanForm({
      planId: planInfo._id,
      code: planInfo.code,
      name: currentVersion.name || planInfo.name || '',
      description: currentVersion.description || '',
      monthlyPriceNpr: currentVersion.monthlyPricePaisa ? currentVersion.monthlyPricePaisa / 100 : 0,
      monthlyIncludedCredits: currentVersion.monthlyIncludedCredits || 0,
      displayOrder: currentVersion.displayOrder || 1,
    });
    setShowEditPlanModal(true);
  };

  const handleSaveEditPlan = async (e) => {
    e.preventDefault();
    if (!editPlanForm.planId) return;
    setPlanSaving(true);
    try {
      const draftRes = await apiRequest(`/api/admin/billing/plans/${editPlanForm.planId}/versions`, {
        method: 'POST',
        body: JSON.stringify({
          name: editPlanForm.name,
          description: editPlanForm.description,
          monthlyPricePaisa: (Number(editPlanForm.monthlyPriceNpr) || 0) * 100,
          monthlyIncludedCredits: Number(editPlanForm.monthlyIncludedCredits) || 0,
          displayOrder: Number(editPlanForm.displayOrder) || 1,
        }),
      });

      if (draftRes.version && draftRes.version._id) {
        await apiRequest(`/api/admin/billing/plans/versions/${draftRes.version._id}/publish`, {
          method: 'POST',
        });
        alert('Subscription plan updated and published successfully!');
        setShowEditPlanModal(false);
        setEditingPlan(null);
        fetchPlansAndCreditPacks();
      }
    } catch (err) {
      alert(err.message || 'Failed to update plan version.');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleArchivePlan = async (planId, code) => {
    if (!window.confirm(`Are you sure you want to archive plan '${code}'? It will no longer be available for new subscriptions.`)) return;
    setPlanSaving(true);
    try {
      await apiRequest(`/api/admin/billing/plans/${planId}`, { method: 'DELETE' });
      alert('Plan archived successfully!');
      fetchPlansAndCreditPacks();
    } catch (err) {
      alert(err.message || 'Failed to archive plan.');
    } finally {
      setPlanSaving(false);
    }
  };

  // Credit Pack handlers
  const handleSaveCreditPack = async (e) => {
    e.preventDefault();
    setPlanSaving(true);
    try {
      const code = editingCreditPack?.code || creditPackForm.code || creditPackForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') || `pack_${Date.now()}`;
      const payload = {
        code,
        name: creditPackForm.name,
        creditsPerPack: Number(creditPackForm.creditsPerPack) || 100,
        pricePaisa: (Number(creditPackForm.priceNpr) || 0) * 100,
        status: creditPackForm.status,
      };

      if (editingCreditPack && editingCreditPack._id) {
        await apiRequest(`/api/admin/billing/credit-packs/${editingCreditPack._id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/admin/billing/credit-packs', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowCreditPackModal(false);
      setEditingCreditPack(null);
      setCreditPackForm({ name: 'Shared Top-Up Pack', creditsPerPack: 100, priceNpr: 1000, status: 'published' });
      fetchPlansAndCreditPacks();
    } catch (err) {
      alert(err.message || 'Failed to save credit pack.');
    } finally {
      setPlanSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="page-header">
        <div>
          <h2>Marketing & Billing Content Management</h2>
          <p className="subtitle">Manage website leads, site settings, FAQs, CMS pages, subscription plans, and top-up credit packs directly from MongoDB.</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('leads')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: activeTab === 'leads' ? '#0E7C86' : '#F1F5F9',
            color: activeTab === 'leads' ? '#FFFFFF' : '#475569',
          }}
        >
          Enquiries & Leads ({leads.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: activeTab === 'settings' ? '#0E7C86' : '#F1F5F9',
            color: activeTab === 'settings' ? '#FFFFFF' : '#475569',
          }}
        >
          Site Settings & Banner
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('faqs')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: activeTab === 'faqs' ? '#0E7C86' : '#F1F5F9',
            color: activeTab === 'faqs' ? '#FFFFFF' : '#475569',
          }}
        >
          FAQs Management
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pages')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: activeTab === 'pages' ? '#0E7C86' : '#F1F5F9',
            color: activeTab === 'pages' ? '#FFFFFF' : '#475569',
          }}
        >
          Pages CMS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('plans')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontWeight: '600',
            cursor: 'pointer',
            backgroundColor: activeTab === 'plans' ? '#0E7C86' : '#F1F5F9',
            color: activeTab === 'plans' ? '#FFFFFF' : '#475569',
          }}
        >
          Plans & Credit Top-Ups
        </button>
      </div>

      {/* --- TAB 1: LEADS --- */}
      {activeTab === 'leads' && (
        <section className="data-panel">
          <div className="table-tools" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', marginRight: '6px' }}>Status:</label>
              <select value={leadFilterStatus} onChange={(e) => setLeadFilterStatus(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="closed">Closed</option>
                <option value="spam">Spam</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', marginRight: '6px' }}>Type:</label>
              <select value={leadFilterType} onChange={(e) => setLeadFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="demo">Demo Request</option>
                <option value="contact">Contact Enquiry</option>
                <option value="pricing">Pricing</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>

          {leadError && <div className="form-error" style={{ color: '#E53E3E', margin: '12px 0' }}>{leadError}</div>}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Organization</th>
                  <th>Contact Email / Phone</th>
                  <th>Audience</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leadLoading ? (
                  <tr>
                    <td colSpan="8" className="empty">Loading enquiries...</td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty">No marketing enquiries found matching filters.</td>
                  </tr>
                ) : (
                  leads.map((item) => (
                    <tr key={item._id}>
                      <td><strong>{item.name}</strong></td>
                      <td>{item.organization || '—'}</td>
                      <td>
                        <div>{item.email}</div>
                        {item.phone && <small style={{ color: '#64748B' }}>{item.phone}</small>}
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize' }}>{item.audience}</span>
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: item.type === 'demo' ? '#E0F2FE' : '#F3E8FF',
                          color: item.type === 'demo' ? '#0369A1' : '#6B21A8',
                        }}>
                          {item.type ? item.type.toUpperCase() : 'DEMO'}
                        </span>
                      </td>
                      <td>
                        <select
                          value={item.status || 'new'}
                          onChange={(e) => handleUpdateLeadStatus(item._id, e.target.value, item.notes)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: '1px solid #CBD5E1',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="closed">Closed</option>
                          <option value="spam">Spam</option>
                        </select>
                      </td>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLead(item);
                            setLeadNotesInput(item.notes || '');
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: '1px solid #0E7C86',
                            color: '#0E7C86',
                            backgroundColor: '#FFFFFF',
                            cursor: 'pointer',
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* --- LEAD DETAIL MODAL --- */}
      {selectedLead && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            padding: '24px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
                Enquiry Details
              </h2>
              <button type="button" onClick={() => setSelectedLead(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '14px' }}>
              <div><strong>Name:</strong> {selectedLead.name}</div>
              <div><strong>Organization:</strong> {selectedLead.organization || '—'}</div>
              <div><strong>Email:</strong> <a href={`mailto:${selectedLead.email}`}>{selectedLead.email}</a></div>
              <div><strong>Phone:</strong> {selectedLead.phone ? <a href={`tel:${selectedLead.phone}`}>{selectedLead.phone}</a> : '—'}</div>
              <div><strong>Audience:</strong> {selectedLead.audience}</div>
              <div><strong>Preferred Contact:</strong> {selectedLead.preferredContact}</div>
              <div><strong>Type:</strong> {selectedLead.type}</div>
              <div><strong>Source Path:</strong> {selectedLead.sourcePath}</div>
              <div><strong>Submitted At:</strong> {new Date(selectedLead.createdAt).toLocaleString()}</div>
            </div>

            {selectedLead.message && (
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Message:</strong>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: '13px', lineHeight: '1.5' }}>
                  {selectedLead.message}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Internal Admin Notes:</strong>
              <textarea
                value={leadNotesInput}
                onChange={(e) => setLeadNotesInput(e.target.value)}
                placeholder="Add notes about follow-up calls or status updates..."
                style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleDeleteLead(selectedLead._id)}
                style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: '600', cursor: 'pointer' }}
              >
                Delete Enquiry
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateLeadStatus(selectedLead._id, selectedLead.status, leadNotesInput)}
                  disabled={leadStatusUpdating}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0E7C86', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
                >
                  {leadStatusUpdating ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: SITE SETTINGS & BANNER --- */}
      {activeTab === 'settings' && (
        <section className="data-panel" style={{ padding: '24px', maxWidth: '700px' }}>
          {settingsLoading ? (
            <p>Loading settings...</p>
          ) : (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {settingsMessage && (
                <div style={{ padding: '10px', backgroundColor: '#DEF7EC', color: '#03543F', borderRadius: '6px', fontWeight: '600' }}>
                  {settingsMessage}
                </div>
              )}

              <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', margin: 0 }}>
                Public Contact Details
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Info Email</label>
                  <input
                    type="email"
                    value={settings.infoEmail}
                    onChange={(e) => setSettings({ ...settings, infoEmail: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Support Email</label>
                  <input
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Phone Number</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>WhatsApp Number (digits)</label>
                  <input
                    type="text"
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', margin: '16px 0 0 0' }}>
                Hero & Announcement Content
              </h3>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Hero Headline</label>
                <input
                  type="text"
                  value={settings.heroHeadline}
                  onChange={(e) => setSettings({ ...settings, heroHeadline: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Hero Subheadline</label>
                <textarea
                  value={settings.heroSubheadline}
                  onChange={(e) => setSettings({ ...settings, heroSubheadline: e.target.value })}
                  style={{ width: '100%', minHeight: '60px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Top Announcement Banner Notice (Optional)</label>
                <input
                  type="text"
                  value={settings.bannerNotice}
                  onChange={(e) => setSettings({ ...settings, bannerNotice: e.target.value })}
                  placeholder="e.g. Special onboarding trial for labs in Nepal!"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="isBannerActive"
                  checked={settings.isBannerActive}
                  onChange={(e) => setSettings({ ...settings, isBannerActive: e.target.checked })}
                />
                <label htmlFor="isBannerActive" style={{ fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Enable top announcement banner on marketing website
                </label>
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                style={{
                  marginTop: '12px',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0E7C86',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  cursor: 'pointer',
                  width: 'fit-content',
                }}
              >
                {settingsSaving ? 'Saving...' : 'Save Site Settings'}
              </button>
            </form>
          )}
        </section>
      )}

      {/* --- TAB 3: FAQS CMS --- */}
      {activeTab === 'faqs' && (
        <section className="data-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Website FAQs</h3>
            <button
              type="button"
              onClick={() => {
                setEditingFaq({});
                setFaqForm({ question: '', answer: '', category: 'general', sortOrder: 0, isPublished: true });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0E7C86',
                color: '#FFFFFF',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} /> Add New FAQ
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Category</th>
                  <th>Question</th>
                  <th>Answer Excerpt</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqLoading ? (
                  <tr>
                    <td colSpan="6" className="empty">Loading FAQs...</td>
                  </tr>
                ) : faqs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty">No FAQs added yet. Click "Add New FAQ" to create one.</td>
                  </tr>
                ) : (
                  faqs.map((faq) => (
                    <tr key={faq._id}>
                      <td>{faq.sortOrder}</td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontSize: '12px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#F1F5F9' }}>
                          {faq.category}
                        </span>
                      </td>
                      <td><strong>{faq.question}</strong></td>
                      <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {faq.answer}
                      </td>
                      <td>
                        {faq.isPublished ? (
                          <span style={{ color: '#059669', fontWeight: '600', fontSize: '12px' }}>Published</span>
                        ) : (
                          <span style={{ color: '#94A3B8', fontWeight: '600', fontSize: '12px' }}>Draft</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => startEditFaq(faq)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#0E7C86' }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFaq(faq._id)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#DC2626' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* FAQ Edit/Create Form Modal */}
          {editingFaq !== null && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '550px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                    {editingFaq._id ? 'Edit FAQ' : 'Add New FAQ'}
                  </h3>
                  <button type="button" onClick={() => setEditingFaq(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveFaq} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Category</label>
                    <select
                      value={faqForm.category}
                      onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    >
                      <option value="general">General</option>
                      <option value="lab">For Labs</option>
                      <option value="clinic">For Clinics</option>
                      <option value="pricing">Pricing</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Question</label>
                    <input
                      type="text"
                      value={faqForm.question}
                      onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                      placeholder="e.g. Can clinics see case progress in real-time?"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Answer</label>
                    <textarea
                      value={faqForm.answer}
                      onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                      placeholder="Enter the detailed answer..."
                      style={{ width: '100%', minHeight: '100px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Sort Order</label>
                      <input
                        type="number"
                        value={faqForm.sortOrder}
                        onChange={(e) => setFaqForm({ ...faqForm, sortOrder: parseInt(e.target.value, 10) || 0 })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={faqForm.isPublished}
                          onChange={(e) => setFaqForm({ ...faqForm, isPublished: e.target.checked })}
                        />
                        Published
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setEditingFaq(null)}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={faqSaving}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0E7C86', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {faqSaving ? 'Saving...' : 'Save FAQ'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {/* --- TAB 4: PAGES CMS --- */}
      {activeTab === 'pages' && (
        <section className="data-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px' }}>
            {/* Page Sidebar Selector */}
            <div style={{ borderRight: '1px solid #E2E8F0', paddingRight: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#1E293B' }}>
                CMS Pages
              </h3>
              {pagesLoading ? (
                <p style={{ fontSize: '13px', color: '#64748B' }}>Loading pages...</p>
              ) : pages.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#64748B' }}>No pages found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {pages.map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => selectPageForEdit(p)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: selectedPage?.slug === p.slug ? '1px solid #0E7C86' : '1px solid #E2E8F0',
                        backgroundColor: selectedPage?.slug === p.slug ? '#F0FDFA' : '#FFFFFF',
                        color: selectedPage?.slug === p.slug ? '#0E7C86' : '#334155',
                        fontWeight: selectedPage?.slug === p.slug ? '700' : '500',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ textTransform: 'capitalize', fontWeight: '700' }}>/{p.slug}</div>
                      <small style={{ color: '#64748B', display: 'block' }}>{p.title}</small>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Page Editor Form */}
            <div>
              {selectedPage ? (
                <form onSubmit={handleSavePageContent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                      Editing Page: <span style={{ color: '#0E7C86' }}>/{selectedPage.slug}</span>
                    </h3>
                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: '600' }}>
                      Published
                    </span>
                  </div>

                  {pageMessage && (
                    <div style={{ padding: '10px 14px', backgroundColor: '#DEF7EC', color: '#03543F', borderRadius: '6px', fontWeight: '600', fontSize: '13px' }}>
                      {pageMessage}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600' }}>Page Title</label>
                        <span style={{ fontSize: '11px', color: '#0E7C86', backgroundColor: '#E0F2FE', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                          📍 Website Tab & Hero Badge
                        </span>
                      </div>
                      <input
                        type="text"
                        value={pageForm.title}
                        onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                        required
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600' }}>Meta Description (SEO)</label>
                        <span style={{ fontSize: '11px', color: '#475569', backgroundColor: '#F1F5F9', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                          🔍 Google Search Snippet
                        </span>
                      </div>
                      <input
                        type="text"
                        value={pageForm.metaDescription}
                        onChange={(e) => setPageForm({ ...pageForm, metaDescription: e.target.value })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                      />
                    </div>
                  </div>

                  {/* Check if page uses Markdown (privacy & terms) vs Structured Copy (about, features, for-labs, for-clinics) */}
                  {['privacy', 'terms'].includes(selectedPage.slug) ? (
                    <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: '8px 12px', borderBottom: '1px solid #CBD5E1' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontWeight: '700', fontSize: '13px', color: '#1E293B' }}>Markdown / Markup Editor (Privacy & Terms)</span>
                          <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                            <button
                              type="button"
                              onClick={() => setPageEditorTab('write')}
                              style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: pageEditorTab === 'write' ? '#0E7C86' : '#FFFFFF',
                                color: pageEditorTab === 'write' ? '#FFFFFF' : '#64748B',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              Write
                            </button>
                            <button
                              type="button"
                              onClick={() => setPageEditorTab('preview')}
                              style={{
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: pageEditorTab === 'preview' ? '#0E7C86' : '#FFFFFF',
                                color: pageEditorTab === 'preview' ? '#FFFFFF' : '#64748B',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              Live Preview
                            </button>
                          </div>
                        </div>

                        {/* Formatting Helper Buttons */}
                        {pageEditorTab === 'write' && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => insertMarkdownSnippet('# Heading 1')} style={{ padding: '2px 6px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>H1</button>
                            <button type="button" onClick={() => insertMarkdownSnippet('## Section Heading')} style={{ padding: '2px 6px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>H2</button>
                            <button type="button" onClick={() => insertMarkdownSnippet('### Subheading')} style={{ padding: '2px 6px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>H3</button>
                            <button type="button" onClick={() => insertMarkdownSnippet('**Bold Text**')} style={{ padding: '2px 6px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>Bold</button>
                            <button type="button" onClick={() => insertMarkdownSnippet('*Italic Text*')} style={{ padding: '2px 6px', fontSize: '11px', fontStyle: 'italic', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>Italic</button>
                            <button type="button" onClick={() => insertMarkdownSnippet('<span style="font-size: 18px; color: #0E7C86;">Custom Font Size</span>')} style={{ padding: '2px 6px', fontSize: '11px', fontWeight: '600', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>Font Size</button>
                            <button type="button" onClick={() => insertMarkdownSnippet('- List Item 1\n- List Item 2')} style={{ padding: '2px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>List</button>
                            <button type="button" onClick={() => insertMarkdownSnippet('[Link Text](https://dlabmate.com)')} style={{ padding: '2px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>Link</button>
                            <button type="button" onClick={() => insertMarkdownSnippet('> Callout notice box')} style={{ padding: '2px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>Quote</button>
                            <button type="button" onClick={() => insertMarkdownSnippet('---')} style={{ padding: '2px 6px', fontSize: '11px', borderRadius: '4px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}>Divider</button>
                          </div>
                        )}
                      </div>

                      {pageEditorTab === 'write' ? (
                        <textarea
                          value={pageForm.contentMarkdown}
                          onChange={(e) => setPageForm({ ...pageForm, contentMarkdown: e.target.value })}
                          placeholder="# Page Title\n\nWrite markdown content here..."
                          style={{
                            width: '100%',
                            minHeight: '340px',
                            padding: '12px 14px',
                            border: 'none',
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            lineHeight: '1.6',
                            resize: 'vertical',
                            outline: 'none',
                            backgroundColor: '#FFFFFF',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            padding: '20px',
                            minHeight: '340px',
                            backgroundColor: '#FFFFFF',
                            overflowY: 'auto',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: '#334155',
                          }}
                        >
                          {pageForm.contentMarkdown ? (
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                              {pageForm.contentMarkdown}
                            </ReactMarkdown>
                          ) : (
                            <em style={{ color: '#94A3B8' }}>No markdown content entered yet. Switch to 'Write' to enter page content.</em>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Structured Copy View for About, Features, For Labs, For Clinics */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '13px', fontWeight: '600' }}>Hero Section Headline (H1)</label>
                          <span style={{ fontSize: '11px', color: '#0E7C86', backgroundColor: '#E0F2FE', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                            📍 Main Hero Heading on /{selectedPage.slug}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={pageForm.headline}
                          onChange={(e) => setPageForm({ ...pageForm, headline: e.target.value })}
                          placeholder="e.g. Built for Nepal's Dental Industry"
                          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <label style={{ fontSize: '13px', fontWeight: '600' }}>Main Lead Paragraph</label>
                          <span style={{ fontSize: '11px', color: '#0E7C86', backgroundColor: '#E0F2FE', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                            📍 Lead Subheadline beneath H1 Hero
                          </span>
                        </div>
                        <textarea
                          value={pageForm.body}
                          onChange={(e) => setPageForm({ ...pageForm, body: e.target.value })}
                          placeholder="Introductory text describing the platform..."
                          style={{ width: '100%', minHeight: '100px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px', lineHeight: '1.5' }}
                        />
                      </div>

                      {selectedPage.slug === 'about' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <label style={{ fontSize: '13px', fontWeight: '600' }}>Our Mission Statement</label>
                            <span style={{ fontSize: '11px', color: '#0E7C86', backgroundColor: '#E0F2FE', padding: '1px 6px', borderRadius: '4px', fontWeight: '600' }}>
                              📍 Highlighted Green Mission Box on /about
                            </span>
                          </div>
                          <textarea
                            value={pageForm.mission}
                            onChange={(e) => setPageForm({ ...pageForm, mission: e.target.value })}
                            placeholder="Our mission statement..."
                            style={{ width: '100%', minHeight: '70px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '13px' }}
                          />
                        </div>
                      )}

                      {/* Live Marketing Web Preview Card */}
                      <div style={{ border: '1px dashed #0E7C86', borderRadius: '8px', padding: '16px', backgroundColor: '#F0FDFA', marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', tracking: '1px', fontWeight: '800', color: '#0E7C86', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🌐 LIVE MARKETING WEBSITE PREVIEW ( how /{selectedPage.slug} will render )</span>
                        </div>
                        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '16px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
                          <span style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: '#0E7C86', backgroundColor: '#CCFBF1', padding: '2px 8px', borderRadius: '12px' }}>
                            {pageForm.title || selectedPage.title}
                          </span>
                          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A', marginTop: '10px', marginBottom: '8px', lineHeight: '1.3' }}>
                            {pageForm.headline || 'Section Headline'}
                          </h2>
                          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
                            {pageForm.body || 'Main lead body text will appear here...'}
                          </p>

                          {selectedPage.slug === 'about' && pageForm.mission && (
                            <div style={{ marginTop: '14px', padding: '12px', borderRadius: '6px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '700', color: '#065F46' }}>OUR MISSION</h4>
                              <p style={{ margin: 0, fontSize: '12px', color: '#047857' }}>{pageForm.mission}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={pageSaving}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#0E7C86',
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      width: 'fit-content',
                    }}
                  >
                    {pageSaving ? 'Saving Content...' : 'Save Page Content'}
                  </button>
                </form>
              ) : (
                <p style={{ color: '#64748B' }}>Select a page from the left to edit its content.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* --- TAB 5: PLANS & CREDIT TOP-UPS --- */}
      {activeTab === 'plans' && (
        <section className="data-panel" style={{ padding: '24px' }}>
          {/* Subscription Plans Section */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Subscription Plans Catalog</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>Manage platform monthly subscription tiers, NPR pricing, and monthly case credit quotas.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPlanModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0E7C86',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Create New Plan
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Plan Name</th>
                    <th>Monthly Price (NPR)</th>
                    <th>Included Credits</th>
                    <th>Display Order</th>
                    <th>Active Version</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plansLoading ? (
                    <tr>
                      <td colSpan="7" className="empty">Loading subscription plans...</td>
                    </tr>
                  ) : plans.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty">No subscription plans found. Click "Create New Plan" to add one.</td>
                    </tr>
                  ) : (
                    plans.map((item) => {
                      const ver = item.activeVersion || item.versions?.[0] || {};
                      const planInfo = item.plan || item;
                      const priceNpr = ver.monthlyPricePaisa ? (ver.monthlyPricePaisa / 100).toLocaleString() : '0';
                      return (
                        <tr key={planInfo._id || planInfo.code}>
                          <td><code>{planInfo.code}</code></td>
                          <td><strong>{ver.name || planInfo.name}</strong></td>
                          <td><strong style={{ color: '#0E7C86' }}>NPR {priceNpr}</strong> / mo</td>
                          <td>{ver.monthlyIncludedCredits || 0} credits</td>
                          <td>{ver.displayOrder || 1}</td>
                          <td>
                            {planInfo.isArchived ? (
                              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#FEE2E2', color: '#991B1B', fontWeight: '600' }}>
                                Archived
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: ver.status === 'draft' ? '#FEF3C7' : '#DCFCE7',
                                color: ver.status === 'draft' ? '#92400E' : '#166534',
                                fontWeight: '600'
                              }}>
                                v{ver.version || 1} ({ver.status ? (ver.status.charAt(0).toUpperCase() + ver.status.slice(1)) : 'Published'})
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                type="button"
                                onClick={() => openEditPlanModal(planInfo, ver)}
                                disabled={planInfo.isArchived || planSaving}
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '12px',
                                  borderRadius: '4px',
                                  border: '1px solid #0E7C86',
                                  backgroundColor: '#FFFFFF',
                                  color: '#0E7C86',
                                  fontWeight: '600',
                                  cursor: planInfo.isArchived ? 'not-allowed' : 'pointer',
                                  opacity: planInfo.isArchived ? 0.5 : 1,
                                }}
                              >
                                Edit Price / Version
                              </button>
                              {!planInfo.isArchived && (
                                <button
                                  type="button"
                                  onClick={() => handleArchivePlan(planInfo._id, planInfo.code)}
                                  disabled={planSaving}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    borderRadius: '4px',
                                    border: '1px solid #EF4444',
                                    backgroundColor: '#FFFFFF',
                                    color: '#EF4444',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Credit Top-Up Packs Section */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Pay-As-You-Go Credit Top-Up Packs</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>Add or edit extra case credit top-up packages that labs can purchase anytime.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCreditPack({});
                  setCreditPackForm({ name: 'Shared Top-Up Pack', creditsPerPack: 100, priceNpr: 1000, status: 'published' });
                  setShowCreditPackModal(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0E7C86',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} /> Add Credit Pack
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Pack Name</th>
                    <th>Credits Granted</th>
                    <th>Pack Price (NPR)</th>
                    <th>Price Per Credit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plansLoading ? (
                    <tr>
                      <td colSpan="6" className="empty">Loading credit packs...</td>
                    </tr>
                  ) : creditPacks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty">No credit packs available. Click "Add Credit Pack" to create one.</td>
                    </tr>
                  ) : (
                    creditPacks.map((item) => {
                      const ver = item.activeVersion || item.versions?.[0] || item;
                      const packId = item._id || ver.packId;
                      const versionId = ver._id || packId;
                      const name = ver.name || item.name || 'Credit Pack';
                      const creditsPerPack = ver.creditsPerPack !== undefined ? ver.creditsPerPack : (item.creditsPerPack || 100);
                      const pricePaisa = ver.pricePaisa !== undefined ? ver.pricePaisa : (item.pricePaisa || 0);
                      const priceNpr = pricePaisa ? pricePaisa / 100 : 0;
                      const costPerCredit = creditsPerPack ? (priceNpr / creditsPerPack).toFixed(2) : '0.00';
                      const status = ver.status || item.status || (item.isArchived ? 'retired' : 'published');
                      return (
                        <tr key={item._id || versionId || item.code}>
                          <td>
                            <strong>{name}</strong>
                            {item.code && <code style={{ fontSize: '11px', color: '#64748B', marginLeft: '6px' }}>({item.code})</code>}
                          </td>
                          <td><strong>{creditsPerPack}</strong> credits</td>
                          <td><strong style={{ color: '#0E7C86' }}>NPR {priceNpr.toLocaleString()}</strong></td>
                          <td>NPR {costPerCredit} / credit</td>
                          <td>
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '600',
                              backgroundColor: status === 'published' ? '#DCFCE7' : status === 'draft' ? '#FEF3C7' : '#F1F5F9',
                              color: status === 'published' ? '#166534' : status === 'draft' ? '#92400E' : '#64748B',
                            }}>
                              {status.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCreditPack({ _id: versionId, packId, code: item.code });
                                setCreditPackForm({
                                  name: name,
                                  creditsPerPack: creditsPerPack,
                                  priceNpr: priceNpr,
                                  status: status,
                                });
                                setShowCreditPackModal(true);
                              }}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: '#0E7C86',
                              }}
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Subscription Plan Modal */}
          {showNewPlanModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '500px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Create New Subscription Plan</h3>
                  <button type="button" onClick={() => setShowNewPlanModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Plan Code (slug, e.g. starter, growth, pro)</label>
                    <input
                      type="text"
                      value={newPlanForm.code}
                      onChange={(e) => setNewPlanForm({ ...newPlanForm, code: e.target.value })}
                      placeholder="e.g. enterprise"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Plan Name</label>
                    <input
                      type="text"
                      value={newPlanForm.name}
                      onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })}
                      placeholder="e.g. Enterprise Plan"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                    <textarea
                      value={newPlanForm.description}
                      onChange={(e) => setNewPlanForm({ ...newPlanForm, description: e.target.value })}
                      placeholder="Plan features and target lab size..."
                      style={{ width: '100%', minHeight: '60px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Monthly Price (NPR)</label>
                      <input
                        type="number"
                        value={newPlanForm.monthlyPriceNpr}
                        onChange={(e) => setNewPlanForm({ ...newPlanForm, monthlyPriceNpr: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Included Monthly Credits</label>
                      <input
                        type="number"
                        value={newPlanForm.monthlyIncludedCredits}
                        onChange={(e) => setNewPlanForm({ ...newPlanForm, monthlyIncludedCredits: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowNewPlanModal(false)}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={planSaving}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0E7C86', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {planSaving ? 'Creating...' : 'Create & Publish Plan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Subscription Plan Modal */}
          {showEditPlanModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '520px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Edit Subscription Plan</h3>
                  <button type="button" onClick={() => setShowEditPlanModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditPlan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Plan Code</label>
                    <input
                      type="text"
                      value={editPlanForm.code}
                      disabled
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#64748B' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Plan Name</label>
                    <input
                      type="text"
                      value={editPlanForm.name}
                      onChange={(e) => setEditPlanForm({ ...editPlanForm, name: e.target.value })}
                      placeholder="e.g. Growth Plan"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
                    <textarea
                      value={editPlanForm.description}
                      onChange={(e) => setEditPlanForm({ ...editPlanForm, description: e.target.value })}
                      placeholder="Plan details..."
                      style={{ width: '100%', minHeight: '60px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Monthly Price (NPR)</label>
                      <input
                        type="number"
                        value={editPlanForm.monthlyPriceNpr}
                        onChange={(e) => setEditPlanForm({ ...editPlanForm, monthlyPriceNpr: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Included Monthly Credits</label>
                      <input
                        type="number"
                        value={editPlanForm.monthlyIncludedCredits}
                        onChange={(e) => setEditPlanForm({ ...editPlanForm, monthlyIncludedCredits: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Display Order</label>
                    <input
                      type="number"
                      value={editPlanForm.displayOrder}
                      onChange={(e) => setEditPlanForm({ ...editPlanForm, displayOrder: Number(e.target.value) || 1 })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowEditPlanModal(false)}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={planSaving}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0E7C86', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {planSaving ? 'Saving...' : 'Save & Publish Version'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Credit Pack Modal */}
          {showCreditPackModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '480px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
                    {editingCreditPack?._id ? 'Edit Credit Top-Up Pack' : 'Add New Credit Top-Up Pack'}
                  </h3>
                  <button type="button" onClick={() => setShowCreditPackModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveCreditPack} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Pack Display Name</label>
                    <input
                      type="text"
                      value={creditPackForm.name}
                      onChange={(e) => setCreditPackForm({ ...creditPackForm, name: e.target.value })}
                      placeholder="e.g. Shared Top-Up Pack"
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Credits Per Pack</label>
                      <input
                        type="number"
                        value={creditPackForm.creditsPerPack}
                        onChange={(e) => setCreditPackForm({ ...creditPackForm, creditsPerPack: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Price (NPR)</label>
                      <input
                        type="number"
                        value={creditPackForm.priceNpr}
                        onChange={(e) => setCreditPackForm({ ...creditPackForm, priceNpr: Number(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>Status</label>
                    <select
                      value={creditPackForm.status}
                      onChange={(e) => setCreditPackForm({ ...creditPackForm, status: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    >
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreditPackModal(false)}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={planSaving}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0E7C86', color: '#FFFFFF', fontWeight: '600', cursor: 'pointer' }}
                    >
                      {planSaving ? 'Saving...' : 'Save Credit Pack'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
