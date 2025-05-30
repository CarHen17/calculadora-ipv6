/**
 * Aplicação Principal da Calculadora IPv6 - Versão Corrigida
 * 
 * Este arquivo coordena a inicialização da aplicação de forma limpa e eficiente,
 * garantindo que todos os event listeners sejam configurados corretamente.
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
    try {
      console.log("Configurando eventos da aplicação...");
      
      // Configurar evento do botão calcular
      const calcularBtn = document.getElementById('calcularBtn');
      if (calcularBtn && window.IPv6Calculator) {
        // Remover listeners existentes
        const newCalcBtn = calcularBtn.cloneNode(true);
        calcularBtn.parentNode.replaceChild(newCalcBtn, calcularBtn);
        newCalcBtn.addEventListener('click', window.IPv6Calculator.calcularSubRedes);
        console.log("Event listener do botão calcular configurado");
      }
      
      // Configurar evento do botão reset
      const resetBtn = document.getElementById('resetBtn');
      if (resetBtn && window.IPv6Calculator) {
        const newResetBtn = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
        newResetBtn.addEventListener('click', window.IPv6Calculator.resetarCalculadora);
        console.log("Event listener do botão reset configurado");
      }
      
      // Configurar evento do botão de tema (já configurado no UIController)
      // Apenas verificar se existe
      const themeBtn = document.getElementById('toggleThemeBtn');
      if (themeBtn && window.UIController) {
        console.log("Botão de tema encontrado - será configurado pelo UIController");
      }
      
      // Configurar botão continuar
      const continuarBtn = document.getElementById('continuarBtn');
      if (continuarBtn && window.IPv6Calculator) {
        const newContinuarBtn = continuarBtn.cloneNode(true);
        continuarBtn.parentNode.replaceChild(newContinuarBtn, continuarBtn);
        newContinuarBtn.addEventListener('click', window.IPv6Calculator.mostrarSugestoesDivisao);
      }
      
      // Configurar checkbox "Selecionar Todos"
      const selectAllBtn = document.getElementById('selectAll');
      if (selectAllBtn && window.UIController) {
        const newSelectAllBtn = selectAllBtn.cloneNode(true);
        selectAllBtn.parentNode.replaceChild(newSelectAllBtn, selectAllBtn);
        newSelectAllBtn.addEventListener('change', window.UIController.toggleSelectAll);
      }
      
      // Configurar botão "Carregar Mais"
      const loadMoreBtn = document.getElementById('loadMoreButton');
      if (loadMoreBtn && window.UIController && window.appState) {
        const newLoadMoreBtn = loadMoreBtn.cloneNode(true);
        loadMoreBtn.parentNode.replaceChild(newLoadMoreBtn, loadMoreBtn);
        newLoadMoreBtn.addEventListener('click', () => {
          window.UIController.carregarMaisSubRedes(window.appState.subRedesExibidas || 0, 100);
        });
      }
      
      // Configurar botões de IPs do bloco principal
      const toggleMainBlockIpsBtn = document.getElementById('toggleMainBlockIpsBtn');
      if (toggleMainBlockIpsBtn && window.IPv6Calculator) {
        const newToggleBtn = toggleMainBlockIpsBtn.cloneNode(true);
        toggleMainBlockIpsBtn.parentNode.replaceChild(newToggleBtn, toggleMainBlockIpsBtn);
        newToggleBtn.addEventListener('click', window.IPv6Calculator.toggleMainBlockIps);
      }
      
      const moreMainBlockIpsBtn = document.getElementById('moreMainBlockIpsBtn');
      if (moreMainBlockIpsBtn && window.IPv6Calculator) {
        const newMoreBtn = moreMainBlockIpsBtn.cloneNode(true);
        moreMainBlockIpsBtn.parentNode.replaceChild(newMoreBtn, moreMainBlockIpsBtn);
        newMoreBtn.addEventListener('click', window.IPv6Calculator.gerarMaisIPsDoBloco);
      }
      
      const resetMainBlockIPsBtn = document.getElementById('resetMainBlockIPsButton');
      if (resetMainBlockIPsBtn && window.IPv6Calculator) {
        const newResetMainBtn = resetMainBlockIPsBtn.cloneNode(true);
        resetMainBlockIPsBtn.parentNode.replaceChild(newResetMainBtn, resetMainBlockIPsBtn);
        newResetMainBtn.addEventListener('click', window.IPv6Calculator.resetarIPsMainBlock);
      }
      
      // Configurar botões de IPs da sub-rede
      const gerarIPsBtn = document.getElementById('gerarIPsButton');
      if (gerarIPsBtn && window.IPv6Calculator) {
        const newGerarBtn = gerarIPsBtn.cloneNode(true);
        gerarIPsBtn.parentNode.replaceChild(newGerarBtn, gerarIPsBtn);
        newGerarBtn.addEventListener('click', window.IPv6Calculator.gerarPrimeirosIPs);
      }
      
      const gerarMaisIPsBtn = document.getElementById('gerarMaisIPsButton');
      if (gerarMaisIPsBtn && window.IPv6Calculator) {
        const newGerarMaisBtn = gerarMaisIPsBtn.cloneNode(true);
        gerarMaisIPsBtn.parentNode.replaceChild(newGerarMaisBtn, gerarMaisIPsBtn);
        newGerarMaisBtn.addEventListener('click', window.IPv6Calculator.gerarMaisIPs);
      }
      
      const resetIPsBtn = document.getElementById('resetIPsButton');
      if (resetIPsBtn && window.IPv6Calculator) {
        const newResetIPsBtn = resetIPsBtn.cloneNode(true);
        resetIPsBtn.parentNode.replaceChild(newResetIPsBtn, resetIPsBtn);
        newResetIPsBtn.addEventListener('click', window.IPv6Calculator.resetarIPsGerados);
      }
      
      console.log("Eventos da aplicação configurados com sucesso");
    } catch (error) {
      console.error("Erro ao configurar eventos da aplicação:", error);
    }
  }
  
  /**
   * Configura funcionalidades de cópia
   */
  function setupCopyFunctionality() {
    try {
      // Garantir que a função global copiarTexto está disponível
      if (!window.copiarTexto && window.UIController && window.UIController.clipboard) {
        window.copiarTexto = function(elementId) {
          const element = document.getElementById(elementId);
          if (element) {
            window.UIController.clipboard.copy(element);
          }
        };
        console.log("Função global copiarTexto configurada");
      }
      
      // Configurar todos os botões de cópia existentes
      if (window.UIController && window.UIController.setupCopyButtons) {
        window.UIController.setupCopyButtons();
      }
    } catch (error) {
      console.error("Erro ao configurar funcionalidade de cópia:", error);
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
      console.log("Estado global da aplicação inicializado");
    }
  }
  
  /**
   * Configura eventos de atalhos de teclado
   */
  function setupKeyboardShortcuts() {
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
  }
  
  /**
   * Monitora mudanças dinâmicas no DOM
   */
  function setupDOMObserver() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          // Quando novos elementos são adicionados, configurar botões de cópia
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              const copyButtons = node.querySelectorAll ? node.querySelectorAll('.copy-btn') : [];
              if (copyButtons.length > 0) {
                setTimeout(() => {
                  if (window.UIController && window.UIController.setupCopyButtons) {
                    window.UIController.setupCopyButtons();
                  }
                }, 100);
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
      setupKeyboardShortcuts();
      setupDOMObserver();
      
      // Aguardar um pouco para UIController configurar seus próprios eventos
      setTimeout(() => {
        console.log('📋 Configuração de eventos concluída');
      }, 500);
      
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
    // Se o DOM já estiver carregado, aguardar um pouco para garantir que outros módulos carregaram
    setTimeout(initializeApplication, 100);
  }
  
  // Expor função de inicialização para debug
  window.debugInitApp = initializeApplication;
  
})();
