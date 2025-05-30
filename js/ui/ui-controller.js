/**
 * UI Controller - Versão Refatorada
 * 
 * Controlador de interface otimizado que usa DOMCache e
 * o sistema de módulos para melhor performance.
 */

const UIController = (function() {
  'use strict';
  
  // Configurações
  const CONFIG = {
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    THEME_STORAGE_KEY: 'themePreference'
  };
  
  // Cache para elementos acessados com frequência
  let domElements = {};
  
  /**
   * Inicializa cache de elementos DOM usando DOMCache
   */
  function initDOMCache() {
    if (!window.DOMCache) {
      console.warn('[UIController] DOMCache não disponível, usando fallback');
      return;
    }
    
    // Usar o cache de elementos comuns do DOMCache
    domElements = window.DOMCache.elements;
  }
  
  /**
   * Obtém elemento de forma segura (com fallback)
   * @param {string} id - ID do elemento
   * @returns {HTMLElement|null} - Elemento encontrado
   */
  function getElement(id) {
    if (window.DOMCache) {
      return window.DOMCache.get(id);
    }
    // Fallback para getElementById tradicional
    return document.getElementById(id);
  }
  
  /**
   * Executa operação DOM de forma segura
   * @param {Function} operation - Operação a ser executada
   * @param {string} context - Contexto para debug
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
   * @param {number} step - Número do passo a ser ativado
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
        const themeBtn = domElements.toggleThemeBtn || getElement('toggleThemeBtn');
        if (themeBtn) {
          const icon = isDark ? 'fa-sun' : 'fa-moon';
          themeBtn.innerHTML = `<i class="fas ${icon}"></i> Tema`;
        }
        
        // Salvar preferência
        localStorage.setItem(CONFIG.THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
        
        // Notificar outros módulos sobre mudança de tema
        this.notifyThemeChange(isDark);
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
        const themeBtn = domElements.toggleThemeBtn || getElement('toggleThemeBtn');
        if (themeBtn) {
          const icon = shouldUseDark ? 'fa-sun' : 'fa-moon';
          themeBtn.innerHTML = `<i class="fas ${icon}"></i> Tema`;
        }
      }, 'load theme preference');
    },
    
    /**
     * Notifica outros módulos sobre mudança de tema
     * @param {boolean} isDark - Se o tema escuro está ativo
     */
    notifyThemeChange(isDark) {
      // Notificar visualizações se disponíveis
      if (window.VisualizationModule && typeof window.VisualizationModule.updateChartsForTheme === 'function') {
        window.VisualizationModule.updateChartsForTheme();
      }
      
      // Disparar evento customizado
      const event = new CustomEvent('themeChanged', { 
        detail: { isDark } 
      });
      document.dispatchEvent(event);
    },
    
    /**
     * Monitora mudanças na preferência do sistema
     */
    setupSystemPreferenceMonitor() {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      darkModeMediaQuery.addEventListener('change', (e) => {
        const themePreference = localStorage.getItem(CONFIG.THEME_STORAGE_KEY);
        
        // Aplicar apenas se estiver usando o tema do sistema
        if (themePreference === 'system' || !themePreference) {
          document.body.classList.toggle('dark-mode', e.matches);
          
          const themeBtn = domElements.toggleThemeBtn || getElement('toggleThemeBtn');
          if (themeBtn) {
            const icon = e.matches ? 'fa-sun' : 'fa-moon';
            themeBtn.innerHTML = `<i class="fas ${icon}"></i> Tema`;
          }
          
          this.notifyThemeChange(e.matches);
        }
      });
    }
  };
  
  /**
   * Sistema de notificações melhorado
   */
  const notificationSystem = {
    // Queue de notificações
    queue: [],
    active: [],
    maxActive: 3,
    
    /**
     * Mostra uma notificação
     * @param {string} message - Mensagem a exibir
     * @param {string} type - Tipo de notificação
     * @param {number} duration - Duração em milissegundos
     */
    show(message, type = 'success', duration = CONFIG.NOTIFICATION_DURATION) {
      const notification = this.create(message, type, duration);
      
      if (this.active.length < this.maxActive) {
        this.display(notification);
      } else {
        this.queue.push(notification);
      }
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
      this.active.push(notification);
      
      // Posicionar baseado nas notificações ativas
      this.repositionAll();
      
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
        
        // Remover da lista ativa
        const index = this.active.findIndex(n => n.element === element);
        if (index > -1) {
          this.active.splice(index, 1);
        }
        
        // Reposicionar outras notificações
        this.repositionAll();
        
        // Mostrar próxima da queue
        if (this.queue.length > 0) {
          const next = this.queue.shift();
          this.display(next);
        }
      }, CONFIG.ANIMATION_DURATION);
    },
    
    /**
     * Reposiciona todas as notificações ativas
     */
    repositionAll() {
      this.active.forEach((notification, index) => {
        const offset = (index * 80) + 20; // 80px de espaçamento entre notificações
        notification.element.style.bottom = `${offset}px`;
      });
    }
  };
  
  /**
   * Gerenciador de cópia para área de transferência
   */
  const clipboardManager = {
    /**
     * Copia texto para área de transferência
     * @param {string|HTMLElement} source - Texto ou elemento
     * @param {boolean} showFeedback - Mostrar feedback visual
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
          this.showFeedback(source);
        }
        
        return true;
      } catch (error) {
        console.error('[UIController] Erro ao copiar:', error);
        notificationSystem.show('Falha ao copiar o texto', 'error');
        return false;
      }
    },
    
    /**
     * Mostra feedback visual após cópia
     * @param {HTMLElement} element - Elemento que foi copiado
     */
    showFeedback(element) {
      if (typeof element === 'string') return;
      
      safeDOMOperation(() => {
        const isButton = element.classList && element.classList.contains('copy-btn');
        
        if (isButton) {
          // Feedback no botão
          const originalHTML = element.innerHTML;
          element.innerHTML = '<i class="fas fa-check"></i>';
          element.style.transform = 'scale(1.1)';
          
          setTimeout(() => {
            element.innerHTML = originalHTML;
            element.style.transform = '';
          }, 1500);
        } else {
          // Criar tooltip flutuante
          const tooltip = document.createElement('div');
          tooltip.className = 'copy-tooltip';
          tooltip.textContent = "Copiado!";
          
          // Posicionar tooltip
          const rect = element.getBoundingClientRect();
          Object.assign(tooltip.style, {
            position: 'fixed',
            left: `${rect.left + (rect.width / 2) - 30}px`,
            top: `${rect.top - 40}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: '10000',
            pointerEvents: 'none',
            opacity: '0',
            transform: 'translateY(10px)',
            transition: 'all 0.3s ease'
          });
          
          document.body.appendChild(tooltip);
          
          // Animar
          requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
            
            setTimeout(() => {
              tooltip.style.opacity = '0';
              tooltip.style.transform = 'translateY(-10px)';
              
              setTimeout(() => {
                if (tooltip.parentNode) {
                  document.body.removeChild(tooltip);
                }
              }, CONFIG.ANIMATION_DURATION);
            }, 1500);
          });
        }
      }, 'copy feedback');
    }
  };
  
  /**
   * Função legada para compatibilidade
   * @param {string} elementId - ID do elemento
   * @param {boolean} feedback - Mostrar feedback
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
   * Adiciona um item à lista de IPs de forma otimizada
   * @param {string} ip - Endereço IP
   * @param {number} number - Número do IP na lista
   * @param {string} listId - ID da lista
   */
  function appendIpToList(ip, number, listId) {
    safeDOMOperation(() => {
      const ipsList = getElement(listId);
      if (!ipsList) {
        console.error(`[UIController] Lista "${listId}" não encontrada`);
        return;
      }
      
      // Criar elementos de forma otimizada
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
      
      // Atualizar botões de exportação se disponível
      if (window.ExportController && window.ExportController.toggleExportButtonVisibility) {
        const exportBtnId = listId === 'mainBlockIpsList' ? 'exportMainBlockIpsBtn' : 'exportSubnetIpsBtn';
        window.ExportController.toggleExportButtonVisibility(exportBtnId, true);
      }
      
    }, 'appendIpToList');
  }
  
  /**
   * Carrega mais sub-redes na tabela de forma otimizada
   * @param {number} startIndex - Índice inicial
   * @param {number} limit - Quantidade a carregar
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
          
          // Usar ModuleManager para chamar funções de forma segura
          if (window.ModuleManager) {
            const ipv6Calc = window.ModuleManager.createSafeAccessor('IPv6Calculator');
            ipv6Calc.callMethod('atualizarBlocoAgregado');
            ipv6Calc.callMethod('atualizarGerarIPsButton');
            ipv6Calc.callMethod('atualizarInformacoesDoBloco');
          } else {
            // Fallback direto
            if (window.IPv6Calculator) {
              if (window.IPv6Calculator.atualizarBlocoAgregado) window.IPv6Calculator.atualizarBlocoAgregado();
              if (window.IPv6Calculator.atualizarGerarIPsButton) window.IPv6Calculator.atualizarGerarIPsButton();
              if (window.IPv6Calculator.atualizarInformacoesDoBloco) window.IPv6Calculator.atualizarInformacoesDoBloco();
            }
          }
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
      
      // Mostrar botão de exportação se disponível
      if (tbody.rows.length > 0 && window.ExportController && window.ExportController.toggleExportButtonVisibility) {
        window.ExportController.toggleExportButtonVisibility('exportSubnetsTableBtn', true);
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
      
      // Usar requestAnimationFrame para melhor performance
      requestAnimationFrame(() => {
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
      });
      
    }, 'toggleSelectAll');
  }
  
  /**
   * Gerenciador de layout responsivo otimizado
   */
  const responsiveManager = {
    /**
     * Verifica se é dispositivo móvel
     */
    isMobile() {
      return window.innerWidth <= 768 || 
             (navigator.maxTouchPoints > 0 && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    },
    
    /**
     * Ajusta layout para dispositivos móveis
     */
    adjust() {
      safeDOMOperation(() => {
        const isMobile = this.isMobile();
        document.body.classList.toggle('mobile-device', isMobile);
        
        if (isMobile) {
          this.optimizeForMobile();
        } else {
          this.restoreDesktop();
        }
      }, 'responsive adjustment');
    },
    
    /**
     * Otimizações específicas para mobile
     */
    optimizeForMobile() {
      // Reordenar layout principal
      const mainLayout = document.querySelector('.main-layout');
      const sidebar = domElements.infoSidebar || getElement('infoSidebar');
      const content = document.querySelector('.content');
      
      if (mainLayout && sidebar && content && !mainLayout.classList.contains('mobile-optimized')) {
        mainLayout.classList.add('mobile-optimized');
        mainLayout.insertBefore(sidebar, content);
      }
      
      // Otimizar botões de ação
      document.querySelectorAll('.action-buttons').forEach(container => {
        if (!container.classList.contains('mobile-optimized')) {
          container.classList.add('mobile-optimized');
          container.style.flexDirection = 'column';
          
          container.querySelectorAll('button').forEach(btn => {
            btn.style.width = '100%';
          });
        }
      });
      
      // Ajustar input para evitar zoom no iOS
      const ipv6Input = domElements.ipv6Input || getElement('ipv6');
      if (ipv6Input) {
        ipv6Input.style.fontSize = '16px';
      }
      
      // Adicionar indicadores de scroll para tabelas
      this.addTableScrollIndicators();
    },
    
    /**
     * Restaura layout desktop
     */
    restoreDesktop() {
      const mainLayout = document.querySelector('.main-layout');
      const sidebar = domElements.infoSidebar || getElement('infoSidebar');
      
      if (mainLayout && sidebar && mainLayout.classList.contains('mobile-optimized')) {
        mainLayout.classList.remove('mobile-optimized');
        mainLayout.appendChild(sidebar);
      }
      
      // Restaurar botões
      document.querySelectorAll('.action-buttons.mobile-optimized').forEach(container => {
        container.classList.remove('mobile-optimized');
        container.style.flexDirection = '';
        
        container.querySelectorAll('button').forEach(btn => {
          btn.style.width = '';
        });
      });
    },
    
    /**
     * Adiciona indicadores de scroll para tabelas em mobile
     */
    addTableScrollIndicators() {
      document.querySelectorAll('.table-container').forEach(container => {
        if (!container.querySelector('.table-scroll-indicator')) {
          const indicator = document.createElement('div');
          indicator.className = 'table-scroll-indicator';
          indicator.innerHTML = '<i class="fas fa-arrows-alt-h"></i> Deslize para visualizar todos os dados';
          
          container.style.position = 'relative';
          container.appendChild(indicator);
          
          // Monitorar scroll para esconder indicador
          container.addEventListener('scroll', function() {
            const maxScroll = this.scrollWidth - this.clientWidth;
            const scrollPosition = this.scrollLeft;
            
            if (scrollPosition > maxScroll * 0.7) {
              indicator.style.opacity = '0';
              setTimeout(() => {
                if (indicator.parentNode === container) {
                  container.removeChild(indicator);
                }
              }, CONFIG.ANIMATION_DURATION);
            }
          });
        }
      });
    }
  };
  
  /**
   * Utilitários de navegação
   */
  const navigation = {
    /**
     * Rola para o topo da página
     */
    scrollToTop() {
      safeDOMOperation(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 'scroll to top');
    },
    
    /**
     * Rola para o final da página
     */
    scrollToBottom() {
      safeDOMOperation(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      }, 'scroll to bottom');
    },
    
    /**
     * Rola até um elemento específico
     * @param {string|HTMLElement} target - ID ou elemento
     * @param {Object} options - Opções de scroll
     */
    scrollToElement(target, options = { behavior: 'smooth', offset: 0 }) {
      safeDOMOperation(() => {
        const element = typeof target === 'string' ? getElement(target) : target;
        
        if (!element) {
          console.error(`[UIController] Elemento "${target}" não encontrado para scroll`);
          return;
        }
        
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        window.scrollTo({
          top: rect.top + scrollTop - (options.offset || 0),
          behavior: options.behavior || 'smooth'
        });
      }, 'scroll to element');
    }
  };
  
  /**
   * Gerenciador de elementos visuais (mostrar/ocultar)
   */
  const displayManager = {
    /**
     * Mostra um elemento com animação
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {string} display - Tipo de display
     */
    show(element, display = 'block') {
      safeDOMOperation(() => {
        const el = typeof element === 'string' ? getElement(element) : element;
        if (!el) return;
        
        el.style.display = display;
        el.style.opacity = '0';
        el.style.transform = 'translateY(10px)';
        
        requestAnimationFrame(() => {
          el.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ease, transform ${CONFIG.ANIMATION_DURATION}ms ease`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      }, 'show element');
    },
    
    /**
     * Oculta um elemento com animação
     * @param {string|HTMLElement} element - ID ou elemento
     */
    hide(element) {
      safeDOMOperation(() => {
        const el = typeof element === 'string' ? getElement(element) : element;
        if (!el) return;
        
        el.style.transition = `opacity ${CONFIG.ANIMATION_DURATION}ms ease, transform ${CONFIG.ANIMATION_DURATION}ms ease`;
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
          el.style.display = 'none';
          el.style.transform = '';
          el.style.transition = '';
        }, CONFIG.ANIMATION_DURATION);
      }, 'hide element');
    },
    
    /**
     * Alterna visibilidade de um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {string} display - Tipo de display quando visível
     */
    toggle(element, display = 'block') {
      const el = typeof element === 'string' ? getElement(element) : element;
      if (!el) return;
      
      const isVisible = el.style.display !== 'none' && 
                       getComputedStyle(el).display !== 'none';
      
      if (isVisible) {
        this.hide(el);
      } else {
        this.show(el, display);
      }
    }
  };
  
  /**
   * Configuração de eventos globais
   */
  function setupEventListeners() {
    // Tema
    const themeBtn = domElements.toggleThemeBtn || getElement('toggleThemeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', themeManager.toggle.bind(themeManager));
    }
    
    // Navegação
    const topBtn = getElement('topBtn');
    const bottomBtn = getElement('bottomBtn');
    
    if (topBtn) {
      topBtn.addEventListener('click', navigation.scrollToTop);
    }
    
    if (bottomBtn) {
      bottomBtn.addEventListener('click', navigation.scrollToBottom);
    }
    
    // Responsividade
    window.addEventListener('resize', responsiveManager.adjust.bind(responsiveManager));
    window.addEventListener('orientationchange', responsiveManager.adjust.bind(responsiveManager));
    
    // Monitorar mudanças de tema do sistema
    themeManager.setupSystemPreferenceMonitor();
  }
  
  /**
   * Inicialização do módulo
   */
  function initialize() {
    console.log('[UIController] Inicializando UI Controller refatorado...');
    
    try {
      // Aguardar DOMCache se disponível
      if (window.ModuleManager) {
        window.ModuleManager.whenReady('DOMCache', () => {
          initDOMCache();
        }, 5000);
      } else {
        initDOMCache();
      }
      
      // Configurar sistema de temas
      themeManager.loadPreference();
      
      // Configurar layout responsivo
      responsiveManager.adjust();
      
      // Configurar eventos
      setupEventListeners();
      
      // Registrar no sistema de módulos
      if (window.ModuleManager) {
        window.ModuleManager.register('UIController', publicAPI, ['DOMCache']);
      }
      
      console.log('[UIController] UI Controller inicializado com sucesso');
      
    } catch (error) {
      console.error('[UIController] Erro na inicialização:', error);
    }
  }
  
  // API pública
  const publicAPI = {
    // Funções principais
    updateStep,
    copiarTexto, // Manter para compatibilidade
    appendIpToList,
    carregarMaisSubRedes,
    toggleSelectAll,
    
    // Sistemas especializados
    theme: themeManager,
    notifications: notificationSystem,
    clipboard: clipboardManager,
    responsive: responsiveManager,
    navigation,
    display: displayManager,
    
    // Alias para notificações (compatibilidade)
    showNotification: notificationSystem.show.bind(notificationSystem),
    
    // Funções legadas mantidas para compatibilidade
    ajustarLayoutResponsivo: responsiveManager.adjust.bind(responsiveManager),
    
    // Utilitários
    getElement,
    safeDOMOperation
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
