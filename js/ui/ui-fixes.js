/**
 * Correções para a UI da Calculadora IPv6
 * 
 * Este script corrige problemas identificados na interface, incluindo:
 * 1. Botões de filtro duplicados
 * 2. Consistência nos botões de copiar da sidebar
 */

(function() {
  'use strict';
  
  // Executar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  /**
   * Inicializa todas as correções
   */
  function initialize() {
    console.log("Inicializando correções de UI para Calculadora IPv6...");
    
    // Aplicar estilos
    applyStyles();
    
    // Corrigir problemas de UI
    setTimeout(function() {
      // Corrigir botões de filtro duplicados
      fixDuplicateFilterButtons();
      
      // Padronizar botões de copiar na sidebar
      standardizeCopyButtons();
      
      // Corrigir comportamento do filtro de prefixos
      fixPrefixFilter();
      
      // Configurar manipuladores de evento
      setupEventHandlers();
      
      console.log("Correções de UI aplicadas com sucesso!");
    }, 500); // Pequeno atraso para garantir que outros scripts foram carregados
  }
  
  /**
   * Aplica estilos necessários
   */
  function applyStyles() {
    const styleId = 'ipv6-ui-fixes-style';
    
    // Verificar se os estilos já foram aplicados
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Estilos para os botões de filtro de prefixo */
      .quick-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
        margin-bottom: 16px;
      }

      .quick-filter-btn {
        padding: 6px 12px;
        border-radius: 4px;
        border: 1px solid var(--border-light);
        background: white;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .quick-filter-btn:hover {
        background-color: var(--bg-light-accent);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .quick-filter-btn.active {
        background-color: var(--primary-color);
        color: white;
        border-color: var(--primary-color);
      }

      /* Estilos para o campo de pesquisa de prefixos */
      .prefix-filter-container {
        position: relative;
        margin-bottom: 16px;
      }

      .prefix-filter-container input {
        padding-left: 36px;
        border-radius: 4px;
        height: 38px;
        border: 1px solid var(--border-light);
        width: 100%;
      }

      .prefix-filter-container i {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-light-secondary);
      }

      /* Estilos para botões de copiar na sidebar */
      #infoSidebar .info-value-container,
      #aggregatedSidebar .info-value-container {
        display: flex;
        align-items: center;
        background-color: var(--bg-light-accent);
        border: 1px solid var(--border-light);
        border-radius: var(--border-radius-sm);
        overflow: hidden;
      }

      #infoSidebar .info-value,
      #aggregatedSidebar .info-value {
        flex: 1;
        padding: 10px 12px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        font-size: 14px;
        color: var(--primary-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        border: none;
        background: transparent;
      }

      #infoSidebar .copy-btn,
      #aggregatedSidebar .copy-btn {
        padding: 0;
        width: 36px;
        height: 36px;
        min-width: 36px;
        border-radius: 0;
        background-color: rgba(0, 112, 209, 0.1);
        color: var(--primary-color);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #infoSidebar .copy-btn:hover,
      #aggregatedSidebar .copy-btn:hover {
        background-color: var(--primary-color);
        color: white;
      }

      /* Estilos para o modo escuro */
      body.dark-mode .quick-filter-btn {
        background-color: var(--bg-dark-accent);
        border-color: var(--border-dark);
        color: var(--text-dark);
      }

      body.dark-mode .quick-filter-btn:hover {
        background-color: var(--bg-dark);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }

      body.dark-mode .quick-filter-btn.active {
        background-color: var(--primary-light);
        color: white;
        border-color: var(--primary-light);
      }

      body.dark-mode #infoSidebar .info-value-container,
      body.dark-mode #aggregatedSidebar .info-value-container {
        background-color: var(--bg-dark-accent);
        border-color: var(--border-dark);
      }

      body.dark-mode #infoSidebar .info-value,
      body.dark-mode #aggregatedSidebar .info-value {
        color: var(--primary-light);
      }

      body.dark-mode #infoSidebar .copy-btn,
      body.dark-mode #aggregatedSidebar .copy-btn {
        background-color: rgba(38, 137, 219, 0.1);
        color: var(--primary-light);
      }

      body.dark-mode #infoSidebar .copy-btn:hover,
      body.dark-mode #aggregatedSidebar .copy-btn:hover {
        background-color: var(--primary-light);
        color: white;
      }

      /* Melhorias para botões da lista de IPs */
      .ip-item .copy-btn {
        background-color: var(--primary-color);
        color: white;
        border-radius: var(--border-radius-sm);
        height: 32px;
        width: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: all 0.2s ease;
      }

      .ip-item .copy-btn:hover {
        background-color: var(--primary-light);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      body.dark-mode .ip-item .copy-btn {
        background-color: var(--primary-light);
      }

      body.dark-mode .ip-item .copy-btn:hover {
        background-color: var(--primary-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Configura os manipuladores de eventos
   */
  function setupEventHandlers() {
    // Monitorar mudanças no tema
    const themeBtn = document.getElementById('toggleThemeBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', function() {
        // Pequeno atraso para permitir que a classe dark-mode seja aplicada
        setTimeout(standardizeCopyButtons, 100);
      });
    }
    
    // Observar mudanças na visibilidade da seção de sugestões
    const suggestionsObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'style') {
          const suggestionsEl = document.getElementById('suggestions');
          if (suggestionsEl && suggestionsEl.style.display !== 'none') {
            // Quando as sugestões de prefixo forem mostradas, corrigir os botões de filtro
            setTimeout(fixDuplicateFilterButtons, 100);
            setTimeout(fixPrefixFilter, 100);
          }
        }
      });
    });
    
    const suggestionsEl = document.getElementById('suggestions');
    if (suggestionsEl) {
      suggestionsObserver.observe(suggestionsEl, { attributes: true });
    }
  }
  
  /**
   * Corrige botões de filtro duplicados
   */
  function fixDuplicateFilterButtons() {
    // Verificar se existem containers de quick-filters
    const quickFiltersContainers = document.querySelectorAll('.quick-filters');
    
    if (quickFiltersContainers.length > 1) {
      console.log("Detectados containers de filtros duplicados. Removendo duplicatas...");
      
      // Manter apenas o primeiro container
      for (let i = 1; i < quickFiltersContainers.length; i++) {
        if (quickFiltersContainers[i].parentNode) {
          quickFiltersContainers[i].parentNode.removeChild(quickFiltersContainers[i]);
        }
      }
    }
    
    // Verificar se existem botões de filtro
    const filterBtns = document.querySelectorAll('.quick-filter-btn');
    if (filterBtns.length === 0) {
      // Criar botões de filtro se não existirem
      createQuickFilterButtons();
    }
  }
  
  /**
   * Cria botões de filtro rápido
   */
  function createQuickFilterButtons() {
    const prefixesList = document.getElementById('possiblePrefixesList');
    if (!prefixesList) return;
    
    // Criar container
    const quickFilters = document.createElement('div');
    quickFilters.className = 'quick-filters';
    
    // Filtros comuns
    const filters = [
      { label: 'Todos', value: '' },
      { label: 'Comuns', value: 'common' },
      { label: '/64', value: '64' },
      { label: 'Até /80', value: '<=80' }
    ];
    
    filters.forEach((filter, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'quick-filter-btn';
      if (index === 0) btn.classList.add('active');
      btn.textContent = filter.label;
      btn.dataset.filter = filter.value;
      
      // Adicionar evento de clique
      btn.addEventListener('click', function() {
        // Remover classe ativa de todos os botões
        document.querySelectorAll('.quick-filter-btn').forEach(b => {
          b.classList.remove('active');
        });
        
        // Adicionar classe ativa ao botão clicado
        this.classList.add('active');
        
        // Aplicar filtro
        const prefixFilter = document.getElementById('prefixFilter');
        if (prefixFilter) {
          prefixFilter.value = filter.value;
          
          // Disparar evento de input
          const event = new Event('input');
          prefixFilter.dispatchEvent(event);
        } else {
          // Aplicar filtro diretamente se não houver campo de filtro
          applyPrefixFilter(filter.value);
        }
      });
      
      quickFilters.appendChild(btn);
    });
    
    // Inserir no DOM
    const insertTarget = prefixesList.parentNode.querySelector('.prefix-filter-container');
    if (insertTarget) {
      // Inserir após o campo de filtro
      insertTarget.after(quickFilters);
    } else {
      // Inserir antes da lista se não houver campo de filtro
      prefixesList.parentNode.insertBefore(quickFilters, prefixesList);
    }
  }
  
  /**
   * Corrige o comportamento do filtro de prefixos
   */
  function fixPrefixFilter() {
    const prefixesList = document.getElementById('possiblePrefixesList');
    if (!prefixesList) return;
    
    // Verificar se já existe um campo de filtro
    let prefixFilter = document.getElementById('prefixFilter');
    
    if (!prefixFilter) {
      // Criar campo de filtro se não existir
      const filterContainer = document.createElement('div');
      filterContainer.className = 'prefix-filter-container';
      
      const searchIcon = document.createElement('i');
      searchIcon.className = 'fas fa-search';
      
      prefixFilter = document.createElement('input');
      prefixFilter.id = 'prefixFilter';
      prefixFilter.type = 'text';
      prefixFilter.placeholder = 'Filtrar prefixos...';
      
      filterContainer.appendChild(searchIcon);
      filterContainer.appendChild(prefixFilter);
      
      // Inserir antes da lista
      prefixesList.parentNode.insertBefore(filterContainer, prefixesList);
    }
    
    // Garantir que o event listener esteja anexado
    const newInput = prefixFilter.cloneNode(true);
    if (prefixFilter.parentNode) {
      prefixFilter.parentNode.replaceChild(newInput, prefixFilter);
      
      // Adicionar event listener
      newInput.addEventListener('input', function() {
        applyPrefixFilter(this.value);
      });
    }
  }
  
  /**
   * Aplica filtro aos prefixos
   * @param {string} filterValue - Valor do filtro
   */
  function applyPrefixFilter(filterValue) {
    filterValue = filterValue.toLowerCase();
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
  
  /**
   * Padroniza os botões de copiar em toda a aplicação
   */
  function standardizeCopyButtons() {
    // Padronizar botões da sidebar
    const sidebarCopyButtons = document.querySelectorAll('#infoSidebar .copy-btn, #aggregatedSidebar .copy-btn');
    
    sidebarCopyButtons.forEach(button => {
      // Garantir que o botão tenha o ícone correto
      if (!button.querySelector('.fas.fa-copy')) {
        button.innerHTML = '<i class="fas fa-copy"></i>';
      }
      
      // Aplicar estilo consistente
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.width = '36px';
      button.style.height = '36px';
      button.style.minWidth = '36px'; // Evitar que seja comprimido
      button.style.padding = '0';
      button.style.borderRadius = '0';
      
      // Aplicar cores baseadas no tema
      if (document.body.classList.contains('dark-mode')) {
        button.style.backgroundColor = 'rgba(38, 137, 219, 0.1)';
        button.style.color = 'var(--primary-light)';
      } else {
        button.style.backgroundColor = 'rgba(0, 112, 209, 0.1)';
        button.style.color = 'var(--primary-color)';
      }
      
      // Limpar event listeners anteriores
      const newButton = button.cloneNode(true);
      if (button.parentNode) {
        button.parentNode.replaceChild(newButton, button);
        
        // Re-adicionar o evento de clique original
        if (newButton.onclick) {
          const originalOnClick = newButton.onclick;
          newButton.onclick = function(e) {
            originalOnClick.call(this, e);
            
            // Adicionar feedback visual
            const originalHTML = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i>';
            
            setTimeout(() => {
              this.innerHTML = originalHTML;
            }, 1500);
          };
        }
      }
    });
    
    // Melhorar estilo dos containers de valores na sidebar
    const infoValueContainers = document.querySelectorAll('#infoSidebar .info-value-container, #aggregatedSidebar .info-value-container');
    
    infoValueContainers.forEach(container => {
      container.style.display = 'flex';
      container.style.alignItems = 'center';
      container.style.border = document.body.classList.contains('dark-mode') 
        ? '1px solid var(--border-dark)' 
        : '1px solid var(--border-light)';
      container.style.borderRadius = 'var(--border-radius-sm)';
      container.style.overflow = 'hidden';
      
      // Ajustar o valor dentro do container
      const infoValue = container.querySelector('.info-value');
      if (infoValue) {
        infoValue.style.flex = '1';
        infoValue.style.padding = '10px 12px';
        infoValue.style.border = 'none';
        infoValue.style.borderRadius = '0';
        
        // Aplicar cores baseadas no tema
        if (document.body.classList.contains('dark-mode')) {
          infoValue.style.backgroundColor = 'var(--bg-dark-accent)';
          infoValue.style.color = 'var(--primary-light)';
        } else {
          infoValue.style.backgroundColor = 'var(--bg-light-accent)';
          infoValue.style.color = 'var(--primary-color)';
        }
      }
    });
  }
})();