/**
 * Melhorias de interface para a Calculadora de Sub-Redes IPv6
 * Este arquivo adiciona funcionalidades interativas e aprimora a experiência do usuário
 */

// Executar quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', function() {
  console.log('Iniciando melhorias de interface');
  
  // Aprimorar funcionamento dos botões de copiar
  enhanceCopyButtons();
  
  // Adicionar funcionalidade de destaques às tabelas
  enhanceTableInteractions();
  
  // Otimizar interface para dispositivos móveis
  optimizeForTouchDevices();
  
  // Adicionar feedback visual para ações do usuário
  addVisualFeedback();
  
  // Melhorar acessibilidade
  improveAccessibility();
  
  console.log('Melhorias de interface inicializadas com sucesso');
});

/**
 * Aprimora o funcionamento dos botões de copiar, adicionando animação e feedback.
 * Sobrescreve o comportamento original mantendo a mesma funcionalidade.
 */
function enhanceCopyButtons() {
  // Reimplementar a função global copiarTexto com melhor feedback visual
  window.copiarTexto = function(elementId, feedback = true) {
    console.log("Copiando texto do elemento:", elementId);
    
    const element = document.getElementById(elementId);
    if (!element) {
      console.error("Elemento não encontrado:", elementId);
      return;
    }
    
    // Extrair o texto a ser copiado
    let text;
    if (element.hasAttribute('data-value')) {
      text = element.getAttribute('data-value');
    } else {
      text = element.innerText;
    }
    
    // Encontrar o botão relacionado
    let copyButton;
    if (element.nextElementSibling && element.nextElementSibling.classList.contains('copy-btn')) {
      copyButton = element.nextElementSibling;
    } else if (element.parentNode.querySelector('.copy-btn')) {
      copyButton = element.parentNode.querySelector('.copy-btn');
    }
    
    // Copiar para a área de transferência
    navigator.clipboard.writeText(text)
      .then(() => {
        if (feedback && copyButton) {
          // Adicionar a classe para mostrar o feedback visual
          copyButton.classList.add('copied');
          
          // Salvar o texto original do botão
          const originalText = copyButton.innerHTML;
          
          // Alterar o texto do botão para mostrar confirmação
          copyButton.innerHTML = "✓";
          
          // Restaurar o botão após animação
          setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.classList.remove('copied');
          }, 1500);
        }
      })
      .catch(error => {
        console.error("Erro ao copiar para clipboard:", error);
        alert("Falha ao copiar o texto.");
      });
  };
  
  // Melhorar todos os botões de cópia na lista de IPs
  document.addEventListener('click', function(event) {
    if (event.target.classList.contains('copy-btn')) {
      // Se o clique não foi tratado pela função copiarTexto
      if (!event.target.hasAttribute('onclick')) {
        const ipText = event.target.closest('.ips-item')?.querySelector('.ip-text')?.textContent;
        
        if (ipText) {
          navigator.clipboard.writeText(ipText)
            .then(() => {
              // Adicionar a classe para mostrar o feedback visual
              event.target.classList.add('copied');
              
              // Salvar o texto original do botão
              const originalText = event.target.innerHTML;
              
              // Alterar o texto do botão para mostrar confirmação
              event.target.innerHTML = "✓";
              
              // Restaurar o botão após animação
              setTimeout(() => {
                event.target.innerHTML = originalText;
                event.target.classList.remove('copied');
              }, 1500);
            })
            .catch(() => alert("Falha ao copiar IP."));
        }
      }
    }
  });
}

/**
 * Adiciona interações aprimoradas às tabelas
 */
function enhanceTableInteractions() {
  // Destacar linha ao passar o mouse
  const tableRows = document.querySelectorAll('#subnetsTable tbody tr');
  tableRows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.style.backgroundColor = 'rgba(0, 112, 209, 0.05)';
    });
    
    row.addEventListener('mouseleave', () => {
      if (!row.classList.contains('selected')) {
        row.style.backgroundColor = '';
      }
    });
    
    // Adicionar destaque ao clicar em qualquer parte da linha (não apenas no checkbox)
    row.addEventListener('click', (e) => {
      // Evitar conflito com o clique no checkbox
      if (e.target.type !== 'checkbox') {
        const checkbox = row.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        
        // Disparar evento de alteração para ativar funções dependentes
        const changeEvent = new Event('change');
        checkbox.dispatchEvent(changeEvent);
      }
    });
  });
  
  // Adicionar um observador para aplicar estes efeitos a linhas adicionadas dinamicamente
  const tableObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'TR') {
            node.addEventListener('mouseenter', () => {
              node.style.backgroundColor = 'rgba(0, 112, 209, 0.05)';
            });
            
            node.addEventListener('mouseleave', () => {
              if (!node.classList.contains('selected')) {
                node.style.backgroundColor = '';
              }
            });
            
            node.addEventListener('click', (e) => {
              if (e.target.type !== 'checkbox') {
                const checkbox = node.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                
                const changeEvent = new Event('change');
                checkbox.dispatchEvent(changeEvent);
              }
            });
          }
        });
      }
    });
  });
  
  const tableBody = document.querySelector('#subnetsTable tbody');
  if (tableBody) {
    tableObserver.observe(tableBody, { childList: true });
  }
}

