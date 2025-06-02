/**
 * UI Controller - Versão Simplificada e Corrigida
 * Gerencia todas as funcionalidades de interface da aplicação
 */

const UIController = (function() {
  'use strict';
  
  // Configurações
  const CONFIG = {
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    THEME_STORAGE_KEY: 'themePreference'
  };
  
  // Flag para evitar inicialização dupla
  let initialized = false;
  
  /**
   * Obtém elemento de forma segura
   */
  function getElement(id) {
    if (typeof id === 'string') {
      return document.getElementById(id);
    }
    return id;
  }
  
  /**
   * Atualiza o passo atual no indicador de progresso
   */
  function updateStep(step) {
    try {
      const steps = document.querySelectorAll('.step');
      if (steps.length === 0) return;
      
      // Remover classe ativa de todos os passos
      steps.forEach(el => el.classList.remove('active'));
      
      // Ativar passo atual
      const currentStep = getElement(`step${step}`);
      if (currentStep) {
        currentStep.classList.add('active');
      }
      
      // Atualizar estado global
      if (window.appState) {
        window.appState.currentStep = step;
      }
    } catch (error) {
      console.error('[UIController] Erro em updateStep:', error);
    }
  }
  
  /**
   * Gerencia o tema da aplicação
   */
  const themeManager = {
    toggle() {
      try {
        const isDark = document.body.classList.toggle('dark-mode');
        
        // Atualizar botão
        const themeBtn = getElement('toggleThemeBtn');
        if (themeBtn) {
          const icon = isDark ? 'fa-sun' : 'fa-moon';
          themeBtn.innerHTML = `<i class="fas ${icon}"></i> Tema`;
        }
        
        // Salvar preferência
        localStorage.setItem(CONFIG.THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
        
        console.log(`[UIController] Tema alterado para: ${isDark ? 'escuro' : 'claro'}`);
      } catch (error) {
        console.error('[UIController] Erro ao alternar tema:', error);
      }
    },
    
    loadPreference() {
      try {
        const saved = localStorage.getItem(CONFIG.THEME_STORAGE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let shouldUseDark = false;
        
        if (saved === 'dark') {
          shouldUseDark = true;
        } else if (saved === 'light') {
          shouldUseDark = false;
        } else {
          shouldUseDark = prefersDark;
        }
        
        // Aplicar tema
        document.body.classList.toggle('dark-mode', shouldUseDark);
        
        // Atualizar botão
        const themeBtn = getElement('toggleThemeBtn');
        if (themeBtn) {
          const icon = shouldUseDark ? 'fa-sun' : 'fa-moon';
          themeBtn.innerHTML = `<i class="fas ${icon}"></i> Tema`;
        }
      } catch (error) {
        console.error('[UIController] Erro ao carregar preferência de tema:', error);
      }
    }
  };
  
  /**
   * Adiciona um item à lista de IPs
   */
  function appendIpToList(ip, number, listId) {
    try {
      const ipsList = getElement(listId);
      if (!ipsList) {
        console.error(`[UIController] Lista "${listId}" não encontrada`);
        return;
      }
      
      // Criar elementos
      const li = document.createElement('li');
      li.className = 'ip-item';
      li.innerHTML = `
        <span class="ip-number">${number}.</span>
        <span class="ip-text" title="${ip}">${ip}</span>
        <button class="copy-btn" type="button" title="Copiar IP" onclick="copyToClipboard('${ip}')">
          <i class="fas fa-copy"></i>
        </button>
      `;
      
      ipsList.appendChild(li);
      
    } catch (error) {
      console.error('[UIController] Erro em appendIpToList:', error);
    }
  }
  
  /**
   * Carrega mais sub-redes na tabela
   */
  function carregarMaisSubRedes(startIndex, limit) {
    try {
      if (!window.appState || !window.appState.subRedesGeradas) {
        console.error('[UIController] Estado da aplicação não inicializado');
        return;
      }
      
      const tbody = document.querySelector('#subnetsTable tbody');
      if (!tbody) {
        console.error('[UIController] Tabela de sub-redes não encontrada');
        return;
      }
      
      const endIndex = Math.min(startIndex + limit, window.appState.subRedesGeradas.length);
      const fragment = document.createDocumentFragment();
      
      for (let i = startIndex; i < endIndex; i++) {
        const subnet = window.appState.subRedesGeradas[i];
        
        if (!subnet || !subnet.subnet || !subnet.initial || !subnet.final || !subnet.network) {
          console.warn(`[UIController] Sub-rede inválida no índice ${i}:`, subnet);
          continue;
        }
        
        const row = document.createElement('tr');
        
        // Função para encurtar IPv6 se disponível
        const shortenIPv6 = window.IPv6Utils && window.IPv6Utils.shortenIPv6 
          ? window.IPv6Utils.shortenIPv6 
          : (addr) => addr;
        
        row.innerHTML = `
          <td>
            <input type="checkbox" value="${i}" aria-label="Selecionar sub-rede ${shortenIPv6(subnet.subnet)}">
          </td>
          <td>${shortenIPv6(subnet.subnet)}</td>
          <td>${shortenIPv6(subnet.initial)}</td>
          <td>${shortenIPv6(subnet.final)}</td>
          <td>${shortenIPv6(subnet.network)}</td>
        `;
        
        // Configurar checkbox
        const checkbox = row.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
          row.classList.toggle('selected', this.checked);
          
          // Habilitar/desabilitar botão de gerar IPs
          updateGenerateIPsButton();
        });
        
        fragment.appendChild(row);
      }
      
      // Adicionar todas as linhas de uma vez
      tbody.appendChild(fragment);
      
      // Atualizar estado
      window.appState.subRedesExibidas = endIndex;
      
      // Atualizar controles
      const loadMoreContainer = getElement('loadMoreContainer');
      if (loadMoreContainer) {
        const shouldShow = window.appState.subRedesExibidas < window.appState.subRedesGeradas.length;
        loadMoreContainer.style.display = shouldShow ? 'block' : 'none';
      }
      
    } catch (error) {
      console.error('[UIController] Erro em carregarMaisSubRedes:', error);
    }
  }
  
  /**
   * Atualiza a visibilidade do botão de gerar IPs
   */
  function updateGenerateIPsButton() {
    try {
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      const generateBtn = getElement('gerarIPsButton');
      
      if (generateBtn) {
        generateBtn.style.display = checkboxes.length === 1 ? 'inline-block' : 'none';
      }
    } catch (error) {
      console.error('[UIController] Erro em updateGenerateIPsButton:', error);
    }
  }
  
  /**
   * Seleciona/desmarca todas as sub-redes
   */
  function toggleSelectAll() {
    try {
      const selectAll = getElement('selectAll');
      if (!selectAll) {
        console.warn('[UIController] Checkbox "selectAll" não encontrado');
        return;
      }
      
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]');
      const isChecked = selectAll.checked;
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        
        // Atualizar linha visualmente
        const row = checkbox.closest('tr');
        if (row) {
          row.classList.toggle('selected', isChecked);
        }
      });
      
      // Atualizar botão de gerar IPs
      updateGenerateIPsButton();
      
    } catch (error) {
      console.error('[UIController] Erro em toggleSelectAll:', error);
    }
  }
  
  /**
   * Utilitários de navegação
   */
  const navigation = {
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    scrollToBottom() {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };
  
  /**
   * Configuração de event listeners
   */
  function setupEventListeners() {
    console.log('[UIController] Configurando event listeners...');
    
    // Botão de tema
    const themeBtn = getElement('toggleThemeBtn');
    if (themeBtn && !themeBtn.hasAttribute('data-ui-ready')) {
      themeBtn.addEventListener('click', themeManager.toggle);
      themeBtn.setAttribute('data-ui-ready', 'true');
    }
    
    // Navegação
    const topBtn = getElement('topBtn');
    const bottomBtn = getElement('bottomBtn');
    
    if (topBtn && !topBtn.hasAttribute('data-ui-ready')) {
      topBtn.addEventListener('click', navigation.scrollToTop);
      topBtn.setAttribute('data-ui-ready', 'true');
    }
    
    if (bottomBtn && !bottomBtn.hasAttribute('data-ui-ready')) {
      bottomBtn.addEventListener('click', navigation.scrollToBottom);
      bottomBtn.setAttribute('data-ui-ready', 'true');
    }
    
    // Checkbox "Selecionar Todos"
    const selectAll = getElement('selectAll');
    if (selectAll && !selectAll.hasAttribute('data-ui-ready')) {
      selectAll.addEventListener('change', toggleSelectAll);
      selectAll.setAttribute('data-ui-ready', 'true');
    }
    
    // Botão "Carregar Mais"
    const loadMoreBtn = getElement('loadMoreButton');
    if (loadMoreBtn && !loadMoreBtn.hasAttribute('data-ui-ready')) {
      loadMoreBtn.addEventListener('click', () => {
        carregarMaisSubRedes(window.appState.subRedesExibidas || 0, 100);
      });
      loadMoreBtn.setAttribute('data-ui-ready', 'true');
    }
    
    // Responsividade
    window.addEventListener('resize', () => {
      const isMobile = window.innerWidth <= 768;
      document.body.classList.toggle('mobile-device', isMobile);
    });
  }
  
  /**
   * Inicialização do módulo
   */
  function initialize() {
    if (initialized) {
      console.log('[UIController] Já inicializado, ignorando chamada dupla');
      return;
    }
    
    console.log('[UIController] Inicializando UI Controller...');
    
    try {
      // Configurar sistema de temas
      themeManager.loadPreference();
      
      // Configurar layout responsivo
      const isMobile = window.innerWidth <= 768;
      document.body.classList.toggle('mobile-device', isMobile);
      
      // Configurar eventos
      setupEventListeners();
      
      // Marcar como inicializado
      initialized = true;
      
      console.log('[UIController] UI Controller inicializado com sucesso');
      
    } catch (error) {
      console.error('[UIController] Erro na inicialização:', error);
    }
  }
  
  // API pública
  const publicAPI = {
    // Funções principais
    updateStep,
    appendIpToList,
    carregarMaisSubRedes,
    toggleSelectAll,
    updateGenerateIPsButton,
    
    // Sistemas especializados
    theme: themeManager,
    navigation,
    
    // Utilitários
    getElement,
    
    // Informações de estado
    isInitialized: () => initialized
  };
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 100);
  }
  
  return publicAPI;
})();

// Exportar globalmente
window.UIController = UIController;
