/**
 * Aplicação Principal da Calculadora IPv6 - Versão Simplificada e Corrigida
 * Coordena a inicialização da aplicação de forma segura
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
   * Configura atalhos de teclado úteis
   */
  function setupKeyboardShortcuts() {
    if (document.hasAttribute('data-keyboard-shortcuts-ready')) {
      return;
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
      
      // Ctrl+D: Alternar tema
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        const themeBtn = document.getElementById('toggleThemeBtn');
        if (themeBtn) {
          themeBtn.click();
        }
      }
    });
    
    document.setAttribute('data-keyboard-shortcuts-ready', 'true');
  }
  
  /**
   * Monitora quando novos elementos são adicionados ao DOM
   */
  function setupDOMObserver() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              // Se novos elementos forem adicionados, verificar se precisam de configuração
              const newButtons = node.querySelectorAll ? node.querySelectorAll('button:not([data-app-ready])') : [];
              if (newButtons.length > 0) {
                // Marcar como processados para evitar re-processamento
                newButtons.forEach(btn => btn.setAttribute('data-app-ready', 'true'));
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
   * Verifica compatibilidade do navegador
   */
  function checkBrowserCompatibility() {
    const issues = [];
    
    // Verificar BigInt
    if (typeof BigInt === 'undefined') {
      issues.push('BigInt não suportado - cálculos IPv6 podem falhar');
    }
    
    // Verificar Clipboard API
    if (!navigator.clipboard) {
      issues.push('API de Clipboard não suportada - função de cópia pode ser limitada');
    }
    
    if (issues.length > 0) {
      console.warn("⚠️ Problemas de compatibilidade detectados:");
      issues.forEach(issue => console.warn("- " + issue));
      
      // Mostrar aviso apenas se for muito crítico
      if (typeof BigInt === 'undefined') {
        setTimeout(() => {
          alert("Seu navegador pode não suportar todas as funcionalidades da Calculadora IPv6. " +
                "Para melhor experiência, utilize uma versão mais recente do Chrome, Firefox ou Edge.");
        }, 2000);
      }
    } else {
      console.log("✅ Navegador compatível com todas as funcionalidades");
    }
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
      // Verificar compatibilidade do navegador
      checkBrowserCompatibility();
      
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
      
      // Configurar funcionalidades
      setupKeyboardShortcuts();
      setupDOMObserver();
      
      // Marcar como inicializado
      initialized = true;
      
      console.log('[App] 🎉 Calculadora IPv6 inicializada com sucesso!');
      
      // Mostrar dicas de atalhos apenas em desenvolvimento
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.log("⌨️ Atalhos disponíveis:");
        console.log("- Ctrl+Enter: Calcular sub-redes");
        console.log("- Escape: Resetar (com confirmação)");
        console.log("- Ctrl+D: Alternar tema");
      }
      
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
    setTimeout(initializeApplication, 100);
  }
  
  // Expor função de inicialização para debug
  window.debugInitApp = initializeApplication;
  
})();
