/**
 * Posicionamento Dinâmico para Modal de Rede
 * 
 * Esta correção faz o modal aparecer centralizado em relação à posição atual
 * do usuário na tela, não em uma posição fixa na página.
 */

// Arquivo: js/ui/network-panel-fixed.js

const NetworkConfigModalFixed = (function() {
  'use strict';
  
  // Estado do modal
  let state = {
    isOpen: false,
    hasOverlap: false,
    wanPrefix: '',
    lanPrefix: '',
    suggestedPrefix: '',
    mainLanPrefix: '',
    originalScrollPosition: 0,
    viewportHeight: 0,
    modalHeight: 0
  };

  // Elementos do DOM
  let modalOverlay = null;
  let modalElement = null;
  let openBtn = null;
  let closeBtn = null;
  let cancelBtn = null;
  let saveBtn = null;
  let wanInput = null;
  let lanInput = null;
  let checkOverlapBtn = null;
  let overlapWarningSection = null;
  let suggestedPrefixCode = null;
  let applySuggestionBtn = null;

  /**
   * Inicializa o modal de configuração de rede
   */
  function initialize() {
    try {
      console.log("Inicializando modal com posicionamento dinâmico...");
      
      mapDOMElements();
      loadInitialConfig();
      setupEventListeners();
      addDynamicPositioningStyles();
      
      console.log("Modal com posicionamento dinâmico inicializado.");
    } catch (error) {
      console.error("Erro ao inicializar modal dinâmico:", error);
    }
  }

  /**
   * Mapeia os elementos do DOM necessários
   */
  function mapDOMElements() {
    modalOverlay = document.getElementById('networkConfigModalOverlay');
    modalElement = document.getElementById('networkConfigModal');
    openBtn = document.getElementById('networkConfigBtn');
    closeBtn = document.getElementById('closeNetworkConfigModalBtn');
    cancelBtn = document.getElementById('cancelNetworkConfigBtn');
    saveBtn = document.getElementById('saveNetworkConfigBtn');
    wanInput = document.getElementById('modalWanPrefix');
    lanInput = document.getElementById('modalLanPrefix');
    checkOverlapBtn = document.getElementById('modalResolveConflictBtn');
    overlapWarningSection = document.getElementById('modalOverlapWarning');
    suggestedPrefixCode = document.getElementById('modalSuggestedPrefix');
    applySuggestionBtn = document.getElementById('modalApplyPrefixBtn');
  }
  
  /**
   * Adiciona estilos para posicionamento dinâmico
   */
  function addDynamicPositioningStyles() {
    const styleId = 'dynamic-modal-positioning';
    
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Posicionamento dinâmico do modal */
      .modal-overlay.dynamic-position {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.6);
        z-index: 1050;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0s linear 0.3s;
      }

      .modal-overlay.dynamic-position.visible {
        opacity: 1;
        visibility: visible;
        transition: opacity 0.3s ease;
      }

      .modal.dynamic-position {
        background-color: var(--bg-light);
        border-radius: var(--border-radius-lg);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        width: 90%;
        max-width: 600px;
        max-height: min(90vh, 800px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0.95) translateY(0);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
        margin: 0;
        position: relative;
      }

      .modal-overlay.dynamic-position.visible .modal.dynamic-position {
        transform: scale(1) translateY(0);
        opacity: 1;
      }

      /* Modo escuro */
      body.dark-mode .modal.dynamic-position {
        background-color: var(--bg-dark);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      }

      /* Responsividade específica para o modal dinâmico */
      @media (max-width: 768px) {
        .modal.dynamic-position {
          width: 95%;
          max-width: none;
          max-height: min(95vh, 700px);
        }
      }

      /* Posicionamento customizado baseado no scroll */
      .modal-overlay.custom-position {
        align-items: flex-start;
        justify-content: center;
        padding-top: var(--dynamic-modal-top, 10vh);
        padding-bottom: 10vh;
        box-sizing: border-box;
      }

      /* Animação suave para reposicionamento */
      .modal.repositioning {
        transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Calcula a melhor posição para o modal baseada no scroll atual
   */
  function calculateOptimalPosition() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    // Altura estimada do modal (será ajustada dinamicamente)
    const modalHeight = Math.min(600, viewportHeight * 0.8);
    
    // Calcular posição ideal
    let topPosition;
    
    // Se o modal caber inteiramente na viewport atual
    if (modalHeight <= viewportHeight * 0.9) {
      // Centralizar na viewport visível
      topPosition = (viewportHeight - modalHeight) / 2;
    } else {
      // Modal muito alto - posicionar no topo da viewport com margem
      topPosition = viewportHeight * 0.05;
    }
    
    // Garantir que não ultrapasse os limites
    topPosition = Math.max(20, Math.min(topPosition, viewportHeight - modalHeight - 20));
    
    return {
      top: topPosition,
      scrollTop: scrollTop,
      viewportHeight: viewportHeight,
      modalHeight: modalHeight
    };
  }
  
  /**
   * Aplica posicionamento dinâmico ao modal
   */
  function applyDynamicPositioning() {
    if (!modalOverlay || !modalElement) return;
    
    const position = calculateOptimalPosition();
    
    // Aplicar classes para posicionamento dinâmico
    modalOverlay.classList.add('dynamic-position', 'custom-position');
    modalElement.classList.add('dynamic-position');
    
    // Definir posição customizada via CSS custom property
    document.documentElement.style.setProperty('--dynamic-modal-top', `${position.top}px`);
    
    // Armazenar informações no estado
    state.originalScrollPosition = position.scrollTop;
    state.viewportHeight = position.viewportHeight;
    state.modalHeight = position.modalHeight;
    
    console.log(`Modal posicionado em: ${position.top}px do topo da viewport`);
  }
  
  /**
   * Remove posicionamento dinâmico
   */
  function removeDynamicPositioning() {
    if (!modalOverlay || !modalElement) return;
    
    modalOverlay.classList.remove('dynamic-position', 'custom-position');
    modalElement.classList.remove('dynamic-position', 'repositioning');
    
    // Remover propriedade CSS customizada
    document.documentElement.style.removeProperty('--dynamic-modal-top');
  }
  
  /**
   * Reposiciona o modal se a janela for redimensionada
   */
  function handleWindowResize() {
    if (!state.isOpen) return;
    
    // Adicionar classe de transição suave
    modalElement.classList.add('repositioning');
    
    // Recalcular e aplicar nova posição
    setTimeout(() => {
      applyDynamicPositioning();
      
      // Remover classe de transição após um tempo
      setTimeout(() => {
        modalElement.classList.remove('repositioning');
      }, 400);
    }, 50);
  }
  
  /**
   * Carrega a configuração inicial (valores WAN/LAN)
   */
  function loadInitialConfig() {
    try {
      if (wanInput && lanInput) {
        const savedWanPrefix = localStorage.getItem('networkConfig.wanPrefix');
        const savedLanPrefix = localStorage.getItem('networkConfig.lanPrefix');
        
        wanInput.value = savedWanPrefix || '2804:418:3000:1::190/64';
        lanInput.value = savedLanPrefix || '2804:418:3000:5::1/64';
        
        state.wanPrefix = wanInput.value;
        state.lanPrefix = lanInput.value;
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
      if (openBtn) {
        openBtn.addEventListener('click', openModal);
      }
      if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
      }
      if (saveBtn) {
        saveBtn.addEventListener('click', saveConfigAndClose);
      }
      if (modalOverlay) {
        modalOverlay.addEventListener('click', function(event) {
          if (event.target === modalOverlay) {
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
      
      // Redimensionamento da janela
      window.addEventListener('resize', debounce(handleWindowResize, 200));
      
      if (checkOverlapBtn) {
        checkOverlapBtn.addEventListener("click", checkOverlapInModal);
      }
      
      if (applySuggestionBtn) {
        applySuggestionBtn.addEventListener('click', applySuggestedPrefixToMainInput);
      }

      // Atualizar estado ao digitar nos campos
      if (wanInput) {
        wanInput.addEventListener('input', () => { 
          state.wanPrefix = wanInput.value;
          hideOverlapWarningInModal();
        });
      }
      
      if (lanInput) {
        lanInput.addEventListener('input', () => { 
          state.lanPrefix = lanInput.value;
          hideOverlapWarningInModal();
        });
      }

    } catch (error) {
      console.error("Erro ao configurar listeners:", error);
    }
  }

  /**
   * Abre o modal com posicionamento dinâmico
   */
  function openModal() {
    if (!modalOverlay) return;
    
    try {
      // Aplicar posicionamento dinâmico ANTES de mostrar
      applyDynamicPositioning();
      
      // Carrega os valores mais recentes
      loadInitialConfig();
      
      // Limpa avisos anteriores
      hideOverlapWarningInModal();
      
      // Definir atributos de acessibilidade
      modalOverlay.setAttribute('aria-hidden', 'false');
      modalElement.setAttribute('aria-modal', 'true');
      
      // Mostrar modal
      modalOverlay.classList.add('visible');
      state.isOpen = true;
      
      // Focar no primeiro campo após animação
      setTimeout(() => {
        if (wanInput) {
          wanInput.focus();
        }
      }, 150);
      
      console.log("Modal aberto com posicionamento dinâmico");
      
    } catch (error) {
      console.error("Erro ao abrir modal:", error);
    }
  }
  
  /**
   * Fecha o modal
   */
  function closeModal() {
    if (!modalOverlay) return;
    
    try {
      // Definir atributos de acessibilidade
      modalOverlay.setAttribute('aria-hidden', 'true');
      modalElement.setAttribute('aria-modal', 'false');
      
      // Ocultar modal
      modalOverlay.classList.remove('visible');
      state.isOpen = false;
      
      // Remover posicionamento dinâmico após animação
      setTimeout(() => {
        removeDynamicPositioning();
      }, 300);
      
    } catch (error) {
      console.error("Erro ao fechar modal:", error);
    }
  }

  /**
   * Salva a configuração e fecha o modal
   */
  function saveConfigAndClose() {
    try {
      const currentWan = wanInput ? wanInput.value.trim() : state.wanPrefix;
      const currentLanRef = lanInput ? lanInput.value.trim() : state.lanPrefix;

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
      if (saveBtn) {
        saveBtn.classList.add('no-overlap');
        setTimeout(() => {
          saveBtn.classList.remove('no-overlap');
        }, 1500);
      }
      
      // Fechar modal após delay
      setTimeout(closeModal, 1500);

      // Remover indicador de problema do botão principal
      if (openBtn) {
        openBtn.classList.remove('has-issue');
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
      // Feedback visual no botão
      if (checkOverlapBtn) {
        checkOverlapBtn.classList.add('checking');
        checkOverlapBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
      }
      
      if (typeof IPv6Utils === 'undefined' || typeof IPv6Utils.checkIPv6Overlap !== 'function') {
        console.error("IPv6Utils.checkIPv6Overlap não disponível.");
        showNotification("Erro: Utilitário de cálculo indisponível.", "error");
        resetCheckButtonState();
        return;
      }
      
      const modalWanPrefix = wanInput ? wanInput.value.trim() : state.wanPrefix;
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
          if (checkOverlapBtn) {
            checkOverlapBtn.classList.remove('checking');
            checkOverlapBtn.classList.add('has-overlap');
            checkOverlapBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Sobreposição Detectada';
            
            setTimeout(() => {
              checkOverlapBtn.classList.remove('has-overlap');
              checkOverlapBtn.innerHTML = '<i class="fas fa-magic"></i> Verificar Sobreposição';
            }, 3000);
          }
        } else {
          hideOverlapWarningInModal();
          showNotification("✅ Prefixos compatíveis.", "success");
          
          // Feedback visual de sucesso
          if (checkOverlapBtn) {
            checkOverlapBtn.classList.remove('checking');
            checkOverlapBtn.classList.add('no-overlap');
            checkOverlapBtn.innerHTML = '<i class="fas fa-check"></i> Prefixos Compatíveis';
            
            setTimeout(() => {
              checkOverlapBtn.classList.remove('no-overlap');
              checkOverlapBtn.innerHTML = '<i class="fas fa-magic"></i> Verificar Sobreposição';
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
    if (!checkOverlapBtn) return;
    
    checkOverlapBtn.classList.remove('checking');
    
    if (isError) {
      checkOverlapBtn.classList.add('has-overlap');
      setTimeout(() => {
        checkOverlapBtn.classList.remove('has-overlap');
        checkOverlapBtn.innerHTML = '<i class="fas fa-magic"></i> Verificar Sobreposição';
      }, 1500);
    } else {
      checkOverlapBtn.innerHTML = '<i class="fas fa-magic"></i> Verificar Sobreposição';
    }
  }
  
  /**
   * Mostra o aviso de sobreposição dentro do modal
   */
  function showOverlapWarningInModal(wanPrefix, lanPrefix, conflictMask, suggestedPrefix) {
    if (!overlapWarningSection || !suggestedPrefixCode) return;
    
    try {
      const messageParagraph = overlapWarningSection.querySelector('p');
      if (messageParagraph) {
        messageParagraph.textContent = `O prefixo WAN (${wanPrefix}) está em conflito com o prefixo LAN principal (${lanPrefix}) no bloco /${conflictMask}.`;
      }
      
      if (suggestedPrefix) {
        suggestedPrefixCode.textContent = suggestedPrefix;
        if (applySuggestionBtn) {
          applySuggestionBtn.style.display = 'inline-block';
        }
        const suggestedPrefixDiv = overlapWarningSection.querySelector('.suggested-prefix');
        if (suggestedPrefixDiv) {
          suggestedPrefixDiv.style.display = 'flex';
        }
      } else {
        suggestedPrefixCode.textContent = '-';
        if (applySuggestionBtn) {
          applySuggestionBtn.style.display = 'none';
        }
      }
      
      // Animação
      overlapWarningSection.style.display = 'flex';
      
      // Marcar botão principal com problema
      if (openBtn) {
        openBtn.classList.add('has-issue');
      }

    } catch (error) {
      console.error("Erro ao mostrar aviso de sobreposição:", error);
    }
  }
  
  /**
   * Oculta o aviso de sobreposição dentro do modal
   */
  function hideOverlapWarningInModal() {
    if (!overlapWarningSection) return;
    overlapWarningSection.style.display = 'none';
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
      if (applySuggestionBtn) {
        applySuggestionBtn.classList.add('no-overlap');
        setTimeout(() => {
          applySuggestionBtn.classList.remove('no-overlap');
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
  
  /**
   * Utilitário para debounce
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
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
    calculateOptimalPosition,
    handleWindowResize
  };
})();

// Sobrescrever o módulo original
window.NetworkConfigModal = NetworkConfigModalFixed;
