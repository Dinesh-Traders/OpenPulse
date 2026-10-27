/* ============================================
   OpenPulse — auth.js
   Supabase Auth — GitHub OAuth
   ============================================ */

const SUPABASE_URL = 'https://ixhwdzyppbaksacvcvwq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_t4mOxvddwoLL7Ggq8OCf4w_ff5CNl5U';

// Wait for Supabase CDN to load
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== DOM REFS =====
const loginBtn   = document.getElementById('loginBtn');
const logoutBtn  = document.getElementById('logoutBtn');
const userMenu   = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userName   = document.getElementById('userName');

// GitHub SVG icon string — reused
const GH_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57
  0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695
  -.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99
  .105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225
  -.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405
  c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225
  0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3
  0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
</svg>`;

// ===== INIT AUTH =====
async function initAuth() {
  try {
    // Check existing session (handles OAuth redirect automatically)
    const { data: { session }, error } = await sb.auth.getSession();

    if (error) {
      console.error('[OpenPulse Auth] getSession error:', error.message);
    }

    renderAuth(session?.user ?? null);

    // Live auth state listener
    sb.auth.onAuthStateChange((event, session) => {
      console.log('[OpenPulse Auth] event:', event);
      renderAuth(session?.user ?? null);
    });

  } catch (err) {
    console.error('[OpenPulse Auth] Init failed:', err.message);
    // Show login button as fallback
    showLoginBtn();
  }
}

// ===== RENDER AUTH STATE =====
function renderAuth(user) {
  if (user) {
    // ---- LOGGED IN ----
    loginBtn.style.display  = 'none';
    userMenu.removeAttribute('hidden');
    userMenu.style.display  = 'flex';

    const avatar = user.user_metadata?.avatar_url || '';
    const name   = user.user_metadata?.user_name   ||
                   user.user_metadata?.name        ||
                   user.email?.split('@')[0]       ||
                   'User';

    if (avatar) {
      userAvatar.src = avatar;
      userAvatar.alt = name;
      userAvatar.style.display = 'block';
    } else {
      userAvatar.style.display = 'none';
    }

    userName.textContent = name;
    console.log('[OpenPulse Auth] Logged in as:', name, '|', user.email);

  } else {
    // ---- LOGGED OUT ----
    showLoginBtn();
  }
}

function showLoginBtn() {
  loginBtn.style.display = 'inline-flex';
  loginBtn.disabled      = false;
  loginBtn.innerHTML     = `${GH_ICON}<span class="btn-login-text">Sign in</span>`;
  userMenu.setAttribute('hidden', '');
  userMenu.style.display = 'none';
}

// ===== GITHUB LOGIN =====
async function loginWithGitHub() {
  // Show loading state
  loginBtn.disabled  = true;
  loginBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
         style="animation:spin 0.7s linear infinite" aria-hidden="true">
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/><path d="M8 16H3v5"/>
    </svg>
    <span class="btn-login-text">Signing in...</span>`;

  const redirectTo = window.location.origin + window.location.pathname;

  const { error } = await sb.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo,
      scopes: 'read:user user:email',
    },
  });

  if (error) {
    console.error('[OpenPulse Auth] OAuth error:', error.message);
    showLoginBtn();
    // Show brief error message
    const errMsg = document.createElement('span');
    errMsg.style.cssText = 'font-size:12px;color:#DC2626;margin-left:8px';
    errMsg.textContent = 'Login failed. Try again.';
    loginBtn.insertAdjacentElement('afterend', errMsg);
    setTimeout(() => errMsg.remove(), 3000);
  }
  // No error = browser redirects to GitHub → comes back with session
}

// ===== LOGOUT =====
async function logout() {
  logoutBtn.textContent = 'Signing out...';
  logoutBtn.disabled    = true;

  const { error } = await sb.auth.signOut();
  if (error) {
    console.error('[OpenPulse Auth] Logout error:', error.message);
  }
  showLoginBtn();
}

// ===== EVENTS =====
loginBtn?.addEventListener('click', loginWithGitHub);
logoutBtn?.addEventListener('click', logout);

// ===== START =====
document.addEventListener('DOMContentLoaded', initAuth);

// Export for use in app.js or other modules
window.OpenPulseAuth = {
  sb,
  getUser:    () => sb.auth.getUser(),
  getSession: () => sb.auth.getSession(),
  isLoggedIn: async () => {
    const { data: { user } } = await sb.auth.getUser();
    return !!user;
  },
};
