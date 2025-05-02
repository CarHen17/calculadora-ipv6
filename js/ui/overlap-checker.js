// Verificar a sobreposição usando a função do IPv6Utils
      const hasOverlap = IPv6Utils.checkIPv6Overlap(wanPrefix, lanPrefix);
      
      if (hasOverlap) {
        // Determinar qual o conflito
        const conflictMask = Math.min(wanMask, lanMask);
        
        // Gerar uma sugestão de prefixo alternativo
        if (typeof IPv6Utils.suggestNonOverlappingPrefix === 'function') {
          state.suggestedPrefix = IPv6Utils.suggestNonOverlappingPrefix(
            lanPrefix, wanPrefix, lanMask
          );
        }
        
        // Atualizar estado
        state.hasOverlap = true;
        
        return true;
      } else {
        // Atualizar estado
        state.hasOverlap = false;
        state.suggestedPrefix = '';
        
        return false;
      }
    } catch (error) {
      console.error("Erro ao verificar sobreposição de prefixos:", error);
      return false;
    }
  }
  
  /**
   * Verifica se um endereço IPv6 é válido
   * @param {string} ipv6 - Endereço IPv6 com CIDR para validar
   * @returns {boolean} - Verdadeiro se for válido
   */
  function isValidIPv6(ipv6) {
    try {
      // Verificar formato básico
      if (!ipv6 || typeof ipv6 !== 'string' || !ipv6.includes('/')) {
        return false;
      }
      
      // Extrair partes
      const [addr, prefix] = ipv6.split('/');
      
      // Validar prefixo CIDR
      const prefixNum = parseInt(prefix);
      if (isNaN(prefixNum) || prefixNum < 1 || prefixNum > 128) {
        return false;
      }
      
      // Verificação básica para o endereço IPv6
      if (!addr || addr.split(':').length < 2) {
        return false;
      }
      
      // Se o IPv6Utils estiver disponível, usar seu validador
      if (typeof IPv6Utils !== 'undefined' && typeof IPv6Utils.validateIPv6 === 'function') {
        return IPv6Utils.validateIPv6(ipv6) === null;
      }
      
      // Implementação básica de validação
      const ipv6Regex = /^([0-9a-fA-F]{1,4}:){1,7}([0-9a-fA-F]{1,4}|:)$/;
      return ipv6Regex.test(addr);
    } catch (error) {
      console.error("Erro ao validar IPv6:", error);
      return false;
    }
  }
  
  /**
   * Aplica o prefixo sugerido ao campo "Inserir IPv6"
   */
  function applySuggestedPrefix() {
    try {
      if (!state.suggestedPrefix) {
        return false;
      }
      
      // Aplicar ao campo de entrada principal da calculadora
      const ipv6Input = document.getElementById('ipv6');
      if (ipv6Input) {
        ipv6Input.value = state.suggestedPrefix;
        
        // Disparar evento para atualizar a UI
        const event = new Event('change');
        ipv6Input.dispatchEvent(event);
        
        // Ocultar o aviso de sobreposição
        hideOverlapWarning();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Erro ao aplicar prefixo sugerido:", error);
      return false;
    }
  }
  
  /**
   * Mostra o aviso de sobreposição no banner de alerta
   * @param {string} wanPrefix - Prefixo IPv6 da WAN
   * @param {string} lanPrefix - Prefixo IPv6 da LAN
   */
  function showOverlapWarning(wanPrefix, lanPrefix) {
    try {
      // Verificar se banner já existe
      let alertBanner = document.getElementById('overlap-alert-banner');
      
      // Criar banner se não existir
      if (!alertBanner) {
        alertBanner = document.createElement('div');
        alertBanner.id = 'overlap-alert-banner';
        alertBanner.className = 'alert-banner warning';
        
        // Inserir antes do formulário principal
        const container = document.querySelector('.container');
        if (container) {
          container.insertBefore(alertBanner, container.firstChild);
        } else {
          document.body.insertBefore(alertBanner, document.body.firstChild);
        }
      }
      
      // Determinar conflito
      const wanMask = parseInt(wanPrefix.split('/')[1]);
      const lanMask = parseInt(lanPrefix.split('/')[1]);
      const conflictMask = Math.min(wanMask, lanMask);
      
      // Construir mensagem com HTML
      alertBanner.innerHTML = `
        <div class="alert-content">
          <div class="alert-icon">⚠️</div>
          <div class="alert-message">
            <h4>Sobreposição de blocos IPv6 detectada!</h4>
            <p>Os prefixos WAN (${wanPrefix}) e LAN (${lanPrefix}) estão em conflito no bloco /${conflictMask}.</p>
            ${state.suggestedPrefix ? `
              <div class="alert-action">
                <span>Sugestão: Usar <code>${state.suggestedPrefix}</code></span>
                <button id="applySuggestedPrefixBtn" class="btn-primary btn-sm">
                  <i class="fas fa-check"></i> Aplicar
                </button>
              </div>
            ` : ''}
          </div>
          <button id="closeAlertBtn" class="alert-close">×</button>
        </div>
      `;
      
      // Adicionar estilos ao banner
      alertBanner.style.display = 'block';
      alertBanner.style.margin = '0 0 20px 0';
      alertBanner.style.padding = '12px 16px';
      alertBanner.style.backgroundColor = 'rgba(255, 244, 229, 0.95)';
      alertBanner.style.border = '1px solid #f0b849';
      alertBanner.style.borderRadius = '8px';
      alertBanner.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
      
      // Configurar botões
      const applyBtn = document.getElementById('applySuggestedPrefixBtn');
      if (applyBtn) {
        applyBtn.addEventListener('click', applySuggestedPrefix);
      }
      
      const closeBtn = document.getElementById('closeAlertBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', hideOverlapWarning);
      }
    } catch (error) {
      console.error("Erro ao mostrar aviso de sobreposição:", error);
    }
  }
  
  /**
   * Oculta o aviso de sobreposição
   */
  function hideOverlapWarning() {
    try {
      const alertBanner = document.getElementById('overlap-alert-banner');
      if (alertBanner) {
        alertBanner.style.display = 'none';
      }
    } catch (error) {
      console.error("Erro ao ocultar aviso de sobreposição:", error);
    }
  }
  
  /**
   * Verifica sobreposição com os valores dos campos de entrada
   */
  function checkPrefixOverlap() {
    try {
      // Obter prefixo do campo principal
      const ipv6Input = document.getElementById('ipv6');
      if (!ipv6Input || !ipv6Input.value) {
        return false;
      }
      
      // Obter prefixos WAN/LAN de configuração preexistente
      const wanPrefix = localStorage.getItem('networkConfig.wanPrefix') || '2804:418:3000:1::190/64';
      const lanPrefix = ipv6Input.value.trim();
      
      // Verificar sobreposição
      const hasOverlap = checkForOverlap(wanPrefix, lanPrefix);
      
      // Mostrar ou ocultar aviso
      if (hasOverlap) {
        showOverlapWarning(wanPrefix, lanPrefix);
      } else {
        hideOverlapWarning();
      }
      
      return hasOverlap;
    } catch (error) {
      console.error("Erro ao verificar sobreposição de prefixos:", error);
      return false;
    }
  }
  
  /**
   * Inicializa o verificador de sobreposição
   */
  function initialize() {
    try {
      console.log("Inicializando verificador de sobreposição IPv6...");
      
      // Adicionar estilos CSS para o alerta
      addAlertStyles();
      
      // Configurar evento para verificação automática ao editar input
      const ipv6Input = document.getElementById('ipv6');
      if (ipv6Input) {
        ipv6Input.addEventListener('input', debounce(function() {
          checkPrefixOverlap();
        }, 500));
        
        ipv6Input.addEventListener('change', function() {
          checkPrefixOverlap();
        });
      }
      
      // Adicionar evento para o botão de calcular
      const calcularBtn = document.getElementById('calcularBtn');
      if (calcularBtn) {
        // Usar o sistema de eventos existente
        const originalClick = calcularBtn.onclick;
        calcularBtn.onclick = function(e) {
          // Verificar sobreposição antes de calcular
          if (checkPrefixOverlap()) {
            // Se houver sobreposição, evitar cálculo
            e.preventDefault();
            return false;
          }
          
          // Caso contrário, continuar com o comportamento original
          if (typeof originalClick === 'function') {
            return originalClick.call(this, e);
          }
        };
      }
      
      console.log("Verificador de sobreposição IPv6 inicializado");
    } catch (error) {
      console.error("Erro ao inicializar verificador de sobreposição:", error);
    }
  }
  
  /**
   * Adiciona estilos CSS para o banner de alerta
   */
  function addAlertStyles() {
    const styleId = 'overlap-alert-styles';
    
    // Verificar se já existe
    if (document.getElementById(styleId)) {
      return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .alert-banner {
        margin-bottom: 20px;
        animation: slideDown 0.3s ease;
      }
      
      .alert-banner.warning {
        background-color: rgba(255, 244, 229, 0.95);
        border: 1px solid #f0b849;
        color: #9c6f19;
      }
      
      .alert-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      
      .alert-icon {
        font-size: 24px;
        flex-shrink: 0;
      }
      
      .alert-message {
        flex: 1;
      }
      
      .alert-message h4 {
        margin: 0 0 8px 0;
        font-weight: 600;
        font-size: 16px;
      }
      
      .alert-message p {
        margin: 0 0 12px 0;
        font-size: 14px;
      }
      
      .alert-action {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 8px;
      }
      
      .alert-action code {
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        background-color: rgba(0, 0, 0, 0.05);
        padding: 2px 4px;
        border-radius: 4px;
      }
      
      .alert-close {
        background: none;
        border: none;
        color: #9c6f19;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
      }
      
      .btn-sm {
        font-size: 13px;
        padding: 6px 12px;
        height: auto;
      }
      
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Dark mode */
      body.dark-mode .alert-banner.warning {
        background-color: rgba(45, 44, 9, 0.95);
        border-color: #473e00;
        color: #e5d352;
      }
      
      body.dark-mode .alert-message h4 {
        color: #e5d352;
      }
      
      body.dark-mode .alert-close {
        color: #e5d352;
      }
      
      body.dark-mode .alert-action code {
        background-color: rgba(255, 255, 255, 0.1);
        color: #e5d352;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  /**
   * Utilitário para limitar chamadas frequentes (debounce)
   * @param {Function} func - Função a ser executada
   * @param {number} wait - Tempo de espera em milissegundos
   * @returns {Function} - Função com debounce
   */
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // API pública
  return {
    checkForOverlap,
    showOverlapWarning,
    hideOverlapWarning,
    applySuggestedPrefix,
    isValidIPv6,
    checkPrefixOverlap,
    initialize
  };
})();

// Exportar globalmente
window.OverlapChecker = OverlapChecker;