/* ============================================
   OpenPulse — auth.js
   Supabase Auth — GitHub OAuth + Email/Password
   ============================================ */

const SUPABASE_URL = 'https://ixhwdzyppbaksacvcvwq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_t4mOxvddwoLL7Ggq8OCf4w_ff5CNl5U';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================================
   GOOGLE SHEETS INTEGRATION (commented out)
   ============================================
   
   Ye feature Supabase ke saath simultaneously
   chal sakta hai — activate karne ke liye:
   
   1. Google Apps Script deploy karo as Web App:
      - script.google.com → New Project
      - Neeche wala GAS code paste karo
      - Deploy → Web App → Anyone can access
      - Web App URL copy karo
   
   2. GOOGLE_SHEET_URL variable mein paste karo
   
   3. Is pura block ko uncomment karo
   
   -----------------------------------------------
   
   const GOOGLE_SHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
   
   // User data Google Sheet mein save karo
   async function saveToGoogleSheet(user, eventType) {
     try {
       const payload = {
         event:      eventType,           // 'signup' ya 'login'
         email:      user.email || '',
         username:   user.user_metadata?.user_name || user.user_metadata?.name || '',
         provider:   user.app_metadata?.provider || 'email',
         userId:     user.id,
         timestamp:  new Date().toISOString(),
       };
   
       await fetch(GOOGLE_SHEET_URL, {
         method:  'POST',
         mode:    'no-cors',              // Google Apps Script needs this
         headers: { 'Content-Type': 'application/json' },
         body:    JSON.stringify(payload),
       });
   
       console.log('[OpenPulse] Google Sheet updated:', eventType);
     } catch (err) {
       // Non-blocking — Sheet error should not break auth flow
       console.warn('[OpenPulse] Google Sheet sync failed:', err.message);
     }
   }
   
   // -----------------------------------------------
   // Google Apps Script Code (paste in script.google.com):
   // -----------------------------------------------
   //
   // function doPost(e) {
   //   try {
   //     const data   = JSON.parse(e.postData.contents);
   //     const sheet  = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
   //
   //     // Add header row if sheet is empty
   //     if (sheet.getLastRow() === 0) {
   //       sheet.appendRow(['Timestamp', 'Event', 'Email', 'Username', 'Provider', 'UserID']);
   //     }
   //
   //     sheet.appendRow([
   //       data.timestamp,
   //       data.event,
   //       data.email,
   //       data.username,
   //       data.provider,
   //       data.userId,
   //     ]);
   //
   //     return ContentService
   //       .createTextOutput(JSON.stringify({ status: 'ok' }))
   //       .setMimeType(ContentService.MimeType.JSON);
   //   } catch(err) {
   //     return ContentService
   //       .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
   //       .setMimeType(ContentService.MimeType.JSON);
   //   }
   // }
   
   ============================================ */

// ===== DOM REFS =====
// Navbar
const navLoginBtn  = document.getElementById('loginBtn');
const logoutBtn    = document.getElementById('logoutBtn');
const userMenu     = document.getElementById('userMenu');
const userAvatar   = document.getElementById('userAvatar');
const userName     = document.getElementById('userName');

// Modal
const authOverlay    = document.getElementById('authOverlay');
const authClose      = document.getElementById('authClose');
const tabLogin       = document.getElementById('tabLogin');
const tabSignup      = document.getElementById('tabSignup');
const panelLogin     = document.getElementById('panelLogin');
const panelSignup    = document.getElementById('panelSignup');
const panelForgot    = document.getElementById('panelForgot');

// Login form
const loginForm      = document.getElementById('loginForm');
const loginEmail     = document.getElementById('loginEmail');
const loginPassword  = document.getElementById('loginPassword');
const loginEmailErr  = document.getElementById('loginEmailErr');
const loginPwErr     = document.getElementById('loginPwErr');
const loginMsg       = document.getElementById('loginMsg');
const loginSubmit    = document.getElementById('loginSubmit');

// Signup form
const signupForm        = document.getElementById('signupForm');
const signupEmail       = document.getElementById('signupEmail');
const signupPassword    = document.getElementById('signupPassword');
const signupConfirm     = document.getElementById('signupConfirm');
const signupEmailErr    = document.getElementById('signupEmailErr');
const signupPwErr       = document.getElementById('signupPwErr');
const signupConfirmErr  = document.getElementById('signupConfirmErr');
const signupMsg         = document.getElementById('signupMsg');
const signupSubmit      = document.getElementById('signupSubmit');

// Forgot form
const forgotBtn    = document.getElementById('forgotBtn');
const backToLogin  = document.getElementById('backToLogin');
const forgotForm   = document.getElementById('forgotForm');
const forgotEmail  = document.getElementById('forgotEmail');
const forgotEmailErr = document.getElementById('forgotEmailErr');
const forgotMsg    = document.getElementById('forgotMsg');
const forgotSubmit = document.getElementById('forgotSubmit');

