/* ============================================
   OpenPulse — app.js
   Real GitHub Good First Issue Finder
   ============================================ */

const App = (() => {

  // ===== CONFIG =====
  const LABEL       = 'good first issue';   // single source of truth
  const PER_PAGE    = 30;
  const DEBOUNCE_MS = 350;

  // GitHub linguist color map
  const LANG_COLORS = {
    python:     '#4B8BBE',
    javascript: '#F7DF1E',
    typescript: '#3178C6',
    go:         '#29BEB0',
    rust:       '#CE422B',
    java:       '#E76F00',
    'c++':      '#9C4221',
    ruby:       '#CC342D',
    php:        '#777BB4',
    swift:      '#F05138',
    kotlin:     '#A97BFF',
    c:          '#555555',
    shell:      '#89E051',
    dart:       '#00B4AB',
    scala:      '#DC322F',
    elixir:     '#6E4A7E',
  };

  // Labels to hide from cards (too common, shown via badge already)
  const SKIP_LABELS = new Set([
    'good first issue', 'good-first-issue',
    'help wanted', 'help-wanted',
    'beginner', 'easy', 'starter',
  ]);

  // ===== STATE =====
  let allIssues    = [];
  let filtered     = [];
  let totalCount   = 0;      // GitHub's real total_count
  let page         = 1;
  let activeLang   = '';
  let activeSort   = 'created';
  let searchQuery  = '';
  let isLoading    = false;
  let debounceTimer;

  // ===== DOM REFS =====
  const grid        = document.getElementById('issuesGrid');
  const countEl     = document.getElementById('resultsCount');
  const emptyEl     = document.getElementById('emptyState');
  const errorEl     = document.getElementById('errorState');
  const errorTitle  = document.getElementById('errorTitle');
  const errorBody   = document.getElementById('errorBody');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const refreshBtn  = document.getElementById('refreshBtn');
  const searchInput = document.getElementById('searchInput');
  const clearBtn    = document.getElementById('clearSearch');
  const heroStats   = document.getElementById('heroStats');
  const sortSelect  = document.getElementById('sortSelect');

  // ===== GITHUB API =====
  async function fetchIssues(lang, sort) {
    // Use LABEL constant — one label, clean query
    let q = `is:issue is:open label:"${LABEL}"`;
    if (lang) q += ` language:${lang}`;

    // Always use direct GitHub API — /api/issues proxy only on Vercel production
    const isVercel = location.hostname !== 'localhost' &&
                     location.hostname !== '127.0.0.1' &&
                     location.protocol !== 'file:' &&
                     !location.hostname.includes('::');

    const base = isVercel
      ? `/api/issues`
      : `https://api.github.com/search/issues`;

    const url = `${base}?q=${encodeURIComponent(q)}&sort=${sort}&order=desc&per_page=${PER_PAGE}`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github+json' },
    });

    // Parse body regardless — error details are in it
    const data = await res.json().catch(() => ({}));

    if (res.status === 403 || res.status === 429 || res.status === 422) {
      const msg = data.message || '';
      throw new Error(
        msg.toLowerCase().includes('rate limit') || res.status === 429
          ? 'rate_limit'
          : msg || `api_${res.status}`
      );
    }

    if (!res.ok) throw new Error(`api_${res.status}`);

    totalCount = data.total_count ?? 0;   // real GitHub total, not just 30
    return data.items || [];
  }

  // ===== LOAD =====
  async function loadIssues() {
    if (isLoading) return;
    isLoading = true;
    setLoading(true);

    try {
      allIssues = await fetchIssues(activeLang, activeSort);
      page = 1;
      applyFilters();
      renderHeroStats();
    } catch (err) {
      console.error('[OpenPulse]', err.message);
      showError(err.message);
    } finally {
      isLoading = false;
      setLoading(false);
    }
  }

  // ===== FILTER (client-side search only) =====
  function applyFilters() {
    const q = searchQuery.trim().toLowerCase();

    filtered = q
      ? allIssues.filter(issue => {
          const repo  = repoSlug(issue).toLowerCase();
          const title = issue.title.toLowerCase();
          return title.includes(q) || repo.includes(q);
        })
      : allIssues.slice();

    renderIssues(filtered.slice(0, page * PER_PAGE));
    renderCount(filtered.length);
    loadMoreBtn.style.display =
      filtered.length > page * PER_PAGE ? 'inline-flex' : 'none';
  }

  // ===== RENDER CARDS =====
  function renderIssues(issues) {
    hideStates();
    grid.innerHTML = '';

    if (issues.length === 0) {
      emptyEl.hidden = false;
      countEl.textContent = '0 issues found';
      return;
    }

    const frag = document.createDocumentFragment();
    issues.forEach(issue => frag.appendChild(buildCard(issue)));
    grid.appendChild(frag);
  }

  // ===== BUILD CARD =====
  function buildCard(issue) {
    const [owner, repo] = repoSlug(issue).split('/');
    const avatarSrc     = `https://github.com/${encodeURIComponent(owner)}.png?size=40`;
    const lang          = detectLang(issue);
    const langColor     = lang ? (LANG_COLORS[lang.toLowerCase()] || '#94A3B8') : null;
    const timeAgo       = relativeTime(issue.created_at);

    // Labels — skip common ones already shown via gfi badge
    const extraLabels = (issue.labels || [])
      .filter(l => !SKIP_LABELS.has(l.name.toLowerCase()))
      .slice(0, 3);

    const labelsHtml = [
      `<span class="label label-gfi">good first issue</span>`,
      ...extraLabels.map(lbl => {
        const cls   = labelClass(lbl.name);
        // Use GitHub's hex colour if available, else fall back to CSS class
        if (lbl.color && cls === 'label-default') {
          const hex = `#${lbl.color}`;
          return `<span class="label label-default" style="background:${hex}18;border-color:${hex}44;color:${hex}">${esc(lbl.name)}</span>`;
        }
        return `<span class="label ${cls}">${esc(lbl.name)}</span>`;
      }),
    ].join('');

    const langHtml = lang && langColor
      ? `<span class="lang-tag">
           <span class="lang-dot-sm" style="background:${langColor}" aria-hidden="true"></span>
           ${esc(lang)}
         </span>`
      : '';

    const card = document.createElement('a');
    card.className = 'issue-card';
    card.href      = issue.html_url;
    card.target    = '_blank';
    card.rel       = 'noopener noreferrer';
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', `${esc(issue.title)} in ${owner}/${repo}`);

    card.innerHTML = `
      <div class="card-header">
        <div class="repo-info">
          <img class="repo-avatar"
               src="${avatarSrc}"
               alt="${esc(owner)}"
               width="20" height="20"
               loading="lazy"
               onerror="this.replaceWith(document.createTextNode(''))"/>
          <span class="repo-name">
            <strong>${esc(owner)}</strong>&#8202;/&#8202;${esc(repo)}
          </span>
        </div>
        <span class="issue-num" aria-label="Issue number ${issue.number}">#${issue.number}</span>
      </div>

      <p class="card-title" title="${esc(issue.title)}">${esc(issue.title)}</p>

      <div class="card-labels" aria-label="Labels">${labelsHtml}</div>

      <div class="card-footer">
        <div class="card-meta">
          <span class="meta-item" aria-label="${issue.comments} comments">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            ${Number(issue.comments).toLocaleString()}
          </span>
          <span class="meta-item" aria-label="Opened ${timeAgo}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            ${timeAgo}
          </span>
        </div>
        ${langHtml}
      </div>
    `;

    return card;
  }

  // ===== HERO STATS =====
  function renderHeroStats() {
    const repos = new Set(allIssues.map(i => i.repository_url)).size;
    // Use real total_count from GitHub, not just the 30 we fetched
    const total = totalCount > 0
      ? totalCount.toLocaleString() + '+'
      : allIssues.length.toString();

    heroStats.innerHTML = `
      <div class="stat-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        <span class="stat-num">${total}</span> open issues
      </div>
      <div class="stat-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65S9.04 17.38 9 18v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        <span class="stat-num">${repos}</span> repositories
      </div>
      <div class="stat-item">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
        beginner friendly
      </div>
    `;
  }

  // ===== COUNT =====
  function renderCount(n) {
    const parts = [];
    if (activeLang) parts.push(activeLang);
    if (searchQuery.trim()) parts.push(`"${searchQuery.trim()}"`);
    const suffix = parts.length ? ` · ${parts.join(' · ')}` : '';
    countEl.textContent =
      `${n.toLocaleString()} issue${n !== 1 ? 's' : ''}${suffix}`;
  }

  // ===== LOADING =====
  function setLoading(on) {
    if (on) {
      grid.innerHTML = Array(6)
        .fill('<div class="skeleton-card" aria-hidden="true"></div>')
        .join('');
      hideStates();
      loadMoreBtn.style.display = 'none';
      countEl.textContent = 'Fetching live issues from GitHub…';
      refreshBtn.classList.add('spinning');
      heroStats.innerHTML = `
        <div class="stat-item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M8 16H3v5"/></svg>
          <span class="stat-loading">Loading live data…</span>
        </div>`;
    } else {
      refreshBtn.classList.remove('spinning');
    }
  }

  // ===== ERROR =====
  function showError(code) {
    grid.innerHTML = '';
    hideStates();
    errorEl.hidden = false;
    loadMoreBtn.style.display = 'none';
    countEl.textContent = 'Failed to load';

    const isRateLimit = code === 'rate_limit';
    errorTitle.textContent = isRateLimit
      ? 'GitHub API rate limit reached'
      : 'Could not load issues';
    errorBody.textContent = isRateLimit
      ? 'GitHub allows 60 unauthenticated requests per hour. Wait a few minutes, then retry.'
      : 'There was a problem fetching data from GitHub. Check your connection and try again.';

    heroStats.innerHTML = `
      <div class="stat-item" style="border-color:#FECACA;color:#DC2626">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        ${isRateLimit ? 'Rate limit reached — retry in a few minutes' : 'Failed to load — check connection'}
      </div>`;
  }

  function hideStates() {
    emptyEl.hidden = true;
    errorEl.hidden = true;
  }

  // ===== HELPERS =====
  function repoSlug(issue) {
    const parts = (issue.repository_url || '').split('/');
    return `${parts[parts.length - 2] || ''}/${parts[parts.length - 1] || ''}`;
  }

  function labelClass(name) {
    const n = name.toLowerCase();
    if (n.includes('bug') || n.includes('fix'))          return 'label-bug';
    if (n.includes('doc') || n.includes('document'))     return 'label-doc';
    if (n.includes('help'))                               return 'label-help';
    return 'label-default';
  }

  function detectLang(issue) {
    // 1. Check issue labels for a language name
    const fromLabel = (issue.labels || [])
      .map(l => l.name.toLowerCase())
      .find(n => LANG_COLORS[n]);
    if (fromLabel) return fromLabel;

    // 2. Scan title for language keywords
    const title = issue.title.toLowerCase();
    return Object.keys(LANG_COLORS).find(l => title.includes(l)) || null;
  }

  function relativeTime(dateStr) {
    const ms    = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(ms / 60_000);
    const hours = Math.floor(ms / 3_600_000);
    const days  = Math.floor(ms / 86_400_000);
    const months= Math.floor(days / 30);
    if (mins  <  1)  return 'just now';
    if (mins  < 60)  return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    if (days  < 30)  return `${days}d ago`;
    if (months < 12) return `${months}mo ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ===== EVENTS =====
  function bindEvents() {

    // Language filter
    document.getElementById('langFilters').addEventListener('click', e => {
      const btn = e.target.closest('.pill');
      if (!btn) return;

      document.querySelectorAll('.pill').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');

      activeLang = btn.dataset.lang;
      loadIssues();
    });

    // Sort
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      loadIssues();
    });

    // Search — debounced, client-side only
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      clearBtn.hidden = searchQuery.length === 0;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilters, DEBOUNCE_MS);
    });

    // Clear search
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.hidden = true;
      searchInput.focus();
      applyFilters();
    });

    // Refresh
    refreshBtn.addEventListener('click', () => {
      if (!isLoading) loadIssues();
    });

    // Load more — slice next page from already-fetched results
    loadMoreBtn.addEventListener('click', () => {
      page++;
      renderIssues(filtered.slice(0, page * PER_PAGE));
      loadMoreBtn.style.display =
        filtered.length > page * PER_PAGE ? 'inline-flex' : 'none';
    });

    // Keyboard: Escape clears search
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Escape' && searchQuery) {
        searchInput.value = '';
        searchQuery = '';
        clearBtn.hidden = true;
        applyFilters();
      }
    });
  }

  // ===== INIT =====
  function init() {
    bindEvents();
    loadIssues();
  }

  return { init };

})();

document.addEventListener('DOMContentLoaded', App.init);
