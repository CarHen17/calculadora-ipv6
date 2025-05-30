/**
 * Integração do Modal Dinâmico
 * 
 * Este script aplica as correções necessárias e integra o novo sistema
 * de posicionamento dinâmico com o projeto existente.
 */

(function() {
  'use strict';

  /**
   * Aplica os estilos CSS necessários para o modal dinâmico
   */
  function applyDynamicModalStyles() {
    const styleId = 'dynamic-modal-positioning-fix';
    
    // Verificar se já foi aplicado
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Correções críticas para o modal dinâmico */
      .modal-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(0, 0, 0, 0.6) !important;
        z-index: 1050 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        opacity: 0 !important;
        visibility: hidden !important;
        transition: opacity 0.3s ease, visibility 0s linear 0.3s !important;
      }

      .modal-overlay.visible {
        opacity: 1 !important;
        visibility: visible !important;
        transition: opacity 0.3s ease !important;
      }

      /* Posicionamento dinâmico */
      .modal-overlay.dynamic-position {
        align-items: flex-start !important;
        justify-content: center !important;
        padding-top: var(--dynamic-modal-top, 20vh) !important;
        padding-bottom: 10vh !important;
        padding-left: 20px !important;
        padding-right: 20px !important;
        box-sizing: border-box !important;
        overflow-y: auto !important;
      }

      .modal.dynamic-position {
        background-color: var(--bg-light) !important;
        border-radius: var(--border-radius-lg) !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
        width: 90% !important;
        max-width: 600px !important;
        max-height: min(80vh, 700px) !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
        transform: scale(0.95) translateY(-20px) !important;
        opacity: 0 !important;
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.3s ease !important;
        margin: 0 !important;
        position: relative !important;
      }

      .modal-overlay.visible .modal.dynamic-position {
        transform: scale(1) translateY(0) !important;
        opacity: 1 !important;
      }

      /* Responsividade mobile */
      @media (max-width: 768px) {
        .modal-overlay.dynamic-position {
          padding-top: var(--dynamic-modal-top, 5vh) !important;
          padding-bottom: 5vh !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
        }
        
        .modal.dynamic-position {
          width: 95% !important;
          max-width: none !important;
          max-height: min(90vh, 600px) !important;
        }
      }

      /* Modo escuro */
      body.dark-mode .modal.dynamic-position {
        background-color: var(--bg-dark) !important;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
      }

      /* Animação de reposicionamento */
      .modal.repositioning {
        transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
      }
    `;
    
    document.head.appendChild(style);
    console.log("Estilos do modal dinâmico aplicados");
  }

  /**
   * Substitui o NetworkConfigModal existente pelo novo
   */
  function integrateNewModal() {
    // Verificar se o novo modal foi carregado
    if (typeof NetworkConfigModalFixed === 'undefined') {
      console.warn("NetworkConfigModalFixed não foi carregado ainda");
      return false;
    }

    // Substituir o módulo original
    window.NetworkConfigModal = NetworkConfigModalFixed;
    
    console.log("Modal dinâmico integrado com sucesso");
    return true;
  }

  /**
   * Configura eventos adicionais para melhor experiência
   */
  function setupAdditionalEvents() {
    // Monitorar mudanças de orientação em dispositivos móveis
    window.addEventListener('orientationchange', function() {
      setTimeout(() => {
        if (window.NetworkConfigModal && typeof window.NetworkConfigModal.handleWindowResize === 'function') {
          window.NetworkConfigModal.handleWindowResize();
        }
      }, 100);
    });

    // Melhorar comportamento em dispositivos touch
    let touchStartY = 0;
    document.addEventListener('touchstart', function(e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
      const modalOverlay = document.querySelector('.modal-overlay.visible');
      if (modalOverlay && modalOverlay.classList.contains('dynamic-position')) {
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - touchStartY;
        
        // Se o usuário está tentando fechar arrastando para baixo
        if (deltaY > 50 && e.target === modalOverlay) {
          e.preventDefault();
        }
      }
    }, { passive: false });

    console.log("Eventos adicionais configurados");
  }

  /**
   * Testa se o modal funciona corretamente
   */
  function testModalFunctionality() {
    const openBtn = document.getElementById('networkConfigBtn');
    if (!openBtn) {
      console.warn("Botão de abrir modal não encontrado");
      return false;
    }

    const modalOverlay = document.getElementById('networkConfigModalOverlay');
    if (!modalOverlay) {
      console.warn("Overlay do modal não encontrado");
      return false;
    }

    const modal = document.getElementById('networkConfigModal');
    if (!modal) {
      console.warn("Elemento modal não encontrado");
      return false;
    }

    console.log("✅ Elementos do modal encontrados e funcionais");
    return true;
  }

  /**
   * Adiciona indicador visual da posição atual (debug)
   */
  function addPositionIndicator() {
    // Só em ambiente de desenvolvimento
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return;
    }

    const indicator = document.createElement('div');
    indicator.id = 'modal-position-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 112, 209, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10000;
      display: none;
    `;
    
    document.body.appendChild(indicator);

    // Atualizar indicador durante scroll
    window.addEventListener('scroll', function() {
      const scrollPercent = Math.round((window.pageYOffset / (document.body.scrollHeight - window.innerHeight)) * 100);
      indicator.textContent = `Scroll: ${scrollPercent}% | Modal: ${window.pageYOffset}px`;
    });

    // Mostrar indicador quando modal estiver aberto
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.target.classList && mutation.target.classList.contains('modal-overlay')) {
          const isVisible = mutation.target.classList.contains('visible');
          indicator.style.display = isVisible ? 'block' : 'none';
        }
      });
    });

    const modalOverlay = document.getElementById('networkConfigModalOverlay');
    if (modalOverlay) {
      observer.observe(modalOverlay, { attributes: true });
    }
  }

  /**
   * Função principal de inicialização
   */
  function initialize() {
    console.log("🔧 Inicializando integração do modal dinâmico...");

    try {
      // Aplicar estilos
      applyDynamicModalStyles();

      // Aguardar um pouco para garantir que outros scripts carregaram
      setTimeout(() => {
        // Integrar novo modal
        const integrated = integrateNewModal();
        
        if (integrated) {
          // Configurar eventos adicionais
          setupAdditionalEvents();
          
          // Testar funcionalidade
          const working = testModalFunctionality();
          
          if (working) {
            console.log("✅ Modal dinâmico integrado e funcionando");
            
            // Adicionar indicador de posição (só em desenvolvimento)
            addPositionIndicator();
            
            // Trigger evento customizado para informar que está pronto
            const event = new CustomEvent('dynamicModalReady', {
              detail: { version: '1.0.0' }
            });
            document.dispatchEvent(event);
          } else {
            console.error("❌ Modal dinâmico com problemas");
          }
        } else {
          console.error("❌ Falha ao integrar modal dinâmico");
        }
      }, 500);

    } catch (error) {
      console.error("Erro ao inicializar modal dinâmico:", error);
    }
  }

  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // Expor função de teste para debug
  window.testDynamicModal = function() {
    console.group("🧪 Teste do Modal Dinâmico");
    
    const position = window.NetworkConfigModal ? 
      window.NetworkConfigModal.calculateOptimalPosition() : 
      null;
    
    if (position) {
      console.log("Posição calculada:", position);
      console.log("Scroll atual:", window.pageYOffset);
      console.log("Altura viewport:", window.innerHeight);
      console.log("Altura do documento:", document.body.scrollHeight);
    } else {
      console.error("Não foi possível calcular posição");
    }
    
    console.groupEnd();
  };

})();
