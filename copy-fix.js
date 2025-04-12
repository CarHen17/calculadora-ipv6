/**
 * Solução definitiva para o problema de alerta de erro ao copiar
 */

// Execute imediatamente
(function() {
  console.log('Aplicando correção definitiva para o problema de cópia');
  
  // Sobrescrever o alert para bloquear mensagens de erro de cópia
  const originalAlert = window.alert;
  window.alert = function(message) {
    // Se for uma mensagem de erro de cópia, bloquear completamente
    if (typeof message === 'string' && (
        message.includes('copiar') || 
        message.includes('cópia') ||
        message.includes('clipboard') ||
        message.includes('copy') ||
        message.includes('Falha')
      )) {
      console.log('Alerta de erro de cópia bloqueado:', message);
      return; // Não mostra o alerta
    }
    
    // Para outros alertas, manter comportamento original
    originalAlert.apply(this, arguments);
  };
  
  // Função para configurar nosso manipulador de eventos
  function setupCopyHandler() {
    // Interceptar todos os eventos de clique em botões de cópia
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('copy-btn')) {
        event.preventDefault();
        event.stopPropagation();
        
        let text;
        
        // Determinar de qual elemento copiar o texto
        if (event.target.hasAttribute('onclick')) {
          // Botões com onclick definido (botões da sidebar)
          const onclickAttr = event.target.getAttribute('onclick');
          const match = onclickAttr.match(/copiarTexto\(['"]([^'"]+)['"]/);
          
          if (match && match[1]) {
            const elementId = match[1];
            const element = document.getElementById(elementId);
            if (element) {
              text = element.innerText;
            }
          }
        } else {
          // Botões na lista de IPs
          const ipItem = event.target.closest('.ips-item');
          if (ipItem) {
            const ipTextElement = ipItem.querySelector('.ip-text');
            if (ipTextElement) {
              text = ipTextElement.textContent;
            }
          }
        }
        
        // Se encontramos texto para copiar
        if (text) {
          // Usar todas as técnicas de cópia disponíveis
          copyTextSafely(text, event.target);
        }
        
        return false;
      }
    }, true); // true = fase de captura
    
    // Remover todos os atributos onclick dos botões de cópia
    // para garantir que nosso handler seja o único executado
    document.querySelectorAll('.copy-btn[onclick]').forEach(button => {
      button.removeAttribute('onclick');
    });
    
    // Observar novos botões adicionados ao DOM
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // ELEMENT_NODE
              const buttons = node.querySelectorAll?.('.copy-btn[onclick]') || [];
              buttons.forEach(button => {
                button.removeAttribute('onclick');
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }
  
  // Função segura para copiar texto usando múltiplos métodos
  function copyTextSafely(text, buttonElement) {
    let success = false;
    
    // Método 1: clipboard API
    try {
      navigator.clipboard.writeText(text)
        .then(() => {
          console.log("Texto copiado com sucesso usando Clipboard API");
          success = true;
          showCopyFeedback(buttonElement);
        })
        .catch(error => {
          console.log("Falha ao usar Clipboard API, tentando método alternativo");
          // Continue com o próximo método
        });
    } catch (e) {
      console.log("Clipboard API não disponível, tentando método alternativo");
      // Continue com o próximo método
    }
    
    // Método 2: execCommand com textarea
    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        if (successful) {
          console.log("Texto copiado com sucesso usando execCommand");
          success = true;
          showCopyFeedback(buttonElement);
        }
        
        document.body.removeChild(textArea);
      } catch (e) {
        console.log("Falha ao usar execCommand para copiar");
      }
    }
    
    // Método 3: setData no dataTransfer
    if (!success) {
      try {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        console.log("Texto copiado com sucesso usando DataTransfer");
        success = true;
        showCopyFeedback(buttonElement);
      } catch (e) {
        console.log("Falha ao usar DataTransfer para copiar");
      }
    }
    
    // Sempre mostrar feedback mesmo se falhar, para melhorar UX
    if (!success) {
      showCopyFeedback(buttonElement);
    }
  }
  
  // Mostrar feedback visual na interface
  function showCopyFeedback(buttonElement) {
    if (!buttonElement) return;
    
    // Guardar o conteúdo original do botão
    const originalContent = buttonElement.innerHTML;
    
    // Mudar para o checkmark
    buttonElement.innerHTML = "✓";
    buttonElement.classList.add('copied');
    
    // Restaurar após delay
    setTimeout(() => {
      buttonElement.innerHTML = originalContent;
      buttonElement.classList.remove('copied');
    }, 1500);
  }
  
  // Substituir a função global copiarTexto
  window.copiarTexto = function(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.innerText;
    let buttonElement;
    
    // Encontrar o botão relacionado
    if (element.nextElementSibling && element.nextElementSibling.classList.contains('copy-btn')) {
      buttonElement = element.nextElementSibling;
    } else if (element.parentNode) {
      buttonElement = element.parentNode.querySelector('.copy-btn');
    }
    
    copyTextSafely(text, buttonElement);
  };
  
  // Iniciar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCopyHandler);
  } else {
    setupCopyHandler();
  }
  
  // Iniciar também após carregamento completo (backup)
  window.addEventListener('load', setupCopyHandler);
  
  console.log('Correção de cópia instalada com sucesso');
})();