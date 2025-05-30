/**
 * Aplicação Principal da Calculadora IPv6 - Versão Simplificada
 * 
 * Este arquivo coordena a inicialização da aplicação de forma limpa e eficiente.
 */

(function() {
  'use strict';
  
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
   */
  function setupApplicationEvents() {
    // Configurar evento do botão calcular
    const calcularBtn = document.getElementById('calcularBtn');
    if (calcularBtn && window.IPv6Calculator) {
      calcularBtn.addEventListener('click', window.IPv6Calculator.calcularSubRedes);
    }
    
    // Configurar evento do botão reset
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn && window.IPv6Calculator) {
      resetBtn.addEventListener('click', window.IPv6Calculator.resetarCalculadora);
    }
    
    // Configurar evento do botão de tema
    const themeBtn = document.getElementById('toggleThemeBtn');
    if (themeBtn && window.UIController) {
      themeBtn.addEventListener('click', window.UIController.theme.toggle);
    }
    
    // Configurar botão continuar
    const continuarBtn = document.getElementById('continuarBtn');
    if (continuarBtn && window.IPv6Calculator) {
      continuarBtn.addEventListener('click', window.IPv6Calculator.mostrarSugestoesDivisao);
    }
    
    // Configurar checkbox "Selecionar Todos"
    const selectAllBtn = document.getElementById('selectAll');
    if (selectAllBtn && window.UIController) {
      selectAllBtn.addEventListener('change', window.UIController.toggleSelectAll);
    }
    
    // Configurar botão "Carregar Mais"
    const loadMoreBtn = document.getElementById('loadMoreButton');
    if (loadMoreBtn && window.UIController && window.appState) {
      loadMoreBtn.addEventListener('click', () => {
        window.UIController.carregarMaisSubRedes(window.appState.subRedesExibidas || 0, 100);
      });
    }
    
    // Configurar botões de navegação
    const topBtn = document.getElementById('topBtn');
    const bottomBtn = document.getElementById('bottomBtn');
    
    if (topBtn && window.UIController) {
      topBtn.addEventListener('click', window.UIController.navigation.scrollToTop);
    }
    
    if (bottomBtn && window.UIController) {
      bottomBtn.addEventListener('click', window.UIController.navigation.scrollToBottom);
    }
    
    // Configurar botões de IPs do bloco principal
    const toggleMainBlockIpsBtn = document.getElementById('toggleMainBlockIpsBtn');
    if (toggleMainBlockIpsBtn && window.IPv6Calculator) {
      toggleMainBlockIpsBtn.addEventListener('click', window.IPv6Calculator.toggleMainBlockIps);
    }
    
    const moreMainBlockIpsBtn = document.getElementById('moreMainBlockIpsBtn');
    if (moreMainBlockIpsBtn && window.IPv6Calculator) {
      moreMainBlockIpsBtn.addEventListener('click', window.IPv6Calculator.gerarMaisIPsDoBloco);
    }
    
    const resetMainBlockIPsBtn = document.getElementById('resetMainBlockIPsButton');
    if (resetMainBlockIPsBtn && window.IPv6Calculator) {
      resetMainBlockIPsBtn.addEventListener('click', window.IPv6Calculator.resetarIPsMainBlock);
    }
    
    // Configurar botões de IPs da sub-rede
    const gerarIPsBtn = document.getElementById('gerarIPsButton');
    if (gerarIPsBtn && window.IPv6Calculator) {
      gerarIPsBtn.addEventListener('click', window.IPv6Calculator.gerarPrimeirosIPs);
    }
    
    const gerarMaisIPsBtn = document.getElementById('gerarMaisIPsButton');
    if (gerarMaisIPsBtn && window.IPv6Calculator) {
      gerarMaisIPsBtn.addEventListener('click', window.IPv6Calculator.gerarMaisIPs);
    }
    
    const resetIPsBtn = document.getElementById('resetIPsButton');
    if (resetIPsBtn && window.IPv6Calculator) {
      resetIPsBtn.addEventListener('click', window.IPv6Calculator.resetarIPsGerados);
    }
  }
  
  /**
   * Configura funcionalidades de cópia
   */
  function setupCopyFunctionality() {
    // Garantir que a função global copiarTexto está disponível
    if (!window.copiarTexto && window.UIController && window.UIController.clipboard) {
      window.copiarTexto = function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
          window.UIController.clipboard.copy(element);
        }
      };
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
    }
  }
  
  /**
   * Mostra notificação de sucesso na inicialização
   */
  function showInitializationSuccess() {
    if (window.UIController && window.UIController.notifications) {
      setTimeout(() => {
        window.UIController.notifications.show(
          'Calculadora IPv6 inicializada com sucesso!', 
          'success', 
          2000
        );
      }, 1000);
    }
  }
  
  /**
   * Função principal de inicialização
   */
  function initializeApplication() {
    console.log('🚀 Inicializando Calculadora IPv6...');
    
    try {
      // Verificar módulos essenciais
      const moduleCheck = checkEssentialModules();
      
      if (!moduleCheck.allLoaded) {
        console.error('❌ Módulos essenciais não carregados:', moduleCheck.missing);
        
        // Mostrar erro na interface
        const errorAlert = document.getElementById('initErrorAlert');
        const errorMessage = document.getElementById('initErrorMessage');
        
        if (errorAlert && errorMessage) {
          errorMessage.textContent = `Módulos não carregados: ${moduleCheck.missing.join(', ')}`;
          errorAlert.style.display = 'block';
        }
        
        return false;
      }
      
      console.log('✅ Módulos essenciais carregados:', moduleCheck.loaded);
      
      // Inicializar estado da aplicação
      initializeAppState();
      
      // Configurar funcionalidades
      setupCopyFunctionality();
      setupApplicationEvents();
      
      // Carregar preferências de tema
      if (window.UIController && window.UIController.theme) {
        window.UIController.theme.loadPreference();
      }
      
      // Ajustar layout responsivo inicial
      if (window.UIController && window.UIController.responsive) {
        window.UIController.responsive.adjust();
      }
      
      // Registrar módulos no ModuleManager se disponível
      if (window.ModuleManager) {
        window.ModuleManager.autoRegister.all();
      }
      
      // Mostrar notificação de sucesso apenas em desenvolvimento
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        showInitializationSuccess();
      }
      
      console.log('🎉 Calculadora IPv6 inicializada com sucesso!');
      return true;
      
    } catch (error) {
      console.error('❌ Erro na inicialização da aplicação:', error);
      
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
    // Se o DOM já estiver carregado, inicializar imediatamente
    initializeApplication();
  }
  
  // Expor função de inicialização para debug
  window.debugInitApp = initializeApplication;
  
})();
