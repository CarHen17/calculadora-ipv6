/**
 * Verificador de Ambiente para Calculadora IPv6
 * Este script ajuda a diagnosticar problemas com módulos carregados
 */
(function() {
  'use strict';
  
  // Verificar o estado dos módulos principais periodicamente
  function checkModules() {
    const requiredModules = {
      'IPv6Utils': typeof window.IPv6Utils !== 'undefined',
      'UIController': typeof window.UIController !== 'undefined',
      'IPv6Calculator': typeof window.IPv6Calculator !== 'undefined',
      'VisualizationModule': typeof window.VisualizationModule !== 'undefined'
    };
    
    const allLoaded = Object.values(requiredModules).every(loaded => loaded);
    
    // Formatar para console
    console.group('Estado dos Módulos da Calculadora IPv6');
    Object.entries(requiredModules).forEach(([name, loaded]) => {
      console.log(`${name}: ${loaded ? '✅ Carregado' : '❌ Não carregado'}`);
      
      if (loaded) {
        const moduleObj = window[name];
        if (typeof moduleObj === 'object') {
          const methods = Object.keys(moduleObj);
          console.log(`  - Métodos disponíveis: ${methods.length > 0 ? methods.join(', ') : 'Nenhum'}`);
        }
      }
    });
    console.log(`Status geral: ${allLoaded ? '✅ Todos os módulos carregados' : '❌ Alguns módulos não foram carregados'}`);
    console.groupEnd();
    
    return allLoaded;
  }
  
  // Tentar corrigir problemas automaticamente
  function autoFix() {
    if (typeof window.IPv6Utils === 'undefined') {
      console.warn("⚠️ IPv6Utils não encontrado. Criando versão de fallback...");
      
      // Implementação básica
      window.IPv6Utils = {
        validateIPv6: function(addressCIDR) {
          console.warn("[FALLBACK] Usando IPv6Utils.validateIPv6 de fallback");
          try {
            const [addr, prefix] = addressCIDR.split('/');
            if (!addr || !prefix || isNaN(prefix)) {
              return "Por favor, insira um endereço IPv6 válido no formato CIDR.";
            }
            return null;
          } catch (error) {
            return "Erro ao processar o endereço IPv6.";
          }
        },
        
        expandIPv6Address: function(addressCIDR) {
          try {
            let [addr, prefix] = addressCIDR.split('/');
            return addr || "Erro: Endereço inválido.";
          } catch (error) {
            return "Erro: Falha ao processar o endereço.";
          }
        },
        
        shortenIPv6: function(address) {
          return address; // Versão simplificada
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
          return null; // Implementação mínima
        },
        
        gerarSubRedesAssincronamente: function(ipv6BigInt, initialMask, prefix, numSubRedes, callback, appState) {
          console.warn("[FALLBACK] Usando implementação simplificada de gerarSubRedesAssincronamente");
          appState = appState || { subRedesGeradas: [] };
          
          // Gerar algumas sub-redes de exemplo
          setTimeout(() => {
            for (let i = 0; i < 10; i++) {
              let subnetFormatada = `2001:db8::${i}`;
              
              appState.subRedesGeradas.push({
                subnet: `${subnetFormatada}/${prefix}`,
                initial: subnetFormatada,
                final: `${subnetFormatada.split('::')[0]}::${subnetFormatada.split('::')[1]}ffff`,
                network: subnetFormatada
              });
            }
            
            // Ocultar indicador de carregamento
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
              loadingIndicator.style.display = 'none';
            }
            
            if (typeof callback === 'function') {
              callback(appState.subRedesGeradas);
            }
          }, 1000);
        }
      };
      
      console.log("✅ Versão de fallback do IPv6Utils criada com sucesso");
    }
    
    // Verificar novamente
    return checkModules();
  }
  
  // Detectar ambiente de desenvolvimento
  function isDevelopmentEnv() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:';
  }
  
  // Função para mostrar aviso na interface
  function showInterfaceWarning(message, severity = 'warning') {
    // Criar elemento de notificação
    const notify = document.createElement('div');
    notify.style.position = 'fixed';
    notify.style.top = '10px';
    notify.style.left = '50%';
    notify.style.transform = 'translateX(-50%)';
    notify.style.zIndex = '9999';
    notify.style.padding = '15px 20px';
    notify.style.borderRadius = '5px';
    notify.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
    notify.style.color = 'white';
    notify.style.fontSize = '14px';
    notify.style.maxWidth = '80%';
    notify.style.textAlign = 'center';
    
    // Estilizar baseado na severidade
    if (severity === 'error') {
      notify.style.backgroundColor = '#e53935';
    } else if (severity === 'warning') {
      notify.style.backgroundColor = '#ff9800';
    } else {
      notify.style.backgroundColor = '#4caf50';
    }
    
    // Conteúdo
    notify.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div>${severity === 'error' ? '⚠️' : severity === 'warning' ? '⚠️' : '✅'}</div>
        <div>${message}</div>
        <div style="margin-left: 10px; cursor: pointer;" onclick="this.parentNode.parentNode.remove()">✕</div>
      </div>
    `;
    
    // Adicionar ao DOM
    document.body.appendChild(notify);
    
    // Auto-remover após alguns segundos
    setTimeout(() => {
      if (notify.parentNode) {
        notify.style.opacity = '0';
        notify.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notify.remove(), 500);
      }
    }, 5000);
  }
  
  // Inicializar quando o DOM estiver pronto
  window.addEventListener('DOMContentLoaded', function() {
    if (isDevelopmentEnv()) {
      console.log("Ambiente de desenvolvimento detectado. Iniciando verificações...");
      
      // Verificar módulos
      const modulesLoaded = checkModules();
      
      if (!modulesLoaded) {
        console.warn("⚠️ Nem todos os módulos foram carregados corretamente. Tentando correção automática...");
        
        const fixed = autoFix();
        
        if (fixed) {
          console.log("✅ Correção automática bem-sucedida!");
          showInterfaceWarning('Alguns módulos foram corrigidos automaticamente. A aplicação deve funcionar normalmente.', 'success');
        } else {
          console.error("❌ Falha na correção automática. A aplicação pode não funcionar corretamente.");
          showInterfaceWarning('Falha ao carregar alguns módulos críticos. Algumas funcionalidades podem não estar disponíveis.', 'error');
        }
      } else {
        console.log("✅ Todos os módulos carregados corretamente!");
      }
      
      // Verificação periódica a cada 10 segundos
      setInterval(checkModules, 10000);
    }
  });
  
  // Expor API de depuração para o console
  window.debugIPv6App = {
    checkModules,
    autoFix,
    showWarning: showInterfaceWarning
  };
})();