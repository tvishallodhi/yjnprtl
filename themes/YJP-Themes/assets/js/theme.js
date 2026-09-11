(function() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;

  const modes = ['system', 'light', 'dark'];

  function applyTheme(theme) {
    let effective = theme;
    if (theme === 'system') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effective);
    document.documentElement.setAttribute('data-color-mode', theme);
    localStorage.setItem('site_theme', theme);
  }

  toggleBtn.addEventListener('click', () => {
    const current = localStorage.getItem('site_theme') || 'system';
    const nextIndex = (modes.indexOf(current) + 1) % modes.length;
    applyTheme(modes[nextIndex]);
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem('site_theme') || 'system') === 'system') {
      applyTheme('system');
    }
  });
})();