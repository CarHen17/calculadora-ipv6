/**
 * Melhorias da Calculadora IPv6 - Versão Simplificada
 * Adiciona funcionalidades extras sem interferir no core da aplicação
 */
(function() {
  'use strict';
  
  /**
   * Adiciona melhorias à interface sem interferir no funcionamento principal
   */
  function applyEnhancements() {
    // Só aplicar se os módulos principais estiverem carregados
    if (!window.IPv6Utils || !window.UIController) {
      console.log("Aguardando módulos principais para aplicar melhorias...");
      return;
    }
    
    try {
      // Adicionar tooltips úteis
      addHelpTooltips();
      
      // Melhorar feedback visual
      enhanceVisualFeedback();
      
      // Adicionar atalhos de teclado
      setupKeyboardShortcuts();
      
      // Configurar função global de cópia
      ensureGlobalCopyFunction();
      
      console.log("✨ Melhorias da interface aplicadas com sucesso");
    } catch (error) {
      console.warn("Erro ao aplicar melhorias:", error);
    }
  }
  
  /**
   * Adiciona tooltips informativos
   */
  function addHelpTooltips() {
    const tooltips = [
      { selector: '#ipv6', text: 'Insira um endereço IPv6 com prefixo CIDR (Ex.: 2001:db8::/41)' },
      { selector: '#calcularBtn', text: 'Calcular sub-redes do endereço IPv6 informado' },
      { selector: '#toggleMainBlockIpsBtn', text: 'Mostrar os primeiros IPs do bloco principal' },
      { selector: '#continuarBtn', text: 'Avançar para escolher o tamanho do prefixo' },
      { selector: '#selectAll', text: 'Selecionar ou desmarcar todas as sub-redes' },
      { selector: '#networkConfigBtn', text: 'Configurar prefixos WAN e LAN para verificar sobreposição' }
    ];
    
    tooltips.forEach(tooltip => {
      const element = document.querySelector(tooltip.selector);
      if (element && !element.getAttribute('title')) {
        element.setAttribute('title', tooltip.text);
      }
    });
  }
  
  /**
   * Melhora o feedback visual da aplicação
   */
  function enhanceVisualFeedback() {
    // Melhorar feedback dos botões de cópia
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('copy-btn') || e.target.closest('.copy-btn')) {
        const btn = e.target.classList.contains('copy-btn') ? e.target : e.target.closest('.copy-btn');
        
        // Feedback visual temporário
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i>';
        btn.style.backgroundColor = '#4caf50';
        
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.style.backgroundColor = '';
        }, 1500);
      }
    });
    
    // Adicionar animação suave aos cards quando aparecem
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '0';
          entry.target.style.transform = 'translateY(20px)';
          entry.target.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, 100);
          
          observer.unobserve(entry.target);
        }
      });
    });
    
    // Observar cards que aparecem dinamicamente
    document.querySelectorAll('.card').forEach(card => {
      observer.observe(card);
    });
  }
  
  /**
   * Configura atalhos de teclado úteis
   */
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
      // Ctrl+Enter: Calcular sub-redes
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const calcularBtn = document.getElementById('calcularBtn');
        if (calcularBtn && calcularBtn.style.display !== 'none') {
          calcularBtn.click();
        }
      }
      
      // Escape: Resetar
      if (e.key === 'Escape') {
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn && confirm('Deseja resetar a calculadora?')) {
          resetBtn.click();
        }
      }
      
      // Ctrl+D: Alternar tema
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        const themeBtn = document.getElementById('toggleThemeBtn');
        if (themeBtn) {
          themeBtn.click();
        }
      }
      
      // Ctrl+M: Abrir modal de rede
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        const networkBtn = document.getElementById('networkConfigBtn');
        if (networkBtn) {
          networkBtn.click();
        }
      }
    });
    
    // Mostrar dicas de atalhos apenas em desenvolvimento
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      console.log("⌨️ Atalhos disponíveis:");
      console.log("- Ctrl+Enter: Calcular sub-redes");
      console.log("- Escape: Resetar (com confirmação)");
      console.log("- Ctrl+D: Alternar tema");
      console.log("- Ctrl+M: Configurações de rede");
    }
  }
  
  /**
   * Garante que a função global de cópia está disponível
   */
  function ensureGlobalCopyFunction() {
    if (!window.copiarTexto && window.UIController) {
      window.copiarTexto = function(elementIdOrText) {
        if (typeof elementIdOrText === 'string') {
          // Se for um ID, buscar o elemento
          if (elementIdOrText.length < 50 && !elementIdOrText.includes(' ')) {
            const element = document.getElementById(elementIdOrText);
            if (element) {
              if (window.UIController.clipboard) {
                window.UIController.clipboard.copy(element);
              } else {
                window.UIController.copiarTexto(elementIdOrText);
              }
            } else {
              // Se não encontrar elemento, tratar como texto
              if (navigator.clipboard) {
                navigator.clipboard.writeText(elementIdOrText);
              }
            }
          } else {
            // Texto longo, copiar diretamente
            if (navigator.clipboard) {
              navigator.clipboard.writeText(elementIdOrText);
            }
          }
        } else {
          // Elemento DOM
          if (window.UIController.clipboard) {
            window.UIController.clipboard.copy(elementIdOrText);
          } else {
            window.UIController.copiarTexto(elementIdOrText);
          }
        }
      };
      
      console.log("🔗 Função global copiarTexto configurada");
    }
  }
  
  /**
   * Adiciona contador de sub-redes selecionadas
   */
  function addSubnetCounter() {
    // Verificar se já existe
    if (document.getElementById('subnetCounter')) return;
    
    // Criar contador
    const counter = document.createElement('div');
    counter.id = 'subnetCounter';
    counter.className = 'subnet-counter';
    counter.style.cssText = `
      margin-top: 8px;
      padding: 4px 8px;
      background-color: rgba(0, 112, 209, 0.1);
      border-radius: 4px;
      font-size: 14px;
      display: none;
      text-align: center;
    `;
    counter.innerHTML = '<span id="subnetCount">0</span> sub-redes selecionadas';
    
    // Adicionar após a tabela
    const table = document.getElementById('subnetsTable');
    if (table && table.parentNode) {
      table.parentNode.insertBefore(counter, table.nextSibling);
      
      // Monitorar mudanças nos checkboxes
      document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox' && e.target.closest('#subnetsTable')) {
          const checkedBoxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
          const count = checkedBoxes.length;
          
          document.getElementById('subnetCount').textContent = count;
          counter.style.display = count > 0 ? 'block' : 'none';
          
          // Mudar cor baseado na quantidade
          if (count >= 10) {
            counter.style.backgroundColor = 'rgba(255, 152, 0, 0.2)';
          } else {
            counter.style.backgroundColor = 'rgba(0, 112, 209, 0.1)';
          }
        }
      });
    }
  }
  
  /**
   * Monitora quando novos elementos são adicionados ao DOM
   */
  function setupDOMObserver() {
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          // Se a tabela de sub-redes for adicionada, adicionar contador
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              if (node.id === 'subnetsTable' || node.querySelector('#subnetsTable')) {
                setTimeout(addSubnetCounter, 100);
              }
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Verifica compatibilidade do navegador
   */
  function checkBrowserCompatibility() {
    const issues = [];
    
    // Verificar BigInt
    if (typeof BigInt === 'undefined') {
      issues.push('BigInt não suportado - cálculos IPv6 podem falhar');
    }
    
    // Verificar Clipboard API
    if (!navigator.clipboard) {
      issues.push('API de Clipboard não suportada - função de cópia pode ser limitada');
    }
    
    // Verificar IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      issues.push('IntersectionObserver não suportado - algumas animações podem não funcionar');
    }
    
    if (issues.length > 0) {
      console.warn("⚠️ Problemas de compatibilidade detectados:");
      issues.forEach(issue => console.warn("- " + issue));
      
      // Mostrar aviso apenas se for muito crítico
      if (typeof BigInt === 'undefined') {
        setTimeout(() => {
          alert("Seu navegador pode não suportar todas as funcionalidades da Calculadora IPv6. " +
                "Para melhor experiência, utilize uma versão mais recente do Chrome, Firefox ou Edge.");
        }, 2000);
      }
    }
  }
  
  /**
   * Inicialização das melhorias
   */
  function initialize() {
    console.log("🔧 Aplicando melhorias à Calculadora IPv6...");
    
    // Verificar compatibilidade
    checkBrowserCompatibility();
    
    // Aguardar módulos principais ou aplicar imediatamente
    if (window.IPv6Utils && window.UIController) {
      applyEnhancements();
      setupDOMObserver();
    } else {
      // Aguardar módulos serem carregados
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if (window.IPv6Utils && window.UIController) {
          clearInterval(checkInterval);
          applyEnhancements();
          setupDOMObserver();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.warn("Módulos principais não carregados - algumas melhorias podem não funcionar");
          
          // Aplicar melhorias básicas mesmo assim
          try {
            addHelpTooltips();
            setupKeyboardShortcuts();
          } catch (error) {
            console.warn("Erro ao aplicar melhorias básicas:", error);
          }
        }
      }, 500);
    }
  }
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
})();
