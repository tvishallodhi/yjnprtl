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

document.addEventListener("DOMContentLoaded", () => {

  // Elements
  const get = (id) => document.getElementById(id);

  const toggle = get("mobileActionToggle");
  const dropdown = get("mobileActionDropdown");

  const shareBtn = get("shareBtn");
  const copyLinkBtn = get("copyLinkBtn");
  const themeBtn = get("themeToggleBtn");

  const mobileShare = get("mobileShareBtn");
  const mobileCopy = get("mobileCopyLinkBtn");
  const mobileTheme = get("mobileThemeBtn");


  // Page Info
  const pageTitle =
    get("pageShareTitle")?.dataset.title || document.title;

  const pageUrl = window.location.href;
  const shareText = `${pageTitle}\n\n${pageUrl}`;


  // Close Mobile Menu
  const closeMenu = () => {
    dropdown?.classList.remove("show");
    toggle?.setAttribute("aria-expanded", "false");
  };

  // Mobile Dropdown
  if (toggle && dropdown) {

    toggle.addEventListener("click", (e) => {

      e.stopPropagation();

      const isOpen = dropdown.classList.toggle("show");

      toggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );
    });

    // Outside Click
    document.addEventListener("click", (e) => {

      if (
        !dropdown.contains(e.target) &&
        !toggle.contains(e.target)
      ) {
        closeMenu();
      }

    });

  }

  // Share
  async function sharePage() {

    if (navigator.share) {

      try {

        await navigator.share({
          title: pageTitle,
          text: shareText,
          url: pageUrl
        });

      } catch (err) {
        // User cancelled sharing
      }

      return;
    }


    // Fallback: Copy
    try {

      await navigator.clipboard.writeText(shareText);

      if (shareBtn) {

        const oldTitle =
          shareBtn.getAttribute("title") || "";

        shareBtn.setAttribute("title", "Copied!");

        setTimeout(() => {
          shareBtn.setAttribute("title", oldTitle);
        }, 1500);

      }

    } catch (err) {

      console.error("Unable to share or copy link.");

    }

  }


  // Copy Link
  async function copyPageLink() {

    try {

      await navigator.clipboard.writeText(shareText);

      if (!copyLinkBtn) return;

      const icon = copyLinkBtn.querySelector(".copy-icon");

      if (!icon) return;

      const oldHTML = icon.innerHTML;

      icon.innerHTML = "✓";

      copyLinkBtn.setAttribute("title", "Copied!");

      setTimeout(() => {

        icon.innerHTML = oldHTML;

        copyLinkBtn.setAttribute(
          "title",
          "Copy page link"
        );

      }, 1500);

    } catch (err) {

      console.error("Unable to copy link.");

    }

  }


  // Desktop Buttons
  shareBtn?.addEventListener("click", sharePage);

  copyLinkBtn?.addEventListener("click", copyPageLink);


  // Mobile Buttons
  mobileShare?.addEventListener("click", () => {

    sharePage();
    closeMenu();

  });


  mobileCopy?.addEventListener("click", () => {

    copyPageLink();
    closeMenu();

  });


  mobileTheme?.addEventListener("click", () => {

    themeBtn?.click();
    closeMenu();

  });

});