// GitHub buttons
const githubLoginBtn  = document.getElementById('githubLoginBtn');
const githubSignupBtn = document.getElementById('githubSignupBtn');

// =====================
// MODAL OPEN / CLOSE
// =====================
function openModal(tab = 'login') {
  authOverlay.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  switchTab(tab);
  // Focus first input after animation
  setTimeout(() => {
    const first = authOverlay.querySelector('input:not([hidden])');
    first?.focus();
  }, 250);
}

function closeModal() {
  authOverlay.setAttribute('hidden', '');
  document.body.style.overflow = '';
  clearAllErrors();
}

// Close on overlay click
authOverlay?.addEventListener('click', (e) => {
  if (e.target === authOverlay) closeModal();
});

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !authOverlay.hasAttribute('hidden')) closeModal();
});

authClose?.addEventListener('click', closeModal);

// =====================
// TABS
// =====================
function switchTab(tab) {
  clearAllErrors();

  if (tab === 'login') {
    tabLogin.classList.add('active');
    tabLogin.setAttribute('aria-selected', 'true');
    tabSignup.classList.remove('active');
    tabSignup.setAttribute('aria-selected', 'false');
    panelLogin.removeAttribute('hidden');
    panelSignup.setAttribute('hidden', '');
    panelForgot.setAttribute('hidden', '');
  } else {
    tabSignup.classList.add('active');
    tabSignup.setAttribute('aria-selected', 'true');
    tabLogin.classList.remove('active');
    tabLogin.setAttribute('aria-selected', 'false');
    panelSignup.removeAttribute('hidden');
    panelLogin.setAttribute('hidden', '');
    panelForgot.setAttribute('hidden', '');
  }
}

tabLogin?.addEventListener('click',  () => switchTab('login'));
tabSignup?.addEventListener('click', () => switchTab('signup'));

// =====================
// FORGOT PASSWORD PANEL
// =====================
forgotBtn?.addEventListener('click', () => {
  panelLogin.setAttribute('hidden', '');
  panelForgot.removeAttribute('hidden');
  forgotEmail.value = loginEmail.value; // pre-fill email
  forgotEmail.focus();
});

backToLogin?.addEventListener('click', () => {
  panelForgot.setAttribute('hidden', '');
  panelLogin.removeAttribute('hidden');
});

// =====================
// SHOW PASSWORD TOGGLE
// =====================
document.querySelectorAll('.toggle-pw').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    const isText = target.type === 'text';
    target.type = isText ? 'password' : 'text';
    btn.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
    // Swap icon
    btn.innerHTML = isText
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  });
});

// =====================
// VALIDATION HELPERS
// =====================
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function setFieldError(el, msg) {
  el.textContent = msg;
  // Highlight parent input
  const input = el.previousElementSibling?.querySelector('input') ||
                el.previousElementSibling;
  input?.classList.toggle('error', !!msg);
}

function setMsg(el, msg, type = 'error') {
  el.textContent = msg;
  el.className = `form-msg ${msg ? type : ''}`;
}

function clearAllErrors() {
  [loginEmailErr, loginPwErr, loginMsg,
   signupEmailErr, signupPwErr, signupConfirmErr, signupMsg,
   forgotEmailErr, forgotMsg].forEach(el => {
    if (el) { el.textContent = ''; el.className = 'form-msg'; }
  });
  document.querySelectorAll('.auth-form input.error')
    .forEach(i => i.classList.remove('error'));
}

function setLoading(btn, loading, originalText) {
  btn.disabled = loading;
  btn.textContent = loading ? 'Please wait...' : originalText;
}

// =====================
// GITHUB OAUTH
// =====================
async function loginWithGitHub() {
  const redirectTo = window.location.origin + window.location.pathname;
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo, scopes: 'read:user user:email' },
  });
  if (error) {
    setMsg(loginMsg, error.message);
  }
  // No error = browser redirects to GitHub automatically
}

githubLoginBtn?.addEventListener('click',  loginWithGitHub);
githubSignupBtn?.addEventListener('click', loginWithGitHub);

// =====================
// EMAIL LOGIN
// =====================
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  const email = loginEmail.value.trim();
  const pw    = loginPassword.value;
  let valid   = true;

  if (!isValidEmail(email)) {
    setFieldError(loginEmailErr, 'Enter a valid email address.');
    valid = false;
  }
  if (pw.length < 6) {
    setFieldError(loginPwErr, 'Password must be at least 6 characters.');
    valid = false;
  }
  if (!valid) return;

  setLoading(loginSubmit, true, 'Sign in');

  const { data, error } = await sb.auth.signInWithPassword({ email, password: pw });

  setLoading(loginSubmit, false, 'Sign in');

  if (error) {
    if (error.message.toLowerCase().includes('invalid')) {
      setMsg(loginMsg, 'Incorrect email or password. Please try again.');
    } else if (error.message.toLowerCase().includes('confirm')) {
      setMsg(loginMsg, 'Please confirm your email before signing in. Check your inbox.');
    } else {
      setMsg(loginMsg, error.message);
    }
    return;
  }

  // Success
  closeModal();
  renderAuth(data.user);
});

