import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api';
import { Sparkles, Plus, Trash2, Edit, X, Search, ChevronDown, ChevronUp, Bot, BookOpen } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'cases', label: 'Cases & Production' },
  { value: 'settings', label: 'Settings & Catalog' },
  { value: 'billing', label: 'Billing & Subscriptions' },
  { value: 'clinics', label: 'Clinics & Doctors' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'general', label: 'General Features' },
];

export default function AiFeatureGuidesPage() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedGuideIds, setExpandedGuideIds] = useState(new Set());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    topicKey: '',
    title: '',
    category: 'settings',
    navigationPath: '',
    keywords: '',
    summary: '',
    instructions: '',
    isActive: true,
  });

  const fetchGuides = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await apiRequest(`/api/admin/feature-guides?${params.toString()}`);
      setGuides(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load feature guides.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);

  const toggleExpand = (id) => {
    setExpandedGuideIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleOpenCreateModal = () => {
    setEditingGuide(null);
    setFormData({
      topicKey: '',
      title: '',
      category: 'settings',
      navigationPath: '',
      keywords: '',
      summary: '',
      instructions: '',
      isActive: true,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (guide) => {
    setEditingGuide(guide);
    setFormData({
      topicKey: guide.topicKey || '',
      title: guide.title || '',
      category: guide.category || 'general',
      navigationPath: guide.navigationPath || '',
      keywords: Array.isArray(guide.keywords) ? guide.keywords.join(', ') : '',
      summary: guide.summary || '',
      instructions: guide.instructions || '',
      isActive: guide.isActive !== false,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSaveGuide = async (e) => {
    e.preventDefault();
    if (!formData.topicKey.trim() || !formData.title.trim() || !formData.summary.trim() || !formData.instructions.trim()) {
      setFormError('Topic key, title, summary, and instructions are required.');
      return;
    }

    setFormSaving(true);
    setFormError('');

    try {
      const payload = {
        ...formData,
        topicKey: formData.topicKey.trim().toLowerCase().replace(/\s+/g, '_'),
      };

      if (editingGuide) {
        await apiRequest(`/api/admin/feature-guides/${editingGuide._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/admin/feature-guides', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setShowModal(false);
      fetchGuides();
    } catch (err) {
      setFormError(err.message || 'Failed to save feature guide.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteGuide = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the guide for "${title}"? The AI assistant will no longer reference this guide.`)) {
      return;
    }

    try {
      await apiRequest(`/api/admin/feature-guides/${id}`, {
        method: 'DELETE',
      });
      fetchGuides();
    } catch (err) {
      alert(err.message || 'Failed to delete guide.');
    }
  };

  const handleToggleActive = async (guide) => {
    try {
      await apiRequest(`/api/admin/feature-guides/${guide._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !guide.isActive }),
      });
      fetchGuides();
    } catch (err) {
      alert(err.message || 'Failed to update guide status.');
    }
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-head">
        <div>
          <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Bot size={15} /> DLabMate AI Knowledge Base
          </span>
          <h1>Feature Guides & Workflows</h1>
          <p>
            Add or update guidelines for any DLabMate feature. The AI assistant references these live records whenever users ask how to use or customize platform features.
          </p>
        </div>
        <button
          type="button"
          className="primary-link"
          onClick={handleOpenCreateModal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> Add New Guideline
        </button>
      </div>

      {/* Toolbar */}
      <div className="data-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
            <div className="search-box" style={{ flex: 1 }}>
              <Search size={16} color="#708084" />
              <input
                type="text"
                placeholder="Search by title, keyword, key, or path..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ minWidth: '180px' }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: '600' }}>
            Total Guides: <strong style={{ color: 'var(--ink)' }}>{guides.length}</strong>
          </div>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {/* Loading state */}
      {loading && (
        <div className="loading-card" style={{ textAlign: 'center', padding: '36px' }}>
          <Sparkles size={24} style={{ color: 'var(--teal)', animation: 'spin 2s linear infinite' }} />
          <p style={{ marginTop: '10px', color: 'var(--muted)' }}>Loading live feature guides from database...</p>
        </div>
      )}

      {/* Guide Cards */}
      {!loading && guides.length === 0 && (
        <div className="data-panel" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <BookOpen size={36} color="var(--muted)" style={{ margin: '0 auto 12px' }} />
          <h3>No feature guidelines found</h3>
          <p style={{ color: 'var(--muted)', maxWidth: '440px', margin: '0 auto 16px' }}>
            No feature guides matched your filters. Click "Add New Guideline" to train the AI on a new feature or workflow.
          </p>
          <button type="button" className="primary-link" onClick={handleOpenCreateModal}>
            <Plus size={16} /> Add First Guideline
          </button>
        </div>
      )}

      {!loading && guides.length > 0 && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {guides.map((guide) => {
            const isExpanded = expandedGuideIds.has(guide._id);
            return (
              <div
                key={guide._id}
                className="data-panel"
                style={{
                  borderLeft: guide.isActive ? '4px solid var(--teal)' : '4px solid #94a3b8',
                  padding: '20px 24px',
                  marginBottom: 0,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>{guide.title}</h3>
                      <span
                        style={{
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          background: '#eef4f4',
                          color: '#0e7c86',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: '700',
                        }}
                      >
                        {guide.topicKey}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          textTransform: 'capitalize',
                          fontWeight: '700',
                        }}
                      >
                        {guide.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(guide)}
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          border: 0,
                          cursor: 'pointer',
                          fontWeight: '700',
                          background: guide.isActive ? '#e6f4ea' : '#f1f5f9',
                          color: guide.isActive ? '#137333' : '#64748b',
                        }}
                      >
                        {guide.isActive ? '● Active in AI' : '○ Disabled'}
                      </button>
                    </div>

                    {guide.navigationPath && (
                      <div style={{ fontSize: '13px', color: 'var(--teal-dark)', fontWeight: '700', marginBottom: '8px' }}>
                        📍 Path: <span style={{ color: 'var(--ink)' }}>{guide.navigationPath}</span>
                      </div>
                    )}

                    <p style={{ margin: '0 0 10px', fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5' }}>
                      {guide.summary}
                    </p>

                    {Array.isArray(guide.keywords) && guide.keywords.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {guide.keywords.map((kw, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '11px',
                              background: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #e2e8f0',
                              padding: '2px 7px',
                              borderRadius: '4px',
                            }}
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(guide)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--line)',
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: 'var(--ink)',
                      }}
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGuide(guide._id, guide.title)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #fee2e2',
                        background: '#fff5f5',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#b91c1c',
                      }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* Collapsible Walkthrough Instructions */}
                <div style={{ borderTop: '1px solid #edf1f1', marginTop: '12px', paddingTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(guide._id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'none',
                      border: 0,
                      color: 'var(--teal)',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    {isExpanded ? 'Hide Step-by-Step Instructions' : 'View Full Instructions Given to AI'}
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '14px 18px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        color: '#334155',
                        fontFamily: 'inherit',
                      }}
                    >
                      {guide.instructions}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="preview-overlay">
          <div className="preview-modal" style={{ width: 'min(720px, 94vw)', height: 'auto', maxHeight: '90vh' }}>
            <header>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={18} color="var(--teal)" />
                {editingGuide ? 'Edit Feature Guideline' : 'Add New Feature Guideline'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close modal">
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSaveGuide} style={{ padding: '24px', overflowY: 'auto' }}>
              {formError && <div className="form-error">{formError}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Creating Custom Materials"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: '100%', height: '42px', border: '1px solid var(--line)', borderRadius: '8px', padding: '0 12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                    Topic Key (Unique Identifier) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. custom_materials_and_worktypes"
                    value={formData.topicKey}
                    onChange={(e) => setFormData({ ...formData, topicKey: e.target.value })}
                    disabled={Boolean(editingGuide)}
                    style={{
                      width: '100%',
                      height: '42px',
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      padding: '0 12px',
                      fontFamily: 'monospace',
                      background: editingGuide ? '#f1f5f9' : '#fff',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ width: '100%', height: '42px', border: '1px solid var(--line)', borderRadius: '8px', padding: '0 12px' }}
                  >
                    <option value="cases">Cases & Production</option>
                    <option value="settings">Settings & Catalog</option>
                    <option value="billing">Billing & Subscriptions</option>
                    <option value="clinics">Clinics & Doctors</option>
                    <option value="notifications">Notifications</option>
                    <option value="general">General Features</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                    Navigation Path in Portal
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Settings -> Catalog Manager tab OR Add Case form"
                    value={formData.navigationPath}
                    onChange={(e) => setFormData({ ...formData, navigationPath: e.target.value })}
                    style={{ width: '100%', height: '42px', border: '1px solid var(--line)', borderRadius: '8px', padding: '0 12px' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  Search Keywords (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. material, worktype, peek, e-max, custom material, add worktype"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  style={{ width: '100%', height: '42px', border: '1px solid var(--line)', borderRadius: '8px', padding: '0 12px' }}
                />
                <small style={{ color: 'var(--muted)', fontSize: '12px' }}>
                  Keywords help the AI match user phrasing to this guideline.
                </small>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  High-Level Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Labs can add custom restoration materials either via Settings or on-the-fly in case forms."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  style={{ width: '100%', height: '42px', border: '1px solid var(--line)', borderRadius: '8px', padding: '0 12px' }}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  Step-by-Step Instructions & Workflow Details *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder={"1. Go to Settings -> Catalog...\n2. Type the new material name and click Add.\n3. Alternatively, type directly in the case creation dropdown."}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    fontFamily: 'inherit',
                    lineHeight: '1.5',
                    fontSize: '13px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <input
                  type="checkbox"
                  id="isActiveGuideline"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="isActiveGuideline" style={{ fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Active (Allow the AI assistant to query and reference this guide)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: '700',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="primary-link"
                  style={{ minHeight: '40px' }}
                >
                  {formSaving ? 'Saving...' : editingGuide ? 'Save Changes' : 'Create Guideline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
