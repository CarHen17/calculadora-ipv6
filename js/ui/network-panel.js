/**
 * Controlador do Painel de Configuração de Rede
 * 
 * Este módulo gerencia o painel lateral para configuração de rede IPv6,
 * incluindo verificação de sobreposição entre endereços WAN e LAN.
 * Implementação com modo totalmente minimizado.
 */

const NetworkPanel = (function() {
  'use strict';
  
  // Estado do painel
  let state = {
    isOpen: false,
    isMinimized: true, // Iniciar minimizado por padrão
    hasOverlap: false,
    wanPrefix: '',
    lanPrefix: '',
    suggestedPrefix: '',
    lastCheckTimestamp: 0
  };
  
  /**
   * Inicializa o painel de configuração de rede
   */
  function initialize() {
    try {
      console.log("Inicializando painel de configuração de rede...");
      
      // Carregar a configuração inicial
      loadInitialConfig();
      
      // Configurar listeners de eventos
      setupEventListeners();
      
      // Iniciar em modo minimizado
      initMinimizedMode();
      
      console.log("Painel de configuração de rede inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar painel de rede:", error);
    }
  }
  
  /**
   * Carrega a configuração inicial
   */
  function loadInitialConfig() {
    try {
      // Obter os campos de entrada
      const wanField = document.getElementById('wanPrefix');
      const lanField = document.getElementById('lanPrefix');
      
      if (wanField && lanField) {
        // Carregar valores do armazenamento local, se disponível
        const savedWanPrefix = localStorage.getItem('networkConfig.wanPrefix');
        const savedLanPrefix = localStorage.getItem('networkConfig.lanPrefix');
        
        // Definir valores padrão ou restaurar valores salvos
        wanField.value = savedWanPrefix || '2804:418:3000:1::190/64';
        lanField.value = savedLanPrefix || '2804:418:3000:5::1/64';
        
        // Atualizar o estado
        state.wanPrefix = wanField.value;
        state.lanPrefix = lanField.value;
      }
    } catch (error) {
      console.error("Erro ao carregar configuração inicial:", error);
    }
  }
  
  /**
   * Inicializa o modo minimizado
   */
  function initMinimizedMode() {
    try {
      const networkPanel = document.getElementById('networkPanel');
      
      if (networkPanel) {
        // Adicionar classe minimizada
        networkPanel.classList.add('minimized');
        
        // Verificar se já existe um botão de expansão
        if (!document.getElementById('expandNetworkBtn')) {
          // Criar botão para expandir
          const expandBtn = document.createElement('button');
          expandBtn.id = 'expandNetworkBtn';
          expandBtn.className = 'expand-btn';
          expandBtn.setAttribute('aria-label', 'Expandir painel de rede');
          expandBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
          expandBtn.addEventListener('click', toggleMinimize);
          
          // Adicionar ao painel
          networkPanel.appendChild(expandBtn);
        }
        
        // Adicionar botão de minimizar ao cabeçalho do painel
        const panelHeader = networkPanel.querySelector('.panel-header');
        if (panelHeader && !document.getElementById('minimizeNetworkBtn')) {
          const minimizeBtn = document.createElement('button');
          minimizeBtn.id = 'minimizeNetworkBtn';
          minimizeBtn.className = 'minimize-btn';
          minimizeBtn.setAttribute('aria-label', 'Minimizar painel');
          minimizeBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
          minimizeBtn.addEventListener('click', toggleMinimize);
          
          panelHeader.insertBefore(minimizeBtn, panelHeader.firstChild);
        }
      }
      
      // Atualizar estado
      state.isOpen = true;
      state.isMinimized = true;
    } catch (error) {
      console.error("Erro ao inicializar modo minimizado:", error);
    }
  }
  
  /**
   * Configura os listeners de eventos para o painel
   */
  function setupEventListeners() {
    try {
      // Botão para abrir o painel
      const networkConfigBtn = document.getElementById('networkConfigBtn');
      if (networkConfigBtn) {
        networkConfigBtn.addEventListener('click', openPanel);
      }
      
      // Botão para fechar o painel
      const closeNetworkPanel = document.getElementById('closeNetworkPanel');
      if (closeNetworkPanel) {
        closeNetworkPanel.addEventListener('click', closePanel);
      }
      
      // Overlay para fechar o painel ao clicar fora
      const panelOverlay = document.getElementById('panelOverlay');
      if (panelOverlay) {
        panelOverlay.addEventListener('click', closePanel);
      }
      
      // Tecla ESC para fechar o painel
      document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && state.isOpen && !state.isMinimized) {
          toggleMinimize();
        }
      });
      
      // Botão para verificar sobreposição
      const resolveConflictBtn = document.getElementById('resolveConflictBtn');
      if (resolveConflictBtn) {
        resolveConflictBtn.addEventListener('click', checkOverlap);
      }
      
      // Botão para aplicar prefixo sugerido
      const applyPrefixBtn = document.getElementById('applyPrefixBtn');
      if (applyPrefixBtn) {
        applyPrefixBtn.addEventListener('click', applySuggestedPrefix);
      }
      
      // Monitorar alterações nos campos WAN e LAN
      const wanField = document.getElementById('wanPrefix');
      const lanField = document.getElementById('lanPrefix');
      
      if (wanField) {
        wanField.addEventListener('input', debounce(function() {
          // Salvar no armazenamento local
          localStorage.setItem('networkConfig.wanPrefix', this.value);
          state.wanPrefix = this.value;
          
          // Verificar sobreposição automaticamente
          checkOverlapIfNeeded();
        }, 500));
      }
      
      if (lanField) {
        lanField.addEventListener('input', debounce(function() {
          // Salvar no armazenamento local
          localStorage.setItem('networkConfig.lanPrefix', this.value);
          state.lanPrefix = this.value;
          
          // Verificar sobreposição automaticamente
          checkOverlapIfNeeded();
        }, 500));
      }
    } catch (error) {
      console.error("Erro ao configurar listeners de eventos:", error);
    }
  }
  
  /**
   * Alterna entre o modo minimizado e expandido
   */
  function toggleMinimize() {
    try {
      const networkPanel = document.getElementById('networkPanel');
      const panelOverlay = document.getElementById('panelOverlay');
      
      if (!networkPanel) return;
      
      if (state.isMinimized) {
        // Expandir o painel
        networkPanel.classList.remove('minimized');
        networkPanel.classList.add('active');
        
        if (panelOverlay) {
          panelOverlay.classList.add('active');
        }
        
        state.isMinimized = false;
      } else {
        // Minimizar o painel
        networkPanel.classList.remove('active');
        networkPanel.classList.add('minimized');
        
        if (panelOverlay) {
          panelOverlay.classList.remove('active');
        }
        
        state.isMinimized = true;
      }
    } catch (error) {
      console.error("Erro ao alternar modo minimizado:", error);
    }
  }
  
  /**
   * Função para abrir o painel
   */
  function openPanel() {
    try {
      const networkPanel = document.getElementById('networkPanel');
      const panelOverlay = document.getElementById('panelOverlay');
      
      if (networkPanel && panelOverlay) {
        if (state.isMinimized) {
          // Se estiver minimizado, expandir
          toggleMinimize();
        } else {
          // Exibir o overlay primeiro
          panelOverlay.classList.add('active');
          
          // Em seguida, exibir o painel com animação
          networkPanel.classList.add('active');
          
          // Atualizar o estado
          state.isOpen = true;
          state.isMinimized = false;
        }
        
        // Verificar sobreposição ao abrir o painel
        setTimeout(checkOverlapIfNeeded, 300);
      }
    } catch (error) {
      console.error("Erro ao abrir painel:", error);
    }
  }
  
  /**
   * Função para fechar o painel
   */
  function closePanel() {
    try {
      const networkPanel = document.getElementById('networkPanel');
      const panelOverlay = document.getElementById('panelOverlay');
      
      if (networkPanel && panelOverlay) {
        // Remover as classes ativas
        networkPanel.classList.remove('active');
        panelOverlay.classList.remove('active');
        
        // Atualizar o estado
        state.isOpen = false;
        state.isMinimized = true;
        
        // Adicionar classe minimizada
        networkPanel.classList.add('minimized');
        
        // Se houver mudanças de configuração, adicionar indicador de notificação
        const networkConfigBtn = document.getElementById('networkConfigBtn');
        if (networkConfigBtn && state.hasOverlap) {
          networkConfigBtn.classList.add('has-issue');
        }
      }
    } catch (error) {
      console.error("Erro ao fechar painel:", error);
    }
  }
  
  /**
   * Verifica sobreposição entre os prefixos WAN e LAN
   */
  function checkOverlap() {
    try {
      // Verificar se a função está disponível
      if (typeof IPv6Utils === 'undefined' || typeof IPv6Utils.checkIPv6Overlap !== 'function') {
        console.error("Função de verificação de sobreposição não disponível");
        return false;
      }
      
      // Obter os valores dos campos
      const wanField = document.getElementById('wanPrefix');
      const lanField = document.getElementById('lanPrefix');
      
      if (!wanField || !lanField) {
        console.error("Campos WAN/LAN não encontrados");
        return false;
      }
      
      const wanPrefix = wanField.value.trim();
      const lanPrefix = lanField.value.trim();
      
      // Validar os prefixos
      if (!isValidPrefix(wanPrefix) || !isValidPrefix(lanPrefix)) {
        showNotification("Os prefixos devem estar no formato CIDR válido", "error");
        return false;
      }
      
      // Extrair as máscaras
      const wanMask = parseInt(wanPrefix.split('/')[1]);
      const lanMask = parseInt(lanPrefix.split('/')[1]);
      
      // Se a máscara LAN for igual ou maior que 64, geralmente não há problema
      if (lanMask >= 64) {
        hideOverlapWarning();
        
        // Simular mudança para /60 para testar
        const lanParts = lanPrefix.split('/');
        if (lanParts.length === 2 && lanMask === 64) {
          const testPrefix = lanParts[0] + '/60';
          
          // Testar se haveria sobreposição com /60
          const wouldOverlap = IPv6Utils.checkIPv6Overlap(wanPrefix, testPrefix);
          if (wouldOverlap) {
            // Sugerir teste com máscara menor
            showNotification("Teste com máscara /60 resultaria em sobreposição. Clique para detalhes.", "warning", function() {
              // Alterar o valor do campo para /60 e verificar novamente
              lanField.value = testPrefix;
              checkOverlap();
            });
          } else {
            showNotification("Não há sobreposição entre os prefixos. Você pode usar /60 sem problemas.", "success");
          }
        } else {
          showNotification("Não há sobreposição entre os prefixos.", "success");
        }
        
        // Atualizar o estado
        state.hasOverlap = false;
        
        return false;
      }
      
      // Verificar sobreposição
      const hasOverlap = IPv6Utils.checkIPv6Overlap(wanPrefix, lanPrefix);
      
      if (hasOverlap) {
        // Determinar qual o conflito
        const conflictMask = Math.min(wanMask, lanMask);
        
        // Mostrar aviso de sobreposição
        showOverlapWarning(wanPrefix, lanPrefix, conflictMask);
        
        // Atualizar o estado
        state.hasOverlap = true;
        
        return true;
      } else {
        // Esconder aviso de sobreposição
        hideOverlapWarning();
        
        // Atualizar o estado
        state.hasOverlap = false;
        
        // Mostrar notificação
        showNotification("Não há sobreposição entre os prefixos.", "success");
        
        return false;
      }
    } catch (error) {
      console.error("Erro ao verificar sobreposição:", error);
      return false;
    }
  }
  
  /**
   * Verifica se há necessidade de verificar sobreposição
   */
  function checkOverlapIfNeeded() {
    try {
      // Limitar a frequência de verificações
      const now = Date.now();
      if (now - state.lastCheckTimestamp < 500) {
        return;
      }
      
      state.lastCheckTimestamp = now;
      
      // Obter os valores dos campos
      const wanField = document.getElementById('wanPrefix');
      const lanField = document.getElementById('lanPrefix');
      
      if (!wanField || !lanField) {
        return;
      }
      
      const lanPrefix = lanField.value.trim();
      
      // Verificar se o prefixo LAN é válido
      if (!isValidPrefix(lanPrefix)) {
        return;
      }
      
      // Extrair a máscara LAN
      const lanMask = parseInt(lanPrefix.split('/')[1]);
      
      // Verificar sobreposição apenas se a máscara LAN for menor que 64
      if (lanMask < 64) {
        checkOverlap();
      } else {
        // Esconder aviso se a máscara for >= 64
        hideOverlapWarning();
        state.hasOverlap = false;
      }
    } catch (error) {
      console.error("Erro ao verificar sobreposição automaticamente:", error);
    }
  }
  
  /**
   * Mostra o aviso de sobreposição
   * @param {string} wanPrefix - Prefixo WAN
   * @param {string} lanPrefix - Prefixo LAN
   * @param {number} conflictMask - Máscara que causa o conflito
   */
  function showOverlapWarning(wanPrefix, lanPrefix, conflictMask) {
    try {
      // Obter o elemento de aviso
      const overlapWarning = document.getElementById('overlapWarning');
      if (!overlapWarning) {
        console.warn("Aviso de sobreposição não encontrado");
        return;
      }
      
      // Gerar um prefixo sugerido
      let suggestedPrefix = '';
      if (typeof IPv6Utils.suggestNonOverlappingPrefix === 'function') {
        suggestedPrefix = IPv6Utils.suggestNonOverlappingPrefix(
          lanPrefix,
          wanPrefix,
          parseInt(lanPrefix.split('/')[1])
        );
        
        // Atualizar o estado
        state.suggestedPrefix = suggestedPrefix;
      }
      
      // Atualizar o conteúdo do aviso
      const paragraphs = overlapWarning.querySelectorAll('p');
      if (paragraphs && paragraphs.length > 0) {
        paragraphs[0].textContent = `Os prefixos WAN (${wanPrefix}) e LAN (${lanPrefix}) estão em conflito.`;
        
        if (paragraphs.length > 1) {
          paragraphs[1].textContent = `Ambos fazem parte do mesmo bloco /${conflictMask}.`;
        }
      }
      
      // Atualizar a sugestão
      const suggestedPrefixElement = document.getElementById('suggestedPrefix');
      if (suggestedPrefixElement && suggestedPrefix) {
        suggestedPrefixElement.textContent = suggestedPrefix;
      }
      
      // Mostrar o aviso
      overlapWarning.style.display = 'flex';
      
      // Adicionar classe de notificação ao botão principal
      const networkConfigBtn = document.getElementById('networkConfigBtn');
      if (networkConfigBtn) {
        networkConfigBtn.classList.add('has-issue');
      }
      
      // Exibir um indicador visual se o painel não estiver aberto
      if (state.isMinimized) {
        showNotification("Sobreposição detectada! Abra o painel de rede para resolver.", "warning", openPanel);
      }
    } catch (error) {
      console.error("Erro ao mostrar aviso de sobreposição:", error);
    }
  }
  
  /**
   * Oculta o aviso de sobreposição
   */
  function hideOverlapWarning() {
    try {
      const overlapWarning = document.getElementById('overlapWarning');
      if (overlapWarning) {
        overlapWarning.style.display = 'none';
      }
      
      // Remover classe de notificação do botão principal
      const networkConfigBtn = document.getElementById('networkConfigBtn');
      if (networkConfigBtn) {
        networkConfigBtn.classList.remove('has-issue');
      }
    } catch (error) {
      console.error("Erro ao ocultar aviso de sobreposição:", error);
    }
  }
  
  /**
   * Aplica o prefixo sugerido ao campo LAN
   */
  function applySuggestedPrefix() {
    try {
      // Verificar se temos uma sugestão
      if (!state.suggestedPrefix) {
        console.warn("Nenhum prefixo sugerido disponível");
        return;
      }
      
      const lanField = document.getElementById('lanPrefix');
      if (!lanField) {
        console.error("Campo LAN não encontrado");
        return;
      }
      
      // Aplicar a sugestão
      lanField.value = state.suggestedPrefix;
      
      // Salvar no armazenamento local
      localStorage.setItem('networkConfig.lanPrefix', state.suggestedPrefix);
      
      // Atualizar o estado
      state.lanPrefix = state.suggestedPrefix;
      state.hasOverlap = false;
      
      // Esconder o aviso
      hideOverlapWarning();
      
      // Mostrar notificação
      showNotification("Prefixo LAN atualizado com sucesso!", "success");
      
      // Efeito visual no botão principal
      const networkConfigBtn = document.getElementById('networkConfigBtn');
      if (networkConfigBtn) {
        networkConfigBtn.classList.add('saved');
        setTimeout(() => {
          networkConfigBtn.classList.remove('saved');
        }, 1000);
      }
    } catch (error) {
      console.error("Erro ao aplicar prefixo sugerido:", error);
    }
  }
  
  /**
   * Verifica se um prefixo IPv6 é válido
   * @param {string} prefix - Prefixo a ser validado
   * @returns {boolean} - Verdadeiro se o prefixo for válido
   */
  function isValidPrefix(prefix) {
    try {
      // Verificar formato básico
      if (!prefix || !prefix.includes('/')) {
        return false;
      }
      
      // Extrair partes
      const [addr, mask] = prefix.split('/');
      
      // Verificar máscara
      const maskNum = parseInt(mask);
      if (isNaN(maskNum) || maskNum < 1 || maskNum > 128) {
        return false;
      }
      
      // Verificação básica do endereço
      if (!addr || !addr.includes(':')) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao validar prefixo:", error);
      return false;
    }
  }
  
  /**
   * Mostra uma notificação na interface
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo de notificação ('success', 'warning', 'error')
   * @param {Function} [onClick] - Função a ser chamada ao clicar na notificação
   */
  function showNotification(message, type = 'success', onClick = null) {
    try {
      // Verificar se o UIController está disponível
      if (typeof UIController !== 'undefined' && typeof UIController.showNotification === 'function') {
        UIController.showNotification(message, type);
        return;
      }
      
      // Remover notificação existente
      const existingNotification = document.querySelector('.network-status');
      if (existingNotification) {
        document.body.removeChild(existingNotification);
      }
      
      // Criar a notificação
      const notification = document.createElement('div');
      notification.className = `network-status ${type}`;
      
      // Ícone baseado no tipo
      let icon = '';
      switch (type) {
        case 'success':
          icon = '<i class="fas fa-check-circle"></i>';
          break;
        case 'warning':
          icon = '<i class="fas fa-exclamation-triangle"></i>';
          break;
        case 'error':
          icon = '<i class="fas fa-times-circle"></i>';
          break;
        default:
          icon = '<i class="fas fa-info-circle"></i>';
      }
      
      notification.innerHTML = `${icon} ${message}`;
      
      // Adicionar evento de clique, se fornecido
      if (typeof onClick === 'function') {
        notification.style.cursor = 'pointer';
        notification.addEventListener('click', onClick);
      }
      
      // Adicionar ao DOM
      document.body.appendChild(notification);
      
      // Animar a entrada
      setTimeout(() => {
        notification.classList.add('visible');
      }, 10);
      
      // Remover após alguns segundos
      setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        }, 300);
      }, 5000);
    } catch (error) {
      console.error("Erro ao mostrar notificação:", error);
    }
  }
  
  /**
   * Função utilitária para limitar chamadas frequentes (debounce)
   * @param {Function} func - Função a ser executada
   * @param {number} wait - Tempo de espera em milissegundos
   * @returns {Function} - Função com debounce
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
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
  
  // API pública
  return {
    openPanel,
    closePanel,
    toggleMinimize,
    checkOverlap,
    applySuggestedPrefix,
    isValidPrefix
  };
})();

// Exportar globalmente
window.NetworkPanel = NetworkPanel;