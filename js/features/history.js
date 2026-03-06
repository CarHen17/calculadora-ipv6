/**
 * Calculation History - Feature 1
 * Stores and restores past IPv6 calculations using localStorage
 */
const CalculationHistory = (function() {
  'use strict';

  const STORAGE_KEY = 'ipv6calc_history';
  const MAX_ITEMS = 10;
  let isOpen = false;

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('[History] Erro ao salvar histórico:', e);
    }
  }

  function addEntry(block, subnetPrefix, subnetCount) {
    const history = loadHistory();
    const entry = {
      block,
      prefix: subnetPrefix,
      timestamp: Date.now(),
      subnetCount
    };

    // Avoid duplicate consecutive entries
    if (history.length > 0 && history[0].block === block && history[0].prefix === subnetPrefix) {
      return;
    }

    history.unshift(entry);
    if (history.length > MAX_ITEMS) history.splice(MAX_ITEMS);
    saveHistory(history);
    renderHistory();
  }

  function renderHistory() {
    const list = document.getElementById('historyList');
    const empty = document.getElementById('historyEmpty');
    if (!list) return;

    const history = loadHistory();
    list.innerHTML = '';

    if (history.length === 0) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    history.forEach((entry) => {
      const li = document.createElement('li');
      li.className = 'history-item';
      li.setAttribute('role', 'option');

      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      const subnetLabel = entry.subnetCount != null ? `, ${entry.subnetCount} sub-redes` : '';
      const prefixLabel = entry.prefix ? ` → /${entry.prefix}` : '';

      li.innerHTML = `
        <span class="history-item-cidr">${entry.block}</span>
        <span class="history-item-meta">${prefixLabel}${subnetLabel} &bull; ${dateStr}</span>
      `;

      li.addEventListener('click', () => restoreEntry(entry));
      list.appendChild(li);
    });
  }

  function restoreEntry(entry) {
    const input = document.getElementById('ipv6');
    if (input) {
      input.value = entry.block;
      closeDropdown();
      const calcBtn = document.getElementById('calcularBtn');
      if (calcBtn) calcBtn.click();
    }
  }

  function toggleDropdown() {
    isOpen = !isOpen;
    const dropdown = document.getElementById('historyDropdown');
    if (!dropdown) return;
    if (isOpen) {
      renderHistory();
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  }

  function closeDropdown() {
    isOpen = false;
    const dropdown = document.getElementById('historyDropdown');
    if (dropdown) dropdown.style.display = 'none';
  }

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
    if (window.showNotification) window.showNotification('Histórico apagado', 'info');
  }

  function initialize() {
    const historyBtn = document.getElementById('historyBtn');
    const clearBtn = document.getElementById('clearHistoryBtn');

    if (historyBtn && !historyBtn.hasAttribute('data-history-ready')) {
      historyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown();
      });
      historyBtn.setAttribute('data-history-ready', 'true');
    }

    if (clearBtn && !clearBtn.hasAttribute('data-history-ready')) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearHistory();
      });
      clearBtn.setAttribute('data-history-ready', 'true');
    }

    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('historyDropdown');
      const btn = document.getElementById('historyBtn');
      if (dropdown && !dropdown.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 200);
  }

  return { addEntry, loadHistory, renderHistory, initialize };
})();

window.CalculationHistory = CalculationHistory;
