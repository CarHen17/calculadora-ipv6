/**
 * Verificador de Sobreposição IPv6
 * 
 * Este módulo verifica se há sobreposição entre blocos IPv6
 * e fornece utilitários para evitar conflitos entre prefixos WAN e LAN.
 */

const OverlapChecker = (function() {
  'use strict';
  
  // Estado do verificador
  let state = {
    hasOverlap: false,
    suggestedPrefix: '',
    lastCheckedWan: '',
    lastCheckedLan: ''
  };
  
  /**
   * Verifica se há sobreposição entre o WAN (do localStorage) e o LAN (do campo principal)
   * @returns {boolean} - Verdadeiro se houver sobreposição
   */
  function checkPrefixOverlap() {
    try {
      console.log("Verificando sobreposição entre WAN e LAN principal...");
      
      // Obter o WAN do localStorage
      const wanPrefix = localStorage.getItem('networkConfig.wanPrefix') || '2804:418:3000:1::190/64';
      console.log("WAN do localStorage:", wanPrefix);
      
      // Obter o LAN do campo principal da calculadora
      const ipv6Input = document.getElementById('ipv6');
      const lanPrefix = ipv6Input ? ipv6Input.value.trim() : '';
      console.log("LAN do campo principal:", lanPrefix);
      
      // Validar entradas
      if (!isValidIPv6(wanPrefix)) {
        console.error("Prefixo WAN inválido");
        showOverlapWarning('', '', '', '');
        return false;
      }
      
      if (!isValidIPv6(lanPrefix)) {
        console.log("Campo LAN principal está vazio ou inválido");
        hideOverlapWarning();
        return false;
      }
      
      // Armazenar para referência
      state.lastCheckedWan = wanPrefix;
      state.lastCheckedLan = lanPrefix;
      
      // Extrair prefixos CIDR
      const wanMask = parseInt(wanPrefix.split('/')[1]);
      const lanMask = parseInt(lanPrefix.split('/')[1]);
      
      // Verificar se IPv6Utils está disponível
      if (typeof IPv6Utils === 'undefined' || typeof IPv6Utils.checkIPv6Overlap !== 'function') {
        console.error("Função IPv6Utils.checkIPv6Overlap não disponível");
        return false;
      }
      
      console.log("Verificando overlap entre:", wanPrefix, "e", lanPrefix);
      
      // Verificar a sobreposição usando a função do IPv6Utils
      const hasOverlap = IPv6Utils.checkIPv6Overlap(wanPrefix, lanPrefix);
      console.log("Resultado overlap:", hasOverlap);
      
      if (hasOverlap) {
        // Determinar qual o conflito
        const conflictMask = Math.min(wanMask, lanMask);
        
        // Gerar uma sugestão de prefixo alternativo
        state.suggestedPrefix = '';
        if (typeof IPv6Utils.suggestNonOverlappingPrefix === 'function') {
          state.suggestedPrefix = IPv6Utils.suggestNonOverlappingPrefix(
            lanPrefix, wanPrefix, lanMask
          );
        }
        
        console.log("Sugestão de novo prefixo:", state.suggestedPrefix);
        
        // Atualizar estado
        state.hasOverlap = true;
        
        // Mostrar aviso na interface
        showOverlapWarning(wanPrefix, lanPrefix, conflictMask, state.suggestedPrefix);
        
        return true;
      } else {
        // Atualizar estado
        state.hasOverlap = false;
        state.suggestedPrefix = '';
        
        // Ocultar aviso
        hideOverlapWarning();
        
        return false;
      }
    } catch (error) {
      console.error("Erro ao verificar sobreposição de prefixos:", error);
      return false;
    }
  }
  
  /**
   * Mostra o aviso de sobreposição na interface principal
   * @param {string} wanPrefix - Prefixo WAN
   * @param {string} lanPrefix - Prefixo LAN principal
   * @param {number} conflictMask - Máscara onde ocorre o conflito
   * @param {string} suggestedPrefix - Prefixo sugerido
   */
  function showOverlapWarning(wanPrefix, lanPrefix, conflictMask, suggestedPrefix) {
    try {
      const container = document.querySelector('.container');
      if (!container) return;
      
      // Remover aviso existente
      const existingWarning = document.getElementById('overlap-warning');
      if (existingWarning && existingWarning.parentNode) {
        existingWarning.parentNode.removeChild(existingWarning);
      }
      
      // Criar novo aviso
      const warning = document.createElement('div');
      warning.id = 'overlap-warning';
      warning.className = 'alert-banner warning';
      
      // Construir mensagem
      let message = '';
      if (wanPrefix && lanPrefix && conflictMask) {
        message = `
          <div class="alert-content">
            <div class="alert-icon">⚠️</div>
            <div class="alert-message">
              <h4>Sobreposição de blocos IPv6 detectada!</h4>
              <p>O prefixo WAN (${wanPrefix}) está em conflito com o prefixo LAN principal (${lanPrefix}) no bloco /${conflictMask}.</p>
              ${suggestedPrefix ? `
                <div class="alert-action">
                  <p>Prefixo recomendado para o campo principal: <code>${suggestedPrefix}</code></p>
                  <button class="btn-sm btn-secondary" onclick="OverlapChecker.applySuggestedPrefix()">
                    <i class="fas fa-check"></i> Aplicar Sugestão
                  </button>
                </div>
              ` : ''}
            </div>
            <button class="alert-close" onclick="OverlapChecker.hideOverlapWarning()">×</button>
          </div>
        `;
      } else {
        message = `
          <div class="alert-content">
            <div class="alert-icon">⚠️</div>
            <div class="alert-message">
              <h4>Prefixo LAN principal está vazio!</h4>
              <p>Para verificar a sobreposição, insira um endereço IPv6 no campo principal da calculadora.</p>
            </div>
            <button class="alert-close" onclick="OverlapChecker.hideOverlapWarning()">×</button>
          </div>
        `;
      }
      
      warning.innerHTML = message;
      
      // Inserir no início do container
      container.insertBefore(warning, container.firstChild);
      
      // Suavizar a entrada
      warning.style.opacity = '0';
      warning.style.transform = 'translateY(-20px)';
      
      setTimeout(() => {
        warning.style.transition = 'all 0.3s ease';
        warning.style.opacity = '1';
        warning.style.transform = 'translateY(0)';
      }, 10);
      
    } catch (error) {
      console.error("Erro ao mostrar aviso de sobreposição:", error);
    }
  }
  
  /**
   * Oculta o aviso de sobreposição
   */
  function hideOverlapWarning() {
    try {
      const warning = document.getElementById('overlap-warning');
      if (warning && warning.parentNode) {
        warning.style.opacity = '0';
        warning.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
          if (warning.parentNode) {
            warning.parentNode.removeChild(warning);
          }
        }, 300);
      }
    } catch (error) {
      console.error("Erro ao ocultar aviso de sobreposição:", error);
    }
  }
  
  /**
   * Aplica o prefixo sugerido ao campo principal
   */
  function applySuggestedPrefix() {
    try {
      if (!state.suggestedPrefix) {
        console.error("Nenhum prefixo sugerido disponível");
        return false;
      }
      
      const ipv6Input = document.getElementById('ipv6');
      if (!ipv6Input) {
        console.error("Campo principal de entrada não encontrado");
        return false;
      }
      
      // Aplicar o novo valor
      ipv6Input.value = state.suggestedPrefix;
      
      // Destacar o campo para chamar atenção
      ipv6Input.style.transition = 'background-color 0.3s ease';
      ipv6Input.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
      
      // Resetar o destaque após um tempo
      setTimeout(() => {
        ipv6Input.style.backgroundColor = '';
      }, 1500);
      
      // Disparar evento para atualizar a UI
      const event = new Event('change');
      ipv6Input.dispatchEvent(event);
      
      // Ocultar o aviso de sobreposição
      hideOverlapWarning();
      
      // Mostrar notificação de sucesso
      showNotification('Prefixo alternativo aplicado com sucesso!', 'success');
      
      return true;
    } catch (error) {
      console.error("Erro ao aplicar prefixo sugerido:", error);
      return false;
    }
  }
  
  /**
   * Verifica se um endereço IPv6 é válido
   * @param {string} ipv6 - Endereço IPv6 com CIDR para validar
   * @returns {boolean} - Verdadeiro se for válido
   */
  function isValidIPv6(ipv6) {
    try {
      // Verificar formato básico
      if (!ipv6 || typeof ipv6 !== 'string' || !ipv6.includes('/')) {
        return false;
      }
      
      // Extrair partes
      const [addr, prefix] = ipv6.split('/');
      
      // Validar prefixo CIDR
      const prefixNum = parseInt(prefix);
      if (isNaN(prefixNum) || prefixNum < 1 || prefixNum > 128) {
        return false;
      }
      
      // Verificação básica para o endereço IPv6
      if (!addr || addr.split(':').length < 2) {
        return false;
      }
      
      // Se o IPv6Utils estiver disponível, usar seu validador
      if (typeof IPv6Utils !== 'undefined' && typeof IPv6Utils.validateIPv6 === 'function') {
        return IPv6Utils.validateIPv6(ipv6) === null;
      }
      
      // Implementação básica de validação
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){1,7}([0-9a-fA-F]{1,4}|:)$/;
      return ipv6Regex.test(addr);
    } catch (error) {
      console.error("Erro ao validar IPv6:", error);
      return false;
    }
  }
  
  /**
   * Mostra uma notificação visual na página
   * @param {string} message - Mensagem a exibir
   * @param {string} type - Tipo de notificação (success, error, warning, info)
   * @param {number} duration - Duração em milissegundos
   */
  function showNotification(message, type = 'info', duration = 3000) {
    try {
      // Remove notificações anteriores
      const oldNotifications = document.querySelectorAll('.overlap-notification');
      oldNotifications.forEach(notif => {
        if (notif.parentNode) {
          notif.parentNode.removeChild(notif);
        }
      });
      
      // Cria nova notificação
      const notification = document.createElement('div');
      notification.className = `overlap-notification overlap-notification-${type}`;
      
      // Posicionamento
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.padding = '12px 20px';
      notification.style.borderRadius = '8px';
      notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
      notification.style.zIndex = '9999';
      notification.style.display = 'flex';
      notification.style.alignItems = 'center';
      notification.style.gap = '10px';
      notification.style.transform = 'translateY(20px)';
      notification.style.opacity = '0';
      notification.style.transition = 'all 0.3s ease';
      
      // Adicionar ícone com base no tipo
      let icon = '';
      switch (type) {
        case 'success':
          notification.style.backgroundColor = '#2ecc71';
          notification.style.color = 'white';
          icon = '<i class="fas fa-check-circle"></i>';
          break;
        case 'error':
          notification.style.backgroundColor = '#e74c3c';
          notification.style.color = 'white';
          icon = '<i class="fas fa-exclamation-circle"></i>';
          break;
        case 'warning':
          notification.style.backgroundColor = '#f39c12';
          notification.style.color = 'white';
          icon = '<i class="fas fa-exclamation-triangle"></i>';
          break;
        default:
          notification.style.backgroundColor = '#3498db';
          notification.style.color = 'white';
          icon = '<i class="fas fa-info-circle"></i>';
      }
      
      // Conteúdo da notificação
      notification.innerHTML = `${icon} <span>${message}</span>`;
      
      // Adicionar ao documento
      document.body.appendChild(notification);
      
      // Animar entrada
      setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
        
        // Remover após a duração
        setTimeout(() => {
          notification.style.transform = 'translateY(20px)';
          notification.style.opacity = '0';
          
          setTimeout(() => {
            if (notification.parentNode) {
              document.body.removeChild(notification);
            }
          }, 300);
        }, duration);
      }, 10);
    } catch (error) {
      console.error("Erro ao mostrar notificação:", error);
    }
  }
  
  // Expor API pública
  return {
    checkPrefixOverlap,
    applySuggestedPrefix,
    hideOverlapWarning,
    getState: () => ({ ...state })
  };
})();

// Exportar globalmente
window.OverlapChecker = OverlapChecker;
