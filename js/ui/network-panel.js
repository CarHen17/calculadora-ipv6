/**
 * Controlador do Modal de Configuração de Rede
 * 
 * Este módulo gerencia o modal para configuração de rede IPv6 (WAN/LAN)
 * e a verificação de sobreposição entre eles e o prefixo principal.
 */

const NetworkConfigModal = (function() {
  'use strict';
  
  // Estado do modal
  let state = {
    isOpen: false,
    hasOverlap: false,
    wanPrefix: '',
    lanPrefix: '', // LAN configurado no modal (para referência)
    suggestedPrefix: '', // Sugestão para o prefixo PRINCIPAL (não o do modal)
    mainLanPrefix: '' // Prefixo LAN principal (do input #ipv6)
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
      
      // Mapear elementos do DOM
      mapDOMElements();

      // Carregar configuração inicial
      loadInitialConfig();
      
      // Configurar listeners de eventos
      setupEventListeners();
      
      // Adicionar estilos para feedback visual
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
      openBtn = document.getElementById('networkConfigBtn'); // Botão no header
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
   * Adiciona estilos para feedback visual ao verificar sobreposição
   */
  function addVisualFeedbackStyles() {
    // Verificar se os estilos já existem
    if (document.getElementById('network-modal-feedback-styles')) {
      return;
    }
    
    // Criar elemento de estilo
    const style = document.createElement('style');
    style.id = 'network-modal-feedback-styles';
    style.textContent = `
      @keyframes pulse-button {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(224, 79, 79, 0.7); }
        100% { transform: scale(1); }
      }
      
      @keyframes pulse-success {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); box-shadow: 0 0 15px rgba(76, 175, 80, 0.7); }
        100% { transform: scale(1); }
      }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
      
      @keyframes slide-in {
        0% { opacity: 0; transform: translateY(-20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
      .has-overlap {
        background-color: #e74c3c !important;
        color: white !important;
        animation: pulse-button 1.5s ease 3;
      }
      
      .no-overlap {
        background-color: #2ecc71 !important;
        color: white !important;
        animation: pulse-success 1.5s ease 2;
      }
      
      .checking {
        background-color: #3498db !important;
        color: white !important;
        position: relative;
      }
      
      .checking::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        animation: shimmer 1.5s infinite;
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .overlap-warning {
        animation: slide-in 0.5s ease forwards;
      }
      
      .warning-shake {
        animation: shake 0.5s ease-in-out;
      }
      
      /* Estilos para notificações */
      .network-notify {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        z-index: 9999;
        transform: translateY(-20px);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
      }
      
      .network-notify.show {
        transform: translateY(0);
        opacity: 1;
      }
      
      .network-notify.success {
        background-color: #2ecc71;
        color: white;
      }
      
      .network-notify.error {
        background-color: #e74c3c;
        color: white;
      }
      
      .network-notify.warning {
        background-color: #f39c12;
        color: white;
      }
      
      .network-notify.info {
        background-color: #3498db;
        color: white;
      }
    `;
    
    // Adicionar ao cabeçalho
    document.head.appendChild(style);
  }
  
  /**
   * Carrega a configuração inicial (valores WAN/LAN)
   */
  function loadInitialConfig() {
    try {
      if (wanInput && lanInput) {
        const savedWanPrefix = localStorage.getItem('networkConfig.wanPrefix');
        const savedLanPrefix = localStorage.getItem('networkConfig.lanPrefix'); // LAN de referência
        
        wanInput.value = savedWanPrefix || '2804:418:3000:1::190/64'; // Padrão WAN
        lanInput.value = savedLanPrefix || '2804:418:3000:5::1/64'; // Padrão LAN referência
        
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
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && state.isOpen) {
          closeModal();
        }
      });
      if (checkOverlapBtn) {
        console.log("Adding click listener to modalResolveConflictBtn"); // Log para depuração
        checkOverlapBtn.addEventListener("click", checkOverlapInModal);
      } else {
        console.error("Button modalResolveConflictBtn not found!"); // Log de erro
      }
      if (applySuggestionBtn) {
        applySuggestionBtn.addEventListener('click', applySuggestedPrefixToMainInput);
      }

      // Atualizar estado ao digitar nos campos do modal
      if (wanInput) {
          wanInput.addEventListener('input', () => { 
              state.wanPrefix = wanInput.value;
              // Esconder o aviso quando o usuário começa a editar
              hideOverlapWarningInModal();
          });
      }
      if (lanInput) {
          lanInput.addEventListener('input', () => { 
              state.lanPrefix = lanInput.value;
              // Esconder o aviso quando o usuário começa a editar
              hideOverlapWarningInModal();
          });
      }

    } catch (error) {
      console.error("Erro ao configurar listeners de eventos do modal:", error);
    }
  }

  /**
   * Abre o modal
   */
  function openModal() {
    if (!modalOverlay) return;
    try {
      // Carrega os valores mais recentes salvos ao abrir
      loadInitialConfig(); 
      // Limpa avisos anteriores ao abrir
      hideOverlapWarningInModal(); 
      
      // Force reflow/repaint para garantir cálculo correto da posição antes da transição
      void modalOverlay.offsetHeight; 

      modalOverlay.classList.add('visible');
      state.isOpen = true;
      // Foco no primeiro campo de input
      if(wanInput) wanInput.focus(); 
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
      modalOverlay.classList.remove('visible');
      state.isOpen = false;
    } catch (error) {
      console.error("Erro ao fechar modal:", error);
    }
  }

  /**
   * Salva a configuração atual (WAN/LAN do modal) no localStorage e fecha
   */
  function saveConfigAndClose() {
      try {
          const currentWan = wanInput ? wanInput.value.trim() : state.wanPrefix;
          const currentLanRef = lanInput ? lanInput.value.trim() : state.lanPrefix;

          // Validar antes de salvar?
          if (!isValidPrefix(currentWan)) {
              showNotification("Prefixo WAN inválido. Não salvo.", "error");
              return;
          }
          // LAN de referência não precisa ser estritamente validado para salvar, mas pode ser útil
          // if (!isValidPrefix(currentLanRef)) {
          //     showNotification("Prefixo LAN de referência inválido.", "warning");
          // }

          localStorage.setItem('networkConfig.wanPrefix', currentWan);
          localStorage.setItem('networkConfig.lanPrefix', currentLanRef); // Salva LAN de referência
          
          state.wanPrefix = currentWan;
          state.lanPrefix = currentLanRef;

          showNotification("Configuração de rede salva!", "success");
          
          // Adicionar feedback visual ao botão
          saveBtn.classList.add('no-overlap');
          setTimeout(() => {
              saveBtn.classList.remove('no-overlap');
          }, 1500);
          
          // Adicionar um pequeno delay antes de fechar para o usuário ver a notificação
          setTimeout(closeModal, 1500); 

          // Remover indicador de problema do botão principal, se houver
          if (openBtn) openBtn.classList.remove('has-issue');

      } catch (error) {
          console.error("Erro ao salvar configuração:", error);
          showNotification("Erro ao salvar configuração.", "error");
      }
  }
  
  /**
   * Verifica sobreposição DENTRO do modal.
   * Compara WAN (do modal) com LAN PRINCIPAL (do input #ipv6).
   */
  function checkOverlapInModal() {
    try {
      // Adicionar classe "checking" ao botão para feedback visual
      if (checkOverlapBtn) {
        checkOverlapBtn.classList.add('checking');
        checkOverlapBtn.innerText = 'Verificando...';
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
      state.mainLanPrefix = mainLanPrefix; // Guarda o LAN principal atual

      // Validar os prefixos
      if (!isValidPrefix(modalWanPrefix)) {
        showNotification("Prefixo WAN no modal é inválido.", "error");
        hideOverlapWarningInModal();
        resetCheckButtonState(true);
        return;
      }
      if (!isValidPrefix(mainLanPrefix)) {
        showNotification("Prefixo LAN principal (fora do modal) está vazio ou é inválido. Preencha-o primeiro.", "warning");
        hideOverlapWarningInModal();
        resetCheckButtonState(true);
        return;
      }
      
      // Pequeno delay para dar tempo do botão mostrar o estado "verificando"
      setTimeout(() => {
        const hasOverlap = IPv6Utils.checkIPv6Overlap(modalWanPrefix, mainLanPrefix);
        state.hasOverlap = hasOverlap;
        
        if (hasOverlap) {
          const wanMask = parseInt(modalWanPrefix.split('/')[1]);
          const lanMask = parseInt(mainLanPrefix.split('/')[1]);
          const conflictMask = Math.min(wanMask, lanMask);
          
          // Gerar sugestão para o prefixo LAN PRINCIPAL
          state.suggestedPrefix = '';
          if (typeof IPv6Utils.suggestNonOverlappingPrefix === 'function') {
            state.suggestedPrefix = IPv6Utils.suggestNonOverlappingPrefix(
              mainLanPrefix, // O que queremos corrigir
              modalWanPrefix, // O conflito
              lanMask // A máscara do que queremos corrigir
            );
          }
          showOverlapWarningInModal(modalWanPrefix, mainLanPrefix, conflictMask, state.suggestedPrefix);
          showNotification("⚠️ Sobreposição detectada entre WAN e LAN principal!", "warning");
          
          // Adicionar classe para feedback visual de erro
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
          
          // Adicionar classe para feedback visual de sucesso
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
   * Mostra o aviso de sobreposição DENTRO do modal
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
        if(applySuggestionBtn) applySuggestionBtn.style.display = 'inline-block';
        const suggestedPrefixDiv = overlapWarningSection.querySelector('.suggested-prefix');
        if (suggestedPrefixDiv) {
          suggestedPrefixDiv.style.display = 'flex';
        }
      } else {
        suggestedPrefixCode.textContent = '-';
        if(applySuggestionBtn) applySuggestionBtn.style.display = 'none';
        const suggestedPrefixDiv = overlapWarningSection.querySelector('.suggested-prefix');
        if (suggestedPrefixDiv) {
          suggestedPrefixDiv.style.display = 'none';
        }
      }
      
      // Remover a classe de animação para reaplica-la
      overlapWarningSection.classList.remove('slide-in');
      overlapWarningSection.classList.add('warning-shake');
      
      // Aplicar a animação de entrada
      overlapWarningSection.style.display = 'flex';
      
      // Resetar a animação para permitir animações subsequentes
      setTimeout(() => {
        overlapWarningSection.classList.remove('warning-shake');
      }, 500);

      // Adiciona classe de problema ao botão principal do header
      if (openBtn) openBtn.classList.add('has-issue');

    } catch (error) {
      console.error("Erro ao mostrar aviso de sobreposição no modal:", error);
    }
  }
  
  /**
   * Oculta o aviso de sobreposição DENTRO do modal
   */
  function hideOverlapWarningInModal() {
    if (!overlapWarningSection) return;
    overlapWarningSection.style.display = 'none';
    // Remove classe de problema do botão principal SE não houver mais overlap
    // (Idealmente, revalidar antes de remover)
    // if (openBtn && !state.hasOverlap) openBtn.classList.remove('has-issue');
  }

  /**
   * Aplica o prefixo sugerido ao campo LAN PRINCIPAL (#ipv6)
   */
  function applySuggestedPrefixToMainInput() {
      if (!state.suggestedPrefix) return;
      const mainLanPrefixInput = document.getElementById('ipv6');
      if (mainLanPrefixInput) {
          mainLanPrefixInput.value = state.suggestedPrefix;
          // Disparar evento de change para que outras partes da UI reajam
          const event = new Event('change', { bubbles: true });
          mainLanPrefixInput.dispatchEvent(event);
          
          // Adicionar classe de sucesso ao botão
          applySuggestionBtn.classList.add('no-overlap');
          setTimeout(() => {
            applySuggestionBtn.classList.remove('no-overlap');
          }, 1500);
          
          showNotification(`✅ Prefixo ${state.suggestedPrefix} aplicado ao campo principal.`, "success");
          // Re-verificar overlap no modal após aplicar
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
    // Verificação simples - pode ser melhorada com IPv6Utils.validateIPv6 se disponível
    return prefix.includes('/') && prefix.split('/').length === 2 && parseInt(prefix.split('/')[1]) > 0;
  }

  /**
   * Mostra uma notificação temporária usando elemento DOM personalizado
   */
  function showNotification(message, type = 'info', duration = 3000) {
      try {
          // Remover notificações anteriores
          const oldNotifications = document.querySelectorAll('.network-notify');
          oldNotifications.forEach(el => {
              if (el.parentNode) {
                  el.parentNode.removeChild(el);
              }
          });
          
          // Criar elemento de notificação
          const notification = document.createElement('div');
          notification.className = `network-notify ${type}`;
          
          // Ícone baseado no tipo
          let icon = '';
          switch(type) {
              case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
              case 'error': icon = '<i class="fas fa-exclamation-circle"></i>'; break;
              case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
              default: icon = '<i class="fas fa-info-circle"></i>';
          }
          
          notification.innerHTML = `${icon} <span>${message}</span>`;
          document.body.appendChild(notification);
          
          // Animar a entrada
          setTimeout(() => {
              notification.classList.add('show');
          }, 10);
          
          // Remover após a duração
          setTimeout(() => {
              notification.classList.remove('show');
              setTimeout(() => {
                  if (notification.parentNode) {
                      notification.parentNode.removeChild(notification);
                  }
              }, 300);
          }, duration);
      } catch (error) {
          console.error("Erro ao mostrar notificação:", error);
          // Fallback: Log no console
          console.log(`[${type.toUpperCase()}] ${message}`);
      }
  }

  // Inicializar o modal quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // API Pública do Módulo
  return {
    openModal: openModal,
    closeModal: closeModal,
    // Expor outras funções se necessário
    checkOverlap: checkOverlapInModal // Para ser chamado externamente se preciso
  };
})();

// Exportar globalmente (opcional)
window.NetworkConfigModal = NetworkConfigModal;