// =====================
// EMAIL SIGNUP
// =====================
signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  const email   = signupEmail.value.trim();
  const pw      = signupPassword.value;
  const confirm = signupConfirm.value;
  let valid     = true;

  if (!isValidEmail(email)) {
    setFieldError(signupEmailErr, 'Enter a valid email address.');
    valid = false;
  }
  if (pw.length < 8) {
    setFieldError(signupPwErr, 'Password must be at least 8 characters.');
    valid = false;
  }
  if (pw !== confirm) {
    setFieldError(signupConfirmErr, 'Passwords do not match.');
    valid = false;
  }
  if (!valid) return;

  setLoading(signupSubmit, true, 'Create account');

  const { data, error } = await sb.auth.signUp({
    email,
    password: pw,
    options: {
      emailRedirectTo: window.location.origin + window.location.pathname,
    },
  });

  setLoading(signupSubmit, false, 'Create account');

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      setMsg(signupMsg, 'An account with this email already exists. Try signing in.');
    } else {
      setMsg(signupMsg, error.message);
    }
    return;
  }

  // Supabase sends confirmation email
  setMsg(signupMsg,
    'Account created! Check your email to confirm your address before signing in.',
    'success'
  );
  signupForm.reset();
});

// =====================
// FORGOT PASSWORD
// =====================
forgotForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  const email = forgotEmail.value.trim();

  if (!isValidEmail(email)) {
    setFieldError(forgotEmailErr, 'Enter a valid email address.');
    return;
  }

  setLoading(forgotSubmit, true, 'Send reset link');

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/reset-password',
  });

  setLoading(forgotSubmit, false, 'Send reset link');

  if (error) {
    setMsg(forgotMsg, error.message);
    return;
  }

  setMsg(forgotMsg,
    `Reset link sent to ${email}. Check your inbox (and spam folder).`,
    'success'
  );
  forgotForm.reset();
});

// =====================
// RENDER AUTH STATE
// =====================
function renderAuth(user) {
  if (user) {
    // Logged in — show user menu
    navLoginBtn.style.display = 'none';
    userMenu.removeAttribute('hidden');
    userMenu.style.display = 'flex';

    const avatar = user.user_metadata?.avatar_url || '';
    const name   = user.user_metadata?.user_name  ||
                   user.user_metadata?.name       ||
                   user.email?.split('@')[0]      ||
                   'User';

    userAvatar.src     = avatar;
    userAvatar.alt     = name;
    userAvatar.style.display = avatar ? 'block' : 'none';
    userName.textContent     = name;

  } else {
    // Logged out — show login button
    navLoginBtn.style.display = 'inline-flex';
    userMenu.setAttribute('hidden', '');
    userMenu.style.display = 'none';
  }
}

// =====================
// LOGOUT
// =====================
logoutBtn?.addEventListener('click', async () => {
  logoutBtn.textContent = 'Signing out...';
  logoutBtn.disabled    = true;
  await sb.auth.signOut();
  renderAuth(null);
  logoutBtn.textContent = 'Sign out';
  logoutBtn.disabled    = false;
});

// =====================
// INIT
// =====================
async function initAuth() {
  try {
    const { data: { session } } = await sb.auth.getSession();
    renderAuth(session?.user ?? null);

    sb.auth.onAuthStateChange((_event, session) => {
      renderAuth(session?.user ?? null);
      // Close modal on successful login
      if (session?.user && !authOverlay.hasAttribute('hidden')) {
        closeModal();
      }
      /* Google Sheets sync — uncomment when GOOGLE_SHEET_URL is set:
      if (session?.user && _event === 'SIGNED_IN') {
        saveToGoogleSheet(session.user, 'login');
      }
      if (session?.user && _event === 'USER_UPDATED') {
        saveToGoogleSheet(session.user, 'signup');
      }
      */
    });
  } catch (err) {
    console.error('[OpenPulse Auth]', err.message);
    renderAuth(null);
  }
}

// Open modal on navbar login button click
navLoginBtn?.addEventListener('click', () => openModal('login'));

document.addEventListener('DOMContentLoaded', initAuth);

// Export
window.OpenPulseAuth = {
  sb,
  openModal,
  closeModal,
  getUser:    () => sb.auth.getUser(),
  getSession: () => sb.auth.getSession(),
};
