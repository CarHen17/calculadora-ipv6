/**
 * Controlador do Modal de Configuração de Rede - Versão Corrigida
 * 
 * Corrige problemas de centralização na viewport e gerenciamento de scroll
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
    mainLanPrefix: '',
    scrollPosition: 0
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
      console.log("Inicializando modal de configuração de rede...");
      
      mapDOMElements();
      loadInitialConfig();
      setupEventListeners();
      addVisualFeedbackStyles();
      
      console.log("Modal de configuração de rede inicializado.");
    } catch (error) {
      console.error("Erro ao inicializar modal de rede:", error);
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
   * Adiciona estilos para feedback visual
   */
  function addVisualFeedbackStyles() {
    if (document.getElementById('network-modal-feedback-styles')) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = 'network-modal-feedback-styles';
    style.textContent = `
      .has-overlap {
        background-color: #e74c3c !important;
        color: white !important;
      }
      
      .no-overlap {
        background-color: #2ecc71 !important;
        color: white !important;
      }
      
      .checking {
        background-color: #3498db !important;
        color: white !important;
      }
      
      .overlap-warning {
        animation: slideIn 0.3s ease forwards;
      }
      
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .warning-shake {
        animation: shake 0.5s ease-in-out;
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
    `;
    
    document.head.appendChild(style);
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
      console.error("Erro ao carregar configuração inicial do modal:", error);
    }
  }
  
  /**
   * Configura os listeners de eventos para o modal
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
      
      if (checkOverlapBtn) {
        checkOverlapBtn.addEventListener("click", checkOverlapInModal);
      }
      
      if (applySuggestionBtn) {
        applySuggestionBtn.addEventListener('click', applySuggestedPrefixToMainInput);
      }

      // Atualizar estado ao digitar nos campos do modal
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
      console.error("Erro ao configurar listeners de eventos do modal:", error);
    }
  }

  /**
   * Salva a posição atual do scroll e previne scroll do body
   */
  function preventBodyScroll() {
    // Salvar posição atual do scroll
    state.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Aplicar estilos para prevenir scroll
    document.body.style.top = `-${state.scrollPosition}px`;
    document.body.classList.add('modal-open');
  }
  
  /**
   * Restaura o scroll do body
   */
  function restoreBodyScroll() {
    // Remover estilos que previnem scroll
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    
    // Restaurar posição do scroll
    window.scrollTo(0, state.scrollPosition);
  }

  /**
   * Abre o modal
   */
  function openModal() {
    if (!modalOverlay) return;
    
    try {
      // Prevenir scroll do body e salvar posição
      preventBodyScroll();
      
      // Carrega os valores mais recentes salvos
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
      }, 100);
      
    } catch (error) {
      console.error("Erro ao abrir modal:", error);
      restoreBodyScroll(); // Restaurar em caso de erro
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
      
      // Restaurar scroll do body após animação
      setTimeout(() => {
        restoreBodyScroll();
      }, 300);
      
    } catch (error) {
      console.error("Erro ao fechar modal:", error);
      restoreBodyScroll(); // Garantir restauração em caso de erro
    }
  }

  /**
   * Salva a configuração atual e fecha o modal
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
        console.error("Função IPv6Utils.checkIPv6Overlap não disponível.");
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
        showNotification("Prefixo LAN principal (campo IPv6) está vazio ou é inválido. Preencha-o primeiro.", "warning");
        hideOverlapWarningInModal();
        resetCheckButtonState(true);
        return;
      }
      
      // Delay para mostrar o estado de verificação
      setTimeout(() => {
        const hasOverlap = IPv6Utils.checkIPv6Overlap(modalWanPrefix, mainLanPrefix);
        state.hasOverlap = hasOverlap;
        
        if (hasOverlap) {
          const wanMask = parseInt(modalWanPrefix.split('/')[1]);
          const lanMask = parseInt(mainLanPrefix.split('/')[1]);
          const conflictMask = Math.min(wanMask, lanMask);
          
          // Gerar sugestão para o prefixo LAN principal
          state.suggestedPrefix = '';
          if (typeof IPv6Utils.suggestNonOverlappingPrefix === 'function') {
            state.suggestedPrefix = IPv6Utils.suggestNonOverlappingPrefix(
              mainLanPrefix,
              modalWanPrefix,
              lanMask
            );
          }
          
          showOverlapWarningInModal(modalWanPrefix, mainLanPrefix, conflictMask, state.suggestedPrefix);
          showNotification("⚠️ Sobreposição detectada entre WAN e LAN principal!", "warning");
          
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
          showNotification("✅ Não há sobreposição entre WAN e LAN principal.", "success");
          
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
      console.error("Erro ao verificar sobreposição no modal:", error);
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
        const suggestedPrefixDiv = overlapWarningSection.querySelector('.suggested-prefix');
        if (suggestedPrefixDiv) {
          suggestedPrefixDiv.style.display = 'none';
        }
      }
      
      // Animação
      overlapWarningSection.classList.remove('slide-in');
      overlapWarningSection.classList.add('warning-shake');
      overlapWarningSection.style.display = 'flex';
      
      setTimeout(() => {
        overlapWarningSection.classList.remove('warning-shake');
      }, 500);

      // Marcar botão principal com problema
      if (openBtn) {
        openBtn.classList.add('has-issue');
      }

    } catch (error) {
      console.error("Erro ao mostrar aviso de sobreposição no modal:", error);
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
