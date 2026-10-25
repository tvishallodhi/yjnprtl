(function() {
  const toggleBtn = document.getElementById('sidebarCollapseToggle');
  // Sirf toggle BUTTONS ko target karein taaki inactive link (<a>) bypass na ho
  const expandBtns = document.querySelectorAll('button.sidebar-expand-btn');

  // Load saved state from LocalStorage
  const savedState = localStorage.getItem('sidebar_minimized') === 'true';
  if (savedState) {
    document.body.classList.add('sidebar-is-minimized');
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('.toggle-icon');
      if (icon) icon.textContent = '+';
      toggleBtn.title = 'Maximize sidebar';
    }
  }

  // Desktop sidebar collapse/expand toggle
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isMinimized = document.body.classList.toggle('sidebar-is-minimized');
      const icon = toggleBtn.querySelector('.toggle-icon');
      if (icon) icon.textContent = isMinimized ? '+' : '−';
      toggleBtn.title = isMinimized ? 'Maximize sidebar' : 'Minimize sidebar';
      localStorage.setItem('sidebar_minimized', isMinimized);
    });
  }

  // Submenu items toggle logic (rotate indicator ke liye class toggle)
  expandBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const parentNode = btn.closest('.sidebar-node');
      const subTree = parentNode.querySelector('.sidebar-sub-tree');
      if (subTree) {
        const isCollapsed = parentNode.classList.toggle('is-collapsed-node');
        subTree.style.display = isCollapsed ? 'none' : '';
        btn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      }
    });
  });
})();