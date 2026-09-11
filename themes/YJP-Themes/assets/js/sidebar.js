(function() {
  const toggleBtn = document.getElementById('sidebarCollapseToggle');
  const expandBtns = document.querySelectorAll('.sidebar-expand-btn');

  const savedState = localStorage.getItem('sidebar_minimized') === 'true';
  if (savedState) {
    document.body.classList.add('sidebar-is-minimized');
    if (toggleBtn) {
      toggleBtn.querySelector('.toggle-icon').textContent = '+';
      toggleBtn.title = 'Maximize sidebar';
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isMinimized = document.body.classList.toggle('sidebar-is-minimized');
      toggleBtn.querySelector('.toggle-icon').textContent = isMinimized ? '+' : '−';
      toggleBtn.title = isMinimized ? 'Maximize sidebar' : 'Minimize sidebar';
      localStorage.setItem('sidebar_minimized', isMinimized);
    });
  }

  expandBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const parentNode = btn.closest('.sidebar-node');
      const subTree = parentNode.querySelector('.sidebar-sub-tree');
      if (subTree) {
        const isCollapsed = subTree.classList.toggle('is-collapsed');
        btn.setAttribute('aria-expanded', !isCollapsed);
      }
    });
  });
})();