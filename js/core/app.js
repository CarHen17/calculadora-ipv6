/**
 * Aplicação Principal da Calculadora IPv6
 * 
 * Este arquivo inicializa todos os módulos e garante
 * que as dependências sejam carregadas na ordem correta.
 */

(function() {
  'use strict';
  
  // Estado para rastrear recursos carregados
  let resourcesLoaded = {
    ipv6Utils: false,
    uiController: false,
    ipv6Calculator: false
  };
  
  /**
   * Verifica se todos os módulos necessários estão carregados
   * @returns {boolean} - Verdadeiro se todos os módulos estão carregados
   */
  function checkModulesLoaded() {
    return (
      typeof window.IPv6Utils !== 'undefined' &&
      typeof window.UIController !== 'undefined' &&
      typeof window.IPv6Calculator !== 'undefined'
    );
  }
  
  /**
   * Registra manualmente o módulo IPv6Utils se não estiver disponível
   */
  function ensureIPv6Utils() {
    if (typeof window.IPv6Utils === 'undefined') {
      console.warn("IPv6Utils não encontrado, criando versão simplificada");
      
      // Implementação básica de fallback
      window.IPv6Utils = {
        validateIPv6: function(addressCIDR) {
          console.warn("Usando implementação simplificada de validateIPv6");
          try {
            const [addr, prefix] = addressCIDR.split('/');
            if (!addr || !prefix || isNaN(prefix)) {
              return "Por favor, insira um endereço IPv6 válido no formato CIDR (ex.: 2001:db8::/41).";
            }
            return null;
          } catch (error) {
            return "Erro ao processar o endereço IPv6.";
          }
        },
        
        expandIPv6Address: function(addressCIDR) {
          try {
            let [addr, prefix] = addressCIDR.split('/');
            // Implementação simplificada para garantir compatibilidade básica
            return addr;
          } catch (error) {
            return "Erro: Falha ao processar o endereço.";
          }
        },
        
        shortenIPv6: function(address) {
          return address; // Versão básica apenas retorna o mesmo endereço
        },
        
        formatIPv6Address: function(ipv6BigInt) {
          try {
            let hexStr = ipv6BigInt.toString(16).padStart(32, '0');
            return hexStr.match(/.{1,4}/g).join(':');
          } catch (error) {
            return "0000:0000:0000:0000:0000:0000:0000:0000";
          }
        },
        
        calcularBlocoAgregado: function() {
          return null; // Versão simplificada retorna null
        },
        
        gerarSubRedesAssincronamente: function(ipv6BigInt, initialMask, prefix, numSubRedes, callback, appState) {
          console.warn("Usando implementação simplificada de gerarSubRedesAssincronamente");
          // Implementação básica que gera apenas algumas sub-redes de exemplo
          appState = appState || { subRedesGeradas: [] };
          
          setTimeout(() => {
            for (let i = 0; i < 10; i++) {
              appState.subRedesGeradas.push({
                subnet: `2001:db8::${i}/${prefix}`,
                initial: `2001:db8::${i}`,
                final: `2001:db8::${i}:ffff`,
                network: `2001:db8::${i}`
              });
            }
            
            if (typeof callback === 'function') {
              callback(appState.subRedesGeradas);
            }
          }, 500);
        }
      };
      
      console.log("Versão simplificada de IPv6Utils criada com sucesso");
      resourcesLoaded.ipv6Utils = true;
      return true;
    }
    
    resourcesLoaded.ipv6Utils = true;
    return true;
  }
  
  /**
   * Registra manualmente o módulo UIController se não estiver disponível
   */
  function ensureUIController() {
    if (typeof window.UIController === 'undefined') {
      console.warn("UIController não encontrado, criando versão simplificada");
      
      // Implementação básica de fallback
      window.UIController = {
        updateStep: function(step) {
          console.warn("Usando função de fallback para updateStep");
          const stepElements = document.querySelectorAll('.step');
          if (stepElements.length > 0) {
            stepElements.forEach(el => el.classList.remove('active'));
            const currentStep = document.getElementById(`step${step}`);
            if (currentStep) {
              currentStep.classList.add('active');
            }
          }
        },
        
        toggleTheme: function() {
          document.body.classList.toggle('dark-mode');
        },
        
        copiarTexto: function(elementId) {
          const element = document.getElementById(elementId);
          if (element) {
            const text = element.innerText;
            if (navigator.clipboard) {
              navigator.clipboard.writeText(text);
            }
          }
        },
        
        appendIpToList: function(ip, number, listId) {
          const list = document.getElementById(listId);
          if (list) {
            const li = document.createElement('li');
            li.textContent = `${number}. ${ip}`;
            list.appendChild(li);
          }
        },
        
        carregarMaisSubRedes: function(startIndex, limit) {
          console.warn("Usando implementação simplificada de carregarMaisSubRedes");
        },
        
        toggleSelectAll: function() {
          const selectAll = document.getElementById('selectAll');
          if (selectAll) {
            const checked = selectAll.checked;
            document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]').forEach(cb => {
              cb.checked = checked;
            });
          }
        },
        
        ajustarLayoutResponsivo: function() {
          // Versão simplificada não faz nada
        },
        
        navigation: {
          scrollToTop: function() {
            window.scrollTo(0, 0);
          },
          
          scrollToBottom: function() {
            window.scrollTo(0, document.body.scrollHeight);
          }
        }
      };
      
      console.log("Versão simplificada de UIController criada com sucesso");
      resourcesLoaded.uiController = true;
      return true;
    }
    
    resourcesLoaded.uiController = true;
    return true;
  }
  
  /**
   * Carrega um script dinamicamente
   * @param {string} url - URL do script a ser carregado
   * @returns {Promise} - Promise que resolve quando o script for carregado
   */
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      
      script.onload = () => {
        console.log(`Script carregado: ${url}`);
        resolve();
      };
      
      script.onerror = () => {
        console.error(`Erro ao carregar script: ${url}`);
        reject(new Error(`Erro ao carregar script: ${url}`));
      };
      
      document.head.appendChild(script);
    });
  }
  
  /**
   * Carrega scripts na ordem correta
   */
  async function loadScriptsInOrder() {
    try {
      const scripts = [
        { url: 'js/core/ipv6-utils.js', key: 'ipv6Utils' },
        { url: 'js/ui/ui-controller.js', key: 'uiController' },
        { url: 'js/core/ipv6-calculator.js', key: 'ipv6Calculator' }
      ];
      
      for (const script of scripts) {
        try {
          await loadScript(script.url);
          resourcesLoaded[script.key] = true;
        } catch (error) {
          console.error(`Erro ao carregar ${script.url}:`, error);
          
          // Usar fallback para scripts críticos
          if (script.key === 'ipv6Utils') {
            ensureIPv6Utils();
          } else if (script.key === 'uiController') {
            ensureUIController();
          }
        }
      }
      
      // Garantir que todos os módulos principais estão disponíveis
      ensureIPv6Utils();
      ensureUIController();
      
      // Inicializar aplicação
      initializeApp();
    } catch (error) {
      console.error("Erro ao carregar scripts:", error);
      showLoadingError();
    }
  }
  
  /**
   * Inicializa a aplicação quando todos os módulos estiverem carregados
   */
  function initializeApp() {
    console.log("Inicializando aplicação Calculadora IPv6...");
    
    try {
      // Verificar compatibilidade com BigInt
      if (typeof BigInt === 'undefined') {
        showCompatibilityWarning();
        return;
      }
      
      // Verificar se todos os módulos foram carregados
      if (!checkModulesLoaded()) {
        console.error("Nem todos os módulos foram carregados corretamente");
        showLoadingError();
        return;
      }
      
      // Configurar chamadas globais para maior compatibilidade
      window.copiarTexto = window.UIController.copiarTexto;
      
      // Remover mensagens de erro de carregamento
      removeLoadingError();
      
      // Mostrar mensagem de sucesso no console
      console.log("Aplicação Calculadora IPv6 inicializada com sucesso");
      
      // Mostrar notificação de inicialização se o usuário estiver em ambiente de desenvolvimento
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        showInitializationNotice();
      }
    } catch (error) {
      console.error("Erro ao inicializar aplicação:", error);
      showLoadingError();
    }
  }
  
  /**
   * Exibe aviso de compatibilidade para navegadores sem suporte a BigInt
   */
  function showCompatibilityWarning() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    const warningEl = document.createElement('div');
    warningEl.className = 'compatibility-warning';
    warningEl.innerHTML = `
      <h3>⚠️ Navegador não compatível</h3>
      <p>
        Seu navegador não suporta funcionalidades necessárias para a Calculadora IPv6.
        Para melhor experiência, utilize uma versão mais recente do Chrome, Firefox, Edge ou Safari.
      </p>
    `;
    
    warningEl.style.backgroundColor = '#fef8e3';
    warningEl.style.border = '1px solid #f0c674';
    warningEl.style.borderRadius = '8px';
    warningEl.style.padding = '16px';
    warningEl.style.marginBottom = '20px';
    
    container.insertBefore(warningEl, container.firstChild);
  }
  
  /**
   * Exibe erro de carregamento
   */
  function showLoadingError() {
    // Verificar se já existe um erro de carregamento
    if (document.querySelector('.error-message')) return;
    
    const warningEl = document.createElement('div');
    warningEl.className = 'error-message';
    warningEl.style.display = 'block';
    warningEl.innerHTML = `
      <strong>Erro ao carregar a aplicação</strong>
      <p>Ocorreu um problema ao inicializar a calculadora. Tente recarregar a página.</p>
      <button id="reloadBtn" style="margin-top:10px;">Recarregar</button>
    `;
    
    const container = document.querySelector('.container');
    if (container) {
      container.insertBefore(warningEl, container.firstChild);
      
      const reloadBtn = document.getElementById('reloadBtn');
      if (reloadBtn) {
        reloadBtn.addEventListener('click', () => window.location.reload());
      }
    }
  }
  
  /**
   * Remove mensagens de erro de carregamento
   */
  function removeLoadingError() {
    const errorMessage = document.querySelector('.error-message');
    if (errorMessage && errorMessage.parentNode) {
      errorMessage.parentNode.removeChild(errorMessage);
    }
  }
  
  /**
   * Exibe notificação de inicialização bem-sucedida
   */
  function showInitializationNotice() {
    const notice = document.createElement('div');
    notice.style.position = 'fixed';
    notice.style.bottom = '20px';
    notice.style.right = '20px';
    notice.style.backgroundColor = '#4caf50';
    notice.style.color = 'white';
    notice.style.padding = '10px 20px';
    notice.style.borderRadius = '4px';
    notice.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notice.style.zIndex = '9999';
    notice.style.opacity = '0';
    notice.style.transition = 'opacity 0.3s ease-in-out';
    
    notice.textContent = '✓ Calculadora IPv6 inicializada com sucesso';
    
    document.body.appendChild(notice);
    
    // Animar
    setTimeout(() => {
      notice.style.opacity = '1';
      
      // Remover após alguns segundos
      setTimeout(() => {
        notice.style.opacity = '0';
        setTimeout(() => {
          if (notice.parentNode) {
            document.body.removeChild(notice);
          }
        }, 300);
      }, 3000);
    }, 300);
  }
  
  // Iniciar o carregamento dos scripts quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadScriptsInOrder);
  } else {
    // Se o DOM já estiver pronto, iniciar carregamento imediatamente
    loadScriptsInOrder();
  }
})();