/**
 * Otimiza a interface para uso em dispositivos de toque
 */
function optimizeForTouchDevices() {
  // Detectar se é um dispositivo móvel
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Adicionar classe ao body para estilos específicos
    document.body.classList.add('mobile-device');
    
    // Mostrar dicas para dispositivos móveis
    document.querySelectorAll('.mobile-hint').forEach(hint => {
      hint.style.display = 'block';
    });
    
    // Detectar orientação da tela
    function checkOrientation() {
      if (window.innerHeight > window.innerWidth) {
        // Modo retrato
        document.getElementById('mobileTip')?.classList.add('visible');
      } else {
        // Modo paisagem
        document.getElementById('mobileTip')?.classList.remove('visible');
      }
    }
    
    // Verificar orientação inicial e adicionar listener para mudanças
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    
    // Facilitar toque em áreas pequenas
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.style.minHeight = '36px';
      btn.style.minWidth = '36px';
    });
    
    // Implementar swipe para remover itens da lista de IPs
    implementSwipeToRemove();
  }
}

/**
 * Implementa funcionalidade de deslizar para remover em listas de IPs
 */
function implementSwipeToRemove() {
  // Identificar listas
  const ipLists = document.querySelectorAll('.mobile-optimized-list');
  
  ipLists.forEach(list => {
    // Configurar handlers para itens existentes
    setupSwipeHandlers(list);
    
    // Observar novos itens adicionados
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          setupSwipeHandlers(list);
        }
      });
    });
    
    observer.observe(list, { childList: true });
  });
  
  function setupSwipeHandlers(list) {
    const items = list.querySelectorAll('.ips-item');
    
    items.forEach(item => {
      // Evitar configurar várias vezes
      if (item.hasAttribute('data-swipe-configured')) return;
      
      let startX, currentX;
      const threshold = 100; // Distância para acionar remoção
      
      item.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        item.style.transition = '';
      });
      
      item.addEventListener('touchmove', e => {
        currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        
        // Limitar ao deslize para esquerda
        if (diff < 0) {
          item.style.transform = `translateX(${diff}px)`;
          item.style.opacity = 1 + (diff / threshold * 0.5);
        }
      });
      
      item.addEventListener('touchend', e => {
        if (startX && currentX && startX - currentX > threshold) {
          // Remover com animação
          item.style.transition = 'all 0.3s ease';
          item.style.transform = 'translateX(-100%)';
          item.style.opacity = '0';
          
          setTimeout(() => {
            if (item.parentNode) {
              item.parentNode.removeChild(item);
            }
          }, 300);
        } else {
          // Restaurar posição
          item.style.transition = 'all 0.3s ease';
          item.style.transform = '';
          item.style.opacity = '';
        }
      });
      
      // Marcar como configurado
      item.setAttribute('data-swipe-configured', 'true');
    });
  }
}

/**
 * Adiciona feedback visual para ações do usuário
 */
function addVisualFeedback() {
  // Adicionar feedback ao clicar em botões
  document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', function() {
      this.classList.add('button-clicked');
      setTimeout(() => {
        this.classList.remove('button-clicked');
      }, 200);
    });
  });
  
  // Animar transições entre seções
  document.querySelectorAll('.resultado, .ips-container, .suggestions').forEach(section => {
    // Adicionar observer para detectar mudanças de visibilidade
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'style' && 
            mutation.target.style.display !== 'none' && 
            !mutation.target.classList.contains('fade-in')) {
          
          mutation.target.classList.add('fade-in');
          setTimeout(() => {
            mutation.target.classList.remove('fade-in');
          }, 500);
        }
      });
    });
    
    observer.observe(section, { attributes: true });
  });
  
  // Estilo para a classe de animação (adicionar ao head)
  const style = document.createElement('style');
  style.textContent = `
    .fade-in {
      animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .button-clicked {
      transform: scale(0.95);
      opacity: 0.8;
      transition: transform 0.2s, opacity 0.2s;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Implementa melhorias de acessibilidade
 */
function improveAccessibility() {
  // Melhorar contraste no modo escuro
  if (document.body.classList.contains('dark-mode')) {
    document.querySelectorAll('.text-dark-secondary').forEach(el => {
      el.style.color = '#9aa5b1'; // Cor mais clara para texto secundário
    });
  }
  
  // Adicionar rótulos ARIA faltantes
  document.querySelectorAll('button:not([aria-label])').forEach(button => {
    // Usar texto interno como rótulo se estiver vazio
    if (button.textContent.trim()) {
      button.setAttribute('aria-label', button.textContent.trim());
    }
  });
  
  // Adicionar indicações de foco claras
  document.querySelectorAll('button, input, a').forEach(el => {
    el.addEventListener('focus', () => {
      el.classList.add('focus-visible');
    });
    el.addEventListener('blur', () => {
      el.classList.remove('focus-visible');
    });
  });
  
  // Adicionar estilo para foco
  const focusStyle = document.createElement('style');
  focusStyle.textContent = `
    .focus-visible {
      outline: 2px solid var(--primary-color) !important;
      outline-offset: 2px !important;
    }
  `;
  document.head.appendChild(focusStyle);
}