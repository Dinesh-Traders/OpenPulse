/* ============================================
   OpenPulse — auth.js
   Supabase Auth — GitHub OAuth
   ============================================ */

const SUPABASE_URL  = 'https://ixhwdzyppbaksacvcvwq.supabase.co';
const SUPABASE_KEY  = 'sb_publishable_t4mOxvddwoLL7Ggq8OCf4w_ff5CNl5U';

const { createClient } = window.supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ===== DOM =====
const loginBtn   = document.getElementById('loginBtn');
const logoutBtn  = document.getElementById('logoutBtn');
const userMenu   = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const userName   = document.getElementById('userName');

// ===== INIT AUTH =====
async function initAuth() {
  // Handle OAuth redirect — Supabase sets session in URL hash
  const { data: { session } } = await sb.auth.getSession();
  renderAuth(session?.user ?? null);

  // Listen for auth state changes (login / logout)
  sb.auth.onAuthStateChange((_event, session) => {
    renderAuth(session?.user ?? null);
  });
}

// ===== RENDER AUTH STATE =====
function renderAuth(user) {
  if (user) {
    // Logged in
    loginBtn.hidden  = true;
    userMenu.hidden  = false;

    const avatar = user.user_metadata?.avatar_url || '';
    const name   = user.user_metadata?.user_name ||
                   user.user_metadata?.name ||
                   user.email?.split('@')[0] ||
                   'User';

    userAvatar.src = avatar;
    userAvatar.alt = name;
    userName.textContent = name;

    console.log('[OpenPulse] Logged in as:', name);
  } else {
    // Logged out
    loginBtn.hidden  = false;
    userMenu.hidden  = true;
  }
}

// ===== GITHUB LOGIN =====
async function loginWithGitHub() {
  loginBtn.disabled = true;
  loginBtn.textContent = 'Signing in...';

  const redirectTo = window.location.origin + window.location.pathname;

  const { error } = await sb.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo,
      scopes: 'read:user user:email',
    },
  });

  if (error) {
    console.error('[OpenPulse] Login error:', error.message);
    loginBtn.disabled = false;
    loginBtn.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
      Sign in with GitHub`;
  }
  // If no error — browser redirects to GitHub automatically
}

// ===== LOGOUT =====
async function logout() {
  await sb.auth.signOut();
  renderAuth(null);
}

// ===== EVENTS =====
loginBtn?.addEventListener('click', loginWithGitHub);
logoutBtn?.addEventListener('click', logout);

// ===== START =====
document.addEventListener('DOMContentLoaded', initAuth);

// Export for other modules
window.OpenPulseAuth = { sb, getUser: () => sb.auth.getUser() };
