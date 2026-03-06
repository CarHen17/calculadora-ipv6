/**
 * Table Tools - Feature 5 (Copy CSV) + Feature 2 (Search/Filter)
 */
const TableTools = (function() {
  'use strict';

  let searchDebounceTimer = null;

  // ===== Feature 5: Copy Table as CSV =====

  function copyTableAsCSV() {
    const subnets = window.appState && window.appState.subRedesGeradas;
    if (!subnets || subnets.length === 0) {
      window.showNotification('Nenhuma sub-rede para copiar', 'warning');
      return;
    }

    const source = window._filteredSubnets || subnets;
    const shorten = window.IPv6Utils ? window.IPv6Utils.shortenIPv6 : (x) => x;
    const headers = ['Sub-rede', 'Inicial', 'Final', 'Rede'];

    const rows = source.map(s => [
      shorten(s.subnet),
      shorten(s.initial),
      shorten(s.final),
      shorten(s.network)
    ].map(v => `"${v}"`).join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(csv).then(() => {
        window.showNotification(`${source.length} sub-redes copiadas como CSV`, 'success');
      }).catch(() => fallbackCopy(csv, source.length));
    } else {
      fallbackCopy(csv, source.length);
    }
  }

  function fallbackCopy(text, count) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      window.showNotification(`${count} sub-redes copiadas como CSV`, 'success');
    } catch (e) {
      window.showNotification('Erro ao copiar', 'error');
    }
    document.body.removeChild(ta);
  }

  // ===== Feature 2: Search/Filter =====

  function filterSubnets(query) {
    const subnets = window.appState && window.appState.subRedesGeradas;
    if (!subnets) return;

    const q = query.trim().toLowerCase();
    const matchCount = document.getElementById('searchMatchCount');

    if (!q) {
      window._filteredSubnets = null;
      rebuildTable(subnets);
      if (matchCount) matchCount.style.display = 'none';
      return;
    }

    const shorten = window.IPv6Utils ? window.IPv6Utils.shortenIPv6 : (x) => x;
    const filtered = subnets.filter(s =>
      shorten(s.subnet).toLowerCase().includes(q) ||
      shorten(s.network).toLowerCase().includes(q) ||
      shorten(s.initial).toLowerCase().includes(q)
    );

    window._filteredSubnets = filtered;
    rebuildTable(filtered);

    if (matchCount) {
      matchCount.textContent = `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`;
      matchCount.style.display = 'inline';
    }
  }

  function rebuildTable(subnets) {
    const tbody = document.querySelector('#subnetsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!window.UIController || !window.UIController.carregarMaisSubRedes) return;

    // If virtual scroll is active, let it handle rendering via refresh
    if (window.VirtualScroll && window.VirtualScroll.isEnabled()) {
      window.VirtualScroll.refresh();
      return;
    }

    const original = window.appState.subRedesGeradas;
    window.appState.subRedesGeradas = subnets;
    window.appState.subRedesExibidas = 0;

    const limit = Math.min(100, subnets.length);
    window.UIController.carregarMaisSubRedes(0, limit);

    // Restore original full list; subRedesExibidas now reflects the filter count
    window.appState.subRedesGeradas = original;

    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (loadMoreContainer) {
      loadMoreContainer.style.display = subnets.length > 100 ? 'block' : 'none';
    }
  }

  // ===== Interaction Hints dismiss =====

  const HINTS_DISMISSED_KEY = 'ipv6calc_hints_dismissed';

  function setupHintsDismiss() {
    const hintsEl = document.getElementById('interactionHints');
    const dismissBtn = document.getElementById('dismissHintsBtn');

    if (!hintsEl) return;

    // Hide immediately if already dismissed
    if (localStorage.getItem(HINTS_DISMISSED_KEY) === 'true') {
      hintsEl.style.display = 'none';
      return;
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        hintsEl.style.transition = 'opacity 0.2s ease, max-height 0.25s ease, margin 0.25s ease, padding 0.25s ease';
        hintsEl.style.overflow = 'hidden';
        hintsEl.style.opacity = '0';
        hintsEl.style.maxHeight = '0';
        hintsEl.style.marginBottom = '0';
        hintsEl.style.paddingTop = '0';
        hintsEl.style.paddingBottom = '0';
        setTimeout(() => { hintsEl.style.display = 'none'; }, 250);
        try { localStorage.setItem(HINTS_DISMISSED_KEY, 'true'); } catch (e) {}
      });
    }
  }

  // ===== Initialization =====

  function initialize() {
    const copyBtn = document.getElementById('copyTableBtn');
    if (copyBtn && !copyBtn.hasAttribute('data-table-tools-ready')) {
      copyBtn.addEventListener('click', copyTableAsCSV);
      copyBtn.setAttribute('data-table-tools-ready', 'true');
    }

    const searchInput = document.getElementById('searchSubnets');
    if (searchInput && !searchInput.hasAttribute('data-table-tools-ready')) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => filterSubnets(e.target.value), 250);
      });
      searchInput.setAttribute('data-table-tools-ready', 'true');
    }

    setupHintsDismiss();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 200);
  }

  return { copyTableAsCSV, filterSubnets, rebuildTable, initialize };
})();

window.TableTools = TableTools;
