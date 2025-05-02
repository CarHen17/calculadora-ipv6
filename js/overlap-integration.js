/**
 * Integração do verificador de sobreposição com a calculadora IPv6
 * 
 * Este script conecta a verificação de sobreposição ao fluxo principal da calculadora.
 */

(function() {
  'use strict';
  
  // Configuração
  const config = {
    // Prefixo WAN padrão se nenhum foi salvo
    defaultWanPrefix: '2804:418:3000:1::190/64',
    // Habilitar verificação automática
    enableAutoCheck: true,
    // Prevenir cálculo se houver sobreposição
    preventCalculationOnOverlap: true
  };
  
  /**
   * Inicializa a integração
   */
  function initialize() {
    try {
      console.log("Inicializando integração de verificação de sobreposição...");
      
      // Integrar com o botão de cálculo
      const calcularBtn = document.getElementById('calcularBtn');
      if (calcularBtn && config.preventCalculationOnOverlap) {
        integrateWithCalculateButton(calcularBtn);
      }
      
      // Configurar evento para verificação ao digitar no campo IPv6
      if (config.enableAutoCheck) {
        setupAutoCheck();
      }
      
      console.log("Integração de verificação de sobreposição inicializada");
    } catch (error) {
      console.error("Erro ao inicializar integração de sobreposição:", error);
    }
  }
  
  /**
   * Integra com o botão de calcular sub-redes
   * @param {HTMLButtonElement} button - Botão de calcular
   */
  function integrateWithCalculateButton(button) {
    // Preservar o comportamento original
    const originalClick = button.onclick;
    
    // Substituir com nova função
    button.onclick = function(e) {
      // Obter o endereço IPv6 inserido
      const ipv6Input = document.getElementById('ipv6');
      if (!ipv6Input || !ipv6Input.value) {
        // Sem entrada, continuar normalmente
        if (typeof originalClick === 'function') {
          return originalClick.call(this, e);
        }
        return true;
      }
      
      // Verificar sobreposição
      const wanPrefix = localStorage.getItem('networkConfig.wanPrefix') || config.defaultWanPrefix;
      const lanPrefix = ipv6Input.value.trim();
      
      if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkForOverlap === 'function') {
        const hasOverlap = OverlapChecker.checkForOverlap(wanPrefix, lanPrefix);
        
        if (hasOverlap) {
          // Mostrar aviso
          if (typeof OverlapChecker.showOverlapWarning === 'function') {
            OverlapChecker.showOverlapWarning(wanPrefix, lanPrefix);
          }
          
          // Evitar cálculo
          e.preventDefault();
          return false;
        }
      }
      
      // Continuar com comportamento original
      if (typeof originalClick === 'function') {
        return originalClick.call(this, e);
      }
      return true;
    };
  }
  
  /**
   * Configura verificação automática ao digitar
   */
  function setupAutoCheck() {
    const ipv6Input = document.getElementById('ipv6');
    if (!ipv6Input) return;
    
    // Função de verificação
    const checkInputValue = function() {
      if (!ipv6Input.value) return;
      
      const wanPrefix = localStorage.getItem('networkConfig.wanPrefix') || config.defaultWanPrefix;
      const lanPrefix = ipv6Input.value.trim();
      
      if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkForOverlap === 'function') {
        const hasOverlap = OverlapChecker.checkForOverlap(wanPrefix, lanPrefix);
        
        if (hasOverlap) {
          if (typeof OverlapChecker.showOverlapWarning === 'function') {
            OverlapChecker.showOverlapWarning(wanPrefix, lanPrefix);
          }
        } else {
          if (typeof OverlapChecker.hideOverlapWarning === 'function') {
            OverlapChecker.hideOverlapWarning();
          }
        }
      }
    };
    
    // Debounce para evitar verificações excessivas
    const debounce = function(func, wait) {
      let timeout;
      return function() {
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
      };
    };
    
    // Adicionar eventos
    ipv6Input.addEventListener('input', debounce(checkInputValue, 500));
    ipv6Input.addEventListener('change', checkInputValue);
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();