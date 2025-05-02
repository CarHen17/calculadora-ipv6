/**
 * Integração do verificador de sobreposição com a calculadora IPv6
 * 
 * Este script conecta a verificação de sobreposição ao fluxo principal da calculadora e ao modal de configuração.
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
      
      // Verificar disponibilidade dos módulos necessários
      const hasOverlapChecker = typeof OverlapChecker !== 'undefined';
      const hasNetworkModal = typeof NetworkConfigModal !== 'undefined';
      const hasIPv6Utils = typeof IPv6Utils !== 'undefined';
      
      if (!hasOverlapChecker || !hasNetworkModal || !hasIPv6Utils) {
        console.error("Módulos necessários não encontrados:", {
          "OverlapChecker": hasOverlapChecker,
          "NetworkConfigModal": hasNetworkModal,
          "IPv6Utils": hasIPv6Utils
        });
        
        // Tentar registrar eventos mesmo assim, em caso de carregamento tardio
        setupEvents();
        return;
      }
      
      // Configurar eventos
      setupEvents();
      
      // Verificar configuração inicial se necessário
      setTimeout(checkInitialConfiguration, 500);
      
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
      // Integrar com o botão de configuração de rede
      const networkConfigBtn = document.getElementById('networkConfigBtn');
      if (networkConfigBtn) {
        // Preservar comportamento original
        const originalClick = networkConfigBtn.onclick;
        
        networkConfigBtn.onclick = function(event) {
          // Se NetworkConfigModal existir e tiver uma função openModal, usá-la
          if (typeof NetworkConfigModal !== 'undefined' && typeof NetworkConfigModal.openModal === 'function') {
            NetworkConfigModal.openModal();
            event.preventDefault();
            return false;
          }
          
          // Caso contrário, manter comportamento original
          if (typeof originalClick === 'function') {
            return originalClick.call(this, event);
          }
        };
      }
      
      // Integrar com o botão de verificação de sobreposição no modal
      const resolveConflictBtn = document.getElementById('modalResolveConflictBtn');
      if (resolveConflictBtn) {
        // Preservar comportamento original
        const originalClick = resolveConflictBtn.onclick;
        
        resolveConflictBtn.onclick = function(event) {
          // Se NetworkConfigModal existir e tiver um método checkOverlap, usá-lo
          if (typeof NetworkConfigModal !== 'undefined' && typeof NetworkConfigModal.checkOverlap === 'function') {
            NetworkConfigModal.checkOverlap();
            event.preventDefault();
            return false;
          }
          
          // Caso contrário, tentar usar OverlapChecker diretamente
          if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkPrefixOverlap === 'function') {
            OverlapChecker.checkPrefixOverlap();
            event.preventDefault();
            return false;
          }
          
          // Manter comportamento original
          if (typeof originalClick === 'function') {
            return originalClick.call(this, event);
          }
        };
      }
      
      // Integrar com o botão de cálculo principal
      const calcularBtn = document.getElementById('calcularBtn');
      if (calcularBtn && config.preventCalculationOnOverlap) {
        // Preservar comportamento original
        const originalClick = calcularBtn.onclick;
        
        calcularBtn.onclick = function(event) {
          // Verificar sobreposição antes de calcular
          if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkPrefixOverlap === 'function') {
            const hasOverlap = OverlapChecker.checkPrefixOverlap();
            
            if (hasOverlap) {
              // Evitar cálculo
              event.preventDefault();
              return false;
            }
          }
          
          // Continuar com comportamento original
          if (typeof originalClick === 'function') {
            return originalClick.call(this, event);
          }
        };
      }
      
      // Configurar evento para o campo de entrada IPv6
      const ipv6Input = document.getElementById('ipv6');
      if (ipv6Input && config.enableAutoCheck) {
        // Debounce para evitar chamadas frequentes
        const debounceCheck = debounce(function() {
          if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkPrefixOverlap === 'function') {
            OverlapChecker.checkPrefixOverlap();
          }
        }, 500);
        
        // Adicionar eventos
        ipv6Input.addEventListener('input', debounceCheck);
        ipv6Input.addEventListener('change', function() {
          if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkPrefixOverlap === 'function') {
            OverlapChecker.checkPrefixOverlap();
          }
        });
      }
    } catch (error) {
      console.error("Erro ao configurar eventos de integração:", error);
    }
  }
  
  /**
   * Verifica a configuração inicial e revela alertas se necessário
   */
  function checkInitialConfiguration() {
    try {
      const ipv6Input = document.getElementById('ipv6');
      if (!ipv6Input || !ipv6Input.value) return;
      
      // Verificar se há sobreposição inicial
      if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkPrefixOverlap === 'function') {
        OverlapChecker.checkPrefixOverlap();
      }
    } catch (error) {
      console.error("Erro ao verificar configuração inicial:", error);
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
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();