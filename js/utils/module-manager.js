/**
 * Gerenciador de Módulos para Calculadora IPv6
 * 
 * Sistema centralizado para gerenciar dependências e carregamento de módulos
 * de forma mais limpa e organizada.
 */

const ModuleManager = (function() {
  'use strict';
  
  // Registro de módulos
  const modules = new Map();
  const dependencies = new Map();
  const loadedModules = new Set();
  const loadingPromises = new Map();
  
  // Estados dos módulos
  const ModuleState = {
    PENDING: 'pending',
    LOADING: 'loading',
    LOADED: 'loaded',
    ERROR: 'error'
  };
  
  // Configuração de debug
  const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  
  /**
   * Registra um módulo no sistema
   * @param {string} name - Nome do módulo
   * @param {*} module - Objeto do módulo
   * @param {Array<string>} deps - Lista de dependências
   * @returns {boolean} - True se registrado com sucesso
   */
  function register(name, module, deps = []) {
    try {
      if (!name || typeof name !== 'string') {
        throw new Error('Nome do módulo deve ser uma string válida');
      }
      
      if (modules.has(name)) {
        console.warn(`[ModuleManager] Módulo '${name}' já está registrado. Sobrescrevendo...`);
      }
      
      // Registrar módulo
      modules.set(name, {
        name,
        module,
        dependencies: deps,
        state: ModuleState.LOADED,
        loadedAt: Date.now()
      });
      
      // Registrar dependências
      dependencies.set(name, deps);
      loadedModules.add(name);
      
      // Disponibilizar globalmente
      window[name] = module;
      
      if (DEBUG) {
        console.log(`[ModuleManager] Módulo '${name}' registrado com sucesso`);
        if (deps.length > 0) {
          console.log(`[ModuleManager] Dependências de '${name}': [${deps.join(', ')}]`);
        }
      }
      
      // Verificar se dependências estão satisfeitas
      checkDependencies(name);
      
      return true;
    } catch (error) {
      console.error(`[ModuleManager] Erro ao registrar módulo '${name}':`, error);
      return false;
    }
  }
  
  /**
   * Obtém um módulo do registro
   * @param {string} name - Nome do módulo
   * @returns {*} - Módulo registrado ou null
   */
  function get(name) {
    if (!name || typeof name !== 'string') {
      console.warn('[ModuleManager] Nome do módulo deve ser uma string válida');
      return null;
    }
    
    const moduleData = modules.get(name);
    if (!moduleData) {
      console.warn(`[ModuleManager] Módulo '${name}' não encontrado`);
      return null;
    }
    
    if (moduleData.state !== ModuleState.LOADED) {
      console.warn(`[ModuleManager] Módulo '${name}' não está carregado (estado: ${moduleData.state})`);
      return null;
    }
    
    return moduleData.module;
  }
  
  /**
   * Verifica se um módulo está registrado e carregado
   * @param {string} name - Nome do módulo
   * @returns {boolean} - True se o módulo está disponível
   */
  function isLoaded(name) {
    const moduleData = modules.get(name);
    return moduleData && moduleData.state === ModuleState.LOADED;
  }
  
  /**
   * Verifica se todas as dependências de um módulo estão satisfeitas
   * @param {string} name - Nome do módulo
   * @returns {boolean} - True se todas as dependências estão satisfeitas
   */
  function checkDependencies(name) {
    const deps = dependencies.get(name) || [];
    const missing = deps.filter(dep => !isLoaded(dep));
    
    if (missing.length > 0) {
      console.warn(`[ModuleManager] Módulo '${name}' tem dependências não satisfeitas: [${missing.join(', ')}]`);
      return false;
    }
    
    if (DEBUG && deps.length > 0) {
      console.log(`[ModuleManager] Todas as dependências de '${name}' estão satisfeitas`);
    }
    
    return true;
  }
  
  /**
   * Aguarda um módulo ser carregado
   * @param {string} name - Nome do módulo
   * @param {number} timeout - Timeout em milissegundos
   * @returns {Promise} - Promise que resolve quando o módulo estiver carregado
   */
  function waitFor(name, timeout = 10000) {
    return new Promise((resolve, reject) => {
      // Se já estiver carregado, resolver imediatamente
      if (isLoaded(name)) {
        resolve(get(name));
        return;
      }
      
      // Se já existe uma promise de carregamento, retornar ela
      if (loadingPromises.has(name)) {
        return loadingPromises.get(name);
      }
      
      let timeoutId;
      let checkInterval;
      
      const checkLoaded = () => {
        if (isLoaded(name)) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          loadingPromises.delete(name);
          resolve(get(name));
        }
      };
      
      // Configurar timeout
      timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        loadingPromises.delete(name);
        reject(new Error(`Timeout aguardando módulo '${name}' (${timeout}ms)`));
      }, timeout);
      
      // Verificar periodicamente
      checkInterval = setInterval(checkLoaded, 100);
      
      // Armazenar promise
      const promise = new Promise((res, rej) => {
        // Promise já configurada acima
      });
      loadingPromises.set(name, promise);
    });
  }
  
  /**
   * Aguarda múltiplos módulos serem carregados
   * @param {Array<string>} names - Lista de nomes de módulos
   * @param {number} timeout - Timeout em milissegundos
   * @returns {Promise<Array>} - Promise que resolve com array de módulos
   */
  function waitForAll(names, timeout = 10000) {
    if (!Array.isArray(names)) {
      return Promise.reject(new Error('Lista de módulos deve ser um array'));
    }
    
    const promises = names.map(name => waitFor(name, timeout));
    return Promise.all(promises);
  }
  
  /**
   * Executa uma função quando um módulo estiver disponível
   * @param {string} name - Nome do módulo
   * @param {Function} callback - Função a ser executada
   * @param {number} timeout - Timeout em milissegundos
   */
  function whenReady(name, callback, timeout = 10000) {
    if (typeof callback !== 'function') {
      console.error('[ModuleManager] Callback deve ser uma função');
      return;
    }
    
    waitFor(name, timeout)
      .then(module => callback(module))
      .catch(error => {
        console.error(`[ModuleManager] Erro ao aguardar módulo '${name}':`, error);
      });
  }
  
  /**
   * Executa uma função quando todos os módulos estiverem disponíveis
   * @param {Array<string>} names - Lista de nomes de módulos
   * @param {Function} callback - Função a ser executada
   * @param {number} timeout - Timeout em milissegundos
   */
  function whenAllReady(names, callback, timeout = 10000) {
    if (typeof callback !== 'function') {
      console.error('[ModuleManager] Callback deve ser uma função');
      return;
    }
    
    waitForAll(names, timeout)
      .then(modules => callback(...modules))
      .catch(error => {
        console.error(`[ModuleManager] Erro ao aguardar módulos [${names.join(', ')}]:`, error);
      });
  }
  
  /**
   * Lista todos os módulos registrados
   * @returns {Array<Object>} - Array com informações dos módulos
   */
  function listModules() {
    const result = [];
    
    for (const [name, moduleData] of modules.entries()) {
      result.push({
        name: moduleData.name,
        state: moduleData.state,
        dependencies: moduleData.dependencies,
        loadedAt: moduleData.loadedAt,
        dependenciesSatisfied: checkDependencies(name)
      });
    }
    
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  /**
   * Obtém estatísticas dos módulos
   * @returns {Object} - Estatísticas dos módulos
   */
  function getStats() {
    const total = modules.size;
    const loaded = loadedModules.size;
    const loading = loadingPromises.size;
    
    return {
      total,
      loaded,
      loading,
      pending: total - loaded - loading,
      loadedPercentage: total > 0 ? Math.round((loaded / total) * 100) : 0
    };
  }
  
  /**
   * Verifica a saúde do sistema de módulos
   * @returns {Object} - Relatório de saúde
   */
  function healthCheck() {
    const issues = [];
    const warnings = [];
    
    // Verificar dependências circulares
    const circularDeps = findCircularDependencies();
    if (circularDeps.length > 0) {
      issues.push({
        type: 'circular_dependencies',
        message: 'Dependências circulares detectadas',
        details: circularDeps
      });
    }
    
    // Verificar módulos com dependências não satisfeitas
    for (const [name, deps] of dependencies.entries()) {
      const missing = deps.filter(dep => !isLoaded(dep));
      if (missing.length > 0) {
        warnings.push({
          type: 'missing_dependencies',
          module: name,
          missing: missing
        });
      }
    }
    
    // Verificar módulos órfãos (sem dependentes)
    const orphans = findOrphanModules();
    if (orphans.length > 0) {
      warnings.push({
        type: 'orphan_modules',
        message: 'Módulos sem dependentes encontrados',
        modules: orphans
      });
    }
    
    const stats = getStats();
    
    return {
      healthy: issues.length === 0,
      stats,
      issues,
      warnings,
      timestamp: Date.now()
    };
  }
  
  /**
   * Encontra dependências circulares
   * @returns {Array} - Lista de dependências circulares
   */
  function findCircularDependencies() {
    const visited = new Set();
    const visiting = new Set();
    const circular = [];
    
    function visit(name, path = []) {
      if (visiting.has(name)) {
        circular.push([...path, name]);
        return;
      }
      
      if (visited.has(name)) {
        return;
      }
      
      visiting.add(name);
      const deps = dependencies.get(name) || [];
      
      for (const dep of deps) {
        visit(dep, [...path, name]);
      }
      
      visiting.delete(name);
      visited.add(name);
    }
    
    for (const name of modules.keys()) {
      if (!visited.has(name)) {
        visit(name);
      }
    }
    
    return circular;
  }
  
  /**
   * Encontra módulos órfãos (sem dependentes)
   * @returns {Array<string>} - Lista de módulos órfãos
   */
  function findOrphanModules() {
    const dependents = new Set();
    
    // Coletar todos os módulos que são dependências
    for (const deps of dependencies.values()) {
      deps.forEach(dep => dependents.add(dep));
    }
    
    // Encontrar módulos que não são dependências de nenhum outro
    const orphans = [];
    for (const name of modules.keys()) {
      if (!dependents.has(name)) {
        orphans.push(name);
      }
    }
    
    return orphans;
  }
  
  /**
   * Cria um utilitário para verificação segura de módulos
   * @param {string} moduleName - Nome do módulo
   * @returns {Object} - Utilitário para o módulo
   */
  function createSafeAccessor(moduleName) {
    return {
      /**
       * Executa uma função se o módulo estiver disponível
       * @param {Function} fn - Função a ser executada
       * @param {*} fallback - Valor de fallback
       */
      ifAvailable(fn, fallback = null) {
        const module = get(moduleName);
        return module ? fn(module) : fallback;
      },
      
      /**
       * Obtém uma propriedade do módulo de forma segura
       * @param {string} property - Nome da propriedade
       * @param {*} fallback - Valor de fallback
       */
      getProperty(property, fallback = null) {
        const module = get(moduleName);
        return module && module[property] ? module[property] : fallback;
      },
      
      /**
       * Chama um método do módulo de forma segura
       * @param {string} method - Nome do método
       * @param {Array} args - Argumentos do método
       * @param {*} fallback - Valor de fallback
       */
      callMethod(method, args = [], fallback = null) {
        const module = get(moduleName);
        if (module && typeof module[method] === 'function') {
          try {
            return module[method](...args);
          } catch (error) {
            console.error(`[ModuleManager] Erro ao chamar ${moduleName}.${method}:`, error);
            return fallback;
          }
        }
        return fallback;
      },
      
      /**
       * Verifica se o módulo está carregado
       */
      isLoaded() {
        return isLoaded(moduleName);
      }
    };
  }
  
  /**
   * Inicialização do sistema
   */
  function initialize() {
    if (DEBUG) {
      console.log('[ModuleManager] Sistema de módulos inicializado');
      
      // Configurar verificação periódica em modo debug
      setInterval(() => {
        const stats = getStats();
        if (stats.loading > 0) {
          console.log(`[ModuleManager] Aguardando ${stats.loading} módulos...`);
        }
      }, 5000);
    }
    
    // Verificar módulos existentes no window
    detectExistingModules();
  }
  
  /**
   * Detecta módulos já existentes no window
   */
  function detectExistingModules() {
    const knownModules = [
      'IPv6Utils',
      'UIController', 
      'IPv6Calculator',
      'DOMCache',
      'ResponsiveHandler',
      'UIComponents',
      'ExportController',
      'OverlapChecker',
      'NetworkConfigModal'
    ];
    
    knownModules.forEach(name => {
      if (window[name] && !modules.has(name)) {
        console.log(`[ModuleManager] Detectado módulo existente: ${name}`);
        register(name, window[name]);
      }
    });
  }
  
  /**
   * Auto-registro para módulos comuns
   */
  const autoRegister = {
    /**
     * Registra IPv6Utils com suas dependências
     */
    IPv6Utils() {
      if (window.IPv6Utils) {
        register('IPv6Utils', window.IPv6Utils);
      }
    },
    
    /**
     * Registra UIController com suas dependências
     */
    UIController() {
      if (window.UIController) {
        register('UIController', window.UIController, ['DOMCache']);
      }
    },
    
    /**
     * Registra IPv6Calculator com suas dependências
     */
    IPv6Calculator() {
      if (window.IPv6Calculator) {
        register('IPv6Calculator', window.IPv6Calculator, ['IPv6Utils', 'UIController']);
      }
    },
    
    /**
     * Registra DOMCache
     */
    DOMCache() {
      if (window.DOMCache) {
        register('DOMCache', window.DOMCache);
      }
    },
    
    /**
     * Registra todos os módulos automaticamente
     */
    all() {
      this.DOMCache();
      this.IPv6Utils();
      this.UIController();
      this.IPv6Calculator();
      
      // Outros módulos opcionais
      ['ResponsiveHandler', 'UIComponents', 'ExportController', 'OverlapChecker', 'NetworkConfigModal'].forEach(name => {
        if (window[name]) {
          register(name, window[name]);
        }
      });
    }
  };
  
  /**
   * Utilitários para debug
   */
  const debug = {
    /**
     * Imprime relatório completo dos módulos
     */
    report() {
      console.group('[ModuleManager] Relatório de Módulos');
      
      const stats = getStats();
      console.log('Estatísticas:', stats);
      
      const health = healthCheck();
      console.log('Saúde do sistema:', health.healthy ? '✅ Saudável' : '⚠️ Problemas detectados');
      
      if (health.issues.length > 0) {
        console.warn('Problemas:', health.issues);
      }
      
      if (health.warnings.length > 0) {
        console.warn('Avisos:', health.warnings);
      }
      
      console.table(listModules());
      console.groupEnd();
    },
    
    /**
     * Monitora mudanças nos módulos
     */
    monitor() {
      const originalRegister = register;
      register = function(name, module, deps) {
        console.log(`[ModuleManager] Registrando módulo: ${name}`);
        return originalRegister(name, module, deps);
      };
      
      console.log('[ModuleManager] Monitoramento ativado');
    },
    
    /**
     * Simula carregamento lento de módulo para testes
     */
    simulateSlowLoad(name, delay = 2000) {
      console.log(`[ModuleManager] Simulando carregamento lento de '${name}' (${delay}ms)`);
      
      const originalModule = window[name];
      delete window[name];
      
      setTimeout(() => {
        window[name] = originalModule;
        if (originalModule) {
          register(name, originalModule);
        }
        console.log(`[ModuleManager] Módulo '${name}' carregado após delay`);
      }, delay);
    }
  };
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // API pública
  return {
    // Funções principais
    register,
    get,
    isLoaded,
    
    // Aguardar módulos
    waitFor,
    waitForAll,
    whenReady,
    whenAllReady,
    
    // Informações
    listModules,
    getStats,
    healthCheck,
    checkDependencies,
    
    // Utilitários
    createSafeAccessor,
    autoRegister,
    
    // Debug (apenas em desenvolvimento)
    ...(DEBUG ? { debug } : {})
  };
})();

// Exportar globalmente
window.ModuleManager = ModuleManager;
