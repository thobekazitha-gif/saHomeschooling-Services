// frontend/src/pages/UserRegister.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const injectHead = () => {
  if (document.getElementById('sah-ur-fonts')) return;
  const fonts = document.createElement('link');
  fonts.id = 'sah-ur-fonts'; fonts.rel = 'stylesheet';
  fonts.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@400;500;600;700&display=swap';
  document.head.appendChild(fonts);
  const fa = document.createElement('link');
  fa.rel = 'stylesheet';
  fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
  document.head.appendChild(fa);
};

const CSS = `
  :root {
    --acc:#c9621a; --acc-d:#a84e12; --acc-l:#f0dcc8;
    --dark:#3a3a3a; --mid:#555; --muted:#888;
    --card:#ede9e3; --white:#fff;
    --border:rgba(0,0,0,0.10);
    --shadow:0 16px 48px rgba(0,0,0,0.13);
    --r:8px; --r-lg:14px;
  }
  .ur-wrap{font-family:'DM Sans',sans-serif;min-height:100vh;display:flex;flex-direction:column;background:var(--card);-webkit-font-smoothing:antialiased;}
  .ur-wrap *{box-sizing:border-box;margin:0;padding:0;}

  /* Header */
  .ur-hdr{height:64px;background:#5a5a5a;display:flex;align-items:center;padding:0 32px;gap:16px;box-shadow:0 2px 12px rgba(0,0,0,0.22);}
  .ur-hdr-back{display:inline-flex;align-items:center;gap:7px;color:rgba(255,255,255,0.85);font-size:0.85rem;font-weight:600;background:none;border:none;cursor:pointer;font-family:inherit;}
  .ur-hdr-back:hover{color:#fff;}
  .ur-hdr-div{width:1px;height:26px;background:rgba(255,255,255,0.25);}
  .ur-hdr-brand{font-family:'Playfair Display',serif;font-weight:800;font-size:1rem;color:#fff;text-decoration:none;}

  /* Hero */
  .ur-hero{position:relative;overflow:hidden;min-height:180px;display:flex;align-items:center;}
  .ur-hero-bg{position:absolute;inset:0;background-image:url('https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400&auto=format&fit=crop&q=80');background-size:cover;background-position:center;}
  .ur-hero-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,rgba(10,10,10,0.88) 0%,rgba(30,30,30,0.80) 100%);}
  .ur-hero-inner{position:relative;z-index:2;padding:40px 32px;width:100%;max-width:560px;margin:0 auto;text-align:center;}
  .ur-hero-inner h1{font-family:'Playfair Display',serif;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:900;color:#fff;line-height:1.1;margin-bottom:8px;}
  .ur-hero-inner h1 em{font-style:italic;color:var(--acc-l);}
  .ur-hero-inner p{font-size:0.88rem;color:rgba(255,255,255,0.7);margin-top:6px;}

  /* Card */
  .ur-body{flex:1;display:flex;align-items:flex-start;justify-content:center;padding:36px 20px 64px;}
  .ur-card{background:var(--white);border-radius:var(--r-lg);box-shadow:var(--shadow);width:100%;max-width:460px;overflow:hidden;}
  .ur-card-head{background:#5a5a5a;padding:24px 32px 18px;}
  .ur-card-head h2{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:800;color:#fff;}
  .ur-card-head p{font-size:0.82rem;color:rgba(255,255,255,0.65);margin-top:3px;}
  .ur-card-body{padding:28px 32px 32px;}

  /* Fields */
  .ur-field{display:flex;flex-direction:column;gap:5px;margin-bottom:16px;}
  .ur-field label{font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--mid);display:flex;align-items:center;gap:5px;}
  .ur-field label i{color:var(--acc);font-size:0.65rem;}
  .ur-field input{padding:11px 14px;border:1.5px solid var(--border);border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:0.92rem;color:var(--dark);outline:none;background:var(--card);transition:border-color 0.15s,box-shadow 0.15s;}
  .ur-field input:focus{border-color:var(--acc);box-shadow:0 0 0 3px rgba(201,98,26,0.14);}
  .ur-field input.err{border-color:#dc2626;background:#fff8f8;}
  .ur-field-err{color:#dc2626;font-size:0.74rem;font-weight:600;padding:4px 9px;background:#fff0f0;border-radius:5px;border-left:3px solid #dc2626;display:flex;align-items:center;gap:5px;}

  /* Password eye */
  .ur-pw{position:relative;}
  .ur-pw input{padding-right:42px;}
  .ur-pw-eye{position:absolute;right:11px;top:50%;transform:translateY(-50%);background:none;border:none;color:var(--muted);cursor:pointer;font-size:0.88rem;padding:3px;}
  .ur-pw-eye:hover{color:var(--acc);}

  /* Submit */
  .ur-submit{width:100%;padding:13px;background:var(--acc);color:#fff;border:none;border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:0.95rem;font-weight:700;cursor:pointer;transition:background 0.15s;display:flex;align-items:center;justify-content:center;gap:8px;}
  .ur-submit:hover{background:var(--acc-d);}
  .ur-submit:disabled{opacity:0.65;cursor:not-allowed;}

  /* Divider */
  .ur-divider{display:flex;align-items:center;gap:12px;margin:18px 0;}
  .ur-divider span{flex:1;height:1px;background:var(--border);}
  .ur-divider p{font-size:0.78rem;color:var(--muted);white-space:nowrap;}

  /* Switch */
  .ur-switch{text-align:center;font-size:0.85rem;color:var(--muted);}
  .ur-switch a{color:var(--acc);font-weight:700;text-decoration:none;}
  .ur-switch a:hover{text-decoration:underline;}

  /* Spinner */
  .ur-spin{width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:ur-s 0.7s linear infinite;}
  @keyframes ur-s{to{transform:rotate(360deg);}}

  /* Submit error */
  .ur-err-banner{background:#fff0f0;border:1.5px solid #f5b3b3;border-radius:var(--r);padding:11px 16px;color:#a00c2c;font-size:0.85rem;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px;}

  /* ── Success / Confirmation screen ── */
  .ur-success-wrap{display:flex;flex-direction:column;align-items:center;text-align:center;padding:36px 28px 32px;}
  .ur-success-icon{width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#d1fae5,#a7f3d0);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;box-shadow:0 8px 24px rgba(16,185,129,0.25);}
  .ur-success-icon i{font-size:1.8rem;color:#065f46;}
  .ur-success-title{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:800;color:#1a1a1a;margin-bottom:8px;}
  .ur-success-email{display:inline-block;background:rgba(201,98,26,0.08);border:1px solid rgba(201,98,26,0.2);border-radius:6px;padding:6px 16px;font-size:0.85rem;font-weight:700;color:var(--acc);margin-bottom:16px;}
  .ur-success-msg{font-size:0.9rem;color:var(--mid);line-height:1.7;margin-bottom:28px;max-width:340px;}
  .ur-success-steps{width:100%;display:flex;flex-direction:column;gap:10px;margin-bottom:28px;text-align:left;}
  .ur-success-step{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;background:var(--card);border-radius:8px;border:1px solid rgba(0,0,0,0.06);}
  .ur-success-step-num{width:24px;height:24px;border-radius:50%;background:var(--acc);color:#fff;font-size:0.72rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
  .ur-success-step-text{font-size:0.83rem;color:var(--mid);line-height:1.5;}
  .ur-success-step-text strong{color:var(--dark);display:block;margin-bottom:2px;}
  .ur-success-login-btn{width:100%;padding:13px;background:var(--acc);color:#fff;border:none;border-radius:var(--r);font-family:'DM Sans',sans-serif;font-size:0.95rem;font-weight:700;cursor:pointer;transition:background 0.15s;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;}
  .ur-success-login-btn:hover{background:var(--acc-d);}
  .ur-success-home{margin-top:12px;font-size:0.84rem;color:var(--muted);}
  .ur-success-home a{color:var(--acc);font-weight:600;text-decoration:none;}
  .ur-success-home a:hover{text-decoration:underline;}

  @media(max-width:480px){.ur-hdr{padding:0 16px;}.ur-card-body{padding:22px 20px 26px;}.ur-hero-inner{padding:32px 16px;}}
`;

