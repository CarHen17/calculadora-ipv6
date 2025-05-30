/**
 * UI Controller - Versão Corrigida
 * 
 * Controlador de interface que gerencia todas as funcionalidades de UI
 * incluindo tema, navegação, notificações e interações.
 */

const UIController = (function() {
  'use strict';
  
  // Configurações
  const CONFIG = {
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    THEME_STORAGE_KEY: 'themePreference'
  };
  
  /**
   * Obtém elemento de forma segura
   */
  function getElement(id) {
    if (typeof id === 'string') {
      return document.getElementById(id);
    }
    return id; // Já é um elemento
  }
  
  /**
   * Executa operação DOM de forma segura
   */
  function safeDOMOperation(operation, context = 'Operação DOM') {
    try {
      return operation();
    } catch (error) {
      console.error(`[UIController] Erro em ${context}:`, error);
      return null;
    }
  }
  
  /**
   * Atualiza o passo atual no indicador de progresso
   */
  function updateStep(step) {
    safeDOMOperation(() => {
      const steps = document.querySelectorAll('.step');
      if (steps.length === 0) return;
      
      // Remover classe ativa de todos os passos
      steps.forEach(el => el.classList.remove('active'));
      
      // Ativar passo atual
      const currentStep = getElement(`step${step}`);
      if (currentStep) {
        currentStep.classList.add('active');
        
        // Animação suave
        currentStep.style.transform = 'scale(1.05)';
        setTimeout(() => {
          currentStep.style.transform = '';
        }, CONFIG.ANIMATION_DURATION);
      }
      
      // Atualizar estado global
      if (window.appState) {
        window.appState.currentStep = step;
      }
    }, 'updateStep');
  }
  
  /**
   * Gerencia o tema da aplicação
   */
  const themeManager = {
    /**
     * Alterna entre tema claro e escuro
     */
    toggle() {
      safeDOMOperation(() => {
        const isDark = document.body.classList.toggle('dark-mode');
        
        // Atualizar botão
        const themeBtn = getElement('toggleThemeBtn');
        if (themeBtn) {
          const icon = isDark ? 'fa-sun' : 'fa-moon';
          themeBtn.innerHTML = `<i class="fas ${icon}"></i> Tema`;
        }
        
        // Salvar preferência
        localStorage.setItem(CONFIG.THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
        
        // Notificar outros módulos sobre mudança de tema
        this.notifyThemeChange(isDark);
        
        console.log(`[UIController] Tema alterado para: ${isDark ? 'escuro' : 'claro'}`);
      }, 'toggle theme');
    },
    
    /**
     * Carrega preferência de tema salva
     */
    loadPreference() {
      safeDOMOperation(() => {
        const saved = localStorage.getItem(CONFIG.THEME_STORAGE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let shouldUseDark = false;
        
        if (saved === 'dark') {
          shouldUseDark = true;
        } else if (saved === 'light') {
          shouldUseDark = false;
        } else {
          // Usar preferência do sistema
          shouldUseDark = prefersDark;
        }
        
        // Aplicar tema
        document.body.classList.toggle('dark-mode', shouldUseDark);
        
        // Atualizar botão
        const themeBtn = getElement('toggleThemeBtn');
        if (themeBtn) {
          const icon = shouldUseDark ? 'fa-sun' : 'fa-moon';
          themeBtn.innerHTML = `<i class="fas ${icon}"></i> Tema`;
        }
      }, 'load theme preference');
    },
    
    /**
     * Notifica outros módulos sobre mudança de tema
     */
    notifyThemeChange(isDark) {
      // Disparar evento customizado
      const event = new CustomEvent('themeChanged', { 
        detail: { isDark } 
      });
      document.dispatchEvent(event);
    }
  };
  
  /**
   * Sistema de notificações
   */
  const notificationSystem = {
    /**
     * Mostra uma notificação
     */
    show(message, type = 'success', duration = CONFIG.NOTIFICATION_DURATION) {
      const notification = this.create(message, type, duration);
      this.display(notification);
    },
    
    /**
     * Cria elemento de notificação
     */
    create(message, type, duration) {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      
      // Ícones por tipo
      const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
      };
      
      // Cores por tipo
      const colors = {
        success: '#4caf50',
        error: '#e53935',
        warning: '#ffa000',
        info: '#0070d1'
      };
      
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <i class="fas ${icons[type] || icons.info}" style="font-size: 20px;"></i>
          <span style="flex: 1;">${message}</span>
          <button class="notification-close" style="background: none; border: none; color: inherit; cursor: pointer; padding: 4px;">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      
      // Estilizar
      Object.assign(notification.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        minWidth: '300px',
        maxWidth: '500px',
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: colors[type] || colors.info,
        color: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '10000',
        fontSize: '14px',
        fontWeight: '500',
        transform: 'translateX(100%)',
        opacity: '0',
        transition: 'all 0.3s ease'
      });
      
      // Configurar botão de fechar
      const closeBtn = notification.querySelector('.notification-close');
      closeBtn.addEventListener('click', () => this.hide(notification));
      
      return { element: notification, duration, type };
    },
    
    /**
     * Exibe notificação na tela
     */
    display(notification) {
      document.body.appendChild(notification.element);
      
      // Animar entrada
      requestAnimationFrame(() => {
        notification.element.style.transform = 'translateX(0)';
        notification.element.style.opacity = '1';
      });
      
      // Auto-remover
      setTimeout(() => {
        this.hide(notification);
      }, notification.duration);
    },
    
    /**
     * Oculta notificação
     */
    hide(notification) {
      const element = notification.element || notification;
      
      element.style.transform = 'translateX(100%)';
      element.style.opacity = '0';
      
      setTimeout(() => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }, CONFIG.ANIMATION_DURATION);
    }
  };
  
  /**
   * Gerenciador de cópia para área de transferência
   */
  const clipboardManager = {
    /**
     * Copia texto para área de transferência
     */
    async copy(source, showFeedback = true) {
      try {
        let text;
        
        if (typeof source === 'string') {
          text = source;
        } else if (source instanceof HTMLElement) {
          text = source.getAttribute('data-value') || source.textContent || source.innerText;
        } else {
          throw new Error('Fonte inválida para cópia');
        }
        
        // Usar API moderna se disponível
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback para método mais antigo
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (!successful) {
            throw new Error('Falha ao copiar usando método fallback');
          }
        }
        
        if (showFeedback) {
          notificationSystem.show('Texto copiado!', 'success', 1500);
        }
        
        return true;
      } catch (error) {
        console.error('[UIController] Erro ao copiar:', error);
        notificationSystem.show('Falha ao copiar o texto', 'error');
        return false;
      }
    }
  };
  
  /**
   * Função legada para compatibilidade
   */
  function copiarTexto(elementId, feedback = true) {
    const element = getElement(elementId);
    if (element) {
      clipboardManager.copy(element, feedback);
    } else {
      console.error(`[UIController] Elemento "${elementId}" não encontrado para cópia`);
    }
  }
  
  /**
   * Adiciona um item à lista de IPs
   */
  function appendIpToList(ip, number, listId) {
    safeDOMOperation(() => {
      const ipsList = getElement(listId);
      if (!ipsList) {
        console.error(`[UIController] Lista "${listId}" não encontrada`);
        return;
      }
      
      // Criar elementos
      const li = document.createElement('li');
      li.className = 'ip-item';
      li.innerHTML = `
        <span class="ip-number">${number}.</span>
        <span class="ip-text" title="${ip}">${ip}</span>
        <button class="copy-btn" type="button" title="Copiar IP" data-ip="${ip}">
          <i class="fas fa-copy"></i>
        </button>
      `;
      
      // Configurar botão de cópia
      const copyBtn = li.querySelector('.copy-btn');
      copyBtn.addEventListener('click', () => {
        clipboardManager.copy(ip, true);
      });
      
      // Adicionar com animação
      li.style.opacity = '0';
      li.style.transform = 'translateY(10px)';
      ipsList.appendChild(li);
      
      requestAnimationFrame(() => {
        li.style.transition = 'all 0.3s ease';
        li.style.opacity = '1';
        li.style.transform = 'translateY(0)';
      });
      
    }, 'appendIpToList');
  }
  
  /**
   * Carrega mais sub-redes na tabela
   */
  function carregarMaisSubRedes(startIndex, limit) {
    safeDOMOperation(() => {
      if (!window.appState || !window.appState.subRedesGeradas) {
        console.error('[UIController] Estado da aplicação não inicializado');
        return;
      }
      
      const tbody = document.querySelector('#subnetsTable tbody');
      if (!tbody) {
        console.error('[UIController] Tabela de sub-redes não encontrada');
        return;
      }
      
      const endIndex = Math.min(startIndex + limit, window.appState.subRedesGeradas.length);
      const fragment = document.createDocumentFragment();
      
      // Usar DocumentFragment para melhor performance
      for (let i = startIndex; i < endIndex; i++) {
        const subnet = window.appState.subRedesGeradas[i];
        
        if (!subnet || !subnet.subnet || !subnet.initial || !subnet.final || !subnet.network) {
          console.warn(`[UIController] Sub-rede inválida no índice ${i}:`, subnet);
          continue;
        }
        
        const row = document.createElement('tr');
        
        // Função para encurtar IPv6 se disponível
        const shortenIPv6 = window.IPv6Utils && window.IPv6Utils.shortenIPv6 
          ? window.IPv6Utils.shortenIPv6 
          : (addr) => addr;
        
        row.innerHTML = `
          <td>
            <input type="checkbox" value="${i}" aria-label="Selecionar sub-rede ${shortenIPv6(subnet.subnet)}">
          </td>
          <td>${shortenIPv6(subnet.subnet)}</td>
          <td>${shortenIPv6(subnet.initial)}</td>
          <td>${shortenIPv6(subnet.final)}</td>
          <td>${shortenIPv6(subnet.network)}</td>
        `;
        
        // Configurar checkbox
        const checkbox = row.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
          row.classList.toggle('selected', this.checked);
        });
        
        fragment.appendChild(row);
      }
      
      // Adicionar todas as linhas de uma vez
      tbody.appendChild(fragment);
      
      // Atualizar estado
      window.appState.subRedesExibidas = endIndex;
      
      // Atualizar controles
      const loadMoreContainer = getElement('loadMoreContainer');
      if (loadMoreContainer) {
        const shouldShow = window.appState.subRedesExibidas < window.appState.subRedesGeradas.length;
        loadMoreContainer.style.display = shouldShow ? 'block' : 'none';
      }
      
    }, 'carregarMaisSubRedes');
  }
  
  /**
   * Seleciona/desmarca todas as sub-redes
   */
  function toggleSelectAll() {
    safeDOMOperation(() => {
      const selectAll = getElement('selectAll');
      if (!selectAll) {
        console.warn('[UIController] Checkbox "selectAll" não encontrado');
        return;
      }
      
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]');
      const isChecked = selectAll.checked;
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        
        // Atualizar linha visualmente
        const row = checkbox.closest('tr');
        if (row) {
          row.classList.toggle('selected', isChecked);
        }
        
        // Disparar evento change
        const changeEvent = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(changeEvent);
      });
      
    }, 'toggleSelectAll');
  }
  
  /**
   * Utilitários de navegação
   */
  const navigation = {
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    scrollToBottom() {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };
  
  /**
   * Gerenciador de layout responsivo
   */
  const responsiveManager = {
    adjust() {
      const isMobile = window.innerWidth <= 768;
      document.body.classList.toggle('mobile-device', isMobile);
    }
  };
  
  /**
   * Configuração de eventos globais
   */
  function setupEventListeners() {
    // Tema - usando addEventListener para evitar sobrescrever
    const themeBtn = getElement('toggleThemeBtn');
    if (themeBtn) {
      // Remover listeners existentes e adicionar novo
      const newThemeBtn = themeBtn.cloneNode(true);
      themeBtn.parentNode.replaceChild(newThemeBtn, themeBtn);
      newThemeBtn.addEventListener('click', themeManager.toggle.bind(themeManager));
      console.log('[UIController] Event listener do tema configurado');
    }
    
    // Navegação
    const topBtn = getElement('topBtn');
    const bottomBtn = getElement('bottomBtn');
    
    if (topBtn) {
      const newTopBtn = topBtn.cloneNode(true);
      topBtn.parentNode.replaceChild(newTopBtn, topBtn);
      newTopBtn.addEventListener('click', navigation.scrollToTop);
    }
    
    if (bottomBtn) {
      const newBottomBtn = bottomBtn.cloneNode(true);
      bottomBtn.parentNode.replaceChild(newBottomBtn, bottomBtn);
      newBottomBtn.addEventListener('click', navigation.scrollToBottom);
    }
    
    // Responsividade
    window.addEventListener('resize', responsiveManager.adjust);
    
    // Configurar todos os botões de cópia da página
    setupCopyButtons();
  }
  
  /**
   * Configura todos os botões de cópia
   */
  function setupCopyButtons() {
    // Configurar botões de cópia existentes
    document.querySelectorAll('.copy-btn').forEach(btn => {
      // Remover listeners existentes
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', function() {
        const text = this.getAttribute('data-ip') || 
                    this.getAttribute('data-value') ||
                    this.closest('.ip-item, .info-value-container').querySelector('.ip-text, .info-value').textContent;
        
        if (text) {
          clipboardManager.copy(text, true);
        }
      });
    });
  }
  
  /**
   * Inicialização do módulo
   */
  function initialize() {
    console.log('[UIController] Inicializando UI Controller...');
    
    try {
      // Configurar sistema de temas
      themeManager.loadPreference();
      
      // Configurar layout responsivo
      responsiveManager.adjust();
      
      // Configurar eventos
      setupEventListeners();
      
      console.log('[UIController] UI Controller inicializado com sucesso');
      
    } catch (error) {
      console.error('[UIController] Erro na inicialização:', error);
    }
  }
  
  // API pública
  const publicAPI = {
    // Funções principais
    updateStep,
    copiarTexto,
    appendIpToList,
    carregarMaisSubRedes,
    toggleSelectAll,
    
    // Sistemas especializados
    theme: themeManager,
    notifications: notificationSystem,
    clipboard: clipboardManager,
    navigation,
    responsive: responsiveManager,
    
    // Alias para compatibilidade
    showNotification: notificationSystem.show.bind(notificationSystem),
    ajustarLayoutResponsivo: responsiveManager.adjust.bind(responsiveManager),
    
    // Utilitários
    getElement,
    safeDOMOperation,
    setupCopyButtons
  };
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  return publicAPI;
})();

// Exportar globalmente
window.UIController = UIController;
