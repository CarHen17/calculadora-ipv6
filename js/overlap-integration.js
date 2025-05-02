/**
 * Integração do verificador de sobreposição com a calculadora IPv6
 * 
 * Este script conecta a verificação de sobreposição ao fluxo principal da calculadora e ao modal de configuração.
 */

(function() {
  'use strict';
  
  // Configuração
  const config = {
    // Habilitar verificação automática
    enableAutoCheck: true,
    // Intervalo para verificação automática (em milissegundos)
    autoCheckInterval: 2000,
    // Prevenir cálculo se houver sobreposição
    preventCalculationOnOverlap: true
  };
  
  // Estado
  let checkingInterval = null;
  
  /**
   * Inicializa a integração
   */
  function initialize() {
    try {
      console.log("Inicializando integração de verificação de sobreposição...");
      
      // Verificar disponibilidade dos módulos necessários
      const hasOverlapChecker = typeof OverlapChecker !== 'undefined';
      const hasNetworkModal = typeof NetworkConfigModal !== 'undefined';
      const hasIPv6Utils = typeof IPv6Utils !== 'undefined';
      
      console.log("Módulos disponíveis:", {
        "OverlapChecker": hasOverlapChecker,
        "NetworkConfigModal": hasNetworkModal,
        "IPv6Utils": hasIPv6Utils
      });
      
      // Configurar eventos
      setupEvents();
      
      // Verificar configuração inicial
      setTimeout(checkInitialConfiguration, 500);
      
      // Configurar verificação automática
      if (config.enableAutoCheck) {
        setupAutoCheck();
      }
      
      console.log("Integração de verificação de sobreposição inicializada com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar integração de sobreposição:", error);
    }
  }
  
  /**
   * Configura eventos de integração entre os módulos
   */
  function setupEvents() {
    try {
      // Monitorar changes no campo IPv6 principal
      const ipv6Input = document.getElementById('ipv6');
      if (ipv6Input) {
        // Debounce para evitar chamadas excessivas
        const debouncedCheck = debounce(performOverlapCheck, 300);
        
        ipv6Input.addEventListener('input', debouncedCheck);
        ipv6Input.addEventListener('change', performOverlapCheck);
        ipv6Input.addEventListener('paste', () => {
          setTimeout(performOverlapCheck, 100);
        });
      }
      
      // Integrar com o botão de configuração de rede do modal
      const resolveConflictBtn = document.getElementById('modalResolveConflictBtn');
      if (resolveConflictBtn) {
        resolveConflictBtn.onclick = function(event) {
          if (typeof NetworkConfigModal !== 'undefined' && typeof NetworkConfigModal.checkOverlap === 'function') {
            NetworkConfigModal.checkOverlap();
            event.preventDefault();
          }
        };
      }
      
      // Integrar com o botão de cálculo principal
      const calcularBtn = document.getElementById('calcularBtn');
      if (calcularBtn && config.preventCalculationOnOverlap) {
        const originalOnClick = calcularBtn.onclick;
        
        calcularBtn.onclick = function(event) {
          if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkPrefixOverlap === 'function') {
            const hasOverlap = OverlapChecker.checkPrefixOverlap();
            
            if (hasOverlap) {
              console.warn("Cálculo bloqueado devido à sobreposição detectada");
              event.preventDefault();
              return false;
            }
          }
          
          // Continuar com comportamento original
          if (typeof originalOnClick === 'function') {
            return originalOnClick.call(this, event);
          }
        };
      }
      
      // Monitorar alterações no localStorage (quando a configuração de rede é salva)
      window.addEventListener('storage', function(e) {
        if (e.key === 'networkConfig.wanPrefix' || e.key === 'networkConfig.lanPrefix') {
          performOverlapCheck();
        }
      });
      
    } catch (error) {
      console.error("Erro ao configurar eventos de integração:", error);
    }
  }
  
  /**
   * Verifica a configuração inicial
   */
  function checkInitialConfiguration() {
    try {
      performOverlapCheck();
    } catch (error) {
      console.error("Erro ao verificar configuração inicial:", error);
    }
  }
  
  /**
   * Configura verificação automática periódica
   */
  function setupAutoCheck() {
    try {
      // Limpar qualquer interval existente
      if (checkingInterval) {
        clearInterval(checkingInterval);
      }
      
      // Configurar novo interval
      checkingInterval = setInterval(performOverlapCheck, config.autoCheckInterval);
      
      console.log(`Verificação automática configurada para cada ${config.autoCheckInterval}ms`);
    } catch (error) {
      console.error("Erro ao configurar verificação automática:", error);
    }
  }
  
  /**
   * Executa a verificação de sobreposição
   */
  function performOverlapCheck() {
    try {
      if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkPrefixOverlap === 'function') {
        const hasOverlap = OverlapChecker.checkPrefixOverlap();
        
        // Atualizar indicação visual no botão de configuração
        const networkConfigBtn = document.getElementById('networkConfigBtn');
        if (networkConfigBtn) {
          networkConfigBtn.classList.toggle('has-issue', hasOverlap);
        }
        
        return hasOverlap;
      }
      
      return false;
    } catch (error) {
      console.error("Erro ao executar verificação de sobreposição:", error);
      return false;
    }
  }
  
  /**
   * Utilitário para limitar chamadas frequentes (debounce)
   * @param {Function} func - Função a ser executada
   * @param {number} wait - Tempo de espera em milissegundos
   * @returns {Function} - Função com debounce
   */
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }
  
  /**
   * Limpa recursos quando necessário
   */
  function cleanup() {
    try {
      if (checkingInterval) {
        clearInterval(checkingInterval);
        checkingInterval = null;
      }
    } catch (error) {
      console.error("Erro ao limpar recursos:", error);
    }
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Limpar ao descarregar a página
  window.addEventListener('beforeunload', cleanup);
  
  // Expor API para debug
  window.OverlapIntegration = {
    performOverlapCheck,
    setupAutoCheck,
    cleanup,
    config
  };
})();
