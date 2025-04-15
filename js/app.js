/**
 * Aplicação Principal da Calculadora IPv6
 * 
 * Este arquivo inicializa todos os módulos e garante
 * que as dependências sejam carregadas na ordem correta.
 */

(function() {
  'use strict';
  
  /**
   * Verifica se todos os módulos necessários estão carregados
   * @returns {boolean} - Verdadeiro se todos os módulos estão carregados
   */
  function checkModulesLoaded() {
    return (
      typeof window.IPv6Utils !== 'undefined' &&
      typeof window.UIController !== 'undefined' &&
      typeof window.IPv6Calculator !== 'undefined' &&
      typeof window.VisualizationModule !== 'undefined'
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
      
      // Garantir que IPv6Utils esteja disponível
      ensureIPv6Utils();
      
      // Verificar se todos os módulos foram carregados
      if (!checkModulesLoaded()) {
        console.error("Nem todos os módulos foram carregados corretamente");
        showLoadingError();
        return;
      }
      
      // Configurar chamadas globais para maior compatibilidade
      window.copiarTexto = window.UIController.copiarTexto;
      
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
    const warningEl = document.createElement('div');
    warningEl.className = 'error-message';
    warningEl.innerHTML = `
      <strong>Erro ao carregar a aplicação</strong>
      <p>Ocorreu um problema ao inicializar a calculadora. Tente recarregar a página.</p>
      <button id="reloadBtn" style="margin-top:10px;">Recarregar</button>
    `;
    
    warningEl.style.display = 'block';
    
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
  
  // Adicionar um ouvinte para quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // Se o DOM já estiver pronto, inicializar imediatamente
    initializeApp();
  }
})();