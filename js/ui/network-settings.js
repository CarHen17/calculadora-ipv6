/**
 * Configurações de Rede para Calculadora IPv6
 * 
 * Este módulo gerencia as configurações de rede WAN/LAN sem usar um painel lateral.
 */

const NetworkSettings = (function() {
  'use strict';
  
  // Configuração padrão
  const defaults = {
    wanPrefix: '2804:418:3000:1::190/64',
    lanPrefix: '2804:418:3000:5::1/64'
  };
  
  /**
   * Carrega as configurações salvas ou usa os padrões
   * @returns {Object} Configurações de rede
   */
  function loadSettings() {
    try {
      return {
        wanPrefix: localStorage.getItem('networkConfig.wanPrefix') || defaults.wanPrefix,
        lanPrefix: localStorage.getItem('networkConfig.lanPrefix') || defaults.lanPrefix
      };
    } catch (error) {
      console.error("Erro ao carregar configurações de rede:", error);
      return defaults;
    }
  }
  
  /**
   * Salva as configurações de rede
   * @param {Object} settings - Configurações a salvar
   */
  function saveSettings(settings) {
    try {
      if (settings.wanPrefix) {
        localStorage.setItem('networkConfig.wanPrefix', settings.wanPrefix);
      }
      
      if (settings.lanPrefix) {
        localStorage.setItem('networkConfig.lanPrefix', settings.lanPrefix);
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao salvar configurações de rede:", error);
      return false;
    }
  }
  
  /**
   * Abre um diálogo de configuração de rede
   */
  function openSettingsDialog() {
    try {
      // Verificar se o diálogo já existe
      let dialog = document.getElementById('network-settings-dialog');
      
      if (!dialog) {
        // Criar diálogo
        dialog = document.createElement('div');
        dialog.id = 'network-settings-dialog';
        dialog.className = 'modal-dialog';
        
        // Conteúdo do diálogo
        dialog.innerHTML = `
          <div class="modal-content">
            <div class="modal-header">
              <h3>Configurações de Rede</h3>
              <button class="modal-close">×</button>
            </div>
            <div class="modal-body">
              <p>Configure seus prefixos IPv6 para WAN e LAN:</p>
              
              <div class="form-group">
                <label for="settings-wan-prefix">Prefixo WAN (CIDR):</label>
                <input type="text" id="settings-wan-prefix" placeholder="Ex.: 2001:db8::/64">
                <div class="form-hint">Endereço IPv6 da interface WAN no formato CIDR</div>
              </div>
              
              <div class="form-group">
                <label for="settings-lan-prefix">Prefixo LAN (CIDR):</label>
                <input type="text" id="settings-lan-prefix" placeholder="Ex.: 2001:db8:1::/64">
                <div class="form-hint">Endereço IPv6 da interface LAN no formato CIDR</div>
              </div>
              
              <div id="settings-overlap-warning" class="form-warning" style="display: none;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Os prefixos WAN e LAN estão em conflito!</span>
              </div>
            </div>
            <div class="modal-footer">
              <button id="settings-save-btn" class="btn-primary">Salvar</button>
              <button id="settings-cancel-btn" class="btn-secondary">Cancelar</button>
            </div>
          </div>
        `;
        
        // Adicionar ao DOM
        document.body.appendChild(dialog);
        
        // Adicionar overlay
        const overlay = document.createElement('div');
        overlay.id = 'modal-overlay';
        overlay.className = 'modal-overlay';
        document.body.appendChild(overlay);
        
        // Configurar eventos
        const closeBtn = dialog.querySelector('.modal-close');
        const saveBtn = document.getElementById('settings-save-btn');
        const cancelBtn = document.getElementById('settings-cancel-btn');
        
        // Fechar diálogo
        function closeDialog() {
          dialog.classList.remove('active');
          overlay.classList.remove('active');
          
          setTimeout(() => {
            dialog.style.display = 'none';
            overlay.style.display = 'none';
          }, 300);
        }
        
        // Salvar configurações
        function saveAndClose() {
          const wanInput = document.getElementById('settings-wan-prefix');
          const lanInput = document.getElementById('settings-lan-prefix');
          
          if (wanInput && lanInput) {
            const settings = {
              wanPrefix: wanInput.value.trim(),
              lanPrefix: lanInput.value.trim()
            };
            
            saveSettings(settings);
            
            // Verificar sobreposição novamente na interface principal
            if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkPrefixOverlap === 'function') {
              OverlapChecker.checkPrefixOverlap();
            }
          }
          
          closeDialog();
        }
        
        if (closeBtn) closeBtn.addEventListener('click', closeDialog);
        if (overlay) overlay.addEventListener('click', closeDialog);
        if (saveBtn) saveBtn.addEventListener('click', saveAndClose);
        if (cancelBtn) cancelBtn.addEventListener('click', closeDialog);
        
        // Verificar sobreposição ao editar
        const wanInput = document.getElementById('settings-wan-prefix');
        const lanInput = document.getElementById('settings-lan-prefix');
        const warningEl = document.getElementById('settings-overlap-warning');
        
        function checkDialogOverlap() {
          if (!wanInput || !lanInput || !warningEl) return;
          
          const wanPrefix = wanInput.value.trim();
          const lanPrefix = lanInput.value.trim();
          
          if (!wanPrefix || !lanPrefix) {
            warningEl.style.display = 'none';
            return;
          }
          
          if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkForOverlap === 'function') {
            const hasOverlap = OverlapChecker.checkForOverlap(wanPrefix, lanPrefix);
            warningEl.style.display = hasOverlap ? 'flex' : 'none';
          }
        }
        
        if (wanInput) {
          wanInput.addEventListener('input', checkDialogOverlap);
          wanInput.addEventListener('change', checkDialogOverlap);
        }
        
        if (lanInput) {
          lanInput.addEventListener('input', checkDialogOverlap);
          lanInput.addEventListener('change', checkDialogOverlap);
        }
      }
      
// Preencher com valores atuais
      const settings = loadSettings();
      const wanInput = document.getElementById('settings-wan-prefix');
      const lanInput = document.getElementById('settings-lan-prefix');
      
      if (wanInput) wanInput.value = settings.wanPrefix;
      if (lanInput) lanInput.value = settings.lanPrefix;
      
      // Mostrar o diálogo
      dialog.style.display = 'block';
      overlay.style.display = 'block';
      
      setTimeout(() => {
        dialog.classList.add('active');
        overlay.classList.add('active');
        
        // Verificar sobreposição inicial
        const warningEl = document.getElementById('settings-overlap-warning');
        if (warningEl && typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkForOverlap === 'function') {
          const hasOverlap = OverlapChecker.checkForOverlap(settings.wanPrefix, settings.lanPrefix);
          warningEl.style.display = hasOverlap ? 'flex' : 'none';
        }
      }, 10);
    } catch (error) {
      console.error("Erro ao abrir diálogo de configurações:", error);
    }
  }
  
  /**
   * Inicializa o módulo de configurações de rede
   */
  function initialize() {
    try {
      console.log("Inicializando configurações de rede...");
      
      // Adicionar estilos para o diálogo
      addDialogStyles();
      
      // Configurar botão de configurações
      const networkBtn = document.getElementById('networkConfigBtn');
      if (networkBtn) {
        networkBtn.addEventListener('click', openSettingsDialog);
      }
      
      console.log("Configurações de rede inicializadas");
    } catch (error) {
      console.error("Erro ao inicializar configurações de rede:", error);
    }
  }
  
  /**
   * Adiciona estilos CSS para o diálogo
   */
  function addDialogStyles() {
    const styleId = 'network-settings-styles';
    
    // Verificar se já existe
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
        display: none;
      }
      
      .modal-overlay.active {
        opacity: 1;
      }
      
      .modal-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.95);
        width: 90%;
        max-width: 500px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        opacity: 0;
        transition: all 0.3s ease;
        display: none;
      }
      
      .modal-dialog.active {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      
      .modal-header {
        padding: 16px 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .modal-header h3 {
        margin: 0;
        color: var(--primary-color);
        font-weight: 600;
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      }
      
      .modal-body {
        padding: 20px;
      }
      
      .modal-footer {
        padding: 16px 20px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
      }
      
      .form-group input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .form-hint {
        margin-top: 6px;
        font-size: 12px;
        color: #666;
      }
      
      .form-warning {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 16px;
        padding: 10px;
        background-color: rgba(255, 244, 229, 0.95);
        border: 1px solid #f0b849;
        border-radius: 4px;
        color: #9c6f19;
        font-size: 14px;
      }
      
      /* Dark mode */
      body.dark-mode .modal-dialog {
        background-color: var(--bg-dark);
        color: var(--text-dark);
      }
      
      body.dark-mode .modal-header,
      body.dark-mode .modal-footer {
        border-color: var(--border-dark);
      }
      
      body.dark-mode .modal-header h3 {
        color: var(--primary-light);
      }
      
      body.dark-mode .modal-close {
        color: var(--text-dark-secondary);
      }
      
      body.dark-mode .form-group label {
        color: var(--text-dark);
      }
      
      body.dark-mode .form-group input {
        background-color: var(--bg-dark-accent);
        border-color: var(--border-dark);
        color: var(--text-dark);
      }
      
      body.dark-mode .form-hint {
        color: var(--text-dark-secondary);
      }
      
      body.dark-mode .form-warning {
        background-color: rgba(45, 44, 9, 0.95);
        border-color: #473e00;
        color: #e5d352;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // API pública
  return {
    loadSettings,
    saveSettings,
    openSettingsDialog,
    initialize
  };
})();

// Exportar globalmente
window.NetworkSettings = NetworkSettings;