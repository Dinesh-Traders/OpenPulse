/* =============================================
   OpenPulse — app.js
   Real GitHub Good First Issue Finder
   ============================================= */

const App = (() => {

  // ===== CONFIG =====
  // One label per fetch — most issues only have ONE of these labels
  const LABEL = 'good first issue';
  const PER_PAGE = 30;
  const DEBOUNCE_MS = 400;

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
  };

  // ===== STATE =====
  let allIssues   = [];
  let filtered    = [];
  let page        = 1;
  let activeLang  = '';
  let activeSort  = 'created';
  let searchQuery = '';
  let isLoading   = false;

  // ===== DOM REFS =====
  const grid        = document.getElementById('issuesGrid');
  const countEl     = document.getElementById('resultsCount');
  const emptyEl     = document.getElementById('emptyState');
  const errorEl     = document.getElementById('errorState');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const refreshBtn  = document.getElementById('refreshBtn');
  const searchInput = document.getElementById('searchInput');
  const clearBtn    = document.getElementById('clearSearch');
  const heroStats   = document.getElementById('heroStats');
  const sortSelect  = document.getElementById('sortSelect');

  // ===== GITHUB API FETCH =====
  async function fetchIssues(lang, sort) {
    // Simple clean query — one label, optional language
    let q = `is:issue is:open label:"good first issue"`;
    if (lang) q += ` language:${lang}`;

    const url = `https://api.github.com/search/issues` +
      `?q=${encodeURIComponent(q)}` +
      `&sort=${sort}&order=desc&per_page=${PER_PAGE}`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });

    // Rate limit
    if (res.status === 403 || res.status === 422) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || 'rate_limit');
    }
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

    const data = await res.json();
    return data.items || [];
  }

  // ===== LOAD DATA =====
  async function loadIssues() {
    if (isLoading) return;
    isLoading = true;
    setLoading(true);

    try {
      allIssues = await fetchIssues(activeLang, activeSort);
      page = 1;
      applyFilters();
      updateHeroStats(allIssues);
    } catch (err) {
      console.error('OpenPulse fetch error:', err.message);
      showError(err.message);
    } finally {
      isLoading = false;
      setLoading(false);
    }
  }

  // ===== FILTER =====
  function applyFilters() {
    const q = searchQuery.toLowerCase().trim();

    filtered = allIssues.filter(issue => {
      if (!q) return true;
      const repo  = issue.repository_url?.split('/').slice(-2).join('/').toLowerCase() || '';
      const title = issue.title.toLowerCase();
      return title.includes(q) || repo.includes(q);
    });

    renderIssues(filtered.slice(0, page * PER_PAGE));
    updateCount(filtered.length);
    loadMoreBtn.style.display =
      filtered.length > page * PER_PAGE ? 'inline-flex' : 'none';
  }

  // ===== RENDER CARDS =====
  function renderIssues(issues) {
    grid.innerHTML = '';
    emptyEl.style.display = 'none';
    errorEl.style.display = 'none';

    if (issues.length === 0) {
      emptyEl.style.display = 'block';
      countEl.textContent   = '0 issues found';
      return;
    }

    const frag = document.createDocumentFragment();
    issues.forEach(issue => frag.appendChild(buildCard(issue)));
    grid.appendChild(frag);
  }

  // ===== BUILD CARD =====
  function buildCard(issue) {
    const parts     = issue.repository_url?.split('/') || [];
    const repoOwner = parts[parts.length - 2] || '';
    const repoName  = parts[parts.length - 1] || '';
    const avatarUrl = `https://github.com/${repoOwner}.png?size=40`;

    // Language from issue labels or detect from title
    const lang      = detectLang(issue);
    const langColor = LANG_COLORS[lang?.toLowerCase()] || null;
    const timeAgo   = getTimeAgo(issue.created_at);

    // Labels — skip generic ones, show meaningful ones
    const skipLabels = new Set(['good first issue','good-first-issue','help wanted']);
    const labelsHtml = (issue.labels || [])
      .filter(l => !skipLabels.has(l.name.toLowerCase()))
      .slice(0, 3)
      .map(lbl => {
        const cls   = getLabelClass(lbl.name);
        const color = lbl.color ? `#${lbl.color}` : null;
        const style = color
          ? `style="background:${color}18;border-color:${color}55;color:${color}"`
          : '';
        return `<span class="label ${cls}" ${style}>${escHtml(lbl.name)}</span>`;
      }).join('');

    // Always show "good first issue" badge
    const gfiBadge = `<span class="label label-gfi">good first issue</span>`;

    const card = document.createElement('a');
    card.className = 'issue-card';
    card.href      = issue.html_url;
    card.target    = '_blank';
    card.rel       = 'noopener noreferrer';

    card.innerHTML = `
      <div class="card-top">
        <div class="repo-info">
          <img class="repo-avatar"
               src="${avatarUrl}"
               alt="${escHtml(repoOwner)}"
               loading="lazy"
               onerror="this.style.display='none'"/>
          <span class="repo-name">
            <strong>${escHtml(repoOwner)}</strong> / ${escHtml(repoName)}
          </span>
        </div>
        <span class="issue-number">#${issue.number}</span>
      </div>

      <div class="issue-title">${escHtml(issue.title)}</div>

      <div class="issue-labels">
        ${gfiBadge}
        ${labelsHtml}
      </div>

      <div class="card-footer">
        <div class="card-meta">
          <span><i class="fas fa-comment-alt"></i> ${issue.comments}</span>
          <span><i class="fas fa-clock"></i> ${timeAgo}</span>
        </div>
        ${lang && langColor ? `
          <span class="lang-tag">
            <span class="dot" style="background:${langColor}"></span>
            ${escHtml(lang)}
          </span>` : ''}
      </div>
    `;

    return card;
  }

  // ===== HERO STATS =====
  function updateHeroStats(issues) {
    const repos = new Set(issues.map(i => i.repository_url)).size;
    heroStats.innerHTML = `
      <div class="stat-pill">
        <i class="fas fa-fire"></i>
        <span class="num">${issues.length}</span> live issues
      </div>
      <div class="stat-pill">
        <i class="fas fa-code-branch"></i>
        <span class="num">${repos}</span> repos
      </div>
      <div class="stat-pill">
        <i class="fas fa-check-circle"></i> beginner friendly
      </div>
    `;
  }

  // ===== COUNT =====
  function updateCount(total) {
    const langLabel = activeLang ? ` · ${activeLang}` : '';
    const qLabel    = searchQuery ? ` · "${searchQuery}"` : '';
    countEl.textContent = `${total} issue${total !== 1 ? 's' : ''}${langLabel}${qLabel}`;
  }

  // ===== LOADING =====
  function setLoading(on) {
    if (on) {
      grid.innerHTML =
        Array(6).fill('<div class="skeleton-card"></div>').join('');
      emptyEl.style.display     = 'none';
      errorEl.style.display     = 'none';
      loadMoreBtn.style.display = 'none';
      countEl.textContent       = 'Fetching live issues from GitHub...';
      refreshBtn.classList.add('spinning');
    } else {
      refreshBtn.classList.remove('spinning');
    }
  }

  // ===== ERROR =====
  function showError(msg) {
    grid.innerHTML            = '';
    errorEl.style.display     = 'block';
    emptyEl.style.display     = 'none';
    loadMoreBtn.style.display = 'none';
    countEl.textContent       = 'Could not load';

    const isRateLimit = msg && (
      msg.includes('rate limit') ||
      msg.includes('API rate') ||
      msg.includes('secondary rate')
    );

    document.querySelector('#errorState h3').textContent =
      isRateLimit ? 'GitHub API rate limit reached' : 'Could not load issues';

    document.querySelector('#errorState p').textContent =
      isRateLimit
        ? 'GitHub allows 60 requests/hour for unauthenticated users. Wait a few minutes and try again.'
        : 'Something went wrong fetching from GitHub. Check your connection and retry.';

    heroStats.innerHTML = `
      <div class="stat-pill" style="border-color:rgba(248,113,113,0.3);color:#f87171">
        <i class="fas fa-exclamation-circle"></i> Failed to load — retry in a few minutes
      </div>`;
  }

  // ===== HELPERS =====
  function getLabelClass(name) {
    const n = name.toLowerCase();
    if (n.includes('bug') || n.includes('fix'))  return 'label-bug';
    if (n.includes('doc'))                        return 'label-doc';
    if (n.includes('help'))                       return 'label-help';
    return 'label-default';
  }

  function detectLang(issue) {
    // Check labels first (most accurate)
    const labelLangs = (issue.labels || [])
      .map(l => l.name.toLowerCase())
      .find(n => LANG_COLORS[n]);
    if (labelLangs) return labelLangs;

    // Fallback: scan title
    const title = issue.title.toLowerCase();
    return Object.keys(LANG_COLORS).find(l => title.includes(l)) || null;
  }

  function getTimeAgo(dateStr) {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 60)  return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    if (days  < 30)  return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US',
      { month: 'short', day: 'numeric' });
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  let debounceTimer;

  // ===== EVENTS =====
  function bindEvents() {
    // Language filters
    document.getElementById('langFilters').addEventListener('click', e => {
      const btn = e.target.closest('.lang-btn');
      if (!btn) return;
      document.querySelectorAll('.lang-btn')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLang = btn.dataset.lang;
      loadIssues();
    });

    // Sort
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      loadIssues();
    });

    // Search — filter locally, no extra API call
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      clearBtn.classList.toggle('visible', searchQuery.length > 0);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilters, DEBOUNCE_MS);
    });

    // Clear
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.classList.remove('visible');
      applyFilters();
      searchInput.focus();
    });

    // Refresh
    refreshBtn.addEventListener('click', () => {
      if (!isLoading) loadIssues();
    });

    // Load more
    loadMoreBtn.addEventListener('click', () => {
      page++;
      renderIssues(filtered.slice(0, page * PER_PAGE));
      loadMoreBtn.style.display =
        filtered.length > page * PER_PAGE ? 'inline-flex' : 'none';
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
