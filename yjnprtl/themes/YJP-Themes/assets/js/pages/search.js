/**
 * ==========================================================================
 * COMPLETE HUGO SMART SEARCH ENGINE (assets/js/search.js)
 * Production-Ready, Zero External Dependencies, Safe XSS Protection.
 * ==========================================================================
 */
(function () {
  'use strict';

  // Configuration Constants
  const CONFIG = {
    indexUrls: ['/index.json', '/search/index.json'],
    pageSize: 20,
    maxSuggestions: 5,
    maxRecent: 20,
    storageKey: 'hugo_recently_viewed_posts',
    debounceDelay: 180
  };

  // State Management
  let searchIndex = null;
  let isIndexLoading = false;
  let currentResults = [];
  let renderedCount = 0;
  let activeSuggestionIdx = -1;
  let debounceTimer = null;

  // Bilingual (Hindi <-> English) & Transliteration Mapping
  const BILINGUAL_MAP = [
    { en: 'railway', hi: 'रेलवे', roman: ['railway', 'relway', 'railve', 'railwy'] },
    { en: 'government job', hi: 'सरकारी नौकरी', roman: ['sarkari', 'naukri', 'rojgar', 'sarkari naukri'] },
    { en: 'recruitment', hi: 'भर्ती', roman: ['bharti', 'recruitment', 'vacancy'] },
    { en: 'scheme', hi: 'योजना', roman: ['yojana', 'yojna', 'scheme'] },
    { en: 'pension', hi: 'पेंशन', roman: ['pension', 'penshan'] },
    { en: 'admit card', hi: 'प्रवेश पत्र', roman: ['admit', 'admit card', 'pravesh patra', 'hall ticket'] },
    { en: 'result', hi: 'परिणाम', roman: ['result', 'parinam', 'nateeja'] },
    { en: 'syllabus', hi: 'पाठ्यक्रम', roman: ['syllabus', 'pathyakram'] },
    { en: 'ssc', hi: 'एसएससी', roman: ['ssc', 'chsl', 'cgl', 'mts', 'gd'] },
    { en: 'eligibility', hi: 'पात्रता', roman: ['patrata', 'yogyata', 'qualification'] },
    { en: 'application', hi: 'आवेदन', roman: ['aavedan', 'apply', 'form'] }
  ];

  // Route Check
  const isSearchPage = window.location.pathname.replace(/\/$/, '').endsWith('/search');

  // DOM Elements (Specific to Search Page)
  const resultsContainer = document.getElementById('searchResultsList');
  const statsContainer = document.getElementById('searchStats');
  const emptyPrompt = document.getElementById('searchEmptyPrompt');
  const loadingIndicator = document.getElementById('searchLoadingIndicator');
  const loadMoreWrapper = document.getElementById('searchLoadMoreWrapper');
  const loadMoreBtn = document.getElementById('searchLoadMoreBtn');
  const recentlyViewedSection = document.getElementById('recentlyViewedSection');
  const recentlyViewedList = document.getElementById('recentlyViewedList');
  const clearRecentBtn = document.getElementById('clearRecentBtn');

  // ==========================================================================
  // 1. Text Normalization, Tokenization & Levenshtein Distance
  // ==========================================================================
  function normalizeText(str) {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .replace(/[_\-–—/\\,.?!()[\]{}:;'"“”‘’+]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getSearchTerms(query) {
    const rawTokens = normalizeText(query).split(' ').filter(t => t.length > 0);
    const termsSet = new Set(rawTokens);

    rawTokens.forEach(token => {
      BILINGUAL_MAP.forEach(item => {
        const matchesRoman = item.roman.some(r => r.includes(token) || token.includes(r));
        const matchesEn = item.en.toLowerCase().includes(token);
        const matchesHi = item.hi.includes(token);

        if (matchesRoman || matchesEn || matchesHi) {
          item.en.toLowerCase().split(' ').forEach(w => termsSet.add(w));
          item.hi.split(' ').forEach(w => termsSet.add(w));
          item.roman.forEach(w => termsSet.add(w));
        }
      });
    });

    return Array.from(termsSet);
  }

  function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const dp = [];
    for (let i = 0; i <= b.length; i++) dp[i] = [i];
    for (let j = 0; j <= a.length; j++) dp[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        dp[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
          ? dp[i - 1][j - 1]
          : Math.min(dp[i - 1][j - 1] + 1, dp[i][j - 1] + 1, dp[i - 1][j] + 1);
      }
    }
    return dp[b.length][a.length];
  }

  function isFuzzyMatch(word, target) {
    if (!word || !target || Math.abs(word.length - target.length) > 2) return false;
    const dist = levenshtein(word, target);
    return word.length <= 4 ? dist <= 1 : dist <= 2;
  }

  // ==========================================================================
  // 2. Safe HTML Escaping & Highlight Generator (XSS Protected)
  // ==========================================================================
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function highlightMatches(text, terms) {
    if (!text) return '';
    const safeText = escapeHTML(text);
    if (!terms || !terms.length) return safeText;

    const validTerms = terms
      .map(t => t.trim())
      .filter(t => t.length > 1)
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (!validTerms.length) return safeText;
    const regex = new RegExp(`(${validTerms.join('|')})`, 'gi');
    return safeText.replace(regex, '<mark class="srch-highlight">$1</mark>');
  }

  // ==========================================================================
  // 3. Search Index Fetcher with Fallbacks
  // ==========================================================================
  async function loadSearchIndex() {
    if (searchIndex) return searchIndex;
    if (isIndexLoading) {
      while (isIndexLoading) {
        await new Promise(r => setTimeout(r, 40));
      }
      return searchIndex;
    }

    isIndexLoading = true;
    if (loadingIndicator) loadingIndicator.style.display = 'block';

    let rawData = null;
    for (const url of CONFIG.indexUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          rawData = await res.json();
          break;
        }
      } catch (e) {
        // Fallback to next path
      }
    }

    if (rawData && Array.isArray(rawData)) {
      searchIndex = rawData.map(item => ({
        ...item,
        _normTitle: normalizeText(item.title),
        _normDesc: normalizeText(item.description),
        _normContent: normalizeText(item.content),
        _normKeywords: (item.keywords || []).map(normalizeText).join(' '),
        _normTags: (item.tags || []).map(normalizeText).join(' '),
        _normCategories: (item.categories || []).map(normalizeText).join(' '),
        _normAliases: (item.aliases || []).map(normalizeText).join(' ')
      }));
    } else {
      console.error('[Hugo Search] Unable to load search index.');
      if (statsContainer) {
        statsContainer.innerHTML = '<span style="color:#ef4444;">Search index could not be loaded. Please check /index.json.</span>';
        statsContainer.style.display = 'block';
      }
    }

    isIndexLoading = false;
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    return searchIndex;
  }

  // ==========================================================================
  // 4. Scoring, Ranking & Search Engine
  // ==========================================================================
  function searchPosts(query) {
    if (!searchIndex || !query.trim()) return [];

    const terms = getSearchTerms(query);
    const normQ = normalizeText(query);
    const scored = [];

    searchIndex.forEach(item => {
      let score = 0;
      let hasMatch = false;

      // 1. Exact & Partial Title Matches
      if (item._normTitle === normQ) {
        score += 120;
        hasMatch = true;
      } else if (item._normTitle.includes(normQ)) {
        score += 80;
        hasMatch = true;
      }

      // 2. Token Field Matching
      terms.forEach(term => {
        if (term.length < 2) return;
        if (item._normTitle.includes(term)) { score += 50; hasMatch = true; }
        if (item._normKeywords.includes(term)) { score += 40; hasMatch = true; }
        if (item._normTags.includes(term) || item._normCategories.includes(term)) { score += 35; hasMatch = true; }
        if (item._normAliases.includes(term)) { score += 30; hasMatch = true; }
        if (item._normDesc.includes(term)) { score += 25; hasMatch = true; }
        if (item._normContent.includes(term)) { score += 15; hasMatch = true; }

        // 3. Fuzzy Spelling Tolerance in Title
        if (!hasMatch) {
          const words = item._normTitle.split(' ');
          for (const w of words) {
            if (isFuzzyMatch(term, w)) {
              score += 15;
              hasMatch = true;
              break;
            }
          }
        }
      });

      // 4. Date Recency Boost
      if (hasMatch && item.date) {
        const yr = parseInt(item.date.substring(0, 4), 10);
        if (yr >= 2026) score += 5;
        else if (yr >= 2025) score += 3;
      }

      if (hasMatch && score > 0) {
        scored.push({ item, score });
      }
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.item);
  }

  // ==========================================================================
  // 5. Results Rendering & Pagination
  // ==========================================================================
  function renderBatch(query, isReset = false) {
    if (!resultsContainer) return;

    if (isReset) {
      resultsContainer.innerHTML = '';
      renderedCount = 0;
    }

    const terms = getSearchTerms(query);
    const batch = currentResults.slice(renderedCount, renderedCount + CONFIG.pageSize);

    if (batch.length === 0 && isReset) {
      resultsContainer.innerHTML = `
        <div class="search-empty-prompt">
          <h3>No results found for "${escapeHTML(query)}"</h3>
          <p>Check for spelling mistakes or try a related keyword.</p>
        </div>
      `;
      return;
    }

    const fragment = document.createDocumentFragment();
    batch.forEach(item => {
      const card = document.createElement('article');
      card.className = 'search-result-card';
      const snippet = item.description || (item.content ? item.content.slice(0, 160) + '...' : '');

      card.innerHTML = `
        <header class="search-result-header">
          <h2 class="search-result-card-title">
            <a href="${escapeHTML(item.url)}" class="track-post-click" data-title="${escapeHTML(item.title)}">
              ${highlightMatches(item.title, terms)}
            </a>
          </h2>
        </header>
        <p class="search-result-snippet">${highlightMatches(snippet, terms)}</p>
        <div class="search-result-footer">
          <a href="${escapeHTML(item.url)}" class="search-read-more track-post-click" data-title="${escapeHTML(item.title)}">
            Read More &rarr;
          </a>
        </div>
      `;
      fragment.appendChild(card);
    });

    resultsContainer.appendChild(fragment);
    renderedCount += batch.length;

    if (loadMoreWrapper) {
      loadMoreWrapper.style.display = (renderedCount < currentResults.length) ? 'block' : 'none';
    }

    bindClickTracker();
  }

  async function executeSearchOnPage(query) {
    const q = (query || '').trim();

    // Sync input fields and clear button visibility across the page
    document.querySelectorAll('.custom-search-input').forEach(input => {
      input.value = q;
      const wrap = input.closest('.search-box-wrapper');
      if (wrap) {
        const clr = wrap.querySelector('.search-clear-btn');
        if (clr) clr.style.display = q.length > 0 ? 'inline-flex' : 'none';
      }
    });

    // Close any open suggestion dropdowns
    document.querySelectorAll('.search-suggestions-dropdown').forEach(b => b.style.display = 'none');

    // Handle Empty Search Case
    if (!q) {
      if (resultsContainer) resultsContainer.innerHTML = '';
      if (statsContainer) statsContainer.style.display = 'none';
      if (emptyPrompt) emptyPrompt.style.display = 'block';
      if (loadMoreWrapper) loadMoreWrapper.style.display = 'none';

      if (window.history.pushState) {
        const url = new URL(window.location);
        url.searchParams.delete('q');
        window.history.pushState({}, '', url);
      }
      return;
    }

    if (emptyPrompt) emptyPrompt.style.display = 'none';

    // Synchronize URL query parameter without page reload
    if (window.history.pushState) {
      const url = new URL(window.location);
      url.searchParams.set('q', q);
      window.history.pushState({}, '', url);
    }

    const index = await loadSearchIndex();
    if (!index) return;

    const t0 = performance.now();
    currentResults = searchPosts(q);
    const t1 = performance.now();
    const elapsed = ((t1 - t0) / 1000).toFixed(3);

    renderBatch(q, true);

    if (statsContainer) {
      statsContainer.style.display = 'block';
      const count = currentResults.length;
      statsContainer.innerHTML = `Showing <strong>${count}</strong> ${count === 1 ? 'result' : 'results'} in <strong>${elapsed}</strong> sec`;
    }
  }

  // ==========================================================================
  // 6. Live Suggestions Dropdown
  // ==========================================================================
  function renderSuggestionsForWrapper(wrapper, list, query) {
    const box = wrapper.querySelector('.search-suggestions-dropdown');
    if (!box) return;

    if (!list || list.length === 0) {
      box.style.display = 'none';
      box.innerHTML = '';
      return;
    }

    const terms = getSearchTerms(query);
    box.innerHTML = list.map((item, idx) => `
      <div class="suggestion-item" data-index="${idx}" data-title="${escapeHTML(item.title)}">
        <div class="suggestion-title">${highlightMatches(item.title, terms)}</div>
        <div class="suggestion-snippet">${highlightMatches(item.description || item.content, terms)}</div>
      </div>
    `).join('');

    box.style.display = 'block';
    activeSuggestionIdx = -1;

    box.querySelectorAll('.suggestion-item').forEach(itemEl => {
      itemEl.addEventListener('click', () => {
        const chosenTitle = itemEl.getAttribute('data-title');
        handleQuerySubmit(chosenTitle);
      });
    });
  }

  // ==========================================================================
  // 7. Recently Viewed Engine (No Numbers, View Icon, LocalStorage)
  // ==========================================================================
  function loadRecentPosts() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];
    } catch {
      return [];
    }
  }

  function addRecentPost(title, url) {
    if (!title || !url) return;
    let list = loadRecentPosts().filter(p => p.url !== url && p.title !== title);
    // Add clicked item to the top (#1)
    list.unshift({ title, url });
    if (list.length > CONFIG.maxRecent) list = list.slice(0, CONFIG.maxRecent);
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(list));
    } catch {}
    renderRecentPosts();
  }

  function renderRecentPosts() {
    if (!recentlyViewedSection || !recentlyViewedList) return;
    const items = loadRecentPosts();

    if (!items.length) {
      recentlyViewedSection.style.display = 'none';
      return;
    }

    recentlyViewedSection.style.display = 'block';

    // Renders list with View Badge icon (No numbering)
    recentlyViewedList.innerHTML = items.map(item => `
      <li class="recent-post-item">
        <span class="recent-view-badge" title="Recently Viewed">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </span>
        <a href="${escapeHTML(item.url)}" class="post-link track-post-click" data-title="${escapeHTML(item.title)}">
          ${escapeHTML(item.title)}
        </a>
      </li>
    `).join('');

    bindClickTracker();
  }

  function bindClickTracker() {
    document.querySelectorAll('.track-post-click').forEach(link => {
      if (link.dataset.bound) return;
      link.dataset.bound = 'true';
      link.addEventListener('click', function () {
        const title = this.getAttribute('data-title') || this.innerText;
        const url = this.getAttribute('href');
        addRecentPost(title, url);
      });
    });
  }

  // ==========================================================================
  // 8. Global Router (Search Page vs External Redirect)
  // ==========================================================================
  function handleQuerySubmit(query) {
    const q = (query || '').trim();
    if (!q) return;

    if (isSearchPage) {
      executeSearchOnPage(q);
    } else {
      window.location.href = `/search/?q=${encodeURIComponent(q)}`;
    }
  }

  // ==========================================================================
  // 9. Main Initialization
  // ==========================================================================
  async function init() {
    renderRecentPosts();
    bindClickTracker();

    // Clear All Recently Viewed History
    if (clearRecentBtn) {
      clearRecentBtn.addEventListener('click', () => {
        try { localStorage.removeItem(CONFIG.storageKey); } catch {}
        renderRecentPosts();
      });
    }

    // Load More Pagination Button
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        const q = new URLSearchParams(window.location.search).get('q') || '';
        renderBatch(q, false);
      });
    }

    // Popular Suggestion Chips (Empty State) Click Handler
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const query = chip.getAttribute('data-search');
        if (query) {
          document.querySelectorAll('.custom-search-input').forEach(inp => {
            inp.value = query;
          });
          executeSearchOnPage(query);
        }
      });
    });

    // Bind All Search Box Wrappers (Header, Sidebar, Search Page)
    document.querySelectorAll('.search-box-wrapper').forEach(wrapper => {
      const form = wrapper.querySelector('.search-box-form');
      const input = wrapper.querySelector('.custom-search-input');
      const submitBtn = wrapper.querySelector('.custom-search-btn');
      const clearBtn = wrapper.querySelector('.search-clear-btn');
      const suggestionsBox = wrapper.querySelector('.search-suggestions-dropdown');

      function updateClearBtnVisibility() {
        if (!clearBtn) return;
        if (input && input.value.trim().length > 0) {
          clearBtn.style.display = 'inline-flex';
        } else {
          clearBtn.style.display = 'none';
        }
      }

      // X (Clear/Cut) Button Click Event
      if (clearBtn && input) {
        clearBtn.addEventListener('click', () => {
          input.value = '';
          updateClearBtnVisibility();
          input.focus();

          if (suggestionsBox) suggestionsBox.style.display = 'none';

          if (isSearchPage) {
            executeSearchOnPage('');
          }
        });
      }

      // Form Submit & Search Button Click
      if (form) {
        form.addEventListener('submit', e => {
          e.preventDefault();
          if (input) handleQuerySubmit(input.value);
        });
      }

      if (submitBtn) {
        submitBtn.addEventListener('click', e => {
          e.preventDefault();
          if (input) handleQuerySubmit(input.value);
        });
      }

      if (input) {
        // Typing Handler (Debounced Suggestions & Clear Button Toggle)
        input.addEventListener('input', () => {
          updateClearBtnVisibility();
          const q = input.value;
          clearTimeout(debounceTimer);

          if (q.trim().length < 2) {
            renderSuggestionsForWrapper(wrapper, [], '');
            return;
          }

          debounceTimer = setTimeout(async () => {
            await loadSearchIndex();
            const results = searchPosts(q);
            renderSuggestionsForWrapper(wrapper, results.slice(0, CONFIG.maxSuggestions), q);
          }, CONFIG.debounceDelay);
        });

        // Keyboard Navigation in Suggestions (Arrow Up/Down, Enter, Esc)
        input.addEventListener('keydown', e => {
          if (!suggestionsBox || suggestionsBox.style.display === 'none') return;
          const items = suggestionsBox.querySelectorAll('.suggestion-item');
          if (!items.length) return;

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeSuggestionIdx = (activeSuggestionIdx + 1) % items.length;
            items.forEach((item, i) => item.classList.toggle('active', i === activeSuggestionIdx));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeSuggestionIdx = (activeSuggestionIdx - 1 + items.length) % items.length;
            items.forEach((item, i) => item.classList.toggle('active', i === activeSuggestionIdx));
          } else if (e.key === 'Enter' && activeSuggestionIdx > -1) {
            e.preventDefault();
            items[activeSuggestionIdx].click();
          } else if (e.key === 'Escape') {
            suggestionsBox.style.display = 'none';
          }
        });

        // Initial Clear button state
        updateClearBtnVisibility();
      }
    });

    // Close suggestions on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.search-box-wrapper')) {
        document.querySelectorAll('.search-suggestions-dropdown').forEach(b => b.style.display = 'none');
      }
    });

    // ==========================================================================
    // CRITICAL: URL Query Auto-fill & Search Trigger on /search/ Page Load
    // ==========================================================================
    if (isSearchPage) {
      const urlParams = new URLSearchParams(window.location.search);
      const initialQuery = urlParams.get('q');

      if (initialQuery) {
        // Auto-fill input text
        document.querySelectorAll('.custom-search-input').forEach(inp => {
          inp.value = initialQuery;
          const wrap = inp.closest('.search-box-wrapper');
          if (wrap) {
            const clr = wrap.querySelector('.search-clear-btn');
            if (clr) clr.style.display = 'inline-flex';
          }
        });
        // Run search immediately
        await executeSearchOnPage(initialQuery);
      } else {
        loadSearchIndex(); // Pre-fetch in background
      }

      // Browser Navigation (Back / Forward)
      window.addEventListener('popstate', async () => {
        const q = new URLSearchParams(window.location.search).get('q') || '';
        document.querySelectorAll('.custom-search-input').forEach(inp => {
          inp.value = q;
        });
        if (q) {
          await executeSearchOnPage(q);
        } else {
          executeSearchOnPage('');
        }
      });
    }
  }

  // Self-executing initialization on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();