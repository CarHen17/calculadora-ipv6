/**
 * Hierarchical Subnet Planner
 * Plans multi-level IPv6 address hierarchies (e.g. ISP → Region → Client → Site → VLAN)
 */
const HierarchicalPlanner = (function () {
  'use strict';

  const LEVEL_COLORS = ['#0070d1', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626'];

  // ── Formatting ────────────────────────────────────────────────────

  function formatBigInt(n) {
    if (n <= 9999n) return n.toLocaleString('pt-BR');
    const s = n.toString();
    const exp = s.length - 1;
    const mantissa = (Number(s.slice(0, 5)) / 10000).toFixed(2);
    // Use common SI abbreviations for readable ranges
    if (n < 1000n) return s;
    if (n < 1000000n) return `${(Number(n) / 1000).toFixed(1)}K`;
    if (n < 1000000000n) return `${(Number(n) / 1e6).toFixed(1)}M`;
    if (n < 1000000000000n) return `${(Number(n) / 1e9).toFixed(1)}B`;
    if (n < 1000000000000000n) return `${(Number(n) / 1e12).toFixed(1)}T`;
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

  // ── Rendering ────────────────────────────────────────────────────

  function renderError(msg) {
    const el = document.getElementById('hpResults');
    el.innerHTML = `<div class="hp-error"><i class="fas fa-exclamation-triangle"></i> ${msg}</div>`;
    el.style.display = 'block';
  }

  function renderResults(base, levels) {
    const baseColor = LEVEL_COLORS[0];
    const baseHosts = 2n ** BigInt(128 - base.prefix);

    // ── Tree ──────────────────────────────────────────────────────
    let treeHtml = `
      <div class="hp-tree">
        <div class="hp-node" style="--node-color:${baseColor}">
          <div class="hp-node-icon" style="background:${baseColor}"><i class="fas fa-globe"></i></div>
          <div class="hp-node-body">
            <div class="hp-node-title">Bloco Base &nbsp;<code>${base.address}/${base.prefix}</code></div>
            <div class="hp-node-meta">
              <span><i class="fas fa-dot-circle"></i> ${formatBigInt(baseHosts)} endereços totais</span>
            </div>
          </div>
        </div>`;

    levels.forEach((level, i) => {
      const color = LEVEL_COLORS[(i + 1) % LEVEL_COLORS.length];
      treeHtml += `
        <div class="hp-connector">
          <div class="hp-connector-line" style="border-color:${color}"></div>
          <div class="hp-connector-badge" style="background:${color}20;border-color:${color};color:${color}">
            ${level.bitsAtLevel} bit${level.bitsAtLevel !== 1 ? 's' : ''}
            &nbsp;→&nbsp; ${formatBigInt(level.childrenPerParent)} filhos/pai
          </div>
        </div>
        <div class="hp-node" style="--node-color:${color}">
          <div class="hp-node-icon" style="background:${color}"><i class="fas fa-network-wired"></i></div>
          <div class="hp-node-body">
            <div class="hp-node-title">
              ${level.label}
              <span class="hp-prefix-tag" style="background:${color}">/${level.prefix}</span>
            </div>
            <div class="hp-node-meta">
              <span><i class="fas fa-th"></i> ${formatBigInt(level.totalBlocks)} blocos no total</span>
              <span><i class="fas fa-dot-circle"></i> ${formatBigInt(level.hostsPerBlock)} end./bloco</span>
            </div>
          </div>
        </div>`;
    });

    treeHtml += '</div>';

    // ── Stats Table ───────────────────────────────────────────────
    let tableHtml = `
      <div class="hp-table-wrap">
        <table class="hp-table">
          <thead>
            <tr>
              <th>Nível</th>
              <th>Prefixo</th>
              <th>Bits usados</th>
              <th>Filhos por pai</th>
              <th>Total de blocos</th>
              <th>Endereços por bloco</th>
            </tr>
          </thead>
          <tbody>
            <tr class="hp-row-base">
              <td><em>Base</em></td>
              <td>/${base.prefix}</td>
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
                <td>/${l.prefix}</td>
                <td>${l.bitsAtLevel}</td>
                <td>${formatBigInt(l.childrenPerParent)}</td>
                <td>${formatBigInt(l.totalBlocks)}</td>
                <td>${formatBigInt(l.hostsPerBlock)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;

    const el = document.getElementById('hpResults');
    el.innerHTML = treeHtml + tableHtml;
    el.style.display = 'block';
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

    // Validate prefixes are strictly ascending and ≤ 128
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

  let levelSeq = 0;

  function addLevel(labelVal = '', prefixVal = '') {
    levelSeq++;
    const list = document.getElementById('hpLevelsList');
    const row = document.createElement('div');
    row.className = 'hp-level-row';
    row.innerHTML = `
      <span class="hp-level-num">${list.children.length + 1}</span>
      <input type="text"   class="hp-level-label"  placeholder="Nome do nível" value="${labelVal}">
      <span class="hp-slash">/</span>
      <input type="number" class="hp-level-prefix" min="1" max="128" placeholder="64" value="${prefixVal}">
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
    document.querySelectorAll('.hp-level-num').forEach((el, i) => {
      el.textContent = i + 1;
    });
  }

  // ── Presets ───────────────────────────────────────────────────────

  const PRESETS = {
    isp: {
      label: 'ISP (Regiões → Clientes → Sites → VLANs)',
      base: '2001:db8::/32',
      levels: [
        { label: 'Região',   prefix: 40 },
        { label: 'Cliente',  prefix: 48 },
        { label: 'Site',     prefix: 56 },
        { label: 'VLAN',     prefix: 64 },
      ],
    },
    enterprise: {
      label: 'Empresa (Departamentos → Segmentos)',
      base: '2001:db8::/48',
      levels: [
        { label: 'Departamento', prefix: 56 },
        { label: 'Segmento',     prefix: 64 },
      ],
    },
    datacenter: {
      label: 'Data Center (PoPs → Racks → Servidores)',
      base: '2001:db8::/40',
      levels: [
        { label: 'PoP',       prefix: 48 },
        { label: 'Rack',      prefix: 56 },
        { label: 'Servidor',  prefix: 64 },
        { label: 'Container', prefix: 80 },
      ],
    },
    mobile: {
      label: 'Operadora Móvel (UFs → Células → Dispositivos)',
      base: '2001:db8::/32',
      levels: [
        { label: 'UF',        prefix: 40 },
        { label: 'Célula',    prefix: 48 },
        { label: 'Dispositivo', prefix: 64 },
      ],
    },
  };

  function loadPreset(key) {
    const p = PRESETS[key];
    if (!p) return;
    document.getElementById('hpBaseBlock').value = p.base;
    document.getElementById('hpLevelsList').innerHTML = '';
    levelSeq = 0;
    p.levels.forEach(l => addLevel(l.label, l.prefix));
    // Auto-calculate
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
/* ── Panel ── */
#hpPanelBackdrop {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 1100;
}
#hpPanel {
  position: fixed;
  top: 0; right: 0;
  width: min(760px, 100vw);
  height: 100vh;
  background: var(--bg-light, #fff);
  box-shadow: -4px 0 32px rgba(0,0,0,.18);
  z-index: 1101;
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform .3s cubic-bezier(.4,0,.2,1);
  overflow: hidden;
}
body.dark-mode #hpPanel { background: var(--bg-dark, #1e2330); }
#hpPanel.hp-panel-open { transform: translateX(0); }

/* ── Panel Header ── */
.hp-panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
  flex-shrink: 0;
}
body.dark-mode .hp-panel-header { border-color: var(--border-dark, #2d3748); }
.hp-panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-light, #1a202c);
  flex: 1;
}
body.dark-mode .hp-panel-header h2 { color: var(--text-dark, #e2e8f0); }
.hp-panel-header i.fa-sitemap { color: var(--primary-color, #0070d1); font-size: 20px; }
.hp-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light-secondary, #718096);
  font-size: 18px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background .15s;
}
.hp-close-btn:hover { background: var(--border-light, #e2e8f0); }
body.dark-mode .hp-close-btn:hover { background: var(--border-dark, #2d3748); }

/* ── Panel Body (scrollable) ── */
.hp-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Presets ── */
.hp-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.hp-presets label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .05em;
  color: var(--text-light-secondary, #718096);
  display: block;
  margin-bottom: 8px;
}
.hp-preset-btn {
  padding: 6px 14px;
  border: 1.5px solid var(--border-light, #cbd5e0);
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-light, #2d3748);
  transition: all .15s;
}
.hp-preset-btn:hover {
  border-color: var(--primary-color, #0070d1);
  color: var(--primary-color, #0070d1);
  background: rgba(0,112,209,.06);
}
body.dark-mode .hp-preset-btn { color: var(--text-dark, #e2e8f0); border-color: var(--border-dark, #4a5568); }
body.dark-mode .hp-preset-btn:hover { border-color: var(--primary-light, #60a5fa); color: var(--primary-light, #60a5fa); }

/* ── Base Input ── */
.hp-base-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hp-base-row label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-light, #2d3748);
}
body.dark-mode .hp-base-row label { color: var(--text-dark, #e2e8f0); }
.hp-base-row input {
  padding: 10px 14px;
  border: 1.5px solid var(--border-light, #cbd5e0);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  background: var(--bg-light, #fff);
  color: var(--text-light, #2d3748);
  transition: border-color .15s;
  max-width: 320px;
}
body.dark-mode .hp-base-row input {
  background: var(--bg-dark-accent, #2d3748);
  border-color: var(--border-dark, #4a5568);
  color: var(--text-dark, #e2e8f0);
}
.hp-base-row input:focus {
  outline: none;
  border-color: var(--primary-color, #0070d1);
  box-shadow: 0 0 0 3px rgba(0,112,209,.15);
}

/* ── Level Rows ── */
.hp-levels-section label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-light, #2d3748);
  display: block;
  margin-bottom: 10px;
}
body.dark-mode .hp-levels-section label { color: var(--text-dark, #e2e8f0); }
#hpLevelsList {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}
.hp-level-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hp-level-num {
  width: 22px;
  min-width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--primary-color, #0070d1);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hp-level-label {
  flex: 1;
  padding: 8px 10px;
  border: 1.5px solid var(--border-light, #cbd5e0);
  border-radius: 6px;
  font-size: 13px;
  background: var(--bg-light, #fff);
  color: var(--text-light, #2d3748);
}
body.dark-mode .hp-level-label {
  background: var(--bg-dark-accent, #2d3748);
  border-color: var(--border-dark, #4a5568);
  color: var(--text-dark, #e2e8f0);
}
.hp-level-label:focus { outline: none; border-color: var(--primary-color, #0070d1); }
.hp-slash {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-light-secondary, #718096);
}
.hp-level-prefix {
  width: 68px;
  padding: 8px 10px;
  border: 1.5px solid var(--border-light, #cbd5e0);
  border-radius: 6px;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  text-align: center;
  background: var(--bg-light, #fff);
  color: var(--text-light, #2d3748);
}
body.dark-mode .hp-level-prefix {
  background: var(--bg-dark-accent, #2d3748);
  border-color: var(--border-dark, #4a5568);
  color: var(--text-dark, #e2e8f0);
}
.hp-level-prefix:focus { outline: none; border-color: var(--primary-color, #0070d1); }
.hp-remove-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-light-secondary, #718096);
  padding: 4px 7px;
  border-radius: 4px;
  font-size: 13px;
  transition: color .15s, background .15s;
}
.hp-remove-btn:hover { color: #dc2626; background: #fef2f2; }
body.dark-mode .hp-remove-btn:hover { background: rgba(220,38,38,.15); }

/* ── Action buttons ── */
.hp-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
.hp-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1.5px dashed var(--border-light, #cbd5e0);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-light-secondary, #718096);
  transition: all .15s;
}
.hp-add-btn:hover {
  border-color: var(--primary-color, #0070d1);
  color: var(--primary-color, #0070d1);
}
body.dark-mode .hp-add-btn { color: var(--text-dark-secondary, #a0aec0); border-color: var(--border-dark, #4a5568); }

/* ── Results ── */
#hpResults { margin-top: 4px; }
.hp-error {
  padding: 14px 16px;
  background: #fef3cd;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
body.dark-mode .hp-error { background: rgba(245,158,11,.15); color: #fbbf24; border-color: #f59e0b; }

/* ── Tree ── */
.hp-tree {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 8px 0 16px 0;
  margin-bottom: 24px;
}
.hp-node {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 10px 10px;
  border: 2px solid var(--node-color, #0070d1);
  border-radius: 10px;
  background: color-mix(in srgb, var(--node-color, #0070d1) 8%, transparent);
  width: 100%;
  box-sizing: border-box;
}
body.dark-mode .hp-node {
  background: color-mix(in srgb, var(--node-color, #0070d1) 12%, transparent);
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
}
.hp-node-body { flex: 1; min-width: 0; }
.hp-node-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-light, #1a202c);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
body.dark-mode .hp-node-title { color: var(--text-dark, #e2e8f0); }
.hp-prefix-tag {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  padding: 2px 7px;
  border-radius: 10px;
}
.hp-node-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 4px;
}
.hp-node-meta span {
  font-size: 12px;
  color: var(--text-light-secondary, #718096);
  display: flex;
  align-items: center;
  gap: 4px;
}
body.dark-mode .hp-node-meta span { color: var(--text-dark-secondary, #a0aec0); }
.hp-connector {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 2px 0 2px 18px;
}
.hp-connector-line {
  width: 2px;
  height: 28px;
  border-left: 2px dashed;
  opacity: .5;
}
.hp-connector-badge {
  margin-left: 10px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1.5px solid;
  white-space: nowrap;
}

/* ── Stats Table ── */
.hp-table-wrap {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid var(--border-light, #e2e8f0);
}
body.dark-mode .hp-table-wrap { border-color: var(--border-dark, #2d3748); }
.hp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.hp-table th {
  padding: 10px 14px;
  text-align: left;
  background: var(--bg-light, #f7fafc);
  color: var(--text-light-secondary, #718096);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .05em;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
  white-space: nowrap;
}
body.dark-mode .hp-table th {
  background: var(--bg-dark-accent, #2d3748);
  color: var(--text-dark-secondary, #a0aec0);
  border-color: var(--border-dark, #4a5568);
}
.hp-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-light, #e2e8f0);
  color: var(--text-light, #2d3748);
  vertical-align: middle;
}
body.dark-mode .hp-table td { border-color: var(--border-dark, #2d3748); color: var(--text-dark, #e2e8f0); }
.hp-table tr:last-child td { border-bottom: none; }
.hp-table tr:hover td { background: rgba(0,112,209,.04); }
body.dark-mode .hp-table tr:hover td { background: rgba(96,165,250,.05); }
.hp-row-base td { color: var(--text-light-secondary, #718096); font-style: italic; }
body.dark-mode .hp-row-base td { color: var(--text-dark-secondary, #a0aec0); }
.hp-table-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 7px;
  vertical-align: middle;
}

/* ── Open button in header ── */
#hpOpenBtn {
  display: flex;
  align-items: center;
  gap: 6px;
}

@media (max-width: 600px) {
  .hp-panel-body { padding: 16px; }
  .hp-node-meta { gap: 8px; }
  .hp-connector-badge { font-size: 11px; }
}
    `;
    document.head.appendChild(s);
  }

  // ── DOM Scaffolding ───────────────────────────────────────────────

  function buildPanel() {
    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'hpPanelBackdrop';
    backdrop.addEventListener('click', closePanel);
    document.body.appendChild(backdrop);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'hpPanel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Planejador Hierárquico de Sub-redes');

    panel.innerHTML = `
      <div class="hp-panel-header">
        <i class="fas fa-sitemap"></i>
        <h2>Planejador Hierárquico de Sub-redes</h2>
        <button class="hp-close-btn" id="hpCloseBtn" title="Fechar" aria-label="Fechar planejador">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="hp-panel-body">

        <!-- Presets -->
        <div>
          <label class="hp-presets" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-light-secondary,#718096);display:block;margin-bottom:8px;">Exemplos prontos</label>
          <div class="hp-presets">
            <button class="hp-preset-btn" data-preset="isp"><i class="fas fa-building"></i> ISP</button>
            <button class="hp-preset-btn" data-preset="enterprise"><i class="fas fa-sitemap"></i> Empresa</button>
            <button class="hp-preset-btn" data-preset="datacenter"><i class="fas fa-server"></i> Data Center</button>
            <button class="hp-preset-btn" data-preset="mobile"><i class="fas fa-mobile-alt"></i> Operadora Móvel</button>
          </div>
        </div>

        <!-- Base block -->
        <div class="hp-base-row">
          <label for="hpBaseBlock">Bloco base (CIDR):</label>
          <input type="text" id="hpBaseBlock" placeholder="Ex: 2001:db8::/32" autocomplete="off" spellcheck="false">
        </div>

        <!-- Levels -->
        <div class="hp-levels-section">
          <label>Níveis hierárquicos:</label>
          <div id="hpLevelsList"></div>
          <div class="hp-actions">
            <button id="hpAddLevelBtn" class="hp-add-btn">
              <i class="fas fa-plus"></i> Adicionar nível
            </button>
            <button id="hpCalcBtn" class="btn-primary">
              <i class="fas fa-calculator"></i> Calcular
            </button>
          </div>
        </div>

        <!-- Results -->
        <div id="hpResults" style="display:none"></div>
      </div>`;

    document.body.appendChild(panel);

    // Events
    panel.querySelector('#hpCloseBtn').addEventListener('click', closePanel);
    panel.querySelector('#hpAddLevelBtn').addEventListener('click', () => addLevel());
    panel.querySelector('#hpCalcBtn').addEventListener('click', calculate);
    panel.querySelectorAll('.hp-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
    });

    // Escape key closes panel
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

    // Insert before the first button in the header
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
