/**
 * Interações de Modal para Calculadora IPv6
 * 
 * Este módulo gerencia todas as interações relacionadas a modais,
 * incluindo abertura, fechamento e transições.
 */

(function() {
  'use strict';

  /**
   * Estrutura para acompanhar o estado dos modais
   */
  const modalState = {
    networkConfig: {
      isOpen: false,
      hasChanges: false
    }
  };

  /**
   * Inicializa os listeners para os modais
   */
  function initialize() {
    try {
      console.log("Inicializando interações de modal...");

      // Configurar o modal de configuração de rede
      setupNetworkConfigModal();

      console.log("Interações de modal inicializadas");
    } catch (error) {
      console.error("Erro ao inicializar interações de modal:", error);
    }
  }

  /**
   * Configura o modal de configuração de rede
   */
  function setupNetworkConfigModal() {
    // Mapear elementos
    const modalOverlay = document.getElementById('networkConfigModalOverlay');
    const modalElement = document.getElementById('networkConfigModal');
    const openBtn = document.getElementById('networkConfigBtn');
    const closeBtn = document.getElementById('closeNetworkConfigModalBtn');
    const cancelBtn = document.getElementById('cancelNetworkConfigBtn');
    const saveBtn = document.getElementById('saveNetworkConfigBtn');

    // Verificar se os elementos existem
    if (!modalOverlay || !modalElement) {
      console.warn("Elementos do modal de configuração de rede não encontrados");
      return;
    }

    // Adicionar listeners
    if (openBtn) {
      openBtn.addEventListener('click', () => openNetworkConfigModal());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeNetworkConfigModal());
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => closeNetworkConfigModal());
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        saveNetworkConfig();
        closeNetworkConfigModal();
      });
    }

    // Fechar o modal ao clicar no overlay
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
          closeNetworkConfigModal();
        }
      });
    }

    // Fechar o modal com a tecla Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modalState.networkConfig.isOpen) {
        closeNetworkConfigModal();
      }
    });

    // Detectar alterações nos campos
    const modalWanPrefix = document.getElementById('modalWanPrefix');
    const modalLanPrefix = document.getElementById('modalLanPrefix');

    if (modalWanPrefix) {
      modalWanPrefix.addEventListener('input', () => {
        modalState.networkConfig.hasChanges = true;
      });
    }

    if (modalLanPrefix) {
      modalLanPrefix.addEventListener('input', () => {
        modalState.networkConfig.hasChanges = true;
      });
    }
  }

  /**
   * Abre o modal de configuração de rede
   */
  function openNetworkConfigModal() {
    const modalOverlay = document.getElementById('networkConfigModalOverlay');
    if (!modalOverlay) return;

    // Carregar valores atuais
    loadNetworkConfig();

    // Resetar estados
    modalState.networkConfig.hasChanges = false;
    
    // Esconder aviso de sobreposição
    const overlapWarning = document.getElementById('modalOverlapWarning');
    if (overlapWarning) {
      overlapWarning.style.display = 'none';
    }

    // Mostrar o modal com animação
    modalOverlay.style.display = 'flex';
    setTimeout(() => {
      modalOverlay.classList.add('visible');
    }, 10);

    // Atualizar estado
    modalState.networkConfig.isOpen = true;
  }

  /**
   * Fecha o modal de configuração de rede
   */
  function closeNetworkConfigModal() {
    const modalOverlay = document.getElementById('networkConfigModalOverlay');
    if (!modalOverlay) return;

    // Verificar se há alterações não salvas
    if (modalState.networkConfig.hasChanges) {
      const confirmClose = confirm("As alterações não foram salvas. Deseja realmente fechar?");
      if (!confirmClose) return;
    }

    // Fechar o modal com animação
    modalOverlay.classList.remove('visible');
    setTimeout(() => {
      modalOverlay.style.display = 'none';
    }, 300);

    // Atualizar estado
    modalState.networkConfig.isOpen = false;
  }

  /**
   * Carrega a configuração atual para o modal
   */
  function loadNetworkConfig() {
    const modalWanPrefix = document.getElementById('modalWanPrefix');
    const modalLanPrefix = document.getElementById('modalLanPrefix');

    if (modalWanPrefix) {
      modalWanPrefix.value = localStorage.getItem('networkConfig.wanPrefix') || '2804:418:3000:1::190/64';
    }

    if (modalLanPrefix) {
      modalLanPrefix.value = localStorage.getItem('networkConfig.lanPrefix') || '2804:418:3000:5::1/64';
    }
  }

  /**
   * Salva a configuração do modal
   */
  function saveNetworkConfig() {
    try {
      const modalWanPrefix = document.getElementById('modalWanPrefix');
      const modalLanPrefix = document.getElementById('modalLanPrefix');

      if (modalWanPrefix && modalWanPrefix.value) {
        localStorage.setItem('networkConfig.wanPrefix', modalWanPrefix.value.trim());
      }

      if (modalLanPrefix && modalLanPrefix.value) {
        localStorage.setItem('networkConfig.lanPrefix', modalLanPrefix.value.trim());
      }

      // Mostrar notificação
      showSaveNotification();

      // Resetar estado de alterações
      modalState.networkConfig.hasChanges = false;

      // Verificar sobreposição com novo valor de WAN
      triggerOverlapCheck();

      return true;
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      return false;
    }
  }

  /**
   * Mostra uma notificação após salvar
   */
  function showSaveNotification() {
    try {
      // Usar UIComponents.toast se disponível
      if (typeof UIComponents !== 'undefined' && typeof UIComponents.toast === 'function') {
        UIComponents.toast("Configuração de rede salva com sucesso!", "success", 3000);
        return;
      }

      // Fallback: notificação simples
      const notification = document.createElement('div');
      notification.textContent = "✓ Configuração de rede salva com sucesso!";
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.padding = '12px 20px';
      notification.style.background = '#4caf50';
      notification.style.color = 'white';
      notification.style.borderRadius = '4px';
      notification.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
      notification.style.zIndex = '10000';

      document.body.appendChild(notification);

      // Remover após alguns segundos
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 3000);
    } catch (error) {
      console.error("Erro ao mostrar notificação:", error);
    }
  }

  /**
   * Dispara uma verificação de sobreposição
   */
  function triggerOverlapCheck() {
    try {
      // Verificar se temos o campo IPv6 principal preenchido
      const ipv6Input = document.getElementById('ipv6');
      if (!ipv6Input || !ipv6Input.value) return;

      // Verificar usando OverlapChecker ou NetworkConfigModal
      if (typeof OverlapChecker !== 'undefined' && typeof OverlapChecker.checkPrefixOverlap === 'function') {
        setTimeout(() => OverlapChecker.checkPrefixOverlap(), 100);
      } else if (typeof NetworkConfigModal !== 'undefined' && typeof NetworkConfigModal.checkOverlap === 'function') {
        setTimeout(() => NetworkConfigModal.checkOverlap(), 100);
      }
    } catch (error) {
      console.error("Erro ao verificar sobreposição após salvar:", error);
    }
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();