/**
 * Header / Global Search Redirect Script
 * Used across standard pages (Home, Single, Archive, etc.)
 */
(function () {
  'use strict';

  function triggerSearchRedirect(query) {
    const trimmed = (query || '').trim();
    if (!trimmed) return;
    window.location.href = `/search/?q=${encodeURIComponent(trimmed)}`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    // यदि यूजर पहले से /search/ पेज पर है, तो यह स्क्रिप्ट निष्पादित न हो
    if (window.location.pathname.replace(/\/$/, '').endsWith('/search')) {
      return;
    }

    // सर्च फॉर्म सबमिट (Enter दबाने पर)
    document.querySelectorAll('.search-box-form').forEach(form => {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const input = form.querySelector('input[name="q"]');
        if (input) triggerSearchRedirect(input.value);
      });
    });

    // सर्च बटन पर क्लिक करने पर
    document.querySelectorAll('.search-submit-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const form = btn.closest('form');
        const input = form ? form.querySelector('input[name="q"]') : null;
        if (input) triggerSearchRedirect(input.value);
      });
    });
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const searchMain = document.querySelector('.search-main');
  const triggerBtn = document.getElementById('searchTriggerBtn');
  const closeBtn = document.getElementById('searchCloseBtn');
  const searchInput = document.getElementById('searchInput');
  const searchForm = searchMain.querySelector('.search-box-form');

  // Mobile me Icon par click karne par expand kare
  triggerBtn.addEventListener('click', (e) => {
    const isMobile = window.innerWidth <= 600;
    
    if (isMobile) {
      if (!searchMain.classList.contains('is-active')) {
        e.preventDefault(); // Pehli baar me form submit na ho, box open ho
        searchMain.classList.add('is-active');
        triggerBtn.setAttribute('type', 'submit'); // Khulne ke baad dobara dabane par search kare
        searchInput.focus();
      }
    }
  });

  // Close button dabane par wapas chhota icon bana de
  closeBtn.addEventListener('click', () => {
    searchMain.classList.remove('is-active');
    triggerBtn.setAttribute('type', 'button');
    searchInput.value = ''; // Input clear kare
  });

  // Bahar click karne par band kare (Optional UX)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 600 && !searchMain.contains(e.target)) {
      searchMain.classList.remove('is-active');
      triggerBtn.setAttribute('type', 'button');
    }
  });
});