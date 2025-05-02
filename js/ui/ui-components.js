/**
 * Componentes de UI para a Calculadora IPv6
 * Módulo que implementa componentes de interface reutilizáveis usando JavaScript puro
 */

const UIComponents = (function() {
  'use strict';
  
  /**
   * Tooltips avançados que seguem o cursor
   */
  const tooltips = {
    init: function() {
      // Adicionar tooltips a elementos com data-tooltip
      document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', this.showTooltip);
        element.addEventListener('mouseleave', this.hideTooltip);
        element.addEventListener('mousemove', this.moveTooltip);
      });
    },
    
    showTooltip: function(e) {
      const tooltip = document.createElement('div');
      tooltip.className = 'ui-tooltip';
      tooltip.textContent = this.getAttribute('data-tooltip');
      
      // Posicionamento inicial
      tooltip.style.position = 'fixed';
      tooltip.style.zIndex = '10000';
      tooltip.style.top = `${e.clientY + 10}px`;
      tooltip.style.left = `${e.clientX + 10}px`;
      
      // Estilização
      tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      tooltip.style.color = 'white';
      tooltip.style.padding = '6px 12px';
      tooltip.style.borderRadius = '4px';
      tooltip.style.fontSize = '12px';
      tooltip.style.maxWidth = '250px';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.transition = 'opacity 0.2s ease';
      tooltip.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
      
      // Modo escuro
      if (document.body.classList.contains('dark-mode')) {
        tooltip.style.backgroundColor = 'rgba(36, 41, 47, 0.9)';
        tooltip.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      }
      
      // Animação
      tooltip.style.opacity = '0';
      document.body.appendChild(tooltip);
      
      // Mostrar após inserir no DOM
      setTimeout(() => {
        tooltip.style.opacity = '1';
      }, 10);
      
      // Guardar referência para remoção
      this.tooltipElement = tooltip;
    },
    
    hideTooltip: function() {
      if (this.tooltipElement) {
        this.tooltipElement.style.opacity = '0';
        setTimeout(() => {
          if (this.tooltipElement && this.tooltipElement.parentNode) {
            document.body.removeChild(this.tooltipElement);
          }
          this.tooltipElement = null;
        }, 200);
      }
    },
    
    moveTooltip: function(e) {
      if (this.tooltipElement) {
        // Verificar se o tooltip está perto da borda direita da janela
        const rightEdge = window.innerWidth - e.clientX;
        if (rightEdge < 150) {
          this.tooltipElement.style.left = `${e.clientX - this.tooltipElement.offsetWidth - 10}px`;
        } else {
          this.tooltipElement.style.left = `${e.clientX + 10}px`;
        }
        
        // Verificar se o tooltip está perto da borda inferior
        const bottomEdge = window.innerHeight - e.clientY;
        if (bottomEdge < 50) {
          this.tooltipElement.style.top = `${e.clientY - this.tooltipElement.offsetHeight - 10}px`;
        } else {
          this.tooltipElement.style.top = `${e.clientY + 10}px`;
        }
      }
    }
  };
  
  /**
   * Toast notifications que desaparecem automaticamente
   */
  const toast = {
    show: function(message, type = 'info', duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `ui-toast ui-toast-${type}`;
      
      // ícone baseado no tipo
      const iconMap = {
        'success': '<i class="fas fa-check-circle"></i>',
        'error': '<i class="fas fa-exclamation-circle"></i>',
        'warning': '<i class="fas fa-exclamation-triangle"></i>',
        'info': '<i class="fas fa-info-circle"></i>'
      };
      
      // Conteúdo
      toast.innerHTML = `
        <div class="ui-toast-icon">${iconMap[type] || iconMap.info}</div>
        <div class="ui-toast-message">${message}</div>
        <button class="ui-toast-close"><i class="fas fa-times"></i></button>
      `;
      
      // Estilização
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.right = '20px';
      toast.style.minWidth = '300px';
      toast.style.padding = '12px 16px';
      toast.style.borderRadius = '6px';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '12px';
      toast.style.zIndex = '10000';
      toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      toast.style.animation = 'toastIn 0.3s ease forwards';
      
      // Cores por tipo
      const colors = {
        'success': { bg: '#4caf50', text: 'white' },
        'error': { bg: '#f44336', text: 'white' },
        'warning': { bg: '#ff9800', text: 'white' },
        'info': { bg: '#2196f3', text: 'white' }
      };
      
      if (colors[type]) {
        toast.style.backgroundColor = colors[type].bg;
        toast.style.color = colors[type].text;
      }
      
      // Estilos para o botão fechar
      const closeBtn = toast.querySelector('.ui-toast-close');
      closeBtn.style.background = 'none';
      closeBtn.style.border = 'none';
      closeBtn.style.color = 'inherit';
      closeBtn.style.opacity = '0.7';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.marginLeft = 'auto';
      closeBtn.style.padding = '4px';
      closeBtn.style.fontSize = '16px';
      
      // Adicionar keyframes de animação se não existirem
      if (!document.getElementById('toast-keyframes')) {
        const style = document.createElement('style');
        style.id = 'toast-keyframes';
        style.textContent = `
          @keyframes toastIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes toastOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
          }
        `;
        document.head.appendChild(style);
      }
      
      // Adicionar ao DOM
      document.body.appendChild(toast);
      
      // Adicionar evento para fechar
      closeBtn.addEventListener('click', () => {
        this.hide(toast);
      });
      
      // Auto-fechar após duração
      const timeoutId = setTimeout(() => {
        this.hide(toast);
      }, duration);
      
      // Pausar o timer ao passar o mouse
      toast.addEventListener('mouseenter', () => {
        clearTimeout(timeoutId);
      });
      
      // Remover ao clicar fora
      document.addEventListener('click', function closeToastOnClickOutside(e) {
        if (!toast.contains(e.target)) {
          document.removeEventListener('click', closeToastOnClickOutside);
          clearTimeout(timeoutId);
          this.hide(toast);
        }
      });
      
      return toast;
    },
    
    hide: function(toast) {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }
  };
  
  /**
   * Botões com efeitos de ondulação (ripple)
   */
  const rippleButtons = {
    init: function() {
      document.querySelectorAll('.btn-primary, .btn-secondary, .dns-btn').forEach(button => {
        button.addEventListener('click', this.createRipple);
      });
    },
    
    createRipple: function(e) {
      const button = this;
      
      // Remover ripples anteriores
      const ripples = button.querySelectorAll('.ripple');
      ripples.forEach(ripple => {
        if (ripple.parentNode === button) {
          button.removeChild(ripple);
        }
      });
      
      // Criar novo ripple
      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      button.appendChild(ripple);
      
      // Posicionar e dimensionar
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.position = 'absolute';
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.borderRadius = '50%';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 0.6s linear';
      ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      
      // Adicionar keyframes para animação
      if (!document.getElementById('ripple-keyframes')) {
        const style = document.createElement('style');
        style.id = 'ripple-keyframes';
        style.textContent = `
          @keyframes ripple {
            to {
              transform: scale(2);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
      
      // Remover após animação
      setTimeout(() => {
        if (ripple.parentNode === button) {
          button.removeChild(ripple);
        }
      }, 600);
    }
  };
  
  /**
   * Filtro dinâmico para listas de prefixos
   */
  const prefixFilter = {
    init: function() {
      // Verificar se temos a lista de prefixos
      const prefixesList = document.getElementById('possiblePrefixesList');
      if (!prefixesList) return;
      
      // Adicionar campo de pesquisa
      const filterContainer = document.createElement('div');
      filterContainer.className = 'prefix-filter-container';
      filterContainer.style.marginBottom = '16px';
      filterContainer.style.display = 'flex';
      filterContainer.style.alignItems = 'center';
      filterContainer.style.position = 'relative';
      
      const searchIcon = document.createElement('i');
      searchIcon.className = 'fas fa-search';
      searchIcon.style.position = 'absolute';
      searchIcon.style.left = '12px';
      searchIcon.style.color = '#666';
      
      const filterInput = document.createElement('input');
      filterInput.id = 'prefixFilter';
      filterInput.type = 'text';
      filterInput.placeholder = 'Filtrar prefixos...';
      filterInput.style.paddingLeft = '36px';
      
      // Adicionar elementos ao DOM
      filterContainer.appendChild(searchIcon);
      filterContainer.appendChild(filterInput);
      
      // Inserir antes da lista
      prefixesList.parentNode.insertBefore(filterContainer, prefixesList);
      
      // Adicionar eventos
      filterInput.addEventListener('input', this.filterPrefixes);
      
      // Adicionar botões de filtro rápido
      this.addQuickFilters(prefixesList);
    },
    
    addQuickFilters: function(prefixesList) {
      const quickFilters = document.createElement('div');
      quickFilters.className = 'quick-filters';
      quickFilters.style.display = 'flex';
      quickFilters.style.flexWrap = 'wrap';
      quickFilters.style.gap = '8px';
      quickFilters.style.marginTop = '12px';
      
      // Filtros comuns
      const filters = [
        { label: 'Todos', value: '' },
        { label: 'Comuns', value: 'common' },
        { label: '/64', value: '64' },
        { label: 'Até /80', value: '<=80' }
      ];
      
      filters.forEach(filter => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quick-filter-btn';
        btn.textContent = filter.label;
        btn.dataset.filter = filter.value;
        
        // Estilização
        btn.style.padding = '6px 12px';
        btn.style.borderRadius = '4px';
        btn.style.border = '1px solid #ccc';
        btn.style.background = 'white';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '12px';
        btn.style.transition = 'all 0.2s ease';
        
        if (filter.value === '') {
          btn.style.backgroundColor = '#f0f0f0';
          btn.style.borderColor = '#999';
        }
        
        // Evento
        btn.addEventListener('click', () => {
          document.querySelectorAll('.quick-filter-btn').forEach(b => {
            b.style.backgroundColor = 'white';
            b.style.borderColor = '#ccc';
          });
          
          btn.style.backgroundColor = '#f0f0f0';
          btn.style.borderColor = '#999';
          
          const filterInput = document.getElementById('prefixFilter');
          filterInput.value = filter.value;
          
          // Disparar evento de input
          const event = new Event('input');
          filterInput.
		  filterInput.dispatchEvent(event);
        });
        
        quickFilters.appendChild(btn);
      });
      
      // Inserir após o campo de filtro
      const filterContainer = document.getElementById('prefixFilter').parentNode;
      filterContainer.parentNode.insertBefore(quickFilters, filterContainer.nextSibling);
    },
    
    filterPrefixes: function() {
      const filterValue = this.value.toLowerCase();
      const prefixGroups = document.querySelectorAll('.prefix-group');
      
      prefixGroups.forEach(group => {
        const prefixItems = group.querySelectorAll('.prefix-item');
        let visibleItems = 0;
        
        prefixItems.forEach(item => {
          let shouldShow = true;
          
          // Filtros especiais
          if (filterValue === 'common') {
            shouldShow = item.classList.contains('common-prefix');
          } else if (filterValue.startsWith('<=')) {
            // Filtro para prefixos menores ou iguais a um valor
            const maxPrefix = parseInt(filterValue.substring(2));
            const itemPrefix = parseInt(item.textContent.replace('/', ''));
            shouldShow = !isNaN(itemPrefix) && itemPrefix <= maxPrefix;
          } else if (filterValue.startsWith('>=')) {
            // Filtro para prefixos maiores ou iguais a um valor
            const minPrefix = parseInt(filterValue.substring(2));
            const itemPrefix = parseInt(item.textContent.replace('/', ''));
            shouldShow = !isNaN(itemPrefix) && itemPrefix >= minPrefix;
          } else if (filterValue !== '') {
            // Filtro de texto simples
            shouldShow = item.textContent.toLowerCase().includes(filterValue);
          }
          
          item.style.display = shouldShow ? 'flex' : 'none';
          if (shouldShow) visibleItems++;
        });
        
        // Mostrar/ocultar o grupo inteiro
        group.style.display = visibleItems > 0 ? 'block' : 'none';
      });
    }
  };
  
  /**
   * Sistema de temas simplificado
   * Agora apenas adicionando funcionalidades extras sem interferir no tema principal
   */
  const themeSystem = {
    init: function() {
      // Não manipularemos mais o botão de tema principal
      // Apenas monitorar mudanças na preferência do sistema
      this.setupSystemPreferenceMonitor();
      
      // Estilizar o botão de tema para melhor aparência
      this.styleThemeButton();
    },
    
    /**
     * Adiciona estilos ao botão de tema
     */
    styleThemeButton: function() {
      const themeBtn = document.getElementById('toggleThemeBtn');
      if (!themeBtn) return;
      
      // Adicionar posição relativa para efeitos
      themeBtn.style.position = 'relative';
      themeBtn.style.overflow = 'hidden';
      
      // Adicionar classe para identificar
      themeBtn.classList.add('theme-toggle-btn');
    },
    
    /**
     * Monitora as mudanças do sistema para tema escuro/claro
     */
    setupSystemPreferenceMonitor: function() {
      // Monitorar mudanças na preferência de tema do sistema
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      darkModeMediaQuery.addEventListener('change', e => {
        const themePreference = localStorage.getItem('themePreference');
        
        // Aplicar apenas se estiver usando o tema do sistema
        if (themePreference === 'system' || !themePreference) {
          document.body.classList.toggle('dark-mode', e.matches);
          
          // Atualizar ícone do botão
          const themeBtn = document.getElementById('toggleThemeBtn');
          if (themeBtn) {
            themeBtn.innerHTML = e.matches ? 
              '<i class="fas fa-sun"></i> Tema' : 
              '<i class="fas fa-moon"></i> Tema';
          }
          
          // Atualizar visualizações se necessário
          if (window.VisualizationModule) {
            window.VisualizationModule.updateChartsForTheme();
          }
        }
      });
    }
  };
  
  /**
   * Animações de scroll
   */
  const scrollEffects = {
    init: function() {
      // Adicionar classes para elementos que devem animar ao scrollar
      this.addAnimationClasses();
      
      // Iniciar observador de interseção
      this.setupIntersectionObserver();
      
      // Adicionar rolagem suave para todos os links de âncora
      this.setupSmoothScroll();
    },
    
    addAnimationClasses: function() {
      // Cards com animação de entrada
      document.querySelectorAll('.card, .sidebar').forEach((el, index) => {
        el.classList.add('animate-on-scroll');
        el.style.setProperty('--animation-order', index);
        el.style.opacity = '0';
      });
      
      // Adicionar estilos de animação
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-on-scroll {
          opacity: 0;
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        
        .animate-on-scroll.visible {
          animation: fadeInUp 0.5s ease forwards;
          animation-delay: calc(var(--animation-order) * 0.1s);
        }
      `;
      document.head.appendChild(style);
    },
    
    setupIntersectionObserver: function() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Parar de observar após animar
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
      
      // Observar todos os elementos com classe animate-on-scroll
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
      });
    },
    
    setupSmoothScroll: function() {
      // Adicionar rolagem suave para links de âncora
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          
          const targetId = this.getAttribute('href');
          const targetElement = document.querySelector(targetId);
          
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth'
            });
          }
        });
      });
    }
  };
  
  /**
   * Melhorias para os botões DNS na sidebar
   */
  const dnsButtonsEnhance = {
    init: function() {
      // Aplicar estilos consistentes aos botões DNS na sidebar
      this.styleSidebarDnsButtons();
    },
    
    styleSidebarDnsButtons: function() {
      // Encontrar botões DNS na sidebar
      const sidebarDnsButtons = document.querySelectorAll('#infoSidebar .dns-buttons .dns-btn');
      
      sidebarDnsButtons.forEach(button => {
        // Aplicar estilos consistentes
        button.style.display = 'flex';
        button.style.flexDirection = 'column';
        button.style.width = '100%';
        button.style.marginBottom = '8px';
        button.style.textAlign = 'left';
        button.style.padding = '8px 12px';
        button.style.borderRadius = '4px';
        button.style.transition = 'all 0.2s ease';
        
        // Estilizar elementos internos
        const label = button.querySelector('.dns-label');
        if (label) {
          label.style.fontWeight = '600';
          label.style.marginBottom = '4px';
        }
        
        const address = button.querySelector('.dns-address');
        if (address) {
          address.style.fontFamily = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";
          address.style.fontSize = '12px';
          address.style.opacity = '0.8';
        }
        
        // Adicionar efeitos hover
        button.addEventListener('mouseenter', function() {
          this.style.backgroundColor = 'var(--primary-color)';
          this.style.color = 'white';
          this.style.transform = 'translateY(-2px)';
          this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
        });
        
        button.addEventListener('mouseleave', function() {
          this.style.backgroundColor = '';
          this.style.color = '';
          this.style.transform = '';
          this.style.boxShadow = '';
        });
      });
    }
  };
  
  /**
   * Inicializa todos os componentes
   */
  function initialize() {
    try {
      console.log("Inicializando UIComponents...");
      
      // Inicializar componentes
      tooltips.init();
      rippleButtons.init();
      prefixFilter.init();
      themeSystem.init();
      scrollEffects.init();
      dnsButtonsEnhance.init();
      
      console.log("UIComponents inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar UIComponents:", error);
    }
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // API pública
  return {
    toast,
    tooltips,
    themeSystem
  };
})();

// Exportar globalmente
window.UIComponents = UIComponents;