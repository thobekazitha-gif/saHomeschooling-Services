// frontend/src/pages/ClientDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ProfileSection from '../components/client/ProfileSection';
import ServiceItem from '../components/client/ServiceItem';
import PlanSelector from '../components/client/PlanSelector';
import TagsInput from '../components/client/TagsInput';
import { PLAN_LIMITS, DAYS_OF_WEEK, PRICING_MODELS, PROVINCES } from '../utils/constants';
import { getPlanLimits } from '../utils/helpers';
import '../assets/css/dashboard.css';

// ── localStorage helpers ──────────────────────────────────────
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('sah_current_user') || 'null'); }
  catch { return null; }
}
function getProviderById(id) {
  try {
    const all = JSON.parse(localStorage.getItem('sah_providers') || '[]');
    return all.find(p => p.id === id) || null;
  } catch { return null; }
}
function saveProviderById(updatedProvider) {
  try {
    const all = JSON.parse(localStorage.getItem('sah_providers') || '[]');
    const idx = all.findIndex(p => p.id === updatedProvider.id);
    if (idx !== -1) { all[idx] = updatedProvider; } else { all.push(updatedProvider); }
    localStorage.setItem('sah_providers', JSON.stringify(all));
  } catch {}
}

const EMPTY_PROFILE = {
  id: '', name: '', email: '', accountType: 'Individual Provider',
  yearsExperience: '', languages: [], primaryCategory: '', secondaryCategories: [],
  tags: [], bio: '', degrees: '', certifications: '', memberships: '', clearance: '',
  services: [{ title: '', description: '', ageGroups: [], deliveryMode: 'Online', subjects: '' }],
  serviceTitle: '', serviceDesc: '', subjects: '', ageGroups: [],
  province: '', city: '', serviceAreas: [], serviceAreaType: 'national', radius: '',
  deliveryMode: '', pricingModel: '', startingPrice: '',
  availabilityDays: [], availabilityNotes: '',
  contactName: '', phone: '', whatsapp: '', contactEmail: '',
  social: '', website: '', facebook: '', publicToggle: true,
  plan: 'free', listingPublic: true, status: 'pending',
  image: null, photo: null, profilePhoto: null,
  certFile: null, certFileName: null, certFileType: null,
  clearanceFile: null, clearanceFileName: null, clearanceFileType: null,
  reviews: { average: 0, count: 0, items: [] },
};

