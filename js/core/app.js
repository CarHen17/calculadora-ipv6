/**
 * Aplicação Principal da Calculadora IPv6 - Versão Corrigida
 * Coordena a inicialização da aplicação de forma segura
 */

(function() {
  'use strict';
  
  // Flag para evitar inicialização dupla
  let initialized = false;
  let keyboardShortcutsSetup = false;
  
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
    // Evitar configuração dupla
    if (keyboardShortcutsSetup) {
      return;
    }
    
    try {
      document.addEventListener('keydown', function(e) {
        // Ctrl+Enter: Calcular sub-redes
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          const calcularBtn = document.getElementById('calcularBtn');
          if (calcularBtn && calcularBtn.style.display !== 'none' && !calcularBtn.disabled) {
            calcularBtn.click();
          }
        }
        
        // Escape: Resetar (somente quando não estiver em um campo de texto)
        if (e.key === 'Escape') {
          const active = document.activeElement;
          const inInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
          if (!inInput) {
            const resetBtn = document.getElementById('resetBtn');
            if (resetBtn && confirm('Deseja resetar a calculadora?')) {
              resetBtn.click();
            }
          }
        }

        // Ctrl+Shift+D: Alternar tema (Ctrl+D conflita com o favorito do navegador)
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
          e.preventDefault();
          const themeBtn = document.getElementById('toggleThemeBtn');
          if (themeBtn) {
            themeBtn.click();
          }
        }
      });
      
      keyboardShortcutsSetup = true;
      console.log('[App] Atalhos de teclado configurados');
      
    } catch (error) {
      console.error('[App] Erro ao configurar atalhos de teclado:', error);
    }
  }
  
  // MutationObserver removido - não era necessário (botões usam onclick direto)
  
  /**
   * Verifica compatibilidade do navegador
   */
  function checkBrowserCompatibility() {
    const issues = [];
    
    try {
      // Verificar BigInt
      if (typeof BigInt === 'undefined') {
        issues.push('BigInt não suportado - cálculos IPv6 podem falhar');
      }
      
      // Verificar Clipboard API
      if (!navigator.clipboard) {
        issues.push('API de Clipboard não suportada - função de cópia pode ser limitada');
      }
      
      // Verificar requestAnimationFrame
      if (!window.requestAnimationFrame) {
        issues.push('requestAnimationFrame não suportado - animações podem não funcionar');
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
      
    } catch (error) {
      console.error('[App] Erro ao verificar compatibilidade:', error);
    }
  }
  
  /**
   * Configura comportamento responsivo básico
   */
  function setupResponsiveBehavior() {
    try {
      function adjustLayout() {
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile-device', isMobile);
      }
      
      // Aplicar inicialmente
      adjustLayout();
      
      // Aplicar em redimensionamentos
      window.addEventListener('resize', adjustLayout);
      
      console.log('[App] Comportamento responsivo configurado');
      
    } catch (error) {
      console.error('[App] Erro ao configurar comportamento responsivo:', error);
    }
  }
  
  /**
   * Configura tratamento de erros globais
   */
  function setupErrorHandling() {
    try {
      // Capturar erros JavaScript não tratados
      window.addEventListener('error', function(e) {
        console.error('[App] Erro global capturado:', {
          message: e.message,
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
          error: e.error
        });
        
        // Se for um erro crítico dos nossos módulos, mostrar para o usuário
        if (e.filename && (e.filename.includes('ipv6') || e.filename.includes('calculator'))) {
          console.error('Erro crítico detectado nos módulos da calculadora');
        }
      });
      
      // Capturar promises rejeitadas
      window.addEventListener('unhandledrejection', function(e) {
        console.warn('[App] Promise rejeitada:', e.reason);
      });
      
      console.log('[App] Tratamento de erros configurado');
      
    } catch (error) {
      console.error('[App] Erro ao configurar tratamento de erros:', error);
    }
  }
  
  /**
   * Inicializa funcionalidades básicas da interface
   */
  function initializeBasicUI() {
    try {
      // Focar no campo de entrada principal
      const ipv6Input = document.getElementById('ipv6');
      if (ipv6Input) {
        ipv6Input.focus();
      }
      
      // Garantir que elementos iniciais estão visíveis
      const container = document.querySelector('.container');
      if (container) {
        container.style.opacity = '1';
      }
      
      console.log('[App] Interface básica inicializada');
      
    } catch (error) {
      console.error('[App] Erro ao inicializar interface básica:', error);
    }
  }
  
  /**
   * Função principal de inicialização
   */
  function initializeApplication() {
    if (initialized) {
      console.log('[App] Aplicação já inicializada, ignorando chamada dupla');
      return true;
    }
    
    console.log('[App] 🚀 Inicializando Calculadora IPv6...');
    
    try {
      // 1. Verificar compatibilidade do navegador
      checkBrowserCompatibility();
      
      // 2. Verificar módulos essenciais
      const moduleCheck = checkEssentialModules();
      
      if (!moduleCheck.allLoaded) {
        console.error('[App] ❌ Módulos essenciais não carregados:', moduleCheck.missing);
        
        // Mostrar erro na interface
        const errorAlert = document.getElementById('initErrorAlert');
        const errorMessage = document.getElementById('initErrorMessage');
        
        if (errorAlert && errorMessage) {
          errorMessage.textContent = `Módulos não carregados: ${moduleCheck.missing.join(', ')}. Verifique o console e recarregue a página.`;
          errorAlert.style.display = 'block';
        }
        
        return false;
      }
      
      console.log('[App] ✅ Módulos essenciais carregados:', moduleCheck.loaded);
      
      // 3. Configurar funcionalidades
      setupErrorHandling();
      setupKeyboardShortcuts();
      setupResponsiveBehavior();
      initializeBasicUI();
      
      // 4. Marcar como inicializado
      initialized = true;
      
      console.log('[App] 🎉 Calculadora IPv6 inicializada com sucesso!');
      
      // 5. Mostrar dicas de atalhos apenas em desenvolvimento
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.group("⌨️ Atalhos de Teclado Disponíveis");
        console.log("• Ctrl+Enter: Calcular sub-redes");
        console.log("• Escape: Resetar calculadora (com confirmação)");
        console.log("• Ctrl+Shift+D: Alternar tema escuro/claro");
        console.groupEnd();
      }
      
      return true;
      
    } catch (error) {
      console.error('[App] ❌ Erro na inicialização da aplicação:', error);
      
      // Mostrar erro na interface
      const errorAlert = document.getElementById('initErrorAlert');
      const errorMessage = document.getElementById('initErrorMessage');
      
      if (errorAlert && errorMessage) {
        errorMessage.textContent = 'Erro na inicialização: ' + error.message + '. Verifique o console para mais detalhes.';
        errorAlert.style.display = 'block';
      }
      
      return false;
    }
  }
  
  /**
   * Aguarda o carregamento do DOM e dos módulos
   */
  function waitForInitialization() {
    // Se o DOM ainda não estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        // Aguardar um pouco mais para garantir que os módulos carregaram
        setTimeout(initializeApplication, 200);
      });
      return;
    }
    
    // DOM já está pronto, verificar se módulos estão carregados
    const moduleCheck = checkEssentialModules();
    
    if (moduleCheck.allLoaded) {
      // Todos os módulos estão prontos, inicializar imediatamente
      initializeApplication();
    } else {
      // Aguardar módulos carregarem
      console.log('[App] Aguardando módulos serem carregados...');
      setTimeout(() => {
        const retryCheck = checkEssentialModules();
        if (retryCheck.allLoaded) {
          initializeApplication();
        } else {
          console.warn('[App] Alguns módulos ainda não carregaram:', retryCheck.missing);
          // Tentar uma última vez após mais tempo
          setTimeout(initializeApplication, 1000);
        }
      }, 500);
    }
  }
  
  // Iniciar o processo de inicialização
  waitForInitialization();
  
  // Expor função de inicialização para debug
  window.debugInitApp = initializeApplication;
  
  // Expor verificação de módulos para debug
  window.checkModules = checkEssentialModules;
  
})();