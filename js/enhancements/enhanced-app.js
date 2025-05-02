/**
 * Versão simplificada da inicialização da Calculadora IPv6
 */
(function() {
  'use strict';
  
  // Registrar funções globais necessárias
  if (typeof window.UIController !== 'undefined') {
    window.copiarTexto = window.UIController.copiarTexto;
  }
  
  // Aplicar melhorias adicionais à interface quando disponíveis
  function applyUIEnhancements() {
    // Verificar se temos o módulo UI Components
    if (typeof window.UIComponents === 'undefined') {
      console.warn("UIComponents não disponível para melhorias visuais");
      return;
    }
    
    // Adicionar contador de sub-redes selecionadas
    addSelectedSubnetsCounter();
    
    // Adicionar atalhos de teclado
    setupKeyboardShortcuts();
    
    // Melhorar acessibilidade
    enhanceAccessibility();
  }
  
  /**
   * Adiciona contador de sub-redes selecionadas
   */
  function addSelectedSubnetsCounter() {
    // Criar elemento contador
    const counterContainer = document.createElement('div');
    counterContainer.className = 'subnets-counter';
    counterContainer.innerHTML = `
      <span id="selectedCount">0</span> sub-redes selecionadas
    `;
    
    // Estilizar contador
    counterContainer.style.marginTop = '8px';
    counterContainer.style.padding = '4px 8px';
    counterContainer.style.backgroundColor = 'rgba(0, 112, 209, 0.1)';
    counterContainer.style.borderRadius = '4px';
    counterContainer.style.fontSize = '14px';
    counterContainer.style.display = 'none';
    
    // Adicionar ao DOM
    const subnetsTable = document.getElementById('subnetsTable');
    if (subnetsTable && subnetsTable.parentNode) {
      subnetsTable.parentNode.insertBefore(counterContainer, subnetsTable.nextSibling);
    }
    
    // Atualizar contador quando checkboxes são alterados
    document.addEventListener('change', function(e) {
      if (e.target.type === 'checkbox' && e.target.closest('#subnetsTable')) {
        updateSubnetsCounter();
      }
    });
    
    function updateSubnetsCounter() {
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      const count = checkboxes.length;
      
      // Atualizar texto
      const countElement = document.getElementById('selectedCount');
      if (countElement) {
        countElement.textContent = count;
      }
      
      // Mostrar/ocultar contador
      counterContainer.style.display = count > 0 ? 'inline-block' : 'none';
      
      // Destacar quando muitas sub-redes estão selecionadas
      if (count >= 10) {
        counterContainer.style.backgroundColor = 'rgba(255, 160, 0, 0.2)';
      } else {
        counterContainer.style.backgroundColor = 'rgba(0, 112, 209, 0.1)';
      }
    }
  }
  
  /**
   * Configura atalhos de teclado
   */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Ctrl+Alt+R: Reset
      if (e.key === 'r' && e.ctrlKey && e.altKey) {
        e.preventDefault();
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) resetBtn.click();
      }
      
      // Ctrl+Alt+C: Calcular
      if (e.key === 'c' && e.ctrlKey && e.altKey) {
        e.preventDefault();
        const calcularBtn = document.getElementById('calcularBtn');
        if (calcularBtn) calcularBtn.click();
      }
      
      // Ctrl+Alt+V: Visualizar
      if (e.key === 'v' && e.ctrlKey && e.altKey) {
        e.preventDefault();
        const visualizarBtn = document.getElementById('visualizarBtn');
        if (visualizarBtn && visualizarBtn.style.display !== 'none') visualizarBtn.click();
      }
      
      // Ctrl+Alt+T: Alternar tema
      if (e.key === 't' && e.ctrlKey && e.altKey) {
        e.preventDefault();
        const toggleThemeBtn = document.getElementById('toggleThemeBtn');
        if (toggleThemeBtn) toggleThemeBtn.click();
      }
    });
  }
  
  /**
   * Melhora a acessibilidade da aplicação
   */
  function enhanceAccessibility() {
    // Adicionar rótulos ARIA para melhorar acessibilidade
    document.querySelectorAll('button').forEach(button => {
      if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
        // Usar o texto do ícone como label
        const iconClass = button.querySelector('i')?.className || '';
        let label = '';
        
        if (iconClass.includes('fa-copy')) label = 'Copiar';
        else if (iconClass.includes('fa-list')) label = 'Listar IPs';
        else if (iconClass.includes('fa-plus')) label = 'Gerar mais IPs';
        else if (iconClass.includes('fa-redo-alt')) label = 'Resetar';
        else if (iconClass.includes('fa-chart-bar')) label = 'Visualizar dados';
        else if (iconClass.includes('fa-calculator')) label = 'Calcular sub-redes';
        else if (iconClass.includes('fa-sync')) label = 'Carregar mais sub-redes';
        else if (iconClass.includes('fa-arrow-up')) label = 'Ir para o topo';
        else if (iconClass.includes('fa-arrow-down')) label = 'Ir para o final';
        else if (iconClass.includes('fa-moon') || iconClass.includes('fa-sun')) label = 'Alternar tema';
        
        if (label) {
          button.setAttribute('aria-label', label);
        }
      }
    });
    
    // Adicionar descrições para elementos interativos
    const ipv6Input = document.getElementById('ipv6');
    if (ipv6Input) {
      ipv6Input.setAttribute('aria-describedby', 'ipv6-description');
    }
    
    const prefixSlider = document.getElementById('prefixSlider');
    if (prefixSlider) {
      prefixSlider.setAttribute('aria-valuemin', '48');
      prefixSlider.setAttribute('aria-valuemax', '128');
      prefixSlider.setAttribute('aria-valuenow', '64');
      prefixSlider.setAttribute('aria-valuetext', 'Prefixo 64');
    }
  }
  
  /**
   * Adiciona tooltips de ajuda
   */
  function addHelpTooltips() {
    // Definir tooltips para elementos importantes
    const tooltips = [
      { selector: '#ipv6', text: 'Insira um endereço IPv6 com prefixo CIDR (Ex.: 2001:db8::/41)' },
      { selector: '#calcularBtn', text: 'Calcular sub-redes do endereço IPv6 informado' },
      { selector: '#toggleMainBlockIpsBtn', text: 'Mostrar os primeiros IPs do bloco principal' },
      { selector: '#continuarBtn', text: 'Avançar para escolher o tamanho do prefixo' },
      { selector: '#gerarIPsButton', text: 'Gerar lista de IPs para a sub-rede selecionada' },
      { selector: '#visualizarBtn', text: 'Visualizar dados estatísticos das sub-redes selecionadas' },
      { selector: '#selectAll', text: 'Selecionar ou desmarcar todas as sub-redes' },
      { selector: '#loadMoreButton', text: 'Carregar mais sub-redes na tabela' }
    ];
    
    // Adicionar tooltips
    tooltips.forEach(tooltip => {
      const element = document.querySelector(tooltip.selector);
      if (element && !element.getAttribute('data-tooltip')) {
        element.setAttribute('data-tooltip', tooltip.text);
      }
    });
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
      <button id="compatibilityBtn" class="btn-primary">Entendi</button>
    `;
    
    // Estilização melhorada
    warningEl.style.backgroundColor = 'rgba(255, 244, 229, 0.95)';
    warningEl.style.border = '1px solid #f0b849';
    warningEl.style.borderRadius = '8px';
    warningEl.style.padding = '20px';
    warningEl.style.marginBottom = '24px';
    warningEl.style.boxShadow = '0 4px 12px rgba(240, 184, 73, 0.2)';
    
    // Adicionar estilo para botão
    const btn = warningEl.querySelector('#compatibilityBtn');
    if (btn) {
      btn.style.marginTop = '16px';
      btn.style.backgroundColor = '#f0b849';
    }
    
    // Adicionar ao DOM
    container.insertBefore(warningEl, container.firstChild);
    
    // Adicionar evento para fechar aviso
    if (btn) {
      btn.addEventListener('click', () => {
        warningEl.style.display = 'none';
      });
    }
  }
  
  /**
   * Exibe notificação de inicialização bem-sucedida
   */
  function showInitializationNotice() {
    // Usar o componente toast se disponível
    if (window.UIComponents && window.UIComponents.toast) {
      window.UIComponents.toast.show('Calculadora IPv6 inicializada com sucesso!', 'success', 5000);
      return;
    }
    
    // Fallback para notificação básica
    const notice = document.createElement('div');
    notice.style.position = 'fixed';
    notice.style.bottom = '20px';
    notice.style.right = '20px';
    notice.style.backgroundColor = '#4caf50';
    notice.style.color = 'white';
    notice.style.padding = '12px 20px';
    notice.style.borderRadius = '8px';
    notice.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
    notice.style.zIndex = '9999';
    notice.style.opacity = '0';
    notice.style.transform = 'translateY(20px)';
    notice.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    notice.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <i class="fas fa-check-circle" style="font-size: 20px;"></i>
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Calculadora IPv6</div>
          <div style="font-size: 14px;">Inicializada com sucesso</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notice);
    
    // Animar entrada
    setTimeout(() => {
      notice.style.opacity = '1';
      notice.style.transform = 'translateY(0)';
      
      // Remover após alguns segundos
      setTimeout(() => {
        notice.style.opacity = '0';
        notice.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          if (notice.parentNode) {
            document.body.removeChild(notice);
          }
        }, 300);
      }, 3000);
    }, 300);
  }
  
  // Iniciar melhorias quando o documento estiver pronto
  document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando versão simplificada da Calculadora IPv6...");
    
    // Verificar compatibilidade com BigInt
    if (typeof BigInt === 'undefined') {
      console.error("Este navegador não suporta BigInt, necessário para cálculos IPv6");
      showCompatibilityWarning();
      return;
    }
    
    // Verificar disponibilidade do IPv6Utils
    if (typeof window.IPv6Utils === 'undefined') {
      console.error("Módulo IPv6Utils não está disponível. Algumas funcionalidades podem não funcionar.");
    } else {
      console.log("Módulo IPv6Utils encontrado e disponível");
    }
    
    // Aplicar melhorias
    applyUIEnhancements();
    
    // Adicionar tooltips
    addHelpTooltips();
    
    // Mostrar notificação
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      showInitializationNotice();
    }
    
    console.log("Versão simplificada da Calculadora IPv6 inicializada com sucesso");
  });
})();