// ── File helper: read File → base64 ──────────────────────────
const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  if (!file) { resolve(null); return; }
  const reader = new FileReader();
  reader.onload  = (e) => resolve(e.target.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

/* ── Inline CSS ── */
const DASH_CSS = `
  .cd-wrap { font-family:'DM Sans','Segoe UI',sans-serif; background:#f4f1ec; min-height:100vh; -webkit-font-smoothing:antialiased; }
  .cd-hero { background:linear-gradient(135deg,#3a3a3a 0%,#5a5a5a 60%,#c9621a 100%); padding:48px 0 36px; position:relative; overflow:hidden; }
  .cd-hero::before { content:''; position:absolute; inset:0; background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
  .cd-hero-inner { max-width:1200px; margin:0 auto; padding:0 32px; position:relative; z-index:1; display:flex; align-items:flex-start; justify-content:space-between; gap:24px; flex-wrap:wrap; }
  .cd-hero-left { flex:1; min-width:0; }
  .cd-hero-eyebrow { font-size:0.7rem; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(255,255,255,0.55); margin-bottom:8px; display:flex; align-items:center; gap:8px; }
  .cd-hero-eyebrow span { width:24px; height:1px; background:rgba(255,255,255,0.35); display:inline-block; }
  .cd-hero-title { font-size:clamp(1.6rem,3vw,2.2rem); font-weight:800; color:#fff; margin:0 0 12px; line-height:1.15; font-family:'Playfair Display',Georgia,serif; }
  .cd-hero-title em { font-style:italic; color:#f0c89a; }
  .cd-hero-meta { display:flex; align-items:center; gap:16px; flex-wrap:wrap; }
  .cd-status-pill { display:inline-flex; align-items:center; gap:7px; padding:6px 16px; border-radius:50px; font-size:0.78rem; font-weight:700; }
  .cd-status-pill.pending  { background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid rgba(245,158,11,0.35); }
  .cd-status-pill.approved { background:rgba(16,185,129,0.2); color:#34d399; border:1px solid rgba(16,185,129,0.35); }
  .cd-status-pill.rejected { background:rgba(239,68,68,0.2); color:#f87171; border:1px solid rgba(239,68,68,0.35); }
  .cd-hero-right { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .cd-btn-ghost { display:inline-flex; align-items:center; gap:7px; padding:9px 20px; border-radius:8px; border:1.5px solid rgba(255,255,255,0.4); background:rgba(255,255,255,0.08); color:#fff; font-size:0.85rem; font-weight:600; cursor:pointer; font-family:inherit; transition:all 0.18s; text-decoration:none; white-space:nowrap; }
  .cd-btn-ghost:hover { background:rgba(255,255,255,0.18); border-color:rgba(255,255,255,0.7); }
  .cd-btn-solid { display:inline-flex; align-items:center; gap:7px; padding:9px 20px; border-radius:8px; border:none; background:#c9621a; color:#fff; font-size:0.85rem; font-weight:700; cursor:pointer; font-family:inherit; transition:all 0.18s; white-space:nowrap; box-shadow:0 4px 16px rgba(201,98,26,0.4); }
  .cd-btn-solid:hover { background:#a84e12; transform:translateY(-1px); }
  .cd-btn-solid.cancel { background:#6b7280; box-shadow:none; }
  .cd-btn-solid.cancel:hover { background:#4b5563; }
  .cd-main { max-width:1200px; margin:0 auto; padding:32px 32px 80px; }
  .cd-grid { display:grid; grid-template-columns:1fr 340px; gap:24px; align-items:start; }
  .cd-card { background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.07),0 1px 3px rgba(0,0,0,0.05); margin-bottom:20px; border:1px solid rgba(0,0,0,0.06); }
  .cd-card-header { display:flex; align-items:center; gap:12px; padding:18px 24px; border-bottom:1px solid #f0ece5; background:#5a5a5a; }
  .cd-card-header-icon { width:36px; height:36px; border-radius:9px; background:linear-gradient(135deg,#c9621a,#e07a35); display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.85rem; flex-shrink:0; }
  .cd-card-title { font-size:0.95rem; font-weight:700; color:#fff; margin:0; }
  .cd-card-subtitle { font-size:0.75rem; color:rgba(255,255,255,0.65); margin:1px 0 0; }
  .cd-card-body { padding:24px; }
  .cd-edit-toggle { margin-left:auto; display:inline-flex; align-items:center; gap:7px; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:0.78rem; font-weight:700; border:1.5px solid; transition:all 0.15s; font-family:inherit; }
  .cd-edit-toggle.inactive { border-color:#d1d5db; background:transparent; color:#6b7280; }
  .cd-edit-toggle.inactive:hover { border-color:#c9621a; color:#c9621a; }
  .cd-edit-toggle.active { border-color:#c9621a; background:#fef3e8; color:#c9621a; }
  .cd-field { margin-bottom:18px; }
  .cd-field:last-child { margin-bottom:0; }
  .cd-label { display:block; font-size:0.71rem; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:#888; margin-bottom:6px; }
  .cd-label .req { color:#c9621a; }
  .cd-value { font-size:0.9rem; color:#1a1a1a; padding:10px 0; border-bottom:1px solid #f0ece5; min-height:38px; display:flex; align-items:center; }
  .cd-value.empty { color:#bbb; font-style:italic; }
  .cd-input { width:100%; padding:10px 14px; border:1.5px solid #e5e0d8; border-radius:8px; background:#faf9f7; font-family:inherit; font-size:0.9rem; color:#1a1a1a; outline:none; transition:border-color 0.15s,box-shadow 0.15s; -webkit-appearance:none; appearance:none; box-sizing:border-box; }
  .cd-input:focus { border-color:#c9621a; box-shadow:0 0 0 3px rgba(201,98,26,0.12); }
  .cd-textarea { resize:vertical; min-height:90px; }
  .cd-select { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px; cursor:pointer; }
  .cd-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .cd-sec-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#c9621a; display:flex; align-items:center; gap:8px; padding-bottom:10px; border-bottom:1px solid #f0ece5; margin:20px 0 16px; }
  .cd-days { display:flex; flex-wrap:wrap; gap:8px; }
  .cd-day-chip { padding:6px 14px; border-radius:20px; font-size:0.8rem; font-weight:600; cursor:default; transition:all 0.15s; }
  .cd-day-chip.on { background:#c9621a; color:#fff; }
  .cd-day-chip.off { background:#f0ece5; color:#bbb; border:1px solid #e5e0d8; }
  .cd-day-chip.editable { cursor:pointer; }
  .cd-day-chip.editable.off:hover { border-color:#c9621a; color:#c9621a; }
  .cd-tags { display:flex; flex-wrap:wrap; gap:8px; }
  .cd-tag { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; background:#fef3e8; color:#c9621a; border:1px solid #f0c89a; font-size:0.78rem; font-weight:600; }
  .cd-plan-badge { display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:10px; font-size:0.85rem; font-weight:700; border:2px solid; }
  .cd-plan-badge.free     { background:#f9f9f9; color:#666; border-color:#e5e5e5; }
  .cd-plan-badge.pro      { background:#eff6ff; color:#1d4ed8; border-color:#bfdbfe; }
  .cd-plan-badge.featured { background:#fffbeb; color:#d97706; border-color:#fde68a; }
  .cd-review { padding:14px 16px; background:#faf9f7; border-radius:10px; border-left:3px solid #c9621a; margin-bottom:10px; }
  .cd-review-stars { color:#f59e0b; font-size:0.85rem; margin-bottom:4px; }
  .cd-review-text { font-size:0.87rem; color:#555; font-style:italic; }
  .cd-review-author { font-size:0.75rem; color:#888; margin-top:4px; font-weight:600; }
  .cd-contact-item { display:flex; align-items:center; gap:12px; padding:12px 0; border-bottom:1px solid #f0ece5; }
  .cd-contact-item:last-child { border-bottom:none; }
  .cd-contact-icon { width:34px; height:34px; border-radius:8px; background:#fef3e8; display:flex; align-items:center; justify-content:center; color:#c9621a; font-size:0.85rem; flex-shrink:0; }
  .cd-contact-label { font-size:0.7rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#aaa; }
  .cd-contact-val { font-size:0.88rem; color:#1a1a1a; font-weight:500; }
  .cd-service-card { background:#faf9f7; border:1px solid #e5e0d8; border-radius:10px; padding:16px 18px; margin-bottom:12px; }
  .cd-service-card.editing { border-color:#c9621a; background:#fff; }
  .cd-sidebar-card { background:#fff; border-radius:14px; box-shadow:0 2px 12px rgba(0,0,0,0.07); margin-bottom:16px; border:1px solid rgba(0,0,0,0.06); overflow:hidden; }
  .cd-sidebar-header { padding:14px 18px; background:#5a5a5a; }
  .cd-sidebar-title { font-size:0.8rem; font-weight:700; color:#fff; text-transform:uppercase; letter-spacing:0.7px; }
  .cd-sidebar-body { padding:16px 18px; }
  .cd-toggle-row { display:flex; align-items:center; justify-content:space-between; }
  .cd-switch { position:relative; display:inline-block; width:42px; height:24px; }
  .cd-switch input { opacity:0; width:0; height:0; }
  .cd-slider { position:absolute; cursor:pointer; inset:0; background:#d1d5db; border-radius:24px; transition:0.2s; }
  .cd-slider::before { content:''; position:absolute; height:18px; width:18px; left:3px; bottom:3px; background:white; border-radius:50%; transition:0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.2); }
  .cd-switch input:checked + .cd-slider { background:#c9621a; }
  .cd-switch input:checked + .cd-slider::before { transform:translateX(18px); }
  .cd-footer-bar { display:flex; align-items:center; justify-content:space-between; padding:16px 24px; background:#faf9f7; border-top:1px solid #f0ece5; gap:12px; flex-wrap:wrap; }
  .cd-last-edit { font-size:0.75rem; color:#aaa; display:flex; align-items:center; gap:5px; }
  .cd-clearance { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:6px; background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; font-size:0.78rem; font-weight:700; }
  .cd-info-note { display:flex; align-items:flex-start; gap:10px; padding:12px 16px; background:#fffbeb; border-radius:8px; border:1px solid #fde68a; font-size:0.8rem; color:#92400e; margin:0 0 16px; }
  .cd-info-note i { color:#f59e0b; margin-top:1px; flex-shrink:0; }
  .cd-qual-parsed { padding:12px 16px; background:#ecfdf5; border-radius:8px; border:1px solid #a7f3d0; font-size:0.8rem; color:#065f46; margin-top:10px; display:flex; align-items:center; gap:8px; }

  /* ── File viewer ── */
  .cd-file-box { border:1.5px solid #e5e0d8; border-radius:10px; overflow:hidden; background:#faf9f7; }
  .cd-file-box-header { display:flex; align-items:center; gap:10px; padding:10px 14px; background:#fff3e8; border-bottom:1px solid #f0d4b8; }
  .cd-file-box-header i { color:#c9621a; font-size:0.9rem; flex-shrink:0; }
  .cd-file-box-name { font-size:0.82rem; font-weight:700; color:#1a1a1a; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .cd-file-box-type { font-size:0.7rem; color:#888; font-weight:600; flex-shrink:0; }
  .cd-file-box-body { padding:12px 14px; }
  .cd-file-img { width:100%; max-height:220px; object-fit:contain; border-radius:6px; border:1px solid #e5e0d8; background:#fff; display:block; }
  .cd-file-pdf-note { display:flex; align-items:center; gap:8px; padding:10px 14px; background:#fef3e8; border-radius:6px; font-size:0.8rem; color:#92400e; font-weight:600; }
  .cd-file-actions { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
  .cd-file-download { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:6px; background:#c9621a; color:#fff; font-size:0.78rem; font-weight:700; text-decoration:none; cursor:pointer; border:none; font-family:inherit; transition:background 0.15s; }
  .cd-file-download:hover { background:#a84e12; }
  .cd-file-replace { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:6px; background:#f3f4f6; color:#555; font-size:0.78rem; font-weight:700; cursor:pointer; border:none; font-family:inherit; transition:background 0.15s; }
  .cd-file-replace:hover { background:#e5e7eb; }
  .cd-file-none { padding:20px; text-align:center; color:#bbb; font-size:0.82rem; font-style:italic; }
  .cd-upload-zone { border:2px dashed #e5e0d8; border-radius:8px; padding:20px; text-align:center; cursor:pointer; transition:all 0.15s; background:#faf9f7; }
  .cd-upload-zone:hover { border-color:#c9621a; background:#fff3e8; }
  .cd-upload-label { font-size:0.82rem; color:#888; cursor:pointer; display:block; }
  .cd-upload-label i { color:#c9621a; margin-right:5px; }
  .cd-upload-hint { font-size:0.72rem; color:#bbb; margin-top:5px; }

  @media (max-width:900px) { .cd-grid { grid-template-columns:1fr; } .cd-main { padding:20px 16px 60px; } .cd-hero-inner { flex-direction:column; } .cd-row { grid-template-columns:1fr; } }
`;

/* ─────────────────────────────────────────────────────────────
   FileViewer — shows uploaded file with preview + download
   Works for both view mode and edit mode (with replace/upload)
───────────────────────────────────────────────────────────── */
const FileViewer = ({ file, fileName, fileType, label, editMode, onUpload, accept }) => {
  const isImage = fileType && fileType.startsWith('image/');
  const isPdf   = fileType === 'application/pdf';

  const handleDownload = () => {
    if (!file) return;
    const a = document.createElement('a');
    a.href     = file;
    a.download = fileName || 'document';
    a.click();
  };

  if (!editMode) {
    // ── View mode ──
    return (
      <div className="cd-field">
        <label className="cd-label">{label}</label>
        {file ? (
          <div className="cd-file-box">
            <div className="cd-file-box-header">
              <i className={`fas ${isImage ? 'fa-image' : isPdf ? 'fa-file-pdf' : 'fa-file-alt'}`}></i>
              <span className="cd-file-box-name">{fileName || 'Uploaded file'}</span>
              <span className="cd-file-box-type">{fileType || ''}</span>
            </div>
            <div className="cd-file-box-body">
              {isImage && <img src={file} alt={label} className="cd-file-img" />}
              {!isImage && (
                <div className="cd-file-pdf-note">
                  <i className={`fas ${isPdf ? 'fa-file-pdf' : 'fa-file'}`} style={{ color: isPdf ? '#dc2626' : '#888' }}></i>
                  {fileName || 'Document on file'}
                </div>
              )}
              <div className="cd-file-actions">
                <button className="cd-file-download" onClick={handleDownload}>
                  <i className="fas fa-download"></i> Download / View
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="cd-file-none">No file uploaded yet</div>
        )}
      </div>
    );
  }

  // ── Edit mode ──
  return (
    <div className="cd-field">
      <label className="cd-label">
        <i className="fas fa-upload" style={{ marginRight: 4 }}></i>{label}
      </label>
      {file ? (
        <div className="cd-file-box">
          <div className="cd-file-box-header">
            <i className={`fas ${isImage ? 'fa-image' : isPdf ? 'fa-file-pdf' : 'fa-file-alt'}`}></i>
            <span className="cd-file-box-name">{fileName || 'Uploaded file'}</span>
            <span className="cd-file-box-type">{fileType || ''}</span>
          </div>
          <div className="cd-file-box-body">
            {isImage && <img src={file} alt={label} className="cd-file-img" />}
            {!isImage && (
              <div className="cd-file-pdf-note">
                <i className={`fas ${isPdf ? 'fa-file-pdf' : 'fa-file'}`} style={{ color: isPdf ? '#dc2626' : '#888' }}></i>
                {fileName || 'Document stored'}
              </div>
            )}
            <div className="cd-file-actions">
              <button className="cd-file-download" onClick={handleDownload}>
                <i className="fas fa-download"></i> Download
              </button>
              <label className="cd-file-replace">
                <i className="fas fa-sync"></i> Replace
                <input type="file" accept={accept || 'image/*,.pdf,.doc,.docx,.txt'} style={{ display: 'none' }}
                  onChange={e => onUpload && onUpload(e.target.files[0])} />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <label className="cd-upload-zone">
          <input type="file" accept={accept || 'image/*,.pdf,.doc,.docx,.txt'} style={{ display: 'none' }}
            onChange={e => onUpload && onUpload(e.target.files[0])} />
          <div className="cd-upload-label">
            <i className="fas fa-cloud-upload-alt"></i> Click to upload {label}
          </div>
          <div className="cd-upload-hint">{accept || 'Images, PDF, Word documents'}</div>
        </label>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   CLIENT DASHBOARD
═══════════════════════════════════════════════════════════ */
const ClientDashboard = () => {
  const { user, updateUserPlan } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const [editModeActive, setEditModeActive] = useState(false);
  const [originalValues, setOriginalValues] = useState({});
  const [profileData, setProfileData]       = useState(EMPTY_PROFILE);
  const [loading, setLoading]               = useState(false);

  // Inject CSS + fonts once
  useEffect(() => {
    if (!document.getElementById('cd-styles')) {
      const s = document.createElement('style'); s.id = 'cd-styles'; s.textContent = DASH_CSS;
      document.head.appendChild(s);
    }
    if (!document.getElementById('cd-fonts')) {
      const l = document.createElement('link'); l.id = 'cd-fonts'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap';
      document.head.appendChild(l);
    }
  }, []);

  // Load profile from localStorage
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) { navigate('/login'); return; }
    const stored = currentUser.id ? getProviderById(currentUser.id) : null;
    if (stored) {
      setProfileData({ ...EMPTY_PROFILE, ...stored });
    } else {
      setProfileData(prev => ({
        ...prev,
        id: currentUser.id || prev.id,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
        plan: currentUser.plan || prev.plan,
        contactEmail: currentUser.email || prev.contactEmail,
      }));
    }
  }, [navigate]);

  const maxServices  = getPlanLimits(profileData.plan).maxServices;
  const serviceCount = profileData.services.length;
  const isPaidPlan   = profileData.plan === 'pro' || profileData.plan === 'featured';

  const toggleEditMode = () => {
    if (!editModeActive) { setOriginalValues({ profileData: { ...profileData } }); setEditModeActive(true); }
    else cancelEdit();
  };
  const cancelEdit = () => {
    if (originalValues.profileData) setProfileData(originalValues.profileData);
    setEditModeActive(false);
    showNotification('Changes discarded', 'info');
  };
  const saveChanges = () => {
    setLoading(true);
    try {
      const toSave = { ...profileData, social: profileData.website || profileData.social || '' };
      saveProviderById(toSave);
      const cu = getCurrentUser();
      if (cu) localStorage.setItem('sah_current_user', JSON.stringify({ ...cu, name: profileData.name, plan: profileData.plan }));
      setOriginalValues({ profileData: { ...toSave } });
      setEditModeActive(false);
      showNotification('Changes saved successfully!', 'success');
    } catch { showNotification('Error saving changes', 'error'); }
    finally { setLoading(false); }
  };

  const handleUpdateProfile = (upd) => setProfileData(prev => ({ ...prev, ...upd }));

  // ── Profile photo upload ──
  const handlePhotoUpload = async (input) => {
    if (!input) return;
    if (typeof input === 'string') {
      setProfileData(prev => ({ ...prev, profilePhoto: input, photo: input, image: input }));
      showNotification('Profile photo updated!', 'success');
      return;
    }
    const file = input instanceof File ? input : null;
    if (!file) return;
    try {
      const base64 = await readFileAsBase64(file);
      setProfileData(prev => ({ ...prev, profilePhoto: base64, photo: base64, image: base64 }));
      showNotification('Profile photo updated!', 'success');
    } catch { showNotification('Failed to read photo', 'error'); }
  };

  // ── Cert file upload ──
  const handleCertFileUpload = async (file) => {
    if (!file) return;
    try {
      const base64 = await readFileAsBase64(file);
      setProfileData(prev => ({
        ...prev,
        certFile: base64,
        certFileName: file.name,
        certFileType: file.type,
        _qualFileName: file.name,
      }));
      showNotification('Qualification document uploaded!', 'success');
    } catch { showNotification('Failed to upload file', 'error'); }
  };

  // ── Clearance file upload ──
  const handleClearanceFileUpload = async (file) => {
    if (!file) return;
    try {
      const base64 = await readFileAsBase64(file);
      setProfileData(prev => ({
        ...prev,
        clearanceFile: base64,
        clearanceFileName: file.name,
        clearanceFileType: file.type,
      }));
      showNotification('Police clearance document uploaded!', 'success');
    } catch { showNotification('Failed to upload file', 'error'); }
  };

  // ── Qual file: also parse text content if .txt ──
  const handleQualFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleCertFileUpload(file);

    if (file.name.toLowerCase().endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target.result;
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const degreeKw = ['bed', 'bsc', 'ba ', 'honours', 'diploma', 'degree', 'masters', 'phd', 'med ', 'pgce'];
        const certKw   = ['sace', 'umalusi', 'cert', 'accredited', 'registered'];
        const degLine  = lines.find(l => degreeKw.some(k => l.toLowerCase().includes(k)));
        const certLine = lines.find(l => certKw.some(k => l.toLowerCase().includes(k)));
        const memLine  = lines.find(l => l.toLowerCase().includes('member'));
        setProfileData(prev => ({
          ...prev,
          degrees:      degLine  || prev.degrees  || '',
          certifications: certLine || prev.certifications || '',
          memberships:  memLine  || prev.memberships,
        }));
        showNotification('Qualification file parsed — review fields below.', 'success');
      };
      reader.readAsText(file);
    }
  };

  const handleAddTag    = (t) => { if (t && !profileData.tags.includes(t)) setProfileData(prev => ({ ...prev, tags: [...prev.tags, t] })); };
  const handleRemoveTag = (i) => setProfileData(prev => ({ ...prev, tags: prev.tags.filter((_, j) => j !== i) }));

  const handleAddService = () => {
    if (serviceCount < maxServices) {
      setProfileData(prev => ({ ...prev, services: [...prev.services, { title: '', description: '', ageGroups: [], deliveryMode: 'Online', subjects: '' }] }));
      showNotification('New service added.', 'success');
    }
  };
  const handleUpdateService = (index, svc) => {
    const s = [...profileData.services]; s[index] = svc;
    setProfileData(prev => ({ ...prev, services: s }));
  };
  const handleRemoveService = (index) => {
    if (profileData.services.length > 1) setProfileData(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }));
  };
  const handlePlanChange = (newPlan) => {
    setProfileData(prev => ({ ...prev, plan: newPlan }));
    if (updateUserPlan) updateUserPlan(newPlan);
    showNotification(`Plan updated to ${PLAN_LIMITS?.[newPlan]?.name || newPlan}`, 'success');
  };
  const handleToggleDay = (day) => {
    const newDays = profileData.availabilityDays.includes(day)
      ? profileData.availabilityDays.filter(d => d !== day)
      : [...profileData.availabilityDays, day];
    setProfileData(prev => ({ ...prev, availabilityDays: newDays }));
  };

  const getPlanName = () => ({
    free: 'Community Member (Free)',
    pro: 'Trusted Provider (R149/month)',
    featured: 'Featured Partner (R399/month)',
  }[profileData.plan] || 'Community Member (Free)');

  const publicViewUrl  = profileData.id ? `/profile?id=${profileData.id}&from=dashboard` : '/profile?from=dashboard';
  const statusInfo = {
    approved: { cls: 'approved', icon: 'fa-check-circle', label: 'Approved — Live' },
    rejected: { cls: 'rejected', icon: 'fa-times-circle', label: 'Rejected' },
    pending:  { cls: 'pending',  icon: 'fa-clock',        label: 'Pending Approval' },
  }[profileData.status] || { cls: 'pending', icon: 'fa-clock', label: 'Pending Approval' };

  const days             = DAYS_OF_WEEK || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const profilePhotoSrc  = profileData.profilePhoto || profileData.photo || profileData.image || null;

  // Profile completeness calculation - more accurate mapping
  const completenessItems = [
    { label: 'Full Name', done: !!(profileData.name && profileData.name.trim()) },
    { label: 'Bio', done: !!(profileData.bio && profileData.bio.length > 30) },
    { label: 'Profile Photo', done: !!profilePhotoSrc },
    { label: 'Services', done: profileData.services.some(s => s.title && s.title.trim()) },
    { label: 'Location', done: !!(profileData.city && profileData.city.trim() && profileData.province) },
    { label: 'Contact Phone', done: !!(profileData.phone && profileData.phone.trim()) },
    { label: 'Contact Email', done: !!(profileData.contactEmail && profileData.contactEmail.trim()) },
    { label: 'Qualifications (Text)', done: !!(profileData.degrees || profileData.certifications) },
    { label: 'Cert. Document', done: !!profileData.certFile },
    { label: 'Police Clearance', done: !!profileData.clearanceFile || !!profileData.clearance },
    { label: 'Availability Days', done: profileData.availabilityDays.length > 0 },
    { label: 'Pricing Model', done: !!profileData.pricingModel },
  ];
  const completePct = Math.round((completenessItems.filter(i => i.done).length / completenessItems.length) * 100);

  return (
    <div className="cd-wrap">
      <Header userType="client" />

      {/* ── HERO ── */}
      <section className="cd-hero">
        <div className="cd-hero-inner">
          <div className="cd-hero-left">
            <div className="cd-hero-eyebrow"><span></span> Provider Dashboard</div>
            <h1 className="cd-hero-title">Welcome back, <em>{profileData.name || 'Provider'}</em></h1>
            <div className="cd-hero-meta">
              <div className={`cd-status-pill ${statusInfo.cls}`}>
                <i className={`fas ${statusInfo.icon}`}></i> {statusInfo.label}
              </div>
              {profileData.plan && (
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="fas fa-crown" style={{ color: '#f59e0b' }}></i> {getPlanName()}
                </div>
              )}
            </div>
          </div>
          <div className="cd-hero-right">
            <button className="cd-btn-ghost" onClick={() => navigate('/')}><i className="fas fa-arrow-left"></i> Back to Directory</button>
            <button className="cd-btn-ghost" onClick={() => navigate(publicViewUrl)}><i className="fas fa-eye"></i> Public View</button>
            {editModeActive ? (
              <>
                <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
                  <i className="fas fa-floppy-disk"></i> {loading ? 'Saving…' : 'Save Changes'}
                </button>
                <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
              </>
            ) : (
              <button className="cd-btn-solid" onClick={toggleEditMode}><i className="fas fa-pen"></i> Edit Profile</button>
            )}
          </div>
        </div>
      </section>

      <main className="cd-main">
        <div className="cd-grid">
          {/* ─── LEFT COLUMN ─── */}
          <div>

            {/* ── PROFILE INFORMATION ── */}
            <div className="cd-card">
              <div className="cd-card-header">
                <div className="cd-card-header-icon"><i className="fas fa-user"></i></div>
                <div>
                  <div className="cd-card-title">Profile Information</div>
                  <div className="cd-card-subtitle">Your public-facing identity and photo</div>
                </div>
                <button className={`cd-edit-toggle ${editModeActive ? 'active' : 'inactive'}`} onClick={toggleEditMode}>
                  <i className={`fas ${editModeActive ? 'fa-pencil-alt' : 'fa-edit'}`}></i>
                  {editModeActive ? 'Editing' : 'Edit'}
                </button>
              </div>
              <div className="cd-card-body">
                {/* ── Profile photo (Edit button moved here) ── */}
                <div className="cd-field">
                  <label className="cd-label"><i className="fas fa-camera" style={{ marginRight: 4 }}></i>Profile Photo / Logo</label>
                  {editModeActive ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                      {profilePhotoSrc ? (
                        <img src={profilePhotoSrc} alt="Profile"
                          style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #c9621a', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#c9621a,#e07a35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: 800, flexShrink: 0 }}>
                          {(profileData.name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1.5px dashed #c9621a', background: '#fff3e8', color: '#c9621a', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                        <i className="fas fa-camera"></i>
                        {profilePhotoSrc ? 'Change Photo / Logo' : 'Upload Photo / Logo'}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => handlePhotoUpload(e.target.files[0])} />
                      </label>
                    </div>
                  ) : (
                    profilePhotoSrc
                      ? <img src={profilePhotoSrc} alt="Profile" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #c9621a' }} />
                      : <div className="cd-value empty">No photo uploaded</div>
                  )}
                </div>

                <ProfileSection
                  profileData={profileData}
                  isEditing={editModeActive}
                  onUpdate={handleUpdateProfile}
                  onPhotoUpload={handlePhotoUpload}
                />

                {/* Tags */}
                <div className="cd-field" style={{ marginTop: 16 }}>
                  <label className="cd-label">Tags / Subjects</label>
                  {editModeActive ? (
                    <TagsInput tags={profileData.tags} isEditing={editModeActive} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
                  ) : (
                    <div className="cd-tags">
                      {profileData.tags.length > 0
                        ? profileData.tags.map((t, i) => <span key={i} className="cd-tag">{t}</span>)
                        : <span className="cd-value empty">No tags added yet</span>}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div className="cd-field">
                  <label className="cd-label">Short Bio <span className="req">*</span></label>
                  {editModeActive ? (
                    <textarea className="cd-input cd-textarea" value={profileData.bio}
                      onChange={e => handleUpdateProfile({ bio: e.target.value })}
                      placeholder="Tell families about your experience and approach..." />
                  ) : (
                    <div className={`cd-value ${!profileData.bio ? 'empty' : ''}`} style={{ display: 'block', lineHeight: 1.6, padding: '10px 0' }}>
                      {profileData.bio || 'No bio added yet.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── QUALIFICATIONS & DOCUMENTS ── */}
            <div className="cd-card">
              <div className="cd-card-header">
                <div className="cd-card-header-icon"><i className="fas fa-graduation-cap"></i></div>
                <div>
                  <div className="cd-card-title">Qualifications &amp; Documents</div>
                  <div className="cd-card-subtitle">Credentials, certifications and clearance files</div>
                </div>
              </div>
              <div className="cd-card-body">
                {/* Text fields */}
                <div className="cd-row">
                  <div className="cd-field">
                    <label className="cd-label">Degrees / Diplomas</label>
                    {editModeActive ? (
                      <input type="text" className="cd-input" value={profileData.degrees || ''}
                        onChange={e => handleUpdateProfile({ degrees: e.target.value })}
                        placeholder="e.g. BEd Honours, Mathematics Education" />
                    ) : (
                      <div className={`cd-value ${!profileData.degrees ? 'empty' : ''}`}>{profileData.degrees || '—'}</div>
                    )}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">Certifications</label>
                    {editModeActive ? (
                      <input type="text" className="cd-input" value={profileData.certifications || ''}
                        onChange={e => handleUpdateProfile({ certifications: e.target.value })}
                        placeholder="e.g. SACE Registered, Umalusi Accredited" />
                    ) : (
                      <div className={`cd-value ${!profileData.certifications ? 'empty' : ''}`}>{profileData.certifications || '—'}</div>
                    )}
                  </div>
                </div>
                <div className="cd-row">
                  <div className="cd-field">
                    <label className="cd-label">Professional Memberships</label>
                    {editModeActive ? (
                      <input type="text" className="cd-input" value={profileData.memberships || ''}
                        onChange={e => handleUpdateProfile({ memberships: e.target.value })}
                        placeholder="e.g. SA Curriculum Association" />
                    ) : (
                      <div className={`cd-value ${!profileData.memberships ? 'empty' : ''}`}>{profileData.memberships || '—'}</div>
                    )}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">Background Clearance Reference</label>
                    {editModeActive ? (
                      <input type="text" className="cd-input" value={profileData.clearance || ''}
                        onChange={e => handleUpdateProfile({ clearance: e.target.value })}
                        placeholder="e.g. Verified 2024 — Cert No. 12345678" />
                    ) : (
                      profileData.clearance
                        ? <span className="cd-clearance"><i className="fas fa-shield-alt"></i>{profileData.clearance}</span>
                        : <div className="cd-value empty">Not provided</div>
                    )}
                  </div>
                </div>

                {/* ── UPLOADED DOCUMENT FILES ── */}
                <div className="cd-sec-label">
                  <i className="fas fa-paperclip"></i> Uploaded Document Files
                </div>

                <div className="cd-row">
                  {/* Qualification / Cert file */}
                  <FileViewer
                    file={profileData.certFile}
                    fileName={profileData.certFileName}
                    fileType={profileData.certFileType}
                    label="Qualification / Certification File"
                    editMode={editModeActive}
                    onUpload={handleCertFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />

                  {/* Police Clearance file */}
                  <FileViewer
                    file={profileData.clearanceFile}
                    fileName={profileData.clearanceFileName}
                    fileType={profileData.clearanceFileType}
                    label="Police Clearance Document"
                    editMode={editModeActive}
                    onUpload={handleClearanceFileUpload}
                    accept="image/*,.pdf"
                  />
                </div>
              </div>
            </div>

            {/* ── SERVICES ── */}
            <div className="cd-card">
              <div className="cd-card-header">
                <div className="cd-card-header-icon"><i className="fas fa-briefcase"></i></div>
                <div>
                  <div className="cd-card-title">Service Details</div>
                  <div className="cd-card-subtitle">What you offer to homeschooling families</div>
                </div>
              </div>
              <div className="cd-card-body">
                {profileData.services.map((service, index) => (
                  <div className={`cd-service-card ${editModeActive ? 'editing' : ''}`} key={index}>
                    <ServiceItem
                      service={service} index={index} isEditing={editModeActive}
                      onUpdate={handleUpdateService} onRemove={handleRemoveService}
                      canRemove={profileData.services.length > 1 && isPaidPlan}
                    />
                  </div>
                ))}
                {editModeActive && isPaidPlan && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <button onClick={handleAddService} disabled={serviceCount >= maxServices}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 8, cursor: serviceCount >= maxServices ? 'not-allowed' : 'pointer', border: '1.5px dashed #c9621a', background: '#fef3e8', color: '#c9621a', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit', opacity: serviceCount >= maxServices ? 0.5 : 1 }}>
                      <i className="fas fa-plus-circle"></i> Add Service
                    </button>
                    <span style={{ fontSize: '0.78rem', color: '#888' }}>{serviceCount}/{maxServices} used</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── LOCATION, PRICING & AVAILABILITY ── */}
            <div className="cd-card">
              <div className="cd-card-header">
                <div className="cd-card-header-icon"><i className="fas fa-map-marker-alt"></i></div>
                <div>
                  <div className="cd-card-title">Location, Pricing &amp; Availability</div>
                  <div className="cd-card-subtitle">Where you serve families and your rates</div>
                </div>
              </div>
              <div className="cd-card-body">
                <div className="cd-sec-label" style={{ marginTop: 0 }}><i className="fas fa-map-marker-alt"></i> Location &amp; Reach</div>
                <div className="cd-row">
                  <div className="cd-field">
                    <label className="cd-label">Province <span className="req">*</span></label>
                    {editModeActive ? (
                      <select className="cd-input cd-select" value={profileData.province}
                        onChange={e => handleUpdateProfile({ province: e.target.value })}>
                        <option value="">-- Select --</option>
                        {(PROVINCES || []).map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    ) : <div className={`cd-value ${!profileData.province ? 'empty' : ''}`}>{profileData.province || '—'}</div>}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">City / Town</label>
                    {editModeActive ? (
                      <input type="text" className="cd-input" value={profileData.city}
                        onChange={e => handleUpdateProfile({ city: e.target.value })} />
                    ) : <div className={`cd-value ${!profileData.city ? 'empty' : ''}`}>{profileData.city || '—'}</div>}
                  </div>
                </div>
                <div className="cd-field">
                  <label className="cd-label">Service Area <span className="req">*</span></label>
                  {editModeActive ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select className="cd-input cd-select" value={profileData.serviceAreaType} style={{ width: 'auto' }}
                        onChange={e => handleUpdateProfile({ serviceAreaType: e.target.value })}>
                        <option value="local">Local (radius)</option>
                        <option value="national">National</option>
                        <option value="online">Online only</option>
                      </select>
                      {profileData.serviceAreaType === 'local' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input type="number" className="cd-input" value={profileData.radius} style={{ width: 90 }}
                            min="1" max="200" onChange={e => handleUpdateProfile({ radius: e.target.value })} />
                          <span style={{ fontSize: '0.85rem', color: '#888' }}>km</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="cd-value">
                      {profileData.serviceAreaType === 'local' ? `Local — ${profileData.radius || '?'} km radius`
                        : profileData.serviceAreaType === 'national' ? 'National' : 'Online only'}
                    </div>
                  )}
                </div>
                <div className="cd-sec-label"><i className="fas fa-tag"></i> Pricing &amp; Availability</div>
                <div className="cd-row">
                  <div className="cd-field">
                    <label className="cd-label">Pricing Model <span className="req">*</span></label>
                    {editModeActive ? (
                      <select className="cd-input cd-select" value={profileData.pricingModel}
                        onChange={e => handleUpdateProfile({ pricingModel: e.target.value })}>
                        {(PRICING_MODELS || ['Hourly', 'Per package', 'Per term', 'Custom quote']).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    ) : <div className={`cd-value ${!profileData.pricingModel ? 'empty' : ''}`}>{profileData.pricingModel || '—'}</div>}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">Starting Price</label>
                    {editModeActive ? (
                      <input type="text" className="cd-input" value={profileData.startingPrice}
                        onChange={e => handleUpdateProfile({ startingPrice: e.target.value })} />
                    ) : <div className={`cd-value ${!profileData.startingPrice ? 'empty' : ''}`}>{profileData.startingPrice || '—'}</div>}
                  </div>
                </div>
                <div className="cd-field">
                  <label className="cd-label">Availability — Days</label>
                  <div className="cd-days" style={{ marginTop: 6 }}>
                    {days.map(day => {
                      const active = profileData.availabilityDays.includes(day);
                      return (
                        <button key={day}
                          className={`cd-day-chip ${active ? 'on' : 'off'} ${editModeActive ? 'editable' : ''}`}
                          onClick={() => editModeActive && handleToggleDay(day)}
                          style={{ border: 'none', cursor: editModeActive ? 'pointer' : 'default' }}>
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {editModeActive ? (
                      <input type="text" className="cd-input" value={profileData.availabilityNotes}
                        onChange={e => handleUpdateProfile({ availabilityNotes: e.target.value })}
                        placeholder="e.g. Weekday afternoons & Saturdays" />
                    ) : (
                      <div className={`cd-value ${!profileData.availabilityNotes ? 'empty' : ''}`} style={{ fontSize: '0.85rem' }}>
                        {profileData.availabilityNotes || '—'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── CONTACT & SOCIAL ── */}
            <div className="cd-card">
              <div className="cd-card-header">
                <div className="cd-card-header-icon"><i className="fas fa-address-card"></i></div>
                <div>
                  <div className="cd-card-title">Contact &amp; Online Presence</div>
                  <div className="cd-card-subtitle">How families reach you</div>
                </div>
              </div>
              <div className="cd-card-body">
                {editModeActive ? (
                  <div className="cd-row">
                    {[
                      { label: 'Contact Name', field: 'contactName', type: 'text' },
                      { label: 'Phone',        field: 'phone',       type: 'text' },
                      { label: 'WhatsApp',     field: 'whatsapp',    type: 'text', placeholder: '+27 82 000 0000' },
                      { label: 'Enquiry Email',field: 'contactEmail',type: 'email' },
                    ].map(({ label, field, type, placeholder }) => (
                      <div className="cd-field" key={field}>
                        <label className="cd-label">{label}</label>
                        <input type={type} className="cd-input" value={profileData[field] || ''}
                          placeholder={placeholder || ''} onChange={e => handleUpdateProfile({ [field]: e.target.value })} />
                      </div>
                    ))}
                    <div className="cd-field">
                      <label className="cd-label">Website</label>
                      <input type="url" className="cd-input" value={profileData.website || profileData.social || ''}
                        onChange={e => handleUpdateProfile({ website: e.target.value, social: e.target.value })}
                        placeholder="https://yoursite.co.za" />
                    </div>
                    <div className="cd-field">
                      <label className="cd-label">Facebook Page</label>
                      <input type="url" className="cd-input" value={profileData.facebook || ''}
                        onChange={e => handleUpdateProfile({ facebook: e.target.value })}
                        placeholder="https://facebook.com/yourpage" />
                    </div>
                  </div>
                ) : (
                  <div>
                    {[
                      { icon: 'fa-user',              label: 'Contact Name', val: profileData.contactName },
                      { icon: 'fa-phone',             label: 'Phone',        val: profileData.phone },
                      { icon: 'fa-brands fa-whatsapp',label: 'WhatsApp',     val: profileData.whatsapp || profileData.phone },
                      { icon: 'fa-envelope',          label: 'Email',        val: profileData.contactEmail },
                      { icon: 'fa-globe',             label: 'Website',      val: profileData.website || profileData.social },
                      { icon: 'fa-brands fa-facebook',label: 'Facebook',     val: profileData.facebook },
                    ].map(({ icon, label, val }) => val ? (
                      <div className="cd-contact-item" key={label}>
                        <div className="cd-contact-icon"><i className={`fas ${icon}`}></i></div>
                        <div>
                          <div className="cd-contact-label">{label}</div>
                          <div className="cd-contact-val">{val}</div>
                        </div>
                      </div>
                    ) : null)}
                    {!profileData.contactName && !profileData.phone && !profileData.contactEmail && (
                      <div className="cd-value empty">No contact details — activate Edit mode to add.</div>
                    )}
                  </div>
                )}
                <div className="cd-toggle-row" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0ece5' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a' }}>Display contact publicly</div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>Visible to families on your profile page</div>
                  </div>
                  <label className="cd-switch">
                    <input type="checkbox" checked={profileData.publicToggle}
                      onChange={e => handleUpdateProfile({ publicToggle: e.target.checked })}
                      disabled={!editModeActive} />
                    <span className="cd-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* ── PLAN & REVIEWS ── */}
            <div className="cd-card">
              <div className="cd-card-header">
                <div className="cd-card-header-icon"><i className="fas fa-crown"></i></div>
                <div>
                  <div className="cd-card-title">Plan &amp; Reviews</div>
                  <div className="cd-card-subtitle">Your listing tier and family feedback</div>
                </div>
              </div>
              <div className="cd-card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#faf9f7', borderRadius: 10, marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                  <span className={`cd-plan-badge ${profileData.plan}`}>
                    <i className="fas fa-crown" style={{ color: '#f59e0b' }}></i> {getPlanName()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: '0.78rem', color: '#888', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fas fa-circle" style={{ color: profileData.status === 'approved' ? '#10b981' : '#f59e0b', fontSize: '0.5rem' }}></i>
                      Listing is {profileData.status}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#c9621a', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => document.getElementById('plan-selector-section')?.scrollIntoView({ behavior: 'smooth' })}>
                      Upgrade plan ↓
                    </span>
                  </div>
                </div>
                <div className="cd-sec-label" style={{ marginTop: 0 }}><i className="fas fa-star"></i> Reviews &amp; Testimonials</div>
                {profileData.reviews?.items?.length > 0 ? (
                  profileData.reviews.items.map((review, i) => (
                    <div className="cd-review" key={i}>
                      <div className="cd-review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                      <div className="cd-review-text">"{review.text}"</div>
                      <div className="cd-review-author">— {review.reviewer}</div>
                    </div>
                  ))
                ) : (
                  <div className="cd-value empty">No reviews yet.</div>
                )}
              </div>
              <div className="cd-footer-bar">
                <span className="cd-last-edit"><i className="far fa-clock"></i> last edited today</span>
                {editModeActive && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="cd-btn-solid" onClick={saveChanges} disabled={loading}>
                      <i className="fas fa-floppy-disk"></i> {loading ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button className="cd-btn-solid cancel" onClick={cancelEdit} disabled={loading}>Cancel</button>
                  </div>
                )}
              </div>
            </div>

            {/* ── PLAN SELECTOR ── */}
            <div className="cd-card" id="plan-selector-section">
              <div className="cd-card-header">
                <div className="cd-card-header-icon"><i className="fas fa-arrow-up"></i></div>
                <div>
                  <div className="cd-card-title">Upgrade Your Plan</div>
                  <div className="cd-card-subtitle">More features and visibility</div>
                </div>
              </div>
              <div className="cd-card-body">
                <PlanSelector currentPlan={profileData.plan} onSelectPlan={handlePlanChange} />
              </div>
            </div>

          </div>

          {/* ─── SIDEBAR ─── */}
          <div>
            {/* Profile photo preview */}
            {profilePhotoSrc && (
              <div className="cd-sidebar-card">
                <div className="cd-sidebar-header">
                  <div className="cd-sidebar-title"><i className="fas fa-image" style={{ marginRight: 6 }}></i>Profile Photo</div>
                </div>
                <div className="cd-sidebar-body" style={{ textAlign: 'center', padding: '20px 18px' }}>
                  <img src={profilePhotoSrc} alt="Profile"
                    style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '4px solid #c9621a', display: 'block', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '0.78rem', color: '#888' }}>Your public profile photo</div>
                </div>
              </div>
            )}

            {/* Documents sidebar summary */}
            <div className="cd-sidebar-card">
              <div className="cd-sidebar-header">
                <div className="cd-sidebar-title"><i className="fas fa-paperclip" style={{ marginRight: 6 }}></i>Uploaded Documents</div>
              </div>
              <div className="cd-sidebar-body">
                {[
                  { label: 'Qualification File', file: profileData.certFile,      name: profileData.certFileName,      type: profileData.certFileType },
                  { label: 'Police Clearance',   file: profileData.clearanceFile, name: profileData.clearanceFileName, type: profileData.clearanceFileType },
                ].map(({ label, file, name, type }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f8f6f3' }}>
                    <i className={`fas ${file ? 'fa-check-circle' : 'fa-circle'}`}
                      style={{ color: file ? '#10b981' : '#d1d5db', fontSize: '0.85rem', width: 16 }}></i>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: file ? '#1a1a1a' : '#999' }}>{label}</div>
                      {file && name && (
                        <div style={{ fontSize: '0.7rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                      )}
                    </div>
                    {file && (
                      <button onClick={() => { const a = document.createElement('a'); a.href = file; a.download = name || label; a.click(); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c9621a', fontSize: '0.8rem', padding: '2px 4px' }}
                        title="Download">
                        <i className="fas fa-download"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Completeness - More accurate */}
            <div className="cd-sidebar-card">
              <div className="cd-sidebar-header">
                <div className="cd-sidebar-title"><i className="fas fa-tasks" style={{ marginRight: 6 }}></i>Profile Completeness</div>
              </div>
              <div className="cd-sidebar-body">
                {completenessItems.map(({ label, done }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid #f8f6f3' }}>
                    <i className={`fas ${done ? 'fa-check-circle' : 'fa-circle'}`}
                      style={{ color: done ? '#10b981' : '#d1d5db', fontSize: '0.85rem', width: 16 }}></i>
                    <span style={{ fontSize: '0.82rem', color: done ? '#1a1a1a' : '#999', fontWeight: done ? 600 : 400 }}>{label}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700 }}>COMPLETE</span>
                    <span style={{ fontSize: '0.72rem', color: '#c9621a', fontWeight: 800 }}>{completePct}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f0ece5', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${completePct}%`, background: 'linear-gradient(90deg,#c9621a,#e07a35)', borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Pending notice */}
            {profileData.status === 'pending' && (
              <div className="cd-sidebar-card">
                <div className="cd-sidebar-header" style={{ background: '#92400e' }}>
                  <div className="cd-sidebar-title"><i className="fas fa-clock" style={{ marginRight: 6 }}></i>Pending Review</div>
                </div>
                <div className="cd-sidebar-body">
                  <p style={{ fontSize: '0.83rem', color: '#555', lineHeight: 1.6 }}>
                    Your profile is awaiting admin verification. Once approved it will appear live in the directory. Typically 1–2 business days.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ClientDashboard;