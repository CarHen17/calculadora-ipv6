/**
 * Aplicação Principal da Calculadora IPv6 - Versão Corrigida e Simplificada
 * 
 * Este arquivo coordena a inicialização da aplicação sem interferir
 * nos event listeners dos outros módulos.
 */

(function() {
  'use strict';
  
  // Flag para evitar inicialização dupla
  let initialized = false;
  
  /**
   * Verifica se todos os módulos essenciais estão carregados
   */
  function checkEssentialModules() {
    const essentialModules = {
      'IPv6Utils': window.IPv6Utils,
      'UIController': window.UIController,
      'IPv6Calculator': window.IPv6Calculator
    };
    
    const missing = [];
    const loaded = [];
    
    for (const [name, module] of Object.entries(essentialModules)) {
      if (module && typeof module === 'object') {
        loaded.push(name);
      } else {
        missing.push(name);
      }
    }
    
    return { loaded, missing, allLoaded: missing.length === 0 };
  }
  
  /**
   * Configura event listeners básicos da aplicação
   * APENAS para elementos que não são gerenciados por outros módulos
   */
  function setupApplicationEvents() {
    try {
      console.log('[App] Configurando eventos da aplicação...');
      
      // Configurar evento do botão calcular - APENAS se não estiver configurado
      const calcularBtn = document.getElementById('calcularBtn');
      if (calcularBtn && window.IPv6Calculator && !calcularBtn.hasAttribute('data-app-ready')) {
        calcularBtn.addEventListener('click', window.IPv6Calculator.calcularSubRedes);
        calcularBtn.setAttribute('data-app-ready', 'true');
        console.log('[App] Event listener do botão calcular configurado');
      }
      
      // Configurar evento do botão reset - APENAS se não estiver configurado
      const resetBtn = document.getElementById('resetBtn');
      if (resetBtn && window.IPv6Calculator && !resetBtn.hasAttribute('data-app-ready')) {
        resetBtn.addEventListener('click', window.IPv6Calculator.resetarCalculadora);
        resetBtn.setAttribute('data-app-ready', 'true');
        console.log('[App] Event listener do botão reset configurado');
      }
      
      // Configurar botão continuar
      const continuarBtn = document.getElementById('continuarBtn');
      if (continuarBtn && window.IPv6Calculator && !continuarBtn.hasAttribute('data-app-ready')) {
        continuarBtn.addEventListener('click', window.IPv6Calculator.mostrarSugestoesDivisao);
        continuarBtn.setAttribute('data-app-ready', 'true');
      }
      
      // Configurar checkbox "Selecionar Todos"
      const selectAllBtn = document.getElementById('selectAll');
      if (selectAllBtn && window.UIController && !selectAllBtn.hasAttribute('data-app-ready')) {
        selectAllBtn.addEventListener('change', window.UIController.toggleSelectAll);
        selectAllBtn.setAttribute('data-app-ready', 'true');
      }
      
      // Configurar botão "Carregar Mais"
      const loadMoreBtn = document.getElementById('loadMoreButton');
      if (loadMoreBtn && window.UIController && window.appState && !loadMoreBtn.hasAttribute('data-app-ready')) {
        loadMoreBtn.addEventListener('click', () => {
          window.UIController.carregarMaisSubRedes(window.appState.subRedesExibidas || 0, 100);
        });
        loadMoreBtn.setAttribute('data-app-ready', 'true');
      }
      
      // Configurar botões de IPs do bloco principal
      const toggleMainBlockIpsBtn = document.getElementById('toggleMainBlockIpsBtn');
      if (toggleMainBlockIpsBtn && window.IPv6Calculator && !toggleMainBlockIpsBtn.hasAttribute('data-app-ready')) {
        toggleMainBlockIpsBtn.addEventListener('click', window.IPv6Calculator.toggleMainBlockIps);
        toggleMainBlockIpsBtn.setAttribute('data-app-ready', 'true');
      }
      
      const moreMainBlockIpsBtn = document.getElementById('moreMainBlockIpsBtn');
      if (moreMainBlockIpsBtn && window.IPv6Calculator && !moreMainBlockIpsBtn.hasAttribute('data-app-ready')) {
        moreMainBlockIpsBtn.addEventListener('click', window.IPv6Calculator.gerarMaisIPsDoBloco);
        moreMainBlockIpsBtn.setAttribute('data-app-ready', 'true');
      }
      
      const resetMainBlockIPsBtn = document.getElementById('resetMainBlockIPsButton');
      if (resetMainBlockIPsBtn && window.IPv6Calculator && !resetMainBlockIPsBtn.hasAttribute('data-app-ready')) {
        resetMainBlockIPsBtn.addEventListener('click', window.IPv6Calculator.resetarIPsMainBlock);
        resetMainBlockIPsBtn.setAttribute('data-app-ready', 'true');
      }
      
      // Configurar botões de IPs da sub-rede
      const gerarIPsBtn = document.getElementById('gerarIPsButton');
      if (gerarIPsBtn && window.IPv6Calculator && !gerarIPsBtn.hasAttribute('data-app-ready')) {
        gerarIPsBtn.addEventListener('click', window.IPv6Calculator.gerarPrimeirosIPs);
        gerarIPsBtn.setAttribute('data-app-ready', 'true');
      }
      
      const gerarMaisIPsBtn = document.getElementById('gerarMaisIPsButton');
      if (gerarMaisIPsBtn && window.IPv6Calculator && !gerarMaisIPsBtn.hasAttribute('data-app-ready')) {
        gerarMaisIPsBtn.addEventListener('click', window.IPv6Calculator.gerarMaisIPs);
        gerarMaisIPsBtn.setAttribute('data-app-ready', 'true');
      }
      
      const resetIPsBtn = document.getElementById('resetIPsButton');
      if (resetIPsBtn && window.IPv6Calculator && !resetIPsBtn.hasAttribute('data-app-ready')) {
        resetIPsBtn.addEventListener('click', window.IPv6Calculator.resetarIPsGerados);
        resetIPsBtn.setAttribute('data-app-ready', 'true');
      }
      
      console.log('[App] Eventos da aplicação configurados com sucesso');
    } catch (error) {
      console.error('[App] Erro ao configurar eventos da aplicação:', error);
    }
  }
  
  /**
   * Configurar funcionalidades de cópia
   */
  function setupCopyFunctionality() {
    try {
      // Garantir que a função global copiarTexto está disponível
      if (!window.copiarTexto && window.UIController && window.UIController.clipboard) {
        window.copiarTexto = function(elementIdOrValue) {
          if (typeof elementIdOrValue === 'string' && elementIdOrValue.length < 50 && !elementIdOrValue.includes(' ')) {
            const element = document.getElementById(elementIdOrValue);
            if (element) {
              window.UIController.clipboard.copy(element);
            } else {
              window.UIController.clipboard.copy(elementIdOrValue);
            }
          } else {
            window.UIController.clipboard.copy(elementIdOrValue);
          }
        };
        console.log('[App] Função global copiarTexto configurada');
      }
      
    } catch (error) {
      console.error('[App] Erro ao configurar funcionalidade de cópia:', error);
    }
  }
  
  /**
   * Inicializa o estado global da aplicação
   */
  function initializeAppState() {
    if (!window.appState) {
      window.appState = {
        subRedesGeradas: [],
        subRedesExibidas: 0,
        selectedBlock: null,
        currentIpOffset: 0,
        mainBlock: null,
        mainBlockCurrentOffset: 0,
        isMainBlockIpsVisible: false,
        currentStep: 1
      };
      console.log('[App] Estado global da aplicação inicializado');
    }
  }
  
  /**
   * Configura eventos de atalhos de teclado
   */
  function setupKeyboardShortcuts() {
    if (document.hasAttribute('data-keyboard-shortcuts-ready')) {
      return; // Já configurado
    }
    
    document.addEventListener('keydown', function(e) {
      // Ctrl+Enter: Calcular sub-redes
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const calcularBtn = document.getElementById('calcularBtn');
        if (calcularBtn && calcularBtn.style.display !== 'none') {
          calcularBtn.click();
        }
      }
      
      // Escape: Resetar (com confirmação)
      if (e.key === 'Escape') {
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn && confirm('Deseja resetar a calculadora?')) {
          resetBtn.click();
        }
      }
    });
    
    document.setAttribute('data-keyboard-shortcuts-ready', 'true');
  }
  
  /**
   * Configura abas de visualização
   */
  function setupTabs() {
    document.querySelectorAll('.tab:not([data-app-ready])').forEach(tab => {
      tab.addEventListener('click', function() {
        // Remover classe ativa de todas as abas
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab-active'));
        this.classList.add('tab-active');
        
        // Ocultar todos os conteúdos
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        // Mostrar o conteúdo correspondente
        const contentId = this.id.replace('Tab', 'Content');
        const contentElement = document.getElementById(contentId);
        if (contentElement) {
          contentElement.classList.add('active');
        }
        
        // Atualizar visualização se necessário
        if (window.VisualizationModule) {
          switch (this.id) {
            case 'utilizationTab':
              if (typeof VisualizationModule.initUtilizationChart === 'function') {
                VisualizationModule.initUtilizationChart();
              }
              break;
            case 'heatmapTab':
              if (typeof VisualizationModule.initHeatmapChart === 'function') {
                VisualizationModule.initHeatmapChart();
              }
              break;
            case 'prefixComparisonTab':
              if (typeof VisualizationModule.initPrefixComparisonChart === 'function') {
                VisualizationModule.initPrefixComparisonChart();
              }
              break;
          }
        }
      });
      
      tab.setAttribute('data-app-ready', 'true');
    });
  }
  
  /**
   * Configura slider de prefixo
   */
  function setupPrefixSlider() {
    const prefixSlider = document.getElementById('prefixSlider');
    if (prefixSlider && !prefixSlider.hasAttribute('data-app-ready')) {
      prefixSlider.addEventListener('input', function() {
        const prefixValue = document.getElementById('prefixValue');
        if (prefixValue) {
          prefixValue.textContent = this.value;
        }
        
        if (window.VisualizationModule && typeof VisualizationModule.updatePrefixStats === 'function') {
          VisualizationModule.updatePrefixStats(parseInt(this.value));
        }
      });
      
      prefixSlider.setAttribute('data-app-ready', 'true');
    }
  }
  
  /**
   * Monitora quando novos elementos são adicionados ao DOM
   */
  function setupDOMObserver() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          // Se novos elementos forem adicionados, configurar eventos se necessário
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              // Configurar abas se necessário
              if (node.querySelectorAll && node.querySelectorAll('.tab').length > 0) {
                setTimeout(setupTabs, 100);
              }
              
              // Configurar slider se necessário
              if (node.id === 'prefixSlider' || node.querySelector('#prefixSlider')) {
                setTimeout(setupPrefixSlider, 100);
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Função principal de inicialização
   */
  function initializeApplication() {
    if (initialized) {
      console.log('[App] Aplicação já inicializada, ignorando chamada dupla');
      return;
    }
    
    console.log('[App] 🚀 Inicializando Calculadora IPv6...');
    
    try {
      // Verificar módulos essenciais
      const moduleCheck = checkEssentialModules();
      
      if (!moduleCheck.allLoaded) {
        console.error('[App] ❌ Módulos essenciais não carregados:', moduleCheck.missing);
        
        // Mostrar erro na interface
        const errorAlert = document.getElementById('initErrorAlert');
        const errorMessage = document.getElementById('initErrorMessage');
        
        if (errorAlert && errorMessage) {
          errorMessage.textContent = `Módulos não carregados: ${moduleCheck.missing.join(', ')}`;
          errorAlert.style.display = 'block';
        }
        
        return false;
      }
      
      console.log('[App] ✅ Módulos essenciais carregados:', moduleCheck.loaded);
      
      // Inicializar estado da aplicação
      initializeAppState();
      
      // Configurar funcionalidades
      setupCopyFunctionality();
      setupApplicationEvents();
      setupKeyboardShortcuts();
      setupTabs();
      setupPrefixSlider();
      setupDOMObserver();
      
      // Marcar como inicializado
      initialized = true;
      
      console.log('[App] 🎉 Calculadora IPv6 inicializada com sucesso!');
      return true;
      
    } catch (error) {
      console.error('[App] ❌ Erro na inicialização da aplicação:', error);
      
      // Mostrar erro na interface
      const errorAlert = document.getElementById('initErrorAlert');
      const errorMessage = document.getElementById('initErrorMessage');
      
      if (errorAlert && errorMessage) {
        errorMessage.textContent = 'Erro na inicialização: ' + error.message;
        errorAlert.style.display = 'block';
      }
      
      return false;
    }
  }
  
  // Aguardar carregamento completo do DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
  } else {
    // Se o DOM já estiver carregado, aguardar um pouco para garantir que outros módulos carregaram
    setTimeout(initializeApplication, 300);
  }
  
  // Expor função de inicialização para debug
  window.debugInitApp = initializeApplication;
  
})();
