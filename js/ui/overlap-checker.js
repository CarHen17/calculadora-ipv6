/**
 * Verificador de Sobreposição IPv6
 * 
 * Este módulo verifica se há sobreposição entre blocos IPv6
 * e fornece utilitários para evitar conflitos entre prefixos WAN e LAN.
 */

const OverlapChecker = (function() {
  'use strict';
  
  // Estado do verificador
  const state = {
    hasOverlap: false,
    suggestedPrefix: '',
    lastCheckedWan: '',
    lastCheckedLan: ''
  };
  
  /**
   * Verifica se há sobreposição entre dois prefixos IPv6
   * @param {string} wanPrefix - Prefixo IPv6 da WAN com CIDR (ex: 2001:db8::/64)
   * @param {string} lanPrefix - Prefixo IPv6 da LAN com CIDR (ex: 2001:db8:1::/64)
   * @returns {boolean} - Verdadeiro se houver sobreposição
   */
  function checkForOverlap(wanPrefix, lanPrefix) {
    try {
      // Validar entradas
      if (!isValidIPv6(wanPrefix) || !isValidIPv6(lanPrefix)) {
        console.error("Prefixos IPv6 inválidos:", wanPrefix, lanPrefix);
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
      
      // Verificar a sobreposição usando a função do IPv6Utils
      const hasOverlap = IPv6Utils.checkIPv6Overlap(wanPrefix, lanPrefix);
      
      if (hasOverlap) {
        // Determinar qual o conflito
        const conflictMask = Math.min(wanMask, lanMask);
        
        // Gerar uma sugestão de prefixo alternativo
        if (typeof IPv6Utils.suggestNonOverlappingPrefix === 'function') {
          state.suggestedPrefix = IPv6Utils.suggestNonOverlappingPrefix(
            lanPrefix, wanPrefix, lanMask
          );
        }
        
        // Atualizar estado
        state.hasOverlap = true;
        
        return true;
      } else {
        // Atualizar estado
        state.hasOverlap = false;
        state.suggestedPrefix = '';
        
        return false;
      }
    } catch (error) {
      console.error("Erro ao verificar sobreposição de prefixos:", error);
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
   * Aplica o prefixo sugerido ao campo "Inserir IPv6"
   */
  function applySuggestedPrefix() {
    try {
      if (!state.suggestedPrefix) {
        return false;
      }
      
      // Aplicar ao campo de entrada principal da calculadora
      const ipv6Input = document.getElementById('ipv6');
      if (ipv6Input) {
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
        showVisualNotification('Prefixo alternativo aplicado com sucesso!', 'success');
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Erro ao aplicar prefixo sugerido:", error);
      return false;
    }
  }
  
  /**
   * Mostra uma notificação visual na página
   * @param {string} message - Mensagem a exibir
   * @param {string} type - Tipo de notificação (success, error, warning, info)
   * @param {number} duration - Duração em milissegundos
   */
  function showVisualNotification(message, type = 'info', duration = 3000) {
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
  }