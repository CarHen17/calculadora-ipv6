/**
 * Hierarchical Subnet Planner
 * Plans multi-level IPv6 address hierarchies (e.g. ISP → Region → Client → Site → VLAN)
 */
const HierarchicalPlanner = (function () {
  'use strict';

  // Palette aligned with app design — used for node accents, not large backgrounds
  const LEVEL_COLORS = ['#0070d1', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];

  // ── Block-view state ─────────────────────────────────────────────
  let lastBase   = null;
  let lastLevels = null;
  let bvLevel    = 0;    // active level tab
  let bvOffset   = 0;    // pagination offset
  const BV_PAGE  = 50;

  // ── Formatting ────────────────────────────────────────────────────

  function formatBigInt(n) {
    if (n < 1000n) return n.toLocaleString('pt-BR');
    if (n < 1000000n) return `${(Number(n) / 1000).toFixed(1)}K`;
    if (n < 1000000000n) return `${(Number(n) / 1e6).toFixed(1)}M`;
    if (n < 1000000000000n) return `${(Number(n) / 1e9).toFixed(1)}B`;
    if (n < 1000000000000000n) return `${(Number(n) / 1e12).toFixed(1)}T`;
    const s = n.toString();
    const exp = s.length - 1;
    const mantissa = (Number(s.slice(0, 5)) / 10000).toFixed(2);
    return `${mantissa}×10<sup>${exp}</sup>`;
  }

  // ── Parsing & Validation ─────────────────────────────────────────

  function parseBaseBlock(val) {
    const parts = val.trim().split('/');
    if (parts.length !== 2) return null;
    const prefix = parseInt(parts[1], 10);
    if (isNaN(prefix) || prefix < 1 || prefix > 127) return null;
    return { address: parts[0].trim(), prefix };
  }

  function getLevels() {
    const rows = document.querySelectorAll('.hp-level-row');
    const levels = [];
    for (const row of rows) {
      const label = row.querySelector('.hp-level-label').value.trim();
      const prefix = parseInt(row.querySelector('.hp-level-prefix').value, 10);
      if (!label || isNaN(prefix)) return null;
      levels.push({ label, prefix });
    }
    return levels.length ? levels : null;
  }

  // ── Core Calculation ─────────────────────────────────────────────

  function computeHierarchy(base, levels) {
    const result = [];
    let parentPrefix = base.prefix;
    let totalBlocks = 1n;

    for (const level of levels) {
      const bitsAtLevel = level.prefix - parentPrefix;
      const childrenPerParent = 2n ** BigInt(bitsAtLevel);
      totalBlocks = totalBlocks * childrenPerParent;
      const hostsPerBlock = 2n ** BigInt(128 - level.prefix);

      result.push({
        label: level.label,
        prefix: level.prefix,
        bitsAtLevel,
        childrenPerParent,
        totalBlocks,
        hostsPerBlock,
      });

      parentPrefix = level.prefix;
    }
    return result;
  }

  // ── IPv6 / Block Enumeration ─────────────────────────────────────

  /** Compress an expanded IPv6 address (no CIDR) to its shortest form. */
  function compressIPv6(addr) {
    const groups = addr.split(':').map(g => parseInt(g, 16).toString(16));
    let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
    groups.forEach((g, i) => {
      if (g === '0') {
        if (curStart < 0) curStart = i;
        curLen++;
        if (curLen > bestLen) { bestStart = curStart; bestLen = curLen; }
      } else { curStart = -1; curLen = 0; }
    });
    if (bestLen < 2) return groups.join(':');
    const before = groups.slice(0, bestStart).join(':');
    const after  = groups.slice(bestStart + bestLen).join(':');
    if (!before && !after) return '::';
    if (!before) return `::${after}`;
    if (!after)  return `${before}::`;
    return `${before}::${after}`;
  }

  /** Return the i-th subnet CIDR string for a given level. */
  function blockCIDR(networkBase, blockSize, i, prefix) {
    const start = networkBase + BigInt(i) * blockSize;
    try {
      const expanded = IPv6Utils.formatIPv6Address(start);
      return `${compressIPv6(expanded)}/${prefix}`;
    } catch (e) {
      // fallback: raw hex
      return `${start.toString(16).padStart(32, '0').match(/.{4}/g).join(':')}/${prefix}`;
    }
  }

  /**
   * Return one page of enumerated blocks for the given level.
   * @returns {{ items: [{index,cidr,label}], total: BigInt, hasMore: boolean }}
   */
  function getBlocksPage(base, levels, levelIndex, offset) {
    const level      = levels[levelIndex];
    const total      = level.totalBlocks;          // BigInt
    const prefix     = level.prefix;
    const blockSize  = 2n ** BigInt(128 - prefix);
    const networkBase = IPv6Utils.getNetworkAddress(base.address, base.prefix);

    const end = BigInt(offset) + BigInt(BV_PAGE) < total
      ? offset + BV_PAGE
      : Number(total);

    const items = [];
    for (let i = offset; i < end; i++) {
      items.push({
        index: i + 1,
        cidr:  blockCIDR(networkBase, blockSize, i, prefix),
        label: `${level.label} ${i + 1}`,
      });
    }
    return { items, total, hasMore: BigInt(end) < total };
  }

  // ── Rendering ────────────────────────────────────────────────────

  function renderError(msg) {
    const el = document.getElementById('hpResults');
    el.className = 'hp-results-error';
    el.innerHTML = `
      <div class="hp-error">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${msg}</span>
      </div>`;
    el.style.display = 'block';
  }

  function renderResults(base, levels) {
    const baseHosts = 2n ** BigInt(128 - base.prefix);
    const totalBitsAllocated = levels[levels.length - 1].prefix - base.prefix;
    const deepestLevel = levels[levels.length - 1];

    // ── Summary stat cards ────────────────────────────────────────
    const summaryHtml = `
      <div class="hp-summary-cards">
        <div class="hp-stat-card">
          <div class="hp-stat-icon" style="background:rgba(0,112,209,.12);color:#0070d1">
            <i class="fas fa-layer-group"></i>
          </div>
          <div>
            <div class="hp-stat-value">${levels.length}</div>
            <div class="hp-stat-label">Níveis</div>
          </div>
        </div>
        <div class="hp-stat-card">
          <div class="hp-stat-icon" style="background:rgba(124,58,237,.12);color:#7c3aed">
            <i class="fas fa-code-branch"></i>
          </div>
          <div>
            <div class="hp-stat-value">${totalBitsAllocated}</div>
            <div class="hp-stat-label">Bits alocados</div>
          </div>
        </div>
        <div class="hp-stat-card">
          <div class="hp-stat-icon" style="background:rgba(5,150,105,.12);color:#059669">
            <i class="fas fa-th"></i>
          </div>
          <div>
            <div class="hp-stat-value">${formatBigInt(deepestLevel.totalBlocks)}</div>
            <div class="hp-stat-label">Blocos (${deepestLevel.label})</div>
          </div>
        </div>
        <div class="hp-stat-card">
          <div class="hp-stat-icon" style="background:rgba(217,119,6,.12);color:#d97706">
            <i class="fas fa-dot-circle"></i>
          </div>
          <div>
            <div class="hp-stat-value">${formatBigInt(deepestLevel.hostsPerBlock)}</div>
            <div class="hp-stat-label">End./bloco (${deepestLevel.label})</div>
          </div>
        </div>
      </div>`;

    // ── Tree visualization ────────────────────────────────────────
    const baseColor = LEVEL_COLORS[0];
    let treeHtml = `
      <div class="hp-section-title"><i class="fas fa-sitemap"></i> Hierarquia visual</div>
      <div class="hp-tree">
        <div class="hp-node" style="border-left-color:${baseColor}">
          <div class="hp-node-icon" style="background:${baseColor}">
            <i class="fas fa-globe"></i>
          </div>
          <div class="hp-node-body">
            <div class="hp-node-name">
              Bloco Base
              <code class="hp-cidr-tag">${base.address}/${base.prefix}</code>
            </div>
            <div class="hp-node-meta">
              <span><i class="fas fa-dot-circle"></i>&nbsp;${formatBigInt(baseHosts)} endereços totais</span>
            </div>
          </div>
        </div>`;

    levels.forEach((level, i) => {
      const color = LEVEL_COLORS[(i + 1) % LEVEL_COLORS.length];
      const bits = level.bitsAtLevel;
      treeHtml += `
        <div class="hp-connector">
          <div class="hp-conn-line" style="background:${color}"></div>
          <div class="hp-conn-badge" style="border-color:${color};color:${color}">
            ${bits} bit${bits !== 1 ? 's' : ''} &nbsp;&rarr;&nbsp; ${formatBigInt(level.childrenPerParent)} sub-redes/bloco
          </div>
        </div>
        <div class="hp-node" style="border-left-color:${color}">
          <div class="hp-node-icon" style="background:${color}">
            <i class="fas fa-network-wired"></i>
          </div>
          <div class="hp-node-body">
            <div class="hp-node-name">
              ${level.label}
              <span class="hp-prefix-pill" style="background:${color}">/${level.prefix}</span>
            </div>
            <div class="hp-node-meta">
              <span><i class="fas fa-th"></i>&nbsp;${formatBigInt(level.totalBlocks)} blocos</span>
              <span class="hp-meta-sep">·</span>
              <span><i class="fas fa-dot-circle"></i>&nbsp;${formatBigInt(level.hostsPerBlock)} end./bloco</span>
            </div>
          </div>
          <button class="hp-view-blocks-btn" data-level="${i}"
                  title="Ver os ${formatBigInt(level.totalBlocks)} blocos de ${level.label}"
                  style="border-color:${color};color:${color}">
            <i class="fas fa-list-ul"></i>
            <span>Ver blocos</span>
          </button>
        </div>`;
    });

    treeHtml += '</div>';

    // ── Stats table ───────────────────────────────────────────────
    const tableHtml = `
      <div class="hp-section-title" style="margin-top:24px"><i class="fas fa-table"></i> Tabela de resumo</div>
      <div class="hp-table-wrap">
        <table class="hp-table">
          <thead>
            <tr>
              <th>Nível</th>
              <th>Prefixo</th>
              <th>Bits usados</th>
              <th>Filhos/pai</th>
              <th>Total de blocos</th>
              <th>End./bloco</th>
            </tr>
          </thead>
          <tbody>
            <tr class="hp-row-base">
              <td><em>Base</em></td>
              <td><code>/${base.prefix}</code></td>
              <td>—</td>
              <td>—</td>
              <td>1</td>
              <td>${formatBigInt(baseHosts)}</td>
            </tr>
            ${levels.map((l, i) => {
              const color = LEVEL_COLORS[(i + 1) % LEVEL_COLORS.length];
              return `
              <tr>
                <td>
                  <span class="hp-table-dot" style="background:${color}"></span>
                  ${l.label}
                </td>
                <td><code>/${l.prefix}</code></td>
                <td><strong>${l.bitsAtLevel}</strong></td>
                <td>${formatBigInt(l.childrenPerParent)}</td>
                <td><strong>${formatBigInt(l.totalBlocks)}</strong></td>
                <td>${formatBigInt(l.hostsPerBlock)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    const el = document.getElementById('hpResults');
    el.className = 'hp-results-content';
    el.innerHTML = summaryHtml + treeHtml + tableHtml;
    el.style.display = 'block';

    // Save state for block enumeration (used by popup)
    lastBase   = base;
    lastLevels = levels;

    // Wire "Ver blocos" buttons on each tree node
    el.querySelectorAll('.hp-view-blocks-btn').forEach(btn => {
      btn.addEventListener('click', () => openBlocksModal(parseInt(btn.dataset.level, 10)));
    });

    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  }

  // ── Blocks popup modal ────────────────────────────────────────────

  function shadeColor(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, ((n >> 16) & 0xff) - 35);
    const g = Math.max(0, ((n >> 8)  & 0xff) - 35);
    const b = Math.max(0, ( n        & 0xff) - 35);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  function openBlocksModal(initialIndex) {
    if (!lastBase || !lastLevels) return;
    bvLevel  = initialIndex;
    bvOffset = 0;

    const color     = LEVEL_COLORS[(initialIndex + 1) % LEVEL_COLORS.length];
    const darkColor = shadeColor(color);
    const level     = lastLevels[initialIndex];

    const tabsHtml = lastLevels.map((l, i) => {
      const c = LEVEL_COLORS[(i + 1) % LEVEL_COLORS.length];
      const active = i === initialIndex;
      return `
        <button class="hp-level-tab${active ? ' hp-tab-active' : ''}" data-index="${i}"
                style="${active ? `border-color:${c};color:${c};background:${c}18` : ''}">
          <span class="hp-tab-dot" style="background:${c}"></span>
          ${l.label}
          <span class="hp-tab-count">${formatBigInt(l.totalBlocks)}</span>
        </button>`;
    }).join('');

    const backdrop = document.createElement('div');
    backdrop.id = 'hpModalBackdrop';
    backdrop.className = 'hp-modal-backdrop';
    backdrop.addEventListener('click', closeBlocksModal);

    const modal = document.createElement('div');
    modal.className = 'hp-blocks-modal';
    modal.setAttribute('role', 'dialog');
    modal.innerHTML = `
      <div class="hp-modal-header" style="background:linear-gradient(135deg,${color},${darkColor})">
        <div class="hp-modal-title">
          <i class="fas fa-network-wired"></i>
          Blocos &mdash; ${level.label}
          <span class="hp-prefix-pill" style="background:rgba(255,255,255,.2);color:#fff">/${level.prefix}</span>
        </div>
        <button class="hp-modal-close" title="Fechar"><i class="fas fa-times"></i></button>
      </div>
      ${lastLevels.length > 1 ? `<div class="hp-level-tabs hp-modal-tabs" id="hpModalLevelTabs">${tabsHtml}</div>` : ''}
      <div class="hp-blocks-info" id="hpModalBlocksInfo"></div>
      <div class="hp-blocks-list" id="hpModalBlocksList"></div>
      <div class="hp-blocks-footer" id="hpModalBlocksFooter"></div>`;

    modal.addEventListener('click', e => e.stopPropagation());
    modal.querySelector('.hp-modal-close').addEventListener('click', closeBlocksModal);

    if (lastLevels.length > 1) {
      modal.querySelectorAll('.hp-level-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const idx = parseInt(tab.dataset.index, 10);
          if (idx === bvLevel) return;
          modal.querySelectorAll('.hp-level-tab').forEach((t, i) => {
            const c = LEVEL_COLORS[(i + 1) % LEVEL_COLORS.length];
            const isActive = parseInt(t.dataset.index, 10) === idx;
            t.classList.toggle('hp-tab-active', isActive);
            t.style.borderColor = isActive ? c : '';
            t.style.color       = isActive ? c : '';
            t.style.background  = isActive ? c + '18' : '';
          });
          bvLevel  = idx;
          bvOffset = 0;
          modal.querySelector('#hpModalBlocksList').innerHTML = '';
          renderBlocksPage(false);
        });
      });
    }

    const onEsc = e => {
      if (e.key === 'Escape') { closeBlocksModal(); document.removeEventListener('keydown', onEsc); }
    };
    document.addEventListener('keydown', onEsc);

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('hp-modal-open'));
    renderBlocksPage(false);
  }

  function closeBlocksModal() {
    const bd = document.getElementById('hpModalBackdrop');
    if (!bd) return;
    bd.classList.remove('hp-modal-open');
    setTimeout(() => bd.parentNode && bd.parentNode.removeChild(bd), 260);
  }

  function renderBlocksPage(append) {
    if (!lastBase || !lastLevels) return;
    const { items, total, hasMore } = getBlocksPage(lastBase, lastLevels, bvLevel, bvOffset);
    const level = lastLevels[bvLevel];
    const color = LEVEL_COLORS[(bvLevel + 1) % LEVEL_COLORS.length];
    const shown = bvOffset + items.length;

    const infoEl = document.getElementById('hpModalBlocksInfo');
    if (infoEl) {
      infoEl.innerHTML = `
        <i class="fas fa-info-circle" style="color:${color}"></i>
        Mostrando <strong>${bvOffset + 1}–${shown}</strong> de
        <strong>${formatBigInt(total)}</strong> blocos
        <span class="hp-info-level" style="background:${color}15;border-color:${color};color:${color}">/${level.prefix}</span>`;
    }

    const listEl = document.getElementById('hpModalBlocksList');
    if (!listEl) return;
    if (!append) listEl.innerHTML = '';

    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'hp-block-item';
      row.innerHTML = `
        <span class="hp-block-index">${item.index}</span>
        <code class="hp-block-cidr">${item.cidr}</code>
        <span class="hp-block-label" style="background:${color}12;border-color:${color}40;color:${color}">${item.label}</span>
        <button class="hp-block-copy" data-cidr="${item.cidr}" title="Copiar ${item.cidr}">
          <i class="fas fa-copy"></i>
        </button>`;
      row.querySelector('.hp-block-copy').addEventListener('click', e => {
        const btn = e.currentTarget;
        navigator.clipboard.writeText(btn.dataset.cidr).then(() => {
          btn.innerHTML = '<i class="fas fa-check"></i>';
          btn.style.background = '#059669';
          setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i>'; btn.style.background = ''; }, 1500);
        });
      });
      listEl.appendChild(row);
    });

    bvOffset = shown;

    const footerEl = document.getElementById('hpModalBlocksFooter');
    if (!footerEl) return;
    if (hasMore) {
      footerEl.innerHTML = `
        <button class="hp-more-btn" style="border-color:${color};color:${color}">
          <i class="fas fa-chevron-down"></i> Ver mais ${BV_PAGE} blocos
        </button>`;
      footerEl.querySelector('.hp-more-btn').addEventListener('click', () => renderBlocksPage(true));
    } else {
      footerEl.innerHTML = items.length > 0
        ? `<span class="hp-blocks-done"><i class="fas fa-check-circle" style="color:#059669"></i> Todos os ${formatBigInt(total)} blocos exibidos</span>`
        : '';
    }
  }

  // ── Clear ─────────────────────────────────────────────────────────

  function clearPlanner() {
    document.getElementById('hpBaseBlock').value = '';
    document.getElementById('hpLevelsList').innerHTML = '';
    const results = document.getElementById('hpResults');
    results.style.display = 'none';
    results.innerHTML = '';
    lastBase = null;
    lastLevels = null;
    bvLevel = 0;
    bvOffset = 0;
  }

  // ── Calculate (entry point) ───────────────────────────────────────

  function calculate() {
    const baseVal = document.getElementById('hpBaseBlock').value;
    const base = parseBaseBlock(baseVal);
    if (!base) {
      renderError('Bloco base inválido. Use formato CIDR — ex: <code>2001:db8::/32</code>');
      return;
    }

    const levels = getLevels();
    if (!levels) {
      renderError('Preencha o nome e prefixo de todos os níveis antes de calcular.');
      return;
    }

    let prev = base.prefix;
    for (const l of levels) {
      if (l.prefix <= prev) {
        renderError(`Nível "<strong>${l.label}</strong>": prefixo /${l.prefix} deve ser maior que /${prev}.`);
        return;
      }
      if (l.prefix > 128) {
        renderError(`Prefixo /${l.prefix} excede o máximo de /128.`);
        return;
      }
      prev = l.prefix;
    }

    const computed = computeHierarchy(base, levels);
    renderResults(base, computed);
  }

  // ── Level Management ─────────────────────────────────────────────

  function addLevel(labelVal = '', prefixVal = '') {
    const list = document.getElementById('hpLevelsList');
    const index = list.children.length; // 0-based, for color
    const color = LEVEL_COLORS[(index + 1) % LEVEL_COLORS.length];

    const row = document.createElement('div');
    row.className = 'hp-level-row';
    row.innerHTML = `
      <span class="hp-level-num" style="background:${color}">${index + 1}</span>
      <input type="text"   class="hp-level-label"  placeholder="Ex: Região" value="${labelVal}">
      <span class="hp-slash">/</span>
      <input type="number" class="hp-level-prefix" min="1" max="128" placeholder="48" value="${prefixVal}">
      <button class="hp-remove-btn" title="Remover nível" aria-label="Remover nível">
        <i class="fas fa-times"></i>
      </button>`;
    row.querySelector('.hp-remove-btn').addEventListener('click', () => {
      row.remove();
      renumber();
    });
    list.appendChild(row);
  }

  function renumber() {
    const rows = document.querySelectorAll('.hp-level-row');
    rows.forEach((row, i) => {
      const num = row.querySelector('.hp-level-num');
      if (num) {
        num.textContent = i + 1;
        num.style.background = LEVEL_COLORS[(i + 1) % LEVEL_COLORS.length];
      }
    });
  }

  // ── Presets ───────────────────────────────────────────────────────

  const PRESETS = {
    isp: {
      base: '2001:db8::/32',
      levels: [
        { label: 'Região',  prefix: 40 },
        { label: 'Cliente', prefix: 48 },
        { label: 'Site',    prefix: 56 },
        { label: 'VLAN',    prefix: 64 },
      ],
    },
    enterprise: {
      base: '2001:db8::/48',
      levels: [
        { label: 'Departamento', prefix: 56 },
        { label: 'Segmento',     prefix: 64 },
      ],
    },
    datacenter: {
      base: '2001:db8::/40',
      levels: [
        { label: 'PoP',       prefix: 48 },
        { label: 'Rack',      prefix: 56 },
        { label: 'Servidor',  prefix: 64 },
        { label: 'Container', prefix: 80 },
      ],
    },
    mobile: {
      base: '2001:db8::/32',
      levels: [
        { label: 'UF',          prefix: 40 },
        { label: 'Célula',      prefix: 48 },
        { label: 'Dispositivo', prefix: 64 },
      ],
    },
  };

  function loadPreset(key) {
    const p = PRESETS[key];
    if (!p) return;
    document.getElementById('hpBaseBlock').value = p.base;
    document.getElementById('hpLevelsList').innerHTML = '';
    p.levels.forEach(l => addLevel(l.label, l.prefix));
    calculate();
  }

  // ── Panel open/close ─────────────────────────────────────────────

  function openPanel() {
    document.getElementById('hpPanel').classList.add('hp-panel-open');
    document.getElementById('hpPanelBackdrop').style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    document.getElementById('hpPanel').classList.remove('hp-panel-open');
    document.getElementById('hpPanelBackdrop').style.display = 'none';
    document.body.style.overflow = '';
  }

  // ── CSS Injection ─────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('hpStyles')) return;
    const s = document.createElement('style');
    s.id = 'hpStyles';
    s.textContent = `

/* ═══════════════════════════════════════════════
   BACKDROP & PANEL SHELL
═══════════════════════════════════════════════ */
#hpPanelBackdrop {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  backdrop-filter: blur(2px);
}

#hpPanel {
  position: fixed;
  top: 0;
  right: 0;
  width: min(720px, 100vw);
  height: 100vh;
  background: #ffffff;
  box-shadow: -6px 0 40px rgba(0, 0, 0, 0.15);
  z-index: 1101;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
body.dark-mode #hpPanel {
  background: #0d1117;
}
#hpPanel.hp-panel-open {
  transform: translateX(0);
}

/* ═══════════════════════════════════════════════
   PANEL HEADER (gradient, like main buttons)
═══════════════════════════════════════════════ */
.hp-panel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #0070d1, #0056a3);
  flex-shrink: 0;
}

.hp-header-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  flex-shrink: 0;
}

.hp-header-text {
  flex: 1;
  min-width: 0;
}
.hp-header-text h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}
.hp-header-text p {
  margin: 3px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.3;
}

.hp-close-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  color: #fff;
  font-size: 15px;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}
.hp-close-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

/* ═══════════════════════════════════════════════
   PANEL BODY (scrollable)
═══════════════════════════════════════════════ */
.hp-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.hp-panel-body::-webkit-scrollbar { width: 6px; }
.hp-panel-body::-webkit-scrollbar-track {
  background: #f6f8fa;
}
body.dark-mode .hp-panel-body::-webkit-scrollbar-track {
  background: #161b22;
}
.hp-panel-body::-webkit-scrollbar-thumb {
  background: #0070d1;
  border-radius: 3px;
}

/* ═══════════════════════════════════════════════
   FORM SECTIONS
═══════════════════════════════════════════════ */
.hp-form-section {
  padding: 20px 24px;
  border-bottom: 1px solid #d0d7de;
}
body.dark-mode .hp-form-section {
  border-color: #30363d;
}

.hp-section-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #57606a;
  margin-bottom: 12px;
}
body.dark-mode .hp-section-label {
  color: #8b949e;
}

/* ═══════════════════════════════════════════════
   PRESETS
═══════════════════════════════════════════════ */
.hp-presets-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hp-preset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1.5px solid #d0d7de;
  border-radius: 20px;
  background: #f6f8fa;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #24292f;
  transition: all 0.2s ease;
  font-family: inherit;
}
.hp-preset-btn:hover {
  border-color: #0070d1;
  color: #0070d1;
  background: rgba(0, 112, 209, 0.06);
  box-shadow: 0 2px 8px rgba(0, 112, 209, 0.12);
  transform: translateY(-1px);
}
body.dark-mode .hp-preset-btn {
  background: #161b22;
  border-color: #30363d;
  color: #e6edf3;
}
body.dark-mode .hp-preset-btn:hover {
  border-color: #2689db;
  color: #2689db;
  background: rgba(38, 137, 219, 0.08);
}

/* ═══════════════════════════════════════════════
   BASE BLOCK INPUT
═══════════════════════════════════════════════ */
.hp-base-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 340px;
}
.hp-base-input-icon {
  position: absolute;
  left: 13px;
  color: #57606a;
  font-size: 14px;
  pointer-events: none;
}
body.dark-mode .hp-base-input-icon { color: #8b949e; }

#hpBaseBlock {
  width: 100%;
  padding: 10px 14px 10px 38px;
  border: 1.5px solid #d0d7de;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  background: #fff;
  color: #24292f;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}
body.dark-mode #hpBaseBlock {
  background: #161b22;
  border-color: #30363d;
  color: #e6edf3;
}
#hpBaseBlock:focus {
  outline: none;
  border-color: #0070d1;
  box-shadow: 0 2px 12px rgba(0, 112, 209, 0.2);
}

/* ═══════════════════════════════════════════════
   LEVEL ROWS
═══════════════════════════════════════════════ */
.hp-levels-col-header {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
  padding: 0 2px;
}
.hp-levels-col-header span {
  font-size: 11px;
  font-weight: 600;
  color: #57606a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
body.dark-mode .hp-levels-col-header span { color: #8b949e; }
.hp-col-name { flex: 1; padding-left: 34px; }
.hp-col-prefix { width: 68px; text-align: center; }
.hp-col-actions { width: 28px; }

#hpLevelsList {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.hp-level-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hp-level-num {
  width: 24px;
  min-width: 24px;
  height: 24px;
  border-radius: 50%;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hp-level-label {
  flex: 1;
  padding: 8px 12px;
  border: 1.5px solid #d0d7de;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  background: #fff;
  color: #24292f;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s, box-shadow 0.2s;
}
body.dark-mode .hp-level-label {
  background: #161b22;
  border-color: #30363d;
  color: #e6edf3;
}
.hp-level-label:focus {
  outline: none;
  border-color: #0070d1;
  box-shadow: 0 2px 8px rgba(0, 112, 209, 0.15);
}

.hp-slash {
  font-size: 16px;
  font-weight: 700;
  color: #57606a;
  flex-shrink: 0;
}
body.dark-mode .hp-slash { color: #8b949e; }

.hp-level-prefix {
  width: 68px;
  padding: 8px 10px;
  border: 1.5px solid #d0d7de;
  border-radius: 6px;
  font-size: 13px;
  font-family: 'SFMono-Regular', Consolas, monospace;
  text-align: center;
  background: #fff;
  color: #24292f;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  transition: border-color 0.2s, box-shadow 0.2s;
  flex-shrink: 0;
}
body.dark-mode .hp-level-prefix {
  background: #161b22;
  border-color: #30363d;
  color: #e6edf3;
}
.hp-level-prefix:focus {
  outline: none;
  border-color: #0070d1;
  box-shadow: 0 2px 8px rgba(0, 112, 209, 0.15);
}

.hp-remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #57606a;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
}
.hp-remove-btn:hover {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
}
body.dark-mode .hp-remove-btn:hover {
  background: rgba(220, 38, 38, 0.12);
}

/* ═══════════════════════════════════════════════
   ADD LEVEL BUTTON
═══════════════════════════════════════════════ */
.hp-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border: 1.5px dashed #d0d7de;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #57606a;
  font-family: inherit;
  transition: all 0.2s ease;
}
.hp-add-btn:hover {
  border-color: #0070d1;
  color: #0070d1;
  background: rgba(0, 112, 209, 0.04);
}
body.dark-mode .hp-add-btn {
  color: #8b949e;
  border-color: #30363d;
}
body.dark-mode .hp-add-btn:hover {
  border-color: #2689db;
  color: #2689db;
}

/* ═══════════════════════════════════════════════
   CALCULATE + CLEAR BUTTONS
═══════════════════════════════════════════════ */
.hp-calc-section {
  padding: 20px 24px;
}

.hp-calc-buttons {
  display: flex;
  gap: 10px;
  align-items: stretch;
}

.hp-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 14px 18px;
  background: transparent;
  color: #57606a;
  border: 1.5px solid #d0d7de;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}
.hp-clear-btn:hover {
  border-color: #dc2626;
  color: #dc2626;
  background: rgba(220, 38, 38, 0.05);
}
body.dark-mode .hp-clear-btn {
  color: #8b949e;
  border-color: #30363d;
}
body.dark-mode .hp-clear-btn:hover {
  border-color: #dc2626;
  color: #f87171;
  background: rgba(220, 38, 38, 0.08);
}

#hpCalcBtn {
  flex: 1;
  padding: 14px 20px;
  background: linear-gradient(135deg, #0070d1, #0056a3);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 112, 209, 0.3);
}
#hpCalcBtn:hover {
  box-shadow: 0 6px 18px rgba(0, 112, 209, 0.4);
  transform: translateY(-1px);
}
#hpCalcBtn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 112, 209, 0.3);
}

/* ═══════════════════════════════════════════════
   RESULTS AREA
═══════════════════════════════════════════════ */
#hpResults {
  padding: 24px;
  border-top: 1px solid #d0d7de;
}
body.dark-mode #hpResults {
  border-color: #30363d;
}

@keyframes hpFadeInUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hp-results-content {
  animation: hpFadeInUp 0.35s ease;
}
.hp-results-error {
  animation: hpFadeInUp 0.25s ease;
}

/* ── Error box ── */
.hp-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: #fff8e1;
  border: 1px solid #f0b849;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 14px;
  line-height: 1.5;
}
body.dark-mode .hp-error {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.4);
  border-left-color: #f59e0b;
  color: #fbbf24;
}
.hp-error i { margin-top: 1px; flex-shrink: 0; }

/* ── Summary stat cards ── */
.hp-summary-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.hp-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 10px;
  transition: box-shadow 0.2s ease;
}
.hp-stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
body.dark-mode .hp-stat-card {
  background: #161b22;
  border-color: #30363d;
}
body.dark-mode .hp-stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.hp-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.hp-stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #24292f;
  line-height: 1.1;
}
body.dark-mode .hp-stat-value { color: #e6edf3; }

.hp-stat-label {
  font-size: 11px;
  color: #57606a;
  margin-top: 2px;
  line-height: 1.3;
}
body.dark-mode .hp-stat-label { color: #8b949e; }

/* ── Section title (before tree/table) ── */
.hp-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #24292f;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 7px;
}
body.dark-mode .hp-section-title { color: #e6edf3; }
.hp-section-title i { color: #0070d1; }

/* ═══════════════════════════════════════════════
   TREE VISUALIZATION
═══════════════════════════════════════════════ */
.hp-tree {
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}

/* Nodes: left-border accent (no color-mix, no full-color backgrounds) */
.hp-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-left: 4px solid #0070d1; /* overridden inline per level */
  border-radius: 8px;
  box-sizing: border-box;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.hp-node:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}
body.dark-mode .hp-node {
  background: #161b22;
  border-color: #30363d;
}
body.dark-mode .hp-node:hover {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}

/* ── Ver blocos button (on each tree node) ── */
.hp-view-blocks-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border: 1.5px solid;
  border-radius: 16px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s ease;
  opacity: 0.85;
}
.hp-view-blocks-btn:hover {
  opacity: 1;
  transform: scale(1.04);
  box-shadow: 0 2px 8px rgba(0,0,0,.12);
}
@media (max-width: 480px) {
  .hp-view-blocks-btn span { display: none; }
}

.hp-node-icon {
  width: 36px;
  min-width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
}

.hp-node-body { flex: 1; min-width: 0; }

.hp-node-name {
  font-size: 14px;
  font-weight: 700;
  color: #24292f;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  line-height: 1.3;
}
body.dark-mode .hp-node-name { color: #e6edf3; }

.hp-cidr-tag {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  background: rgba(0, 112, 209, 0.1);
  color: #0070d1;
  padding: 2px 8px;
  border-radius: 5px;
  border: 1px solid rgba(0, 112, 209, 0.2);
}
body.dark-mode .hp-cidr-tag {
  background: rgba(38, 137, 219, 0.12);
  color: #58a6ff;
  border-color: rgba(38, 137, 219, 0.25);
}

.hp-prefix-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
}

.hp-node-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}
.hp-node-meta span {
  font-size: 12px;
  color: #57606a;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
body.dark-mode .hp-node-meta span { color: #8b949e; }
.hp-meta-sep {
  color: #d0d7de !important;
  font-size: 14px !important;
}
body.dark-mode .hp-meta-sep { color: #30363d !important; }

/* Connector between nodes */
.hp-connector {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0 6px 20px;
}

.hp-conn-line {
  width: 2px;
  height: 30px;
  border-radius: 2px;
  opacity: 0.35;
  flex-shrink: 0;
}

.hp-conn-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border: 1.5px solid;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: #fff;
  white-space: nowrap;
}
body.dark-mode .hp-conn-badge {
  background: #0d1117;
}

/* ═══════════════════════════════════════════════
   STATS TABLE
═══════════════════════════════════════════════ */
.hp-table-wrap {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #d0d7de;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
body.dark-mode .hp-table-wrap {
  border-color: #30363d;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

.hp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

/* Gradient header matching app's table style */
.hp-table thead tr {
  background: linear-gradient(135deg, #0070d1, #0056a3);
}
.hp-table th {
  padding: 11px 14px;
  text-align: left;
  color: #fff;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
}

.hp-table td {
  padding: 9px 14px;
  border-bottom: 1px solid #d0d7de;
  color: #24292f;
  vertical-align: middle;
  /* Override global table height that causes rows to balloon */
  height: auto !important;
  line-height: 1.4;
  white-space: nowrap;
}
body.dark-mode .hp-table td {
  border-color: #21262d;
  color: #e6edf3;
}

.hp-table tbody tr:last-child td { border-bottom: none; }
.hp-table tbody tr:hover td { background: rgba(0, 112, 209, 0.04); }
body.dark-mode .hp-table tbody tr:hover td { background: rgba(38, 137, 219, 0.05); }

.hp-row-base td {
  color: #57606a;
  background: #f6f8fa;
}
body.dark-mode .hp-row-base td {
  color: #8b949e;
  background: #161b22;
}

.hp-table code {
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 5px;
  border-radius: 4px;
}
body.dark-mode .hp-table code {
  background: rgba(255, 255, 255, 0.07);
}

.hp-table-dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 7px;
  vertical-align: middle;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════
   HEADER OPEN BUTTON
═══════════════════════════════════════════════ */
#hpOpenBtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* ═══════════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════════ */
@media (max-width: 600px) {
  .hp-form-section { padding: 16px; }
  .hp-calc-section { padding: 16px; }
  #hpResults { padding: 16px; }
  .hp-summary-cards { grid-template-columns: 1fr 1fr; gap: 8px; }
  .hp-stat-value { font-size: 17px; }
  .hp-node-meta { gap: 3px; }
  .hp-conn-badge { font-size: 11px; padding: 3px 9px; }
  .hp-header-text p { display: none; }
}
@media (max-width: 400px) {
  .hp-summary-cards { grid-template-columns: 1fr; }
}

/* ═══════════════════════════════════════════════
   BLOCKS POPUP MODAL
═══════════════════════════════════════════════ */
.hp-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.hp-modal-backdrop.hp-modal-open {
  opacity: 1;
}

.hp-blocks-modal {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transform: translateY(16px) scale(0.97);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.hp-modal-backdrop.hp-modal-open .hp-blocks-modal {
  transform: translateY(0) scale(1);
}
body.dark-mode .hp-blocks-modal {
  background: #161b22;
}

.hp-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  flex-shrink: 0;
}
.hp-modal-title {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  flex-wrap: wrap;
}
.hp-modal-close {
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  transition: background 0.15s;
  flex-shrink: 0;
}
.hp-modal-close:hover { background: rgba(255, 255, 255, 0.3); }

/* ── Level tabs (shared between modal and any future use) ── */
.hp-level-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 12px 16px;
  border-bottom: 1px solid #d0d7de;
  flex-shrink: 0;
}
body.dark-mode .hp-level-tabs {
  border-color: #30363d;
}
.hp-modal-tabs {
  background: #f6f8fa;
}
body.dark-mode .hp-modal-tabs {
  background: #0d1117;
}

.hp-level-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 13px;
  border: 1.5px solid #d0d7de;
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  color: #57606a;
  transition: all 0.2s ease;
}
.hp-level-tab:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,.08);
  transform: translateY(-1px);
}
body.dark-mode .hp-level-tab {
  color: #8b949e;
  border-color: #30363d;
}
.hp-tab-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.hp-tab-count {
  font-size: 11px;
  opacity: 0.7;
  margin-left: 1px;
}

/* ── Info bar ── */
.hp-blocks-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 13px;
  color: #57606a;
  background: #f6f8fa;
  border-bottom: 1px solid #d0d7de;
}
body.dark-mode .hp-blocks-info {
  background: #161b22;
  border-color: #30363d;
  color: #8b949e;
}
.hp-info-level {
  display: inline-block;
  padding: 1px 8px;
  border: 1px solid;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  font-family: 'SFMono-Regular', monospace;
  margin-left: 4px;
}

/* ── Block list ── */
.hp-blocks-list {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}
.hp-blocks-list::-webkit-scrollbar { width: 5px; }
.hp-blocks-list::-webkit-scrollbar-thumb { background: #0070d1; border-radius: 3px; }

.hp-block-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 11px;
  border: 1px solid #d0d7de;
  border-radius: 7px;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.hp-block-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
}
body.dark-mode .hp-block-item {
  background: #0d1117;
  border-color: #21262d;
}
body.dark-mode .hp-block-item:hover {
  border-color: #30363d;
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
}

.hp-block-index {
  min-width: 30px;
  text-align: right;
  font-size: 12px;
  color: #57606a;
  flex-shrink: 0;
}
body.dark-mode .hp-block-index { color: #8b949e; }

.hp-block-cidr {
  flex: 1;
  font-family: 'SFMono-Regular', Consolas, monospace;
  font-size: 13px;
  font-weight: 600;
  color: #24292f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
body.dark-mode .hp-block-cidr { color: #e6edf3; }

.hp-block-label {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 9px;
  border-radius: 10px;
  border: 1px solid;
  white-space: nowrap;
  flex-shrink: 0;
}

.hp-block-copy {
  background: #0070d1;
  color: #fff;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: background 0.15s, transform 0.15s;
  flex-shrink: 0;
}
.hp-block-copy:hover {
  background: #0056a3;
  transform: scale(1.07);
}

/* ── Footer ── */
.hp-blocks-footer {
  padding: 12px 16px;
  border-top: 1px solid #d0d7de;
  display: flex;
  align-items: center;
  justify-content: center;
}
body.dark-mode .hp-blocks-footer { border-color: #30363d; }

.hp-more-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 20px;
  border: 1.5px solid;
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.2s ease;
}
.hp-more-btn:hover {
  opacity: 0.8;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0,0,0,.1);
}
.hp-blocks-done {
  font-size: 13px;
  color: #57606a;
  display: flex;
  align-items: center;
  gap: 7px;
}
body.dark-mode .hp-blocks-done { color: #8b949e; }
    `;
    document.head.appendChild(s);
  }

  // ── DOM Scaffolding ───────────────────────────────────────────────

  function buildPanel() {
    const backdrop = document.createElement('div');
    backdrop.id = 'hpPanelBackdrop';
    backdrop.addEventListener('click', closePanel);
    document.body.appendChild(backdrop);

    const panel = document.createElement('div');
    panel.id = 'hpPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Planejador Hierárquico de Sub-redes');

    panel.innerHTML = `
      <!-- Header (gradient) -->
      <div class="hp-panel-header">
        <div class="hp-header-icon-wrap">
          <i class="fas fa-sitemap"></i>
        </div>
        <div class="hp-header-text">
          <h2>Planejador Hierárquico</h2>
          <p>Visualize o endereçamento IPv6 em múltiplos níveis</p>
        </div>
        <button class="hp-close-btn" id="hpCloseBtn" title="Fechar" aria-label="Fechar planejador">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="hp-panel-body">

        <!-- 1. Presets -->
        <div class="hp-form-section">
          <span class="hp-section-label">Início rápido</span>
          <div class="hp-presets-row">
            <button class="hp-preset-btn" data-preset="isp">
              <i class="fas fa-building"></i> ISP
            </button>
            <button class="hp-preset-btn" data-preset="enterprise">
              <i class="fas fa-sitemap"></i> Empresa
            </button>
            <button class="hp-preset-btn" data-preset="datacenter">
              <i class="fas fa-server"></i> Data Center
            </button>
            <button class="hp-preset-btn" data-preset="mobile">
              <i class="fas fa-mobile-alt"></i> Operadora Móvel
            </button>
          </div>
        </div>

        <!-- 2. Base block -->
        <div class="hp-form-section">
          <label class="hp-section-label" for="hpBaseBlock">Bloco base (CIDR)</label>
          <div class="hp-base-input-wrap">
            <i class="fas fa-cube hp-base-input-icon"></i>
            <input
              type="text"
              id="hpBaseBlock"
              placeholder="Ex: 2001:db8::/32"
              autocomplete="off"
              spellcheck="false"
            >
          </div>
        </div>

        <!-- 3. Hierarchical levels -->
        <div class="hp-form-section">
          <span class="hp-section-label">Níveis hierárquicos</span>
          <div class="hp-levels-col-header">
            <span class="hp-col-name">Nome</span>
            <span class="hp-col-prefix">Prefixo</span>
            <span class="hp-col-actions"></span>
          </div>
          <div id="hpLevelsList"></div>
          <button id="hpAddLevelBtn" class="hp-add-btn">
            <i class="fas fa-plus"></i> Adicionar nível
          </button>
        </div>

        <!-- 4. Calculate + Clear buttons -->
        <div class="hp-calc-section">
          <div class="hp-calc-buttons">
            <button id="hpClearBtn" class="hp-clear-btn">
              <i class="fas fa-redo-alt"></i> Limpar
            </button>
            <button id="hpCalcBtn">
              <i class="fas fa-calculator"></i> Calcular Hierarquia
            </button>
          </div>
        </div>

        <!-- 5. Results (hidden until calculated) -->
        <div id="hpResults" style="display:none"></div>

      </div>`;

    document.body.appendChild(panel);

    panel.querySelector('#hpCloseBtn').addEventListener('click', closePanel);
    panel.querySelector('#hpAddLevelBtn').addEventListener('click', () => addLevel());
    panel.querySelector('#hpCalcBtn').addEventListener('click', calculate);
    panel.querySelector('#hpClearBtn').addEventListener('click', clearPlanner);
    panel.querySelectorAll('.hp-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && panel.classList.contains('hp-panel-open')) {
        closePanel();
      }
    });
  }

  function addOpenButton() {
    const headerButtons = document.querySelector('.header-buttons');
    if (!headerButtons || document.getElementById('hpOpenBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'hpOpenBtn';
    btn.className = 'btn-primary';
    btn.title = 'Planejador Hierárquico de Sub-redes';
    btn.innerHTML = '<i class="fas fa-sitemap"></i> Planejar';
    btn.addEventListener('click', openPanel);

    headerButtons.insertBefore(btn, headerButtons.firstChild);
  }

  // ── Initialize ───────────────────────────────────────────────────

  function initialize() {
    injectStyles();
    buildPanel();
    addOpenButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 0);
  }

  return { initialize, openPanel, closePanel, calculate, loadPreset };
})();

window.HierarchicalPlanner = HierarchicalPlanner;
