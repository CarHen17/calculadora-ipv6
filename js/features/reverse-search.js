/**
 * Reverse Search - Feature 6
 * Locates which subnet contains a given IPv6 address
 */
const ReverseSearch = (function() {
  'use strict';

  function performSearch() {
    const ipInput = document.getElementById('reverseSearchIp');
    const resultDiv = document.getElementById('reverseSearchResult');
    if (!ipInput || !resultDiv) return;

    const ip = ipInput.value.trim();
    if (!ip) {
      resultDiv.style.display = 'none';
      return;
    }

    if (!window.IPv6Utils || !window.IPv6Utils.findSubnetForIP) {
      resultDiv.className = 'reverse-search-result not-found';
      resultDiv.textContent = 'Módulo de busca não disponível';
      resultDiv.style.display = 'block';
      return;
    }

    const subnets = window.appState && window.appState.subRedesGeradas;
    if (!subnets || subnets.length === 0) {
      resultDiv.className = 'reverse-search-result not-found';
      resultDiv.textContent = 'Nenhuma sub-rede gerada para pesquisar';
      resultDiv.style.display = 'block';
      return;
    }

    // Search in the full list always (not filtered)
    const result = window.IPv6Utils.findSubnetForIP(ip, subnets);
    resultDiv.style.display = 'block';

    // Clear previous highlights
    document.querySelectorAll('#subnetsTable tbody tr.reverse-match')
      .forEach(r => r.classList.remove('reverse-match'));

    if (result.error) {
      resultDiv.className = 'reverse-search-result not-found';
      resultDiv.textContent = `Erro: ${result.error}`;
      return;
    }

    if (!result.found) {
      resultDiv.className = 'reverse-search-result not-found';
      resultDiv.textContent = `IP ${ip} não encontrado em nenhuma das ${subnets.length} sub-redes geradas`;
      return;
    }

    const shorten = window.IPv6Utils.shortenIPv6;
    const matchedSubnet = shorten(result.subnet.subnet);
    resultDiv.className = 'reverse-search-result found';
    resultDiv.innerHTML = `<i class="fas fa-check-circle" style="color:var(--secondary-color);margin-right:8px;"></i>
      IP encontrado em <strong>${matchedSubnet}</strong> (linha ${result.index + 1})`;

    scrollToAndHighlight(result.index);
  }

  function scrollToAndHighlight(index) {
    const tbody = document.querySelector('#subnetsTable tbody');
    if (!tbody) return;

    // Load more rows if the target index isn't yet rendered
    if (window.appState && index >= window.appState.subRedesExibidas) {
      if (window.UIController && window.UIController.carregarMaisSubRedes) {
        const needed = index + 10;
        window.UIController.carregarMaisSubRedes(
          window.appState.subRedesExibidas,
          needed - window.appState.subRedesExibidas
        );
      }
    }

    const row = tbody.querySelector(`tr[data-index="${index}"]`);
    if (row) {
      row.classList.add('reverse-match');
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function toggleBody() {
    const btn = document.getElementById('toggleReverseSearchBtn');
    const body = document.getElementById('reverseSearchBody');
    if (!btn || !body) return;

    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
    btn.classList.toggle('expanded', !isOpen);
  }

  function initialize() {
    const toggleBtn = document.getElementById('toggleReverseSearchBtn');
    const searchBtn = document.getElementById('reverseSearchBtn');
    const ipInput = document.getElementById('reverseSearchIp');

    if (toggleBtn && !toggleBtn.hasAttribute('data-reverse-ready')) {
      toggleBtn.addEventListener('click', toggleBody);
      toggleBtn.setAttribute('data-reverse-ready', 'true');
    }

    if (searchBtn && !searchBtn.hasAttribute('data-reverse-ready')) {
      searchBtn.addEventListener('click', performSearch);
      searchBtn.setAttribute('data-reverse-ready', 'true');
    }

    if (ipInput && !ipInput.hasAttribute('data-reverse-ready')) {
      ipInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); performSearch(); }
      });
      ipInput.setAttribute('data-reverse-ready', 'true');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 200);
  }

  return { performSearch, initialize };
})();

window.ReverseSearch = ReverseSearch;
