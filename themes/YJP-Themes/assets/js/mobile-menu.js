(function() {
  const toggleBtn = document.getElementById('menuToggleBtn');
  const drawer = document.getElementById('mobileSidebarDrawer');
  const overlay = document.getElementById('mobileOverlay');
  const closeBtn = document.getElementById('drawerCloseBtn');

  function openDrawer() {
    drawer.classList.add('is-active');
    overlay.classList.add('is-active');
    drawer.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeDrawer() {
    drawer.classList.remove('is-active');
    overlay.classList.remove('is-active');
    drawer.setAttribute('aria-hidden', 'true');
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggleBtn.focus();
  }

  if (toggleBtn && drawer && overlay && closeBtn) {
    toggleBtn.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-active')) {
        closeDrawer();
      }
    });

    const drawerLinks = drawer.querySelectorAll('a');
    drawerLinks.forEach(link => {
      link.addEventListener('click', closeDrawer);
    });
  }
})();

  document.addEventListener('DOMContentLoaded', () => {
  // Mobile drawer me active section toggle handler
  const drawerExpandButtons = document.querySelectorAll('button.drawer-expand-btn');

  drawerExpandButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const item = btn.closest('.drawer-nav-item');
      const subList = item.querySelector('.drawer-sub-list');

      if (subList) {
        const isCollapsed = item.classList.toggle('is-collapsed-node');
        subList.style.display = isCollapsed ? 'none' : '';
        btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      }
    });
  });
});