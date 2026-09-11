// Global framework bootstrapping
document.addEventListener('DOMContentLoaded', () => {
  // Horizontal scroll support via drag
  const navTrack = document.getElementById('horizontalNavTrack');
  if (navTrack) {
    let isDown = false;
    let startX, scrollLeft;

    navTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - navTrack.offsetLeft;
      scrollLeft = navTrack.scrollLeft;
    });
    navTrack.addEventListener('mouseleave', () => isDown = false);
    navTrack.addEventListener('mouseup', () => isDown = false);
    navTrack.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - navTrack.offsetLeft;
      const walk = (x - startX) * 1.5;
      navTrack.scrollLeft = scrollLeft - walk;
    });
  }
});