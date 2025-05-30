/**
 * Modal de Configuração de Rede - Versão Corrigida
 * 
 * Gerencia o modal de configuração de rede com posicionamento adequado
 * e funcionalidade completa de verificação de sobreposição.
 */

const NetworkConfigModal = (function() {
  'use strict';
  
  // Estado do modal
  let state = {
    isOpen: false,
    hasOverlap: false,
    wanPrefix: '',
    lanPrefix: '',
    suggestedPrefix: '',
    mainLanPrefix: ''
  };

  // Elementos do DOM
  let elements = {};

  /**
   * Inicializa o modal de configuração de rede
   */
  function initialize() {
    try {
      console.log("Inicializando modal de configuração de rede...");
      
      mapDOMElements();
      loadInitialConfig();
      setupEventListeners();
      
      console.log("Modal de configuração de rede inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar modal de rede:", error);
    }
  }

  /**
   * Mapeia os elementos do DOM necessários
   */
  function mapDOMElements() {
    elements = {
      overlay: document.getElementById('networkConfigModalOverlay'),
      modal: document.getElementById('networkConfigModal'),
      openBtn: document.getElementById('networkConfigBtn'),
      closeBtn: document.getElementById('closeNetworkConfigModalBtn'),
      cancelBtn: document.getElementById('cancelNetworkConfigBtn'),
      saveBtn: document.getElementById('saveNetworkConfigBtn'),
      wanInput: document.getElementById('modalWanPrefix'),
      lanInput: document.getElementById('modalLanPrefix'),
      checkOverlapBtn: document.getElementById('modalResolveConflictBtn'),
      overlapWarning: document.getElementById('modalOverlapWarning'),
      suggestedPrefixCode: document.getElementById('modalSuggestedPrefix'),
      applySuggestionBtn: document.getElementById('modalApplyPrefixBtn')
    };
    
    // Verificar se elementos essenciais existem
    if (!elements.overlay || !elements.modal || !elements.openBtn) {
      console.error("Elementos essenciais do modal não encontrados no DOM");
      return false;
    }
    
    return true;
  }
  
  /**
   * Carrega a configuração inicial (valores WAN/LAN)
   */
  function loadInitialConfig() {
    try {
      if (elements.wanInput && elements.lanInput) {
        const savedWanPrefix = localStorage.getItem('networkConfig.wanPrefix');
        const savedLanPrefix = localStorage.getItem('networkConfig.lanPrefix');
        
        elements.wanInput.value = savedWanPrefix || '2804:418:3000:1::190/64';
        elements.lanInput.value = savedLanPrefix || '2804:418:3000:5::1/64';
        
        state.wanPrefix = elements.wanInput.value;
        state.lanPrefix = elements.lanInput.value;
      }
    } catch (error) {
      console.error("Erro ao carregar configuração inicial:", error);
    }
  }
  
  /**
   * Configura os listeners de eventos
   */
  function setupEventListeners() {
    try {
      // Botão de abrir modal
      if (elements.openBtn) {
        // Remover listeners existentes clonando o elemento
        const newOpenBtn = elements.openBtn.cloneNode(true);
        elements.openBtn.parentNode.replaceChild(newOpenBtn, elements.openBtn);
        elements.openBtn = newOpenBtn;
        
        elements.openBtn.addEventListener('click', openModal);
        console.log("Event listener do botão de rede configurado");
      }
      
      // Botões de fechar
      if (elements.closeBtn) {
        elements.closeBtn.addEventListener('click', closeModal);
      }
      if (elements.cancelBtn) {
        elements.cancelBtn.addEventListener('click', closeModal);
      }
      
      // Botão de salvar
      if (elements.saveBtn) {
        elements.saveBtn.addEventListener('click', saveConfigAndClose);
      }
      
      // Fechar ao clicar no overlay
      if (elements.overlay) {
        elements.overlay.addEventListener('click', function(event) {
          if (event.target === elements.overlay) {
            closeModal();
          }
        });
      }
      
      // Eventos de teclado
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && state.isOpen) {
          closeModal();
        }
      });
      
      // Botão de verificar sobreposição
      if (elements.checkOverlapBtn) {
        elements.checkOverlapBtn.addEventListener('click', checkOverlapInModal);
      }
      
      // Botão de aplicar sugestão
      if (elements.applySuggestionBtn) {
        elements.applySuggestionBtn.addEventListener('click', applySuggestedPrefixToMainInput);
      }

      // Eventos dos campos de entrada
      if (elements.wanInput) {
        elements.wanInput.addEventListener('input', () => { 
          state.wanPrefix = elements.wanInput.value;
          hideOverlapWarningInModal();
        });
      }
      
      if (elements.lanInput) {
        elements.lanInput.addEventListener('input', () => { 
          state.lanPrefix = elements.lanInput.value;
          hideOverlapWarningInModal();
        });
      }

    } catch (error) {
      console.error("Erro ao configurar listeners de eventos:", error);
    }
  }

  /**
   * Abre o modal
   */
  function openModal() {
    if (!elements.overlay || !elements.modal) {
      console.error("Elementos do modal não encontrados");
      return;
    }
    
    try {
      console.log("Abrindo modal de configuração de rede");
      
      // Carregar valores mais recentes
      loadInitialConfig();
      
      // Limpar avisos anteriores
      hideOverlapWarningInModal();
      
      // Definir atributos de acessibilidade
      elements.overlay.setAttribute('aria-hidden', 'false');
      elements.modal.setAttribute('aria-modal', 'true');
      
      // Mostrar modal
      elements.overlay.classList.add('visible');
      state.isOpen = true;
      
      // Focar no primeiro campo após animação
      setTimeout(() => {
        if (elements.wanInput) {
          elements.wanInput.focus();
        }
      }, 150);
      
    } catch (error) {
      console.error("Erro ao abrir modal:", error);
    }
  }
  
  /**
   * Fecha o modal
   */
  function closeModal() {
    if (!elements.overlay || !elements.modal) return;
    
    try {
      console.log("Fechando modal de configuração de rede");
      
      // Definir atributos de acessibilidade
      elements.overlay.setAttribute('aria-hidden', 'true');
      elements.modal.setAttribute('aria-modal', 'false');
      
      // Ocultar modal
      elements.overlay.classList.remove('visible');
      state.isOpen = false;
      
    } catch (error) {
      console.error("Erro ao fechar modal:", error);
    }
  }

  /**
   * Salva a configuração e fecha o modal
   */
  function saveConfigAndClose() {
    try {
      const currentWan = elements.wanInput ? elements.wanInput.value.trim() : state.wanPrefix;
      const currentLanRef = elements.lanInput ? elements.lanInput.value.trim() : state.lanPrefix;

      // Validar antes de salvar
      if (!isValidPrefix(currentWan)) {
        showNotification("Prefixo WAN inválido. Não salvo.", "error");
        return;
      }

      localStorage.setItem('networkConfig.wanPrefix', currentWan);
      localStorage.setItem('networkConfig.lanPrefix', currentLanRef);
      
      state.wanPrefix = currentWan;
      state.lanPrefix = currentLanRef;

      showNotification("Configuração de rede salva!", "success");
      
      // Feedback visual no botão
      if (elements.saveBtn) {
        elements.saveBtn.style.backgroundColor = '#4caf50';
        elements.saveBtn.innerHTML = '<i class="fas fa-check"></i> Salvo!';
        
        setTimeout(() => {
          elements.saveBtn.style.backgroundColor = '';
          elements.saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
        }, 1500);
      }
      
      // Fechar modal após delay
      setTimeout(closeModal, 1500);

      // Remover indicador de problema do botão principal
      if (elements.openBtn) {
        elements.openBtn.classList.remove('has-issue');
      }

      // Verificar sobreposição após salvar
      setTimeout(() => {
        if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkPrefixOverlap === 'function') {
          OverlapChecker.checkPrefixOverlap();
        }
      }, 100);

    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      showNotification("Erro ao salvar configuração.", "error");
    }
  }
  
  /**
   * Verifica sobreposição dentro do modal
   */
  function checkOverlapInModal() {
    try {
      console.log("Verificando sobreposição no modal");
      
      // Feedback visual no botão
      if (elements.checkOverlapBtn) {
        elements.checkOverlapBtn.classList.add('checking');
        elements.checkOverlapBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
      }
      
      if (typeof IPv6Utils === 'undefined' || typeof IPv6Utils.checkIPv6Overlap !== 'function') {
        console.error("IPv6Utils.checkIPv6Overlap não disponível");
        showNotification("Erro: Utilitário de cálculo indisponível.", "error");
        resetCheckButtonState();
        return;
      }
      
      const modalWanPrefix = elements.wanInput ? elements.wanInput.value.trim() : state.wanPrefix;
      const mainLanPrefixInput = document.getElementById('ipv6');
      const mainLanPrefix = mainLanPrefixInput ? mainLanPrefixInput.value.trim() : '';
      state.mainLanPrefix = mainLanPrefix;

      // Validar os prefixos
      if (!isValidPrefix(modalWanPrefix)) {
        showNotification("Prefixo WAN no modal é inválido.", "error");
        hideOverlapWarningInModal();
        resetCheckButtonState(true);
        return;
      }
      
      if (!isValidPrefix(mainLanPrefix)) {
        showNotification("Prefixo LAN principal está vazio ou é inválido.", "warning");
        hideOverlapWarningInModal();
        resetCheckButtonState(true);
        return;
      }
      
      // Delay para mostrar estado de verificação
      setTimeout(() => {
        const hasOverlap = IPv6Utils.checkIPv6Overlap(modalWanPrefix, mainLanPrefix);
        state.hasOverlap = hasOverlap;
        
        if (hasOverlap) {
          const wanMask = parseInt(modalWanPrefix.split('/')[1]);
          const lanMask = parseInt(mainLanPrefix.split('/')[1]);
          
          // Gerar sugestão para o prefixo LAN principal
          state.suggestedPrefix = '';
          if (typeof IPv6Utils.suggestNonOverlappingPrefix === 'function') {
            state.suggestedPrefix = IPv6Utils.suggestNonOverlappingPrefix(
              mainLanPrefix,
              modalWanPrefix,
              lanMask
            );
          }
          
          showOverlapWarningInModal(modalWanPrefix, mainLanPrefix, Math.min(wanMask, lanMask), state.suggestedPrefix);
          showNotification("⚠️ Sobreposição detectada!", "warning");
          
          // Feedback visual de erro
          if (elements.checkOverlapBtn) {
            elements.checkOverlapBtn.classList.remove('checking');
            elements.checkOverlapBtn.classList.add('has-overlap');
            elements.checkOverlapBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Sobreposição Detectada';
            
            setTimeout(() => {
              elements.checkOverlapBtn.classList.remove('has-overlap');
              elements.checkOverlapBtn.innerHTML = '<i class="fas fa-magic"></i> Verificar Sobreposição';
            }, 3000);
          }
        } else {
          hideOverlapWarningInModal();
          showNotification("✅ Prefixos compatíveis.", "success");
          
          // Feedback visual de sucesso
          if (elements.checkOverlapBtn) {
            elements.checkOverlapBtn.classList.remove('checking');
            elements.checkOverlapBtn.classList.add('no-overlap');
            elements.checkOverlapBtn.innerHTML = '<i class="fas fa-check"></i> Prefixos Compatíveis';
            
            setTimeout(() => {
              elements.checkOverlapBtn.classList.remove('no-overlap');
              elements.checkOverlapBtn.innerHTML = '<i class="fas fa-magic"></i> Verificar Sobreposição';
            }, 3000);
          }
        }
      }, 500);
      
    } catch (error) {
      console.error("Erro ao verificar sobreposição:", error);
      showNotification("Erro ao verificar sobreposição.", "error");
      hideOverlapWarningInModal();
      resetCheckButtonState(true);
    }
  }
  
  /**
   * Reseta o estado do botão de verificação
   */
  function resetCheckButtonState(isError = false) {
    if (!elements.checkOverlapBtn) return;
    
    elements.checkOverlapBtn.classList.remove('checking');
    
    if (isError) {
      elements.checkOverlapBtn.classList.add('has-overlap');
      setTimeout(() => {
        elements.checkOverlapBtn.classList.remove('has-overlap');
        elements.checkOverlapBtn.innerHTML = '<i class="fas fa-magic"></i> Verificar Sobreposição';
      }, 1500);
    } else {
      elements.checkOverlapBtn.innerHTML = '<i class="fas fa-magic"></i> Verificar Sobreposição';
    }
  }
  
  /**
   * Mostra o aviso de sobreposição dentro do modal
   */
  function showOverlapWarningInModal(wanPrefix, lanPrefix, conflictMask, suggestedPrefix) {
    if (!elements.overlapWarning || !elements.suggestedPrefixCode) return;
    
    try {
      const messageParagraph = elements.overlapWarning.querySelector('p');
      if (messageParagraph) {
        messageParagraph.textContent = `O prefixo WAN (${wanPrefix}) está em conflito com o prefixo LAN principal (${lanPrefix}) no bloco /${conflictMask}.`;
      }
      
      if (suggestedPrefix) {
        elements.suggestedPrefixCode.textContent = suggestedPrefix;
        if (elements.applySuggestionBtn) {
          elements.applySuggestionBtn.style.display = 'inline-block';
        }
        const suggestedPrefixDiv = elements.overlapWarning.querySelector('.suggested-prefix');
        if (suggestedPrefixDiv) {
          suggestedPrefixDiv.style.display = 'flex';
        }
      } else {
        elements.suggestedPrefixCode.textContent = '-';
        if (elements.applySuggestionBtn) {
          elements.applySuggestionBtn.style.display = 'none';
        }
      }
      
      // Mostrar aviso
      elements.overlapWarning.style.display = 'flex';
      
      // Marcar botão principal com problema
      if (elements.openBtn) {
        elements.openBtn.classList.add('has-issue');
      }

    } catch (error) {
      console.error("Erro ao mostrar aviso de sobreposição:", error);
    }
  }
  
  /**
   * Oculta o aviso de sobreposição dentro do modal
   */
  function hideOverlapWarningInModal() {
    if (!elements.overlapWarning) return;
    elements.overlapWarning.style.display = 'none';
  }

  /**
   * Aplica o prefixo sugerido ao campo LAN principal
   */
  function applySuggestedPrefixToMainInput() {
    if (!state.suggestedPrefix) return;
    
    const mainLanPrefixInput = document.getElementById('ipv6');
    if (mainLanPrefixInput) {
      mainLanPrefixInput.value = state.suggestedPrefix;
      
      // Disparar evento de change
      const event = new Event('change', { bubbles: true });
      mainLanPrefixInput.dispatchEvent(event);
      
      // Feedback visual
      if (elements.applySuggestionBtn) {
        elements.applySuggestionBtn.style.backgroundColor = '#4caf50';
        elements.applySuggestionBtn.innerHTML = '<i class="fas fa-check"></i> Aplicado!';
        
        setTimeout(() => {
          elements.applySuggestionBtn.style.backgroundColor = '';
          elements.applySuggestionBtn.innerHTML = '<i class="fas fa-check"></i> Aplicar Sugestão';
        }, 1500);
      }
      
      showNotification(`✅ Prefixo ${state.suggestedPrefix} aplicado.`, "success");
      
      // Re-verificar overlap após aplicar
      setTimeout(checkOverlapInModal, 500);
    } else {
      showNotification("Erro: Campo principal não encontrado.", "error");
    }
  }

  /**
   * Valida se um prefixo está no formato CIDR básico
   */
  function isValidPrefix(prefix) {
    if (!prefix || typeof prefix !== 'string') return false;
    return prefix.includes('/') && prefix.split('/').length === 2 && parseInt(prefix.split('/')[1]) > 0;
  }

  /**
   * Mostra uma notificação temporária
   */
  function showNotification(message, type = 'info', duration = 3000) {
    try {
      // Usar sistema existente se disponível
      if (window.UIController && window.UIController.notifications) {
        window.UIController.notifications.show(message, type, duration);
        return;
      }
      
      // Fallback para notificação simples
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      
      const icons = {
        'success': '<i class="fas fa-check-circle"></i>',
        'error': '<i class="fas fa-exclamation-circle"></i>',
        'warning': '<i class="fas fa-exclamation-triangle"></i>',
        'info': '<i class="fas fa-info-circle"></i>'
      };
      
      notification.innerHTML = `${icons[type] || icons.info} <span>${message}</span>`;
      
      // Estilizar
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 16px',
        borderRadius: '6px',
        color: 'white',
        fontSize: '14px',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-20px)',
        opacity: '0',
        transition: 'all 0.3s ease'
      });
      
      // Cores por tipo
      const colors = {
        'success': '#4caf50',
        'error': '#e53935',
        'warning': '#ffa000',
        'info': '#0070d1'
      };
      
      notification.style.backgroundColor = colors[type] || colors.info;
      
      document.body.appendChild(notification);
      
      // Animar entrada
      setTimeout(() => {
        notification.style.transform = 'translateY(0)';
        notification.style.opacity = '1';
        
        // Remover após duração
        setTimeout(() => {
          notification.style.transform = 'translateY(-20px)';
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
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // API Pública
  return {
    openModal,
    closeModal,
    checkOverlap: checkOverlapInModal,
    initialize
  };
})();

// Exportar globalmente
window.NetworkConfigModal = NetworkConfigModal;
