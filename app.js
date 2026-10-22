/* =============================================
   OpenPulse — app.js
   GitHub Good First Issue Finder
   ============================================= */

const App = (() => {

  // ===== CONFIG =====
  const LABELS = ['good first issue', 'good-first-issue', 'beginner', 'easy', 'starter'];
  const PER_PAGE = 30;
  const DEBOUNCE_MS = 400;

  // Language color map (matching GitHub)
  const LANG_COLORS = {
    python:     '#3572A5',
    javascript: '#f1e05a',
    typescript: '#2b7489',
    go:         '#00ADD8',
    rust:       '#dea584',
    java:       '#b07219',
    'c++':      '#f34b7d',
    ruby:       '#701516',
    php:        '#4F5D95',
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
  const grid         = document.getElementById('issuesGrid');
  const countEl      = document.getElementById('resultsCount');
  const emptyEl      = document.getElementById('emptyState');
  const errorEl      = document.getElementById('errorState');
  const loadMoreBtn  = document.getElementById('loadMoreBtn');
  const refreshBtn   = document.getElementById('refreshBtn');
  const searchInput  = document.getElementById('searchInput');
  const clearBtn     = document.getElementById('clearSearch');
  const heroStats    = document.getElementById('heroStats');
  const sortSelect   = document.getElementById('sortSelect');

  // ===== GITHUB API FETCH =====
  async function fetchIssues(lang, sort) {
    // Build query: label + optional language + sort
    const labelQuery = LABELS.map(l => `label:"${l}"`).join(' ');
    const langQuery  = lang ? `+language:${lang}` : '';
    const q          = `is:issue is:open ${labelQuery}${langQuery}`;

    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=${sort}&order=desc&per_page=${PER_PAGE}`;

    const res = await fetch(url, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });

    if (res.status === 403 || res.status === 429) {
      throw new Error('rate_limit');
    }
    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status}`);
    }

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
      console.error(err);
      if (err.message === 'rate_limit') {
        showError();
      } else {
        showError();
      }
    } finally {
      isLoading = false;
      setLoading(false);
    }
  }

  // ===== FILTER & RENDER =====
  function applyFilters() {
    const q = searchQuery.toLowerCase().trim();

    filtered = allIssues.filter(issue => {
      if (!q) return true;
      const repo  = issue.repository_url?.split('/').slice(-2).join('/').toLowerCase() || '';
      const title = issue.title.toLowerCase();
      const body  = (issue.body || '').toLowerCase();
      return title.includes(q) || repo.includes(q) || body.includes(q);
    });

    renderIssues(filtered.slice(0, page * PER_PAGE));
    updateCount(filtered.length);
    loadMoreBtn.style.display = filtered.length > page * PER_PAGE ? 'inline-flex' : 'none';
  }

  // ===== RENDER ISSUE CARDS =====
  function renderIssues(issues) {
    grid.innerHTML = '';
    emptyEl.style.display  = 'none';
    errorEl.style.display  = 'none';

    if (issues.length === 0) {
      emptyEl.style.display = 'block';
      countEl.textContent   = '0 issues found';
      return;
    }

    const fragment = document.createDocumentFragment();
    issues.forEach(issue => {
      const card = buildCard(issue);
      fragment.appendChild(card);
    });
    grid.appendChild(fragment);
  }

  // ===== BUILD SINGLE CARD =====
  function buildCard(issue) {
    // Parse repo owner/name from repository_url
    const repoParts  = issue.repository_url?.split('/') || [];
    const repoOwner  = repoParts[repoParts.length - 2] || '';
    const repoName   = repoParts[repoParts.length - 1] || '';
    const avatarUrl  = `https://github.com/${repoOwner}.png?size=28`;
    const lang       = issue.language || detectLang(issue);
    const langColor  = LANG_COLORS[lang?.toLowerCase()] || '#8b949e';
    const timeAgo    = getTimeAgo(issue.created_at);

    // Build labels HTML
    const labelsHtml = (issue.labels || [])
      .slice(0, 4)
      .map(lbl => {
        const cls = getLabelClass(lbl.name);
        const color = lbl.color ? `#${lbl.color}` : null;
        const style = color ? `style="background:${color}22; border-color:${color}66; color:${color}"` : '';
        return `<span class="label ${cls}" ${style}>${escHtml(lbl.name)}</span>`;
      }).join('');

    const card = document.createElement('a');
    card.className  = 'issue-card';
    card.href       = issue.html_url;
    card.target     = '_blank';
    card.rel        = 'noopener noreferrer';

    card.innerHTML = `
      <div class="card-top">
        <div class="repo-info">
          <img class="repo-avatar" src="${avatarUrl}" alt="${repoOwner}" loading="lazy"
               onerror="this.src='https://github.com/github.png?size=28'"/>
          <span class="repo-name"><strong>${escHtml(repoOwner)}</strong> / ${escHtml(repoName)}</span>
        </div>
        <span class="issue-number">#${issue.number}</span>
      </div>
      <div class="issue-title">${escHtml(issue.title)}</div>
      <div class="issue-labels">${labelsHtml}</div>
      <div class="card-footer">
        <div class="card-meta">
          <span><i class="fas fa-comment"></i> ${issue.comments}</span>
          <span><i class="fas fa-clock"></i> ${timeAgo}</span>
        </div>
        ${lang ? `<span class="lang-tag">
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
      <div class="stat-pill"><i class="fas fa-bug"></i> <span class="num">${issues.length}+</span> open issues</div>
      <div class="stat-pill"><i class="fas fa-code-branch"></i> <span class="num">${repos}</span> repositories</div>
      <div class="stat-pill"><i class="fas fa-heart" style="color:#db61a2"></i> beginner friendly</div>
    `;
  }

  // ===== COUNT =====
  function updateCount(total) {
    const langLabel = activeLang ? ` in ${activeLang}` : '';
    const qLabel    = searchQuery ? ` for "${searchQuery}"` : '';
    countEl.textContent = `${total} issue${total !== 1 ? 's' : ''}${langLabel}${qLabel}`;
  }

  // ===== LOADING STATE =====
  function setLoading(on) {
    if (on) {
      grid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');
      emptyEl.style.display  = 'none';
      errorEl.style.display  = 'none';
      loadMoreBtn.style.display = 'none';
      countEl.textContent    = 'Loading issues...';
      refreshBtn.classList.add('spinning');
    } else {
      refreshBtn.classList.remove('spinning');
    }
  }

  // ===== ERROR STATE =====
  function showError() {
    grid.innerHTML = '';
    errorEl.style.display  = 'block';
    emptyEl.style.display  = 'none';
    loadMoreBtn.style.display = 'none';
    countEl.textContent    = 'Failed to load';
    heroStats.innerHTML    = '<div class="stat-pill"><i class="fas fa-exclamation-triangle" style="color:#f78166"></i> API limit reached — try again later</div>';
  }

  // ===== HELPERS =====
  function getLabelClass(name) {
    const n = name.toLowerCase();
    if (n.includes('good first') || n.includes('beginner') || n.includes('starter') || n.includes('easy')) return 'label-gfi';
    if (n.includes('help'))       return 'label-help';
    if (n.includes('bug'))        return 'label-bug';
    if (n.includes('doc'))        return 'label-doc';
    return 'label-default';
  }

  function detectLang(issue) {
    // Try to guess language from labels or repo name
    const text = (issue.title + ' ' + (issue.body || '') + ' ' + (issue.labels || []).map(l => l.name).join(' ')).toLowerCase();
    for (const lang of Object.keys(LANG_COLORS)) {
      if (text.includes(lang)) return lang;
    }
    return null;
  }

  function getTimeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30)  return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  let debounceTimer;
  function debounce(fn, ms) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fn, ms);
  }

  // ===== EVENT LISTENERS =====
  function bindEvents() {
    // Language filter buttons
    document.getElementById('langFilters').addEventListener('click', e => {
      const btn = e.target.closest('.lang-btn');
      if (!btn) return;
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeLang = btn.dataset.lang;
      loadIssues();
    });

    // Sort
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      loadIssues();
    });

    // Search
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      clearBtn.classList.toggle('visible', searchQuery.length > 0);
      debounce(applyFilters, DEBOUNCE_MS);
    });

    // Clear search
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
      loadMoreBtn.style.display = filtered.length > page * PER_PAGE ? 'inline-flex' : 'none';
    });
  }

  // ===== INIT =====
  function init() {
    bindEvents();
    loadIssues();
  }

  return { init };

})();

// Start the app
document.addEventListener('DOMContentLoaded', App.init);
