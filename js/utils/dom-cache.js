/**
 * Cache DOM otimizado para Calculadora IPv6
 * 
 * Este módulo gerencia o cache de elementos DOM para melhorar a performance
 * e reduzir consultas repetitivas ao DOM.
 */

const DOMCache = (function() {
  'use strict';
  
  // Cache principal
  const elementCache = new Map();
  const queryCache = new Map();
  
  // Observador para limpeza automática
  let mutationObserver = null;
  
  /**
   * Obtém um elemento pelo ID (com cache)
   * @param {string} id - ID do elemento
   * @returns {HTMLElement|null} - Elemento encontrado ou null
   */
  function getElementById(id) {
    if (!id) {
      console.warn('[DOMCache] ID vazio fornecido para getElementById');
      return null;
    }
    
    // Verificar cache primeiro
    if (elementCache.has(id)) {
      const cached = elementCache.get(id);
      
      // Verificar se o elemento ainda está no DOM
      if (cached && document.contains(cached)) {
        return cached;
      } else {
        // Remover do cache se não estiver mais no DOM
        elementCache.delete(id);
      }
    }
    
    // Buscar elemento e adicionar ao cache
    const element = document.getElementById(id);
    if (element) {
      elementCache.set(id, element);
    }
    
    return element;
  }
  
  /**
   * Obtém elementos por seletor (com cache)
   * @param {string} selector - Seletor CSS
   * @param {HTMLElement} context - Contexto de busca (opcional)
   * @returns {NodeList} - Lista de elementos encontrados
   */
  function querySelector(selector, context = document) {
    if (!selector) {
      console.warn('[DOMCache] Seletor vazio fornecido para querySelector');
      return document.querySelectorAll('');
    }
    
    const cacheKey = `${selector}:${context === document ? 'document' : 'context'}`;
    
    // Verificar cache
    if (queryCache.has(cacheKey)) {
      const cached = queryCache.get(cacheKey);
      
      // Verificar se todos os elementos ainda estão no DOM
      const allValid = Array.from(cached).every(el => document.contains(el));
      
      if (allValid) {
        return cached;
      } else {
        // Remover do cache se algum elemento não estiver mais no DOM
        queryCache.delete(cacheKey);
      }
    }
    
    // Buscar elementos e adicionar ao cache
    const elements = context.querySelectorAll(selector);
    if (elements.length > 0) {
      queryCache.set(cacheKey, elements);
    }
    
    return elements;
  }
  
  /**
   * Obtém um elemento por seletor (com cache)
   * @param {string} selector - Seletor CSS
   * @param {HTMLElement} context - Contexto de busca (opcional)
   * @returns {HTMLElement|null} - Primeiro elemento encontrado ou null
   */
  function querySelectorSingle(selector, context = document) {
    const elements = querySelector(selector, context);
    return elements.length > 0 ? elements[0] : null;
  }
  
  /**
   * Cache para elementos comuns da aplicação
   */
  const commonElements = {
    // Cache de elementos frequentemente utilizados
    _cache: new Map(),
    
    get container() {
      return this._getOrCache('container', () => getElementById('container') || document.querySelector('.container'));
    },
    
    get header() {
      return this._getOrCache('header', () => document.querySelector('.header'));
    },
    
    get mainLayout() {
      return this._getOrCache('mainLayout', () => document.querySelector('.main-layout'));
    },
    
    get subnetsTable() {
      return this._getOrCache('subnetsTable', () => getElementById('subnetsTable'));
    },
    
    get subnetsTableBody() {
      return this._getOrCache('subnetsTableBody', () => document.querySelector('#subnetsTable tbody'));
    },
    
    get ipv6Input() {
      return this._getOrCache('ipv6Input', () => getElementById('ipv6'));
    },
    
    get calcularBtn() {
      return this._getOrCache('calcularBtn', () => getElementById('calcularBtn'));
    },
    
    get resetBtn() {
      return this._getOrCache('resetBtn', () => getElementById('resetBtn'));
    },
    
    get toggleThemeBtn() {
      return this._getOrCache('toggleThemeBtn', () => getElementById('toggleThemeBtn'));
    },
    
    get loadingIndicator() {
      return this._getOrCache('loadingIndicator', () => getElementById('loadingIndicator'));
    },
    
    get errorMessage() {
      return this._getOrCache('errorMessage', () => getElementById('errorMessage'));
    },
    
    get infoSidebar() {
      return this._getOrCache('infoSidebar', () => getElementById('infoSidebar'));
    },
    
    get mainBlockSection() {
      return this._getOrCache('mainBlockSection', () => getElementById('mainBlockSection'));
    },
    
    get suggestions() {
      return this._getOrCache('suggestions', () => getElementById('suggestions'));
    },
    
    get resultado() {
      return this._getOrCache('resultado', () => getElementById('resultado'));
    },
    
    get ipsResult() {
      return this._getOrCache('ipsResult', () => getElementById('ipsResult'));
    },
    
    get ipsList() {
      return this._getOrCache('ipsList', () => getElementById('ipsList'));
    },
    
    get mainBlockIpsList() {
      return this._getOrCache('mainBlockIpsList', () => getElementById('mainBlockIpsList'));
    },
    
    get loadMoreButton() {
      return this._getOrCache('loadMoreButton', () => getElementById('loadMoreButton'));
    },
    
    get loadMoreContainer() {
      return this._getOrCache('loadMoreContainer', () => getElementById('loadMoreContainer'));
    },
    
    get selectAllCheckbox() {
      return this._getOrCache('selectAllCheckbox', () => getElementById('selectAll'));
    },
    
    get possiblePrefixesList() {
      return this._getOrCache('possiblePrefixesList', () => getElementById('possiblePrefixesList'));
    },
    
    get aggregatedContent() {
      return this._getOrCache('aggregatedContent', () => getElementById('aggregatedContent'));
    },
    
    get aggregatedPrefix() {
      return this._getOrCache('aggregatedPrefix', () => getElementById('aggregatedPrefix'));
    },
    
    get sidebarBlockCidr() {
      return this._getOrCache('sidebarBlockCidr', () => getElementById('sidebarBlockCidr'));
    },
    
    get mainBlockCidr() {
      return this._getOrCache('mainBlockCidr', () => getElementById('mainBlockCidr'));
    },
    
    get mainBlockGateway() {
      return this._getOrCache('mainBlockGateway', () => getElementById('mainBlockGateway'));
    },
    
    // Método auxiliar para cache interno
    _getOrCache(key, getter) {
      if (this._cache.has(key)) {
        const cached = this._cache.get(key);
        if (cached && document.contains(cached)) {
          return cached;
        } else {
          this._cache.delete(key);
        }
      }
      
      const element = getter();
      if (element) {
        this._cache.set(key, element);
      }
      
      return element;
    },
    
    // Limpar cache interno
    clear() {
      this._cache.clear();
    }
  };
  
  /**
   * Utilitários para operações DOM comuns
   */
  const domUtils = {
    /**
     * Mostra um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {string} display - Tipo de display (optional)
     */
    show(element, display = 'block') {
      const el = typeof element === 'string' ? getElementById(element) : element;
      if (el) {
        el.style.display = display;
      }
    },
    
    /**
     * Oculta um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     */
    hide(element) {
      const el = typeof element === 'string' ? getElementById(element) : element;
      if (el) {
        el.style.display = 'none';
      }
    },
    
    /**
     * Alterna visibilidade de um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {string} display - Tipo de display quando visível
     */
    toggle(element, display = 'block') {
      const el = typeof element === 'string' ? getElementById(element) : element;
      if (el) {
        el.style.display = el.style.display === 'none' ? display : 'none';
      }
    },
    
    /**
     * Define o texto de um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {string} text - Texto a ser definido
     */
    setText(element, text) {
      const el = typeof element === 'string' ? getElementById(element) : element;
      if (el) {
        el.textContent = text;
      }
    },
    
    /**
     * Define o HTML de um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {string} html - HTML a ser definido
     */
    setHTML(element, html) {
      const el = typeof element === 'string' ? getElementById(element) : element;
      if (el) {
        el.innerHTML = html;
      }
    },
    
    /**
     * Adiciona uma classe a um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {string} className - Nome da classe
     */
    addClass(element, className) {
      const el = typeof element === 'string' ? getElementById(element) : element;
      if (el && className) {
        el.classList.add(className);
      }
    },
    
    /**
     * Remove uma classe de um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {string} className - Nome da classe
     */
    removeClass(element, className) {
      const el = typeof element === 'string' ? getElementById(element) : element;
      if (el && className) {
        el.classList.remove(className);
      }
    },
    
    /**
     * Alterna uma classe em um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {string} className - Nome da classe
     */
    toggleClass(element, className) {
      const el = typeof element === 'string' ? getElementById(element) : element;
      if (el && className) {
        el.classList.toggle(className);
      }
    },
    
    /**
     * Verifica se um elemento tem uma classe
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {string} className - Nome da classe
     * @returns {boolean} - True se o elemento tem a classe
     */
    hasClass(element, className) {
      const el = typeof element === 'string' ? getElementById(element) : element;
      return el && className ? el.classList.contains(className) : false;
    },
    
    /**
     * Remove todos os filhos de um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     */
    empty(element) {
      const el = typeof element === 'string' ? getElementById(element) : element;
      if (el) {
        while (el.firstChild) {
          el.removeChild(el.firstChild);
        }
      }
    },
    
    /**
     * Rola até um elemento
     * @param {string|HTMLElement} element - ID ou elemento
     * @param {Object} options - Opções de scroll
     */
    scrollTo(element, options = { behavior: 'smooth' }) {
      const el = typeof element === 'string' ? getElementById(element) : element;
      if (el && el.scrollIntoView) {
        el.scrollIntoView(options);
      }
    }
  };
  
  /**
   * Configurar observador de mutações para limpeza automática
   */
  function setupMutationObserver() {
    if (mutationObserver) {
      return; // Já configurado
    }
    
    mutationObserver = new MutationObserver(function(mutations) {
      let shouldClearCache = false;
      
      mutations.forEach(function(mutation) {
        // Se nós foram removidos, limpar cache
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          shouldClearCache = true;
        }
      });
      
      if (shouldClearCache) {
        // Debounce da limpeza de cache
        clearTimeout(setupMutationObserver.clearTimeout);
        setupMutationObserver.clearTimeout = setTimeout(clearStaleCache, 100);
      }
    });
    
    // Observar mudanças no documento
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Limpar entradas inválidas do cache
   */
  function clearStaleCache() {
    // Limpar cache de elementos
    for (const [id, element] of elementCache.entries()) {
      if (!element || !document.contains(element)) {
        elementCache.delete(id);
      }
    }
    
    // Limpar cache de consultas
    for (const [selector, elements] of queryCache.entries()) {
      const allValid = Array.from(elements).every(el => document.contains(el));
      if (!allValid) {
        queryCache.delete(selector);
      }
    }
    
    // Limpar cache comum
    commonElements.clear();
  }
  
  /**
   * Limpar todo o cache
   */
  function clearCache() {
    elementCache.clear();
    queryCache.clear();
    commonElements.clear();
  }
  
  /**
   * Destruir o cache e observador
   */
  function destroy() {
    clearCache();
    
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
  }
  
  /**
   * Obter estatísticas do cache
   * @returns {Object} - Estatísticas do cache
   */
  function getStats() {
    return {
      elementCacheSize: elementCache.size,
      queryCacheSize: queryCache.size,
      commonElementsCacheSize: commonElements._cache.size,
      totalCacheSize: elementCache.size + queryCache.size + commonElements._cache.size
    };
  }
  
  /**
   * Inicializar o cache DOM
   */
  function initialize() {
    console.log('[DOMCache] Inicializando cache DOM...');
    
    // Configurar observador de mutações
    setupMutationObserver();
    
    // Pré-carregar elementos comuns
    setTimeout(() => {
      preloadCommonElements();
    }, 100);
    
    console.log('[DOMCache] Cache DOM inicializado com sucesso');
  }
  
  /**
   * Pré-carregar elementos comuns para melhorar performance inicial
   */
  function preloadCommonElements() {
    try {
      // Acessar propriedades dos elementos comuns para carregá-los no cache
      const elementsToPreload = [
        'container', 'header', 'mainLayout', 'subnetsTable', 'ipv6Input',
        'calcularBtn', 'resetBtn', 'toggleThemeBtn', 'loadingIndicator',
        'errorMessage', 'infoSidebar', 'mainBlockSection', 'suggestions',
        'resultado', 'ipsResult'
      ];
      
      elementsToPreload.forEach(elementName => {
        // Acessar a propriedade para trigger o cache
        const element = commonElements[elementName];
        if (element) {
          console.log(`[DOMCache] Elemento ${elementName} pré-carregado no cache`);
        }
      });
      
    } catch (error) {
      console.warn('[DOMCache] Erro ao pré-carregar elementos:', error);
    }
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Limpeza quando a página for descarregada
  window.addEventListener('beforeunload', destroy);
  
  // API pública
  return {
    // Funções principais
    getElementById,
    querySelector,
    querySelectorSingle,
    
    // Cache de elementos comuns
    elements: commonElements,
    
    // Utilitários DOM
    utils: domUtils,
    
    // Gerenciamento de cache
    clearCache,
    clearStaleCache,
    getStats,
    
    // Destruição
    destroy,
    
    // Aliases para compatibilidade
    get: getElementById,
    getAll: querySelector,
    getFirst: querySelectorSingle
  };
})();

// Exportar globalmente
window.DOMCache = DOMCache;