const API_URL = 'http://localhost:5000/api';

const UserRegister = () => {
  const navigate = useNavigate();
  const { registerUser: authRegister } = useAuth();
  const { showNotification } = useNotification();

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [showCf, setShowCf]           = useState(false);
  const [errors, setErrors]           = useState({});
  const [submitErr, setSubmitErr]     = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [registered, setRegistered]   = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    injectHead();
    if (!document.getElementById('sah-ur-css')) {
      const s = document.createElement('style');
      s.id = 'sah-ur-css'; s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);

  const validate = () => {
    const e = {};
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email))
      e.email = 'Enter a valid email address.';
    if (!password || password.length < 8)
      e.password = 'Password must be at least 8 characters.';
    if (password !== confirm)
      e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setSubmitErr(''); setSubmitting(true);

    try {
      // Call backend API
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          role: 'USER',
          name: email.split('@')[0], // Default name from email
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          throw new Error('An account with this email already exists. Please log in instead.');
        } else {
          throw new Error(data.message || 'Registration failed');
        }
      }

      // Log the registration event
      try {
        await fetch(`${API_URL}/auth/log-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            role: 'USER',
            event: 'REGISTER',
          }),
        });
      } catch (logErr) {
        console.error('Failed to log event:', logErr);
      }

      // Show confirmation screen
      setRegisteredEmail(email.trim().toLowerCase());
      setRegistered(true);
      showNotification?.('✅ Account created! You can now log in.', 'success');
    } catch (err) {
      console.error('Registration error:', err);
      setSubmitErr(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fe = errors;

  /* ── Confirmation / success screen ── */
  if (registered) {
    return (
      <div className="ur-wrap">
        <header className="ur-hdr">
          <button className="ur-hdr-back" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left" /> Back to Directory
          </button>
          <div className="ur-hdr-div" />
          <Link to="/" className="ur-hdr-brand">SA Homeschooling</Link>
        </header>

        <div className="ur-hero">
          <div className="ur-hero-bg" />
          <div className="ur-hero-inner">
            <h1>Account <em>Created!</em></h1>
          </div>
        </div>

        <div className="ur-body">
          <div className="ur-card">
            <div className="ur-card-head" style={{ background: '#1a7a4a' }}>
              <h2><i className="fas fa-check-circle" style={{ marginRight: 9, fontSize: '1.1rem' }} /> Registration Successful</h2>
              <p>Your free account has been created</p>
            </div>
            <div className="ur-success-wrap">
              <div className="ur-success-icon">
                <i className="fas fa-check" />
              </div>
              <div className="ur-success-title">You're all set!</div>
              <div className="ur-success-email">{registeredEmail}</div>
              <p className="ur-success-msg">
                Your account has been successfully created. To access provider profiles and contact details, please log in using your email and password below.
              </p>

              <div className="ur-success-steps">
                <div className="ur-success-step">
                  <div className="ur-success-step-num">1</div>
                  <div className="ur-success-step-text">
                    <strong>Account created</strong>
                    Your details have been saved securely.
                  </div>
                </div>
                <div className="ur-success-step">
                  <div className="ur-success-step-num">2</div>
                  <div className="ur-success-step-text">
                    <strong>Log in to your account</strong>
                    Use your email and password to sign in from the homepage.
                  </div>
                </div>
                <div className="ur-success-step">
                  <div className="ur-success-step-num">3</div>
                  <div className="ur-success-step-text">
                    <strong>Browse providers</strong>
                    View full profiles, contact details and reviews.
                  </div>
                </div>
              </div>

              <button
                className="ur-success-login-btn"
                onClick={() => {
                  sessionStorage.setItem('sah_prefill_login_email', registeredEmail);
                  navigate('/');
                }}
              >
                <i className="fas fa-sign-in-alt" /> Go to Homepage &amp; Log In
              </button>
              <div className="ur-success-home">
                Are you a provider? <Link to="/register/provider">Register a service listing</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Registration form ── */
  return (
    <div className="ur-wrap">
      {/* Header */}
      <header className="ur-hdr">
        <button className="ur-hdr-back" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left" /> Back to Directory
        </button>
        <div className="ur-hdr-div" />
        <Link to="/" className="ur-hdr-brand">SA Homeschooling</Link>
      </header>

      {/* Hero */}
      <div className="ur-hero">
        <div className="ur-hero-bg" />
        <div className="ur-hero-inner">
          <h1>Join as a <em>Family</em></h1>
          <p>Browse verified tutors, therapists &amp; curriculum providers across South Africa</p>
        </div>
      </div>

      {/* Form */}
      <div className="ur-body">
        <div className="ur-card">
          <div className="ur-card-head">
            <h2><i className="fas fa-user-plus" style={{ marginRight: 9, color: 'var(--acc-l)', fontSize: '1.1rem' }} /> Create Your Account</h2>
            <p>Free account for homeschooling parents &amp; families</p>
          </div>
          <div className="ur-card-body">

            {submitErr && (
              <div className="ur-err-banner">
                <i className="fas fa-exclamation-triangle" /> {submitErr}
                {submitErr.includes('already exists') && (
                  <div style={{ marginTop: '8px' }}>
                    <Link to="/login" style={{ color: '#a00c2c', fontWeight: '700', textDecoration: 'underline' }}>
                      Click here to log in
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="ur-field">
              <label><i className="fas fa-envelope" /> Email Address <span style={{ color: 'var(--acc)' }}>*</span></label>
              <input
                type="email" value={email} placeholder="you@example.co.za"
                className={fe.email ? 'err' : ''}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
              />
              {fe.email && <div className="ur-field-err"><i className="fas fa-exclamation-circle" /> {fe.email}</div>}
            </div>

            <div className="ur-field">
              <label><i className="fas fa-lock" /> Password <span style={{ color: 'var(--acc)' }}>*</span></label>
              <div className="ur-pw">
                <input
                  type={showPw ? 'text' : 'password'} value={password} placeholder="Min. 8 characters"
                  className={fe.password ? 'err' : ''}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })); }}
                />
                <button type="button" className="ur-pw-eye" onClick={() => setShowPw(s => !s)}>
                  <i className={`far fa-eye${showPw ? '-slash' : ''}`} />
                </button>
              </div>
              {fe.password && <div className="ur-field-err"><i className="fas fa-exclamation-circle" /> {fe.password}</div>}
            </div>

            <div className="ur-field">
              <label><i className="fas fa-lock" /> Confirm Password <span style={{ color: 'var(--acc)' }}>*</span></label>
              <div className="ur-pw">
                <input
                  type={showCf ? 'text' : 'password'} value={confirm} placeholder="Repeat your password"
                  className={fe.confirm ? 'err' : ''}
                  onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })); }}
                />
                <button type="button" className="ur-pw-eye" onClick={() => setShowCf(s => !s)}>
                  <i className={`far fa-eye${showCf ? '-slash' : ''}`} />
                </button>
              </div>
              {fe.confirm && <div className="ur-field-err"><i className="fas fa-exclamation-circle" /> {fe.confirm}</div>}
            </div>

            <button className="ur-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <span className="ur-spin" /> : <i className="fas fa-user-plus" />}
              {submitting ? 'Creating Account…' : 'Create Free Account'}
            </button>

            <div className="ur-divider">
              <span /><p>Already have an account?</p><span />
            </div>

            <div className="ur-switch">
              <Link to="/login">Log in to your account</Link>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              Are you a provider? <Link to="/register/provider">Register here</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegister;