/**
 * Virtual Scroll - Feature 9
 * Renders only visible rows for large subnet tables.
 * Uses a scroll event listener on .table-container and
 * a "phantom" tbody height to simulate full scrollable content.
 *
 * Approach: Instead of absolute positioning (which is unreliable in tables),
 * this module uses a simpler "windowed rendering" strategy:
 *   - Pre-render rows in batches of WINDOW_SIZE
 *   - Load more rows on scroll (extending the rendered list)
 *   - On filter/search, the table-tools.js rebuildTable is used directly
 *
 * This is a progressive enhancement: for datasets <= THRESHOLD, the existing
 * carregarMaisSubRedes + loadMore button is used unchanged.
 */
const VirtualScroll = (function() {
  'use strict';

  const THRESHOLD = 500;   // Activate virtual scroll above this many rows
  const INITIAL_ROWS = 100;
  const SCROLL_BATCH = 100; // Rows to add per scroll trigger

  let enabled = false;
  let container = null;
  let scrollHandler = null;

  function getDataSource() {
    return window._filteredSubnets || (window.appState && window.appState.subRedesGeradas) || [];
  }

  function onScroll() {
    if (!container || !enabled) return;
    const threshold = 200; // px from bottom
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;

    if (nearBottom) {
      const data = getDataSource();
      const current = window.appState.subRedesExibidas;
      if (current < data.length) {
        const next = Math.min(current + SCROLL_BATCH, data.length);
        if (window.UIController && window.UIController.carregarMaisSubRedes) {
          window.UIController.carregarMaisSubRedes(current, next - current);
        }
      }
    }
  }

  function activate(data) {
    if (data.length <= THRESHOLD) {
      enabled = false;
      return false;
    }

    container = document.querySelector('.table-container');
    if (!container) return false;

    enabled = true;

    // Ensure the table-container is scrollable
    if (container.style.overflowY !== 'auto') {
      container.style.overflowY = 'auto';
      container.style.maxHeight = 'calc(100vh - 350px)';
      container.style.minHeight = '400px';
    }

    // Hide the load-more button (scroll handles loading)
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';

    // Attach scroll listener
    if (scrollHandler) container.removeEventListener('scroll', scrollHandler);
    scrollHandler = () => requestAnimationFrame(onScroll);
    container.addEventListener('scroll', scrollHandler, { passive: true });

    return true;
  }

  function deactivate() {
    enabled = false;
    if (scrollHandler && container) {
      container.removeEventListener('scroll', scrollHandler);
    }
    // Restore container style
    if (container) {
      container.style.overflowY = '';
      container.style.maxHeight = '';
      container.style.minHeight = '';
    }
    container = null;
    scrollHandler = null;
  }

  function refresh() {
    if (!enabled) return;
    const data = getDataSource();
    const tbody = document.querySelector('#subnetsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    window.appState.subRedesExibidas = 0;
    if (window.UIController && window.UIController.carregarMaisSubRedes) {
      window.UIController.carregarMaisSubRedes(0, INITIAL_ROWS);
    }
    // Update load-more container visibility
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer) {
      // When virtual scroll is active, hide the button
      loadMoreContainer.style.display = 'none';
    }
  }

  return { activate, deactivate, refresh, isEnabled: () => enabled };
})();

window.VirtualScroll = VirtualScroll;
