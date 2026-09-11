(function() {
  const switchBtn = document.getElementById('langSwitchBtn');
  const dropdown = document.getElementById('langDropdown');
  const optionBtns = document.querySelectorAll('.lang-option-btn');
  const translationLink = document.getElementById('translationPairLink');

  function setLanguage(lang) {
    document.body.setAttribute('data-lang-selected', lang);
    localStorage.setItem('site_lang', lang);

    if (translationLink && translationLink.getAttribute('data-target-lang') === lang) {
      window.location.href = translationLink.getAttribute('href');
      return;
    }

    const currentLabel = document.querySelector('.lang-current-label');
    if (currentLabel) {
      currentLabel.textContent = lang.toUpperCase();
    }
  }

  const initialLang = localStorage.getItem('site_lang') || 'hi';
  setLanguage(initialLang);

  if (switchBtn && dropdown) {
    switchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = switchBtn.getAttribute('aria-expanded') === 'true';
      switchBtn.setAttribute('aria-expanded', !expanded);
      dropdown.style.display = expanded ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
      switchBtn.setAttribute('aria-expanded', 'false');
      dropdown.style.display = 'none';
    });

    optionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const selected = btn.getAttribute('data-set-lang');
        setLanguage(selected);
        switchBtn.setAttribute('aria-expanded', 'false');
        dropdown.style.display = 'none';
      });
    });
  }

  window.getCurrentSelectedLanguage = () => localStorage.getItem('site_lang') || 'hi';
})();