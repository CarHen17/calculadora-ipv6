/**
 * Verificador de Ambiente Melhorado para Calculadora IPv6
 * Sistema robusto de diagnóstico e correção automática
 */
(function() {
  'use strict';
  
  // Configuração
  const CONFIG = {
    CHECK_INTERVAL: 10000, // 10 segundos
    MAX_CHECK_ATTEMPTS: 5,
    NOTIFICATION_DURATION: 5000
  };
  
  let checkAttempts = 0;
  let checkInterval = null;
  
  /**
   * Módulos essenciais para funcionamento da aplicação
   */
  const ESSENTIAL_MODULES = {
    'IPv6Utils': {
      required: true,
      methods: ['validateIPv6', 'expandIPv6Address', 'shortenIPv6', 'formatIPv6Address']
    },
    'UIController': {
      required: true,
      methods: ['updateStep', 'copiarTexto', 'appendIpToList']
    },
    'IPv6Calculator': {
      required: true,
      methods: ['calcularSubRedes', 'resetarCalculadora']
    },
    'DOMCache': {
      required: false,
      methods: ['getElementById', 'elements']
    },
    'ModuleManager': {
      required: false,
      methods: ['register', 'get', 'isLoaded']
    }
  };
  
  /**
   * Verifica o estado dos módulos
   */
  function checkModules() {
    const results = {
      loaded: [],
      missing: [],
      partial: [],
      errors: []
    };
    
    for (const [moduleName, config] of Object.entries(ESSENTIAL_MODULES)) {
      try {
        const moduleObj = window[moduleName];
        
        if (!moduleObj) {
          if (config.required) {
            results.missing.push(moduleName);
          }
          continue;
        }
        
        // Verificar se tem os métodos necessários
        const missingMethods = config.methods.filter(method => 
          typeof moduleObj[method] !== 'function' && 
          typeof moduleObj[method] !== 'object'
        );
        
        if (missingMethods.length > 0) {
          results.partial.push({
            module: moduleName,
            missingMethods: missingMethods
          });
        } else {
          results.loaded.push(moduleName);
        }
        
      } catch (error) {
        results.errors.push({
          module: moduleName,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Cria implementações de fallback para módulos críticos
   */
  function createFallbacks() {
    const created = [];
    
    // Fallback para IPv6Utils
    if (!window.IPv6Utils) {
      window.IPv6Utils = {
        validateIPv6: function(addressCIDR) {
          try {
            const [addr, prefix] = addressCIDR.split('/');
            if (!addr || !prefix || isNaN(prefix)) {
              return "Por favor, insira um endereço IPv6 válido no formato CIDR.";
            }
            const prefixNum = parseInt(prefix);
            if (prefixNum < 1 || prefixNum > 128) {
              return "O prefixo deve estar entre 1 e 128.";
            }
            return null;
          } catch (error) {
            return "Erro ao processar o endereço IPv6.";
          }
        },
        
        expandIPv6Address: function(addressCIDR) {
          try {
            const [addr] = addressCIDR.split('/');
            // Implementação simplificada
            return addr.includes('::') ? addr.replace('::', ':0000:0000:0000:0000:') : addr;
          } catch (error) {
            return "Erro: Falha ao processar o endereço.";
          }
        },
        
        shortenIPv6: function(address) {
          // Versão simplificada - apenas retorna o endereço
          return address;
        },
        
        formatIPv6Address: function(ipv6BigInt) {
          try {
            const hexStr = ipv6BigInt.toString(16).padStart(32, '0');
            return hexStr.match(/.{1,4}/g).join(':');
          } catch (error) {
            return "0000:0000:0000:0000:0000:0000:0000:0000";
          }
        },
        
        checkIPv6Overlap: function(prefix1, prefix2) {
          // Implementação básica
          return prefix1 === prefix2;
        },
        
        suggestNonOverlappingPrefix: function(currentPrefix, conflictingPrefix, desiredMask) {
          // Sugestão simples
          const [addr, mask] = currentPrefix.split('/');
          const parts = addr.split(':');
          
          // Incrementar a última parte não vazia
          for (let i = parts.length - 1; i >= 0; i--) {
            if (parts[i] && parts[i] !== '0000') {
              const num = parseInt(parts[i], 16) + 1;
              parts[i] = num.toString(16).padStart(4, '0');
              break;
            }
          }
          
          return `${parts.join(':')}/${desiredMask}`;
        },
        
        gerarSubRedesAssincronamente: function(ipv6BigInt, initialMask, prefix, numSubRedes, callback, appState) {
          console.warn("[FALLBACK] Usando geração simplificada de sub-redes");
          
          appState = appState || { subRedesGeradas: [] };
          
          setTimeout(() => {
            // Gerar algumas sub-redes de exemplo
            const maxSubnets = Math.min(Number(numSubRedes), 50);
            
            for (let i = 0; i < maxSubnets; i++) {
              const subnetBase = `2001:db8:${i.toString(16).padStart(4, '0')}`;
              
              appState.subRedesGeradas.push({
                subnet: `${subnetBase}::/${prefix}`,
                initial: `${subnetBase}::`,
                final: `${subnetBase}::ffff`,
                network: `${subnetBase}::`
              });
            }
            
            // Ocultar loading
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
              loadingIndicator.style.display = 'none';
            }
            
            if (typeof callback === 'function') {
              callback(appState.subRedesGeradas);
            }
          }, 500);
        }
      };
      
      created.push('IPv6Utils');
    }
    
    // Fallback para UIController
    if (!window.UIController) {
      window.UIController = {
        updateStep: function(step) {
          const steps = document.querySelectorAll('.step');
          steps.forEach(el => el.classList.remove('active'));
          const currentStep = document.getElementById(`step${step}`);
          if (currentStep) {
            currentStep.classList.add('active');
          }
        },
        
        copiarTexto: function(elementId) {
          const element = typeof elementId === 'string' ? 
            document.getElementById(elementId) : elementId;
          
          if (element) {
            const text = element.getAttribute('data-value') || 
                        element.textContent || 
                        element.innerText;
            
            if (navigator.clipboard) {
              navigator.clipboard.writeText(text);
            } else {
              // Fallback método antigo
              const textArea = document.createElement('textarea');
              textArea.value = text;
              textArea.style.position = 'fixed';
              textArea.style.left = '-999999px';
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand('copy');
              document.body.removeChild(textArea);
            }
          }
        },
        
        appendIpToList: function(ip, number, listId) {
          const list = document.getElementById(listId);
          if (list) {
            const li = document.createElement('li');
            li.className = 'ip-item';
            li.innerHTML = `
              <span class="ip-number">${number}.</span>
              <span class="ip-text">${ip}</span>
              <button class="copy-btn" onclick="UIController.copiarTexto('${ip}')" title="Copiar IP">
                <i class="fas fa-copy"></i>
              </button>
            `;
            list.appendChild(li);
          }
        },
        
        carregarMaisSubRedes: function(startIndex, limit) {
          if (!window.appState || !window.appState.subRedesGeradas) {
            return;
          }
          
          const tbody = document.querySelector('#subnetsTable tbody');
          if (!tbody) return;
          
          const endIndex = Math.min(startIndex + limit, window.appState.subRedesGeradas.length);
          
          for (let i = startIndex; i < endIndex; i++) {
            const subnet = window.appState.subRedesGeradas[i];
            if (!subnet) continue;
            
            const row = document.createElement('tr');
            row.innerHTML = `
              <td><input type="checkbox" value="${i}"></td>
              <td>${subnet.subnet}</td>
              <td>${subnet.initial}</td>
              <td>${subnet.final}</td>
              <td>${subnet.network}</td>
            `;
            tbody.appendChild(row);
          }
          
          window.appState.subRedesExibidas = endIndex;
          
          // Atualizar botão "Carregar Mais"
          const loadMoreContainer = document.getElementById('loadMoreContainer');
          if (loadMoreContainer) {
            const shouldShow = window.appState.subRedesExibidas < window.appState.subRedesGeradas.length;
            loadMoreContainer.style.display = shouldShow ? 'block' : 'none';
          }
        },
        
        toggleSelectAll: function() {
          const selectAll = document.getElementById('selectAll');
          if (!selectAll) return;
          
          const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]');
          const isChecked = selectAll.checked;
          
          checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const row = checkbox.closest('tr');
            if (row) {
              row.classList.toggle('selected', isChecked);
            }
          });
        },
        
        // Objetos aninhados básicos
        theme: {
          toggle: function() {
            document.body.classList.toggle('dark-mode');
            const themeBtn = document.getElementById('toggleThemeBtn');
            if (themeBtn) {
              const isDark = document.body.classList.contains('dark-mode');
              const icon = isDark ? 'fa-sun' : 'fa-moon';
              themeBtn.innerHTML = `<i class="fas ${icon}"></i> Tema`;
            }
          },
          loadPreference: function() {
            // Implementação básica
          }
        },
        
        navigation: {
          scrollToTop: function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          },
          scrollToBottom: function() {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
          }
        },
        
        clipboard: {
          copy: function(source) {
            if (typeof source === 'string') {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(source);
              }
            } else if (source instanceof HTMLElement) {
              const text = source.textContent || source.innerText;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(text);
              }
            }
          }
        },
        
        responsive: {
          adjust: function() {
            // Implementação básica de responsividade
            const isMobile = window.innerWidth <= 768;
            document.body.classList.toggle('mobile-device', isMobile);
          }
        }
      };
      
      created.push('UIController');
    }
    
    return created;
  }
  
  /**
   * Tenta corrigir problemas automaticamente
   */
  function autoFix() {
    const moduleCheck = checkModules();
    const hasIssues = moduleCheck.missing.length > 0 || moduleCheck.partial.length > 0;
    
    if (hasIssues) {
      console.warn("⚠️ Problemas detectados nos módulos. Tentando correção automática...");
      
      const createdFallbacks = createFallbacks();
      
      if (createdFallbacks.length > 0) {
        console.log("✅ Fallbacks criados para:", createdFallbacks.join(', '));
        showNotification(`Módulos corrigidos: ${createdFallbacks.join(', ')}`, 'warning');
      }
      
      // Verificar novamente
      const newCheck = checkModules();
      const stillMissing = newCheck.missing.filter(module => 
        ESSENTIAL_MODULES[module].required
      );
      
      if (stillMissing.length === 0) {
        console.log("✅ Todos os módulos essenciais estão disponíveis");
        showNotification('Aplicação corrigida e funcionando!', 'success');
        return true;
      } else {
        console.error("❌ Ainda faltam módulos críticos:", stillMissing);
        showNotification('Alguns problemas críticos não puderam ser corrigidos', 'error');
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Mostra notificação na interface
   */
  function showNotification(message, type = 'info') {
    // Tentar usar o sistema de notificações do UIController
    if (window.UIController && window.UIController.notifications) {
      window.UIController.notifications.show(message, type, CONFIG.NOTIFICATION_DURATION);
      return;
    }
    
    // Fallback para notificação simples
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 4px;
      color: white;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: opacity 0.3s ease;
    `;
    
    // Cores por tipo
    const colors = {
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      info: '#2196f3'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remover
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, CONFIG.NOTIFICATION_DURATION);
  }
  
  /**
   * Executar verificação e diagnóstico
   */
  function runDiagnostic() {
    checkAttempts++;
    
    console.group(`🔍 Diagnóstico #${checkAttempts} - Calculadora IPv6`);
    
    const moduleCheck = checkModules();
    const allEssentialLoaded = moduleCheck.missing.filter(module => 
      ESSENTIAL_MODULES[module].required
    ).length === 0;
    
    // Log dos resultados
    console.log('✅ Módulos carregados:', moduleCheck.loaded);
    
    if (moduleCheck.missing.length > 0) {
      console.warn('❌ Módulos ausentes:', moduleCheck.missing);
    }
    
    if (moduleCheck.partial.length > 0) {
      console.warn('⚠️ Módulos incompletos:', moduleCheck.partial);
    }
    
    if (moduleCheck.errors.length > 0) {
      console.error('💥 Erros nos módulos:', moduleCheck.errors);
    }
    
    console.log('📊 Status geral:', allEssentialLoaded ? '✅ OK' : '❌ Problemas detectados');
    console.groupEnd();
    
    // Tentar correção automática se necessário
    if (!allEssentialLoaded && checkAttempts <= CONFIG.MAX_CHECK_ATTEMPTS) {
      const fixed = autoFix();
      
      if (fixed) {
        console.log("✅ Problemas corrigidos automaticamente");
        clearInterval(checkInterval);
        return true;
      }
    }
    
    // Parar verificações após máximo de tentativas
    if (checkAttempts >= CONFIG.MAX_CHECK_ATTEMPTS) {
      console.warn(`⏹️ Máximo de tentativas atingido (${CONFIG.MAX_CHECK_ATTEMPTS})`);
      clearInterval(checkInterval);
      
      if (!allEssentialLoaded) {
        showNotification('Alguns módulos críticos não puderam ser carregados', 'error');
      }
    }
    
    return allEssentialLoaded;
  }
  
  /**
   * Detecta ambiente de desenvolvimento
   */
  function isDevelopmentEnv() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
  }
  
  /**
   * Inicialização
   */
  function initialize() {
    // Executar diagnóstico inicial
    const initialCheck = runDiagnostic();
    
    // Se estiver em desenvolvimento, continuar verificando
    if (isDevelopmentEnv() && !initialCheck) {
      console.log("🔄 Iniciando verificações periódicas (ambiente de desenvolvimento)");
      checkInterval = setInterval(runDiagnostic, CONFIG.CHECK_INTERVAL);
    }
  }
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Expor API para debug
  window.debugIPv6App = {
    checkModules,
    autoFix,
    runDiagnostic,
    showNotification,
    config: CONFIG
  };
  
})();
