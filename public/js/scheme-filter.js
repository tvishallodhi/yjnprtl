/**
 * scheme-filter.js
 * High-performance instant search and state/central filter for YOJNA PORTAL.
 * Zero-dependency Vanilla JS.
 */
(function () {
  'use strict';

  function initSchemeFilter() {
    const root = document.getElementById('yjp-schemes-app');
    if (!root) return;

    const selectEl = document.getElementById('yjp-state-select');
    const searchEl = document.getElementById('yjp-scheme-search');
    const clearBtn = document.getElementById('yjp-search-clear');
    const resetBtn = document.getElementById('yjp-reset-filters');
    const countDisplay = document.getElementById('yjp-count-display');
    const noResults = document.getElementById('yjp-no-results');
    const grid = document.getElementById('yjp-schemes-list');

    if (!selectEl || !searchEl || !grid) return;

    // Cache items to avoid repeated DOM queries
    const cards = Array.from(grid.querySelectorAll('[data-scheme-item]'));
    const items = cards.map((card) => ({
      el: card,
      type: card.getAttribute('data-type') || '',
      state: card.getAttribute('data-state') || '',
      searchData: (card.getAttribute('data-search') || '').toLowerCase()
    }));

    function applyFilters() {
      const selectedValue = selectEl.value; // 'all' | 'central' | state_code (e.g. 'mp')
      const query = searchEl.value.trim().toLowerCase();
      let visibleCount = 0;

      // Toggle clear button
      if (clearBtn) {
        clearBtn.hidden = query.length === 0;
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // 1. Dropdown State/Central Matching Rule
        let matchesDropdown = false;
        if (selectedValue === 'all') {
          // Show all Central and all State
          matchesDropdown = true;
        } else if (selectedValue === 'central') {
          // Show ONLY Central
          matchesDropdown = (item.type === 'central');
        } else {
          // A specific State is selected:
          // Rule: Show ALL Central Government schemes + Selected State schemes
          matchesDropdown = (item.type === 'central' || item.state === selectedValue);
        }

        // 2. Search Query Matching Rule
        let matchesSearch = true;
        if (query.length > 0) {
          matchesSearch = item.searchData.indexOf(query) !== -1;
        }

        // 3. Final Visibility Determination
        const isVisible = matchesDropdown && matchesSearch;
        if (isVisible) {
          if (item.el.style.display === 'none') {
            item.el.style.display = '';
          }
          visibleCount++;
        } else {
          if (item.el.style.display !== 'none') {
            item.el.style.display = 'none';
          }
        }
      }

      // Update counters & empty state
      if (countDisplay) {
        countDisplay.textContent = visibleCount;
      }

      if (noResults) {
        noResults.hidden = visibleCount > 0;
      }
    }

    // Event Listeners
    selectEl.addEventListener('change', applyFilters);

    // Debounced search for smooth typing
    let debounceTimer;
    searchEl.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilters, 50);
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        searchEl.value = '';
        searchEl.focus();
        applyFilters();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        selectEl.value = 'all';
        searchEl.value = '';
        applyFilters();
      });
    }

    // Initial run
    applyFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSchemeFilter);
  } else {
    initSchemeFilter();
  }
})();