/**
 * UI Controller Module for IPv6 Calculator
 * 
 * Este módulo gerencia todos os aspectos da interface do usuário,
 * incluindo renderização, atualização de elementos DOM e interações.
 */

const UIController = (function() {
  'use strict';
  
  /**
   * Referências aos elementos principais da UI
   * @private
   */
  const elements = {
    // Inicializa vazios e os preenche posteriormente para evitar erros
    header: null,
    steps: [],
    table: null,
    tableBody: null,
    ipsList: null,
    mainBlockIpsList: null,
    loadMoreButton: null,
    loadMoreContainer: null,
    toggleThemeBtn: null,
    mainBlockSection: null,
    resultado: null,
    ipsResult: null,
    visualizationSection: null,
    tooltips: []
  };
  
  /**
   * Inicializa as referências aos elementos DOM
   */
  function initElements() {
    // Inicializar com segurança - verificando existência
    elements.header = document.querySelector('.header');
    elements.steps = document.querySelectorAll('.step');
    elements.table = document.getElementById('subnetsTable');
    elements.tableBody = document.querySelector('#subnetsTable tbody');
    elements.ipsList = document.getElementById('ipsList');
    elements.mainBlockIpsList = document.getElementById('mainBlockIpsList');
    elements.loadMoreButton = document.getElementById('loadMoreButton');
    elements.loadMoreContainer = document.getElementById('loadMoreContainer');
    elements.toggleThemeBtn = document.getElementById('toggleThemeBtn');
    elements.mainBlockSection = document.getElementById('mainBlockSection');
    elements.resultado = document.getElementById('resultado');
    elements.ipsResult = document.getElementById('ipsResult');
    elements.visualizationSection = document.getElementById('visualizationSection');
    elements.tooltips = document.querySelectorAll('.tooltip');
  }
  
  /**
   * Atualiza o passo atual no indicador de progresso
   * @param {number} step - Número do passo a ser ativado
   */
  function updateStep(step) {
    try {
      const steps = document.querySelectorAll('.step');
      if (steps && steps.length > 0) {
        steps.forEach(el => el.classList.remove('active'));
        
        const currentStep = document.getElementById(`step${step}`);
        if (currentStep) {
          currentStep.classList.add('active');
        }
      }
      
      // Atualizar o estado global para compatibilidade
      if (window.appState) {
        window.appState.currentStep = step;
      }
    } catch (error) {
      console.error("Erro ao atualizar passo:", error);
    }
  }
  
  /**
   * Alterna o tema entre claro e escuro
   */
  function toggleTheme() {
    try {
      document.body.classList.toggle('dark-mode');
      
      // Atualizar ícone do botão
      const themeBtn = document.getElementById('toggleThemeBtn');
      if (themeBtn) {
        if (document.body.classList.contains('dark-mode')) {
          themeBtn.innerHTML = '<i class="fas fa-sun"></i> Tema';
          // Salvar preferência
          localStorage.setItem('themePreference', 'dark');
        } else {
          themeBtn.innerHTML = '<i class="fas fa-moon"></i> Tema';
          // Salvar preferência
          localStorage.setItem('themePreference', 'light');
        }
      }
    } catch (error) {
      console.error("Erro ao alternar tema:", error);
    }
  }
  
  /**
   * Carrega a preferência de tema do localStorage
   */
  function loadThemePreference() {
    try {
      const themePreference = localStorage.getItem('themePreference');
      
      if (themePreference === 'dark') {
        document.body.classList.add('dark-mode');
        const themeBtn = document.getElementById('toggleThemeBtn');
        if (themeBtn) {
          themeBtn.innerHTML = '<i class="fas fa-sun"></i> Tema';
        }
      } else if (themePreference === 'light') {
        document.body.classList.remove('dark-mode');
        const themeBtn = document.getElementById('toggleThemeBtn');
        if (themeBtn) {
          themeBtn.innerHTML = '<i class="fas fa-moon"></i> Tema';
        }
      } else {
        // Usar preferência do sistema
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.toggle('dark-mode', prefersDark);
        const themeBtn = document.getElementById('toggleThemeBtn');
        if (themeBtn) {
          if (prefersDark) {
            themeBtn.innerHTML = '<i class="fas fa-sun"></i> Tema';
          } else {
            themeBtn.innerHTML = '<i class="fas fa-moon"></i> Tema';
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar preferência de tema:", error);
    }
  }
  
  /**
   * Copia texto para a área de transferência
   * @param {string} elementId - ID do elemento contendo o texto
   * @param {boolean} feedback - Se deve mostrar feedback visual
   */
  function copiarTexto(elementId, feedback = true) {
    try {
      let text;
      const element = document.getElementById(elementId);
      
      if (!element) {
        console.error(`Elemento "${elementId}" não encontrado`);
        return;
      }
      
      if (element.hasAttribute('data-value')) {
        text = element.getAttribute('data-value');
      } else {
        text = element.innerText;
      }
      
      // Usar API moderna para clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            if (feedback) {
              showCopyFeedback(element);
            }
          })
          .catch(error => {
            console.error("Erro ao copiar para clipboard:", error);
            alert("Falha ao copiar o texto.");
          });
      } else {
        // Fallback para método mais antigo
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            if (feedback) {
              showCopyFeedback(element);
            }
          } else {
            alert("Falha ao copiar o texto.");
          }
        } catch (err) {
          console.error("Erro ao copiar:", err);
          alert("Falha ao copiar o texto.");
        }
        
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error("Erro ao copiar texto:", error);
    }
  }
  
  /**
   * Mostra feedback visual após cópia bem-sucedida
   * @param {HTMLElement} element - Elemento que contém o texto copiado
   */
  function showCopyFeedback(element) {
    try {
      // Verificar se é um botão ou outro elemento
      const isButton = element.classList.contains('copy-btn');
      
      if (isButton) {
        // Feedback no botão
        const originalHTML = element.innerHTML;
        element.innerHTML = '<i class="fas fa-check"></i>';
        
        setTimeout(() => {
          element.innerHTML = originalHTML;
        }, 1500);
      } else {
        // Cria tooltip flutuante
        const tooltip = document.createElement('div');
        tooltip.className = 'copy-tooltip';
        tooltip.textContent = "Copiado!";
        
        // Posicionar o tooltip
        const rect = element.getBoundingClientRect();
        
        tooltip.style.position = 'absolute';
        tooltip.style.left = `${rect.left + (rect.width / 2) - 30}px`;
        tooltip.style.top = `${rect.top - 30}px`;
        
        document.body.appendChild(tooltip);
        
        // Iniciar animação
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
          tooltip.style.opacity = '1';
          tooltip.style.transform = 'translateY(0)';
          
          // Remover após alguns segundos
          setTimeout(() => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
              if (tooltip.parentNode) {
                document.body.removeChild(tooltip);
              }
            }, 200);
          }, 1500);
        }, 10);
      }
    } catch (error) {
      console.error("Erro ao mostrar feedback de cópia:", error);
    }
  }
  
  /**
   * Adiciona um novo IP à lista de IPs
   * @param {string} ip - Endereço IP a ser adicionado
   * @param {number} number - Número do IP na lista
   * @param {string} listId - ID da lista onde o IP será adicionado
   */
  function appendIpToList(ip, number, listId) {
    try {
      const ipsList = document.getElementById(listId);
      if (!ipsList) {
        console.error(`Lista de IPs "${listId}" não encontrada`);
        return;
      }
      
      // Criar elementos do item
      const li = document.createElement('li');
      li.className = 'ip-item';
      
      const numberSpan = document.createElement('span');
      numberSpan.className = 'ip-number';
      numberSpan.textContent = `${number}.`;
      
      const ipSpan = document.createElement('span');
      ipSpan.className = 'ip-text';
      ipSpan.textContent = ip;
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
      copyBtn.title = "Copiar IP";
      copyBtn.setAttribute('type', 'button');
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(ip)
          .then(() => {
            this.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
              this.innerHTML = '<i class="fas fa-copy"></i>';
            }, 1500);
          })
          .catch(() => alert("Falha ao copiar IP."));
      });
      
      // Montar o item na lista
      li.appendChild(numberSpan);
      li.appendChild(ipSpan);
      li.appendChild(copyBtn);
      ipsList.appendChild(li);

      // Exibir botão de exportação correspondente se houver itens na lista
      if (typeof ExportController !== 'undefined' && ExportController.toggleExportButtonVisibility) {
          if (listId === 'mainBlockIpsList') {
              ExportController.toggleExportButtonVisibility('exportMainBlockIpsBtn', true);
          } else if (listId === 'ipsList') {
              ExportController.toggleExportButtonVisibility('exportSubnetIpsBtn', true);
          }
      }
    } catch (error) {
      console.error("Erro ao adicionar IP à lista:", error);
    }
  }
  
  /**
   * Carrega mais sub-redes na tabela
   * @param {number} startIndex - Índice inicial para carregar
   * @param {number} limit - Quantidade a ser carregada
   */
  function carregarMaisSubRedes(startIndex, limit) {
    try {
      if (!window.appState || !window.appState.subRedesGeradas) {
        console.error("Estado da aplicação não inicializado");
        return;
      }
      
      const tbody = document.querySelector('#subnetsTable tbody');
      if (!tbody) {
        console.error("Tabela de sub-redes não encontrada");
        return;
      }
      
      const endIndex = Math.min(startIndex + limit, window.appState.subRedesGeradas.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const subnet = window.appState.subRedesGeradas[i];
        
        // Verificar se a sub-rede é válida
        if (!subnet || !subnet.subnet || !subnet.initial || !subnet.final || !subnet.network) {
          console.warn(`Sub-rede inválida no índice ${i}:`, subnet);
          continue;
        }
        
        const row = tbody.insertRow();
        
        // Célula para checkbox
        const checkboxCell = row.insertCell(0);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = i;
        
        // Segurança para o caso de IPv6Utils não estar disponível
        const shortenedSubnet = typeof IPv6Utils !== 'undefined' && typeof IPv6Utils.shortenIPv6 === 'function'
          ? IPv6Utils.shortenIPv6(subnet.subnet)
          : subnet.subnet;
        
        checkbox.setAttribute('aria-label', `Selecionar sub-rede ${shortenedSubnet}`);
        
        checkbox.addEventListener('change', function() {
          // Atualizar bloco agregado e UI
          atualizarBlocoAgregado();
          atualizarGerarIPsButton();
          atualizarInformacoesDoBloco();
          
          // Adicionar efeito visual para linha selecionada
          row.classList.toggle('selected', checkbox.checked);
        });
        
        checkboxCell.appendChild(checkbox);
        
        // Células de dados - usando IPv6Utils se disponível
        if (typeof IPv6Utils !== 'undefined' && typeof IPv6Utils.shortenIPv6 === 'function') {
          row.insertCell(1).innerText = IPv6Utils.shortenIPv6(subnet.subnet);
          row.insertCell(2).innerText = IPv6Utils.shortenIPv6(subnet.initial);
          row.insertCell(3).innerText = IPv6Utils.shortenIPv6(subnet.final);
          row.insertCell(4).innerText = IPv6Utils.shortenIPv6(subnet.network);
        } else {
          // Fallback se IPv6Utils não estiver disponível
          row.insertCell(1).innerText = subnet.subnet;
          row.insertCell(2).innerText = subnet.initial;
          row.insertCell(3).innerText = subnet.final;
          row.insertCell(4).innerText = subnet.network;
        }
      }
      
      // Atualizar estado e controles
      window.appState.subRedesExibidas = endIndex;
      
      const loadMoreContainer = document.getElementById('loadMoreContainer');
      if (loadMoreContainer) {
        loadMoreContainer.style.display = 
          window.appState.subRedesExibidas < window.appState.subRedesGeradas.length ? 'block' : 'none';
      }

      // Exibir botão de exportação da tabela se houver linhas
      if (tbody.rows.length > 0 && typeof ExportController !== 'undefined' && ExportController.toggleExportButtonVisibility) {
          ExportController.toggleExportButtonVisibility('exportSubnetsTableBtn', true);
      }
    } catch (error) {
      console.error("Erro ao carregar mais sub-redes:", error);
    }
  }
  
  /**
   * Atualiza as informações do bloco selecionado na sidebar
   */
  function atualizarInformacoesDoBloco() {
    try {
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      
      // Verificar se temos elementos-alvo na sidebar
      const sidebarBlockCidr = document.getElementById('sidebarBlockCidr');
      const mainBlockGateway = document.getElementById('mainBlockGateway');
      
      if (!sidebarBlockCidr || !mainBlockGateway) {
        console.warn("Elementos da sidebar não encontrados");
        return;
      }
      
      if (checkboxes.length === 1) {
        const indice = parseInt(checkboxes[0].value);
        
        if (isNaN(indice) || !window.appState.subRedesGeradas[indice]) {
          console.warn("Índice inválido ou sub-rede não encontrada");
          return;
        }
        
        const blocoSelecionado = window.appState.subRedesGeradas[indice];
        
        // Verificar se a sub-rede tem propriedades necessárias
        if (!blocoSelecionado.subnet || !blocoSelecionado.network) {
          console.warn("Sub-rede selecionada não tem propriedades necessárias");
          return;
        }
        
        // Usar shortenIPv6 se disponível
        if (typeof IPv6Utils !== 'undefined' && typeof IPv6Utils.shortenIPv6 === 'function') {
          sidebarBlockCidr.innerText = IPv6Utils.shortenIPv6(blocoSelecionado.subnet);
        } else {
          sidebarBlockCidr.innerText = blocoSelecionado.subnet;
        }
        
        // Calcular gateway - verificar se IPv6Utils está disponível
        if (typeof IPv6Utils !== 'undefined' && 
            typeof IPv6Utils.formatIPv6Address === 'function' && 
            typeof IPv6Utils.shortenIPv6 === 'function') {
          
          try {
            const redeHex = blocoSelecionado.network.replace(/:/g, '');
            const redeBigInt = BigInt("0x" + redeHex);
            const gatewayIpBigInt = redeBigInt + 1n; 
            const gatewayIpFormatado = IPv6Utils.formatIPv6Address(gatewayIpBigInt);
            const gatewayIpShort = IPv6Utils.shortenIPv6(gatewayIpFormatado);
            
            mainBlockGateway.innerText = gatewayIpShort;
          } catch (error) {
            console.error("Erro ao calcular gateway:", error);
            mainBlockGateway.innerText = "-";
          }
        } else {
          // Fallback sem IPv6Utils
          mainBlockGateway.innerText = "-";
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar informações do bloco:", error);
    }
  }
  
  /**
   * Atualiza o bloco agregado na sidebar
   */
  function atualizarBlocoAgregado() {
    try {
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      const aggregatedPrefix = document.getElementById('aggregatedPrefix');
      const aggregatedContent = document.getElementById('aggregatedContent');
      
      if (!aggregatedPrefix || !aggregatedContent) {
        console.warn("Elementos do bloco agregado não encontrados");
        return;
      }
      
      if (checkboxes.length === 0) {
        aggregatedPrefix.innerText = "N/A";
        aggregatedContent.style.display = "none";
        return;
      }
      
      aggregatedContent.style.display = "block";
      
      // Verificar se IPv6Utils está disponível
      if (typeof IPv6Utils === 'undefined' || typeof IPv6Utils.calcularBlocoAgregado !== 'function') {
        console.warn("Função IPv6Utils.calcularBlocoAgregado não disponível");
        aggregatedPrefix.innerText = "N/A";
        return;
      }
      
      const selectedSubnets = Array.from(checkboxes).map(checkbox => {
        const index = parseInt(checkbox.value);
        return window.appState.subRedesGeradas[index];
      });
      
      const aggregate = IPv6Utils.calcularBlocoAgregado(selectedSubnets);
      
      if (aggregate === null) {
        aggregatedPrefix.innerText = "Bloco inválido";
      } else {
        // Usar shortenIPv6 se disponível
        if (typeof IPv6Utils.shortenIPv6 === 'function') {
          aggregatedPrefix.innerText = IPv6Utils.shortenIPv6(aggregate.network) + "/" + aggregate.prefix;
        } else {
          aggregatedPrefix.innerText = aggregate.network + "/" + aggregate.prefix;
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar bloco agregado:", error);
    }
  }
  
  /**
   * Atualiza a visibilidade do botão de gerar IPs
   */
  function atualizarGerarIPsButton() {
    try {
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      const btn = document.getElementById('gerarIPsButton');
      
      if (btn) {
        btn.style.display = (checkboxes.length === 1) ? 'inline-block' : 'none';
      }
    } catch (error) {
      console.error("Erro ao atualizar botão de gerar IPs:", error);
    }
  }
  
  /**
   * Seleciona ou desmarca todas as sub-redes na tabela
   */
  function toggleSelectAll() {
    try {
      const selectAll = document.getElementById('selectAll');
      if (!selectAll) {
        console.warn("Checkbox 'selectAll' não encontrado");
        return;
      }
      
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]');
      const isChecked = selectAll.checked;
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        
        // Disparar evento change para atualizar linhas selecionadas
        const changeEvent = new Event('change');
        checkbox.dispatchEvent(changeEvent);
      });
    } catch (error) {
      console.error("Erro ao alternar seleção de todas as sub-redes:", error);
    }
  }
  
  /**
   * Ajusta o layout para dispositivos móveis
   */
  function ajustarLayoutResponsivo() {
    try {
      const isMobile = window.innerWidth <= 992;
      
      if (isMobile) {
        // Duplicar sidebars para o layout móvel
        duplicarSidebarParaMobile("infoSidebar", "infoSidebarMobile");
      } else {
        // Remover duplicatas em layouts desktop
        removerElemento("infoSidebarMobile");
      }
    } catch (error) {
      console.error("Erro ao ajustar layout responsivo:", error);
    }
  }
  
  /**
   * Duplica uma sidebar para visualização móvel
   * @param {string} originalId - ID da sidebar original
   * @param {string} mobileId - ID para a versão móvel
   */
  function duplicarSidebarParaMobile(originalId, mobileId) {
    try {
      const original = document.getElementById(originalId);
      const container = document.querySelector('.container');
      
      if (!original || !container || original.style.display === 'none') return;
      
      // Verificar se já existe uma versão móvel
      if (!document.getElementById(mobileId)) {
        const clone = original.cloneNode(true);
        clone.id = mobileId;
        clone.classList.remove('sidebar');
        clone.style.marginBottom = '20px';
        
        // Determinar posição de inserção
        if (originalId === 'infoSidebar') {
          const firstChild = container.firstChild;
          if (firstChild && firstChild.nextSibling) {
            container.insertBefore(clone, firstChild.nextSibling);
          } else {
            container.appendChild(clone);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao duplicar sidebar para mobile:", error);
    }
  }
  
  /**
   * Remove um elemento do DOM pelo ID
   * @param {string} elementId - ID do elemento a remover
   */
  function removerElemento(elementId) {
    try {
      const elemento = document.getElementById(elementId);
      if (elemento && elemento.parentNode) {
        elemento.parentNode.removeChild(elemento);
      }
    } catch (error) {
      console.error("Erro ao remover elemento:", error);
    }
  }
  
  /**
   * Exibe uma notificação temporária
   * @param {string} message - Mensagem a ser exibida
   * @param {string} type - Tipo de notificação ('success', 'error', 'warning')
   * @param {number} duration - Duração em milissegundos
   */
  function showNotification(message, type = 'success', duration = 3000) {
    try {
      // Criar elemento de notificação
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      
      // Configurar estilos base
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.padding = '12px 20px';
      notification.style.borderRadius = '4px';
      notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      notification.style.zIndex = '9999';
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(20px)';
      notification.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      // Configurar cores com base no tipo
      switch (type) {
        case 'success':
          notification.style.backgroundColor = '#4caf50';
          notification.style.color = 'white';
          message = `✓ ${message}`;
          break;
        case 'error':
          notification.style.backgroundColor = '#e53935';
          notification.style.color = 'white';
          message = `⚠ ${message}`;
          break;
        case 'warning':
          notification.style.backgroundColor = '#ffa000';
          notification.style.color = 'white';
          message = `! ${message}`;
          break;
        default:
          notification.style.backgroundColor = '#0070d1';
          notification.style.color = 'white';
      }
      
      notification.textContent = message;
      document.body.appendChild(notification);
      
      // Animar entrada
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
        
        // Remover após duração especificada
        setTimeout(() => {
          notification.style.opacity = '0';
          notification.style.transform = 'translateY(20px)';
          
          setTimeout(() => {
            if (notification.parentNode) {
              document.body.removeChild(notification);
            }
          }, 300);
        }, duration);
      }, 10);
    } catch (error) {
      console.error("Erro ao mostrar notificação:", error);
    }
  }
  
  /**
   * Funções de detecção e otimização para dispositivos móveis
   */
  const mobileUtils = {
    /**
     * Detecta se é um dispositivo móvel
     * @returns {boolean} - True se for dispositivo móvel
     */
    isMobileDevice: function() {
      try {
        return (window.innerWidth <= 768) || 
                (navigator.maxTouchPoints > 0 && 
                 /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
      } catch (error) {
        console.error("Erro ao detectar dispositivo móvel:", error);
        return false;
      }
    },
    
    /**
     * Otimiza a interface para dispositivos móveis
     */
    optimizeForMobile: function() {
      try {
        const isMobile = this.isMobileDevice();
        
        // Adicionar classe para estilos específicos de mobile
        document.body.classList.toggle('mobile-device', isMobile);
        
        // Adicionar dica de rolagem para tabelas em dispositivos móveis
        if (isMobile) {
          document.querySelectorAll('.table-container').forEach(container => {
            // Verificar se já tem a dica
            if (!container.querySelector('.table-scroll-hint')) {
              const scrollHint = document.createElement('div');
              scrollHint.className = 'table-scroll-hint';
              scrollHint.textContent = 'Deslize para ver mais →';
              scrollHint.style.fontSize = '12px';
              scrollHint.style.color = 'rgba(0, 0, 0, 0.5)';
              scrollHint.style.padding = '8px';
              scrollHint.style.textAlign = 'center';
              
              container.appendChild(scrollHint);
              
              // Ocultar a dica quando chegar ao final da tabela
              container.addEventListener('scroll', function() {
                if (this.scrollLeft + this.clientWidth >= this.scrollWidth - 10) {
                  scrollHint.style.opacity = '0';
                } else {
                  scrollHint.style.opacity = '1';
                }
              });
            }
          });
        }
      } catch (error) {
        console.error("Erro ao otimizar para dispositivos móveis:", error);
      }
    },
    
    /**
     * Inicializa otimizações para dispositivos móveis
     */
    initMobileOptimizations: function() {
      try {
        this.optimizeForMobile();
        
        // Reajustar quando a tela for redimensionada
        window.addEventListener('resize', () => this.optimizeForMobile());
      } catch (error) {
        console.error("Erro ao inicializar otimizações móveis:", error);
      }
    }
  };
  
  /**
   * Funções de navegação e scrolling
   */
  const navigation = {
    /**
     * Rola para o topo da página
     */
    scrollToTop: function() {
      try {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } catch (error) {
        // Fallback para navegadores que não suportam comportamento smooth
        window.scrollTo(0, 0);
      }
    },
    
    /**
     * Rola para o final da página
     */
    scrollToBottom: function() {
      try {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
      } catch (error) {
        // Fallback para navegadores que não suportam comportamento smooth
        window.scrollTo(0, document.body.scrollHeight);
      }
    },
    
    /**
     * Rola até um elemento específico
     * @param {string|HTMLElement} target - ID do elemento ou o próprio elemento
     * @param {Object} options - Opções de scrolling
     */
    scrollToElement: function(target, options = { behavior: 'smooth', offset: 0 }) {
      try {
        const element = typeof target === 'string' ? document.getElementById(target) : target;
        
        if (!element) {
          console.error(`Elemento "${target}" não encontrado para scroll`);
          return;
        }
        
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        window.scrollTo({
          top: rect.top + scrollTop - (options.offset || 0),
          behavior: options.behavior || 'smooth'
        });
      } catch (error) {
        console.error("Erro ao rolar para elemento:", error);
      }
    }
  };
  
  /**
   * Inicializa o módulo UI
   */
  function initialize() {
    try {
      console.log("Inicializando módulo UIController...");
      
      // Inicializar referências aos elementos DOM
      initElements();
      
      // Inicializar otimizações para dispositivos móveis
      mobileUtils.initMobileOptimizations();
      
      // Ajustar layout responsivo
      ajustarLayoutResponsivo();
      
      // Adicionar listener para redimensionamento da janela
      window.addEventListener('resize', ajustarLayoutResponsivo);
      
      // Carregar preferência de tema
      loadThemePreference();
      
      // Configurar o botão de tema corretamente
      const themeBtn = document.getElementById('toggleThemeBtn');
      if (themeBtn) {
        // Garantir que o botão de tema use nossa função toggleTheme
        themeBtn.onclick = toggleTheme;
      }
      
      console.log("Módulo UIController inicializado com sucesso");
      
      return true;
    } catch (error) {
      console.error("Erro ao inicializar UIController:", error);
      return false;
    }
  }
  
  // Executar inicialização quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // API pública
  return {
    updateStep,
    toggleTheme,
    copiarTexto,
    appendIpToList,
    carregarMaisSubRedes,
    toggleSelectAll,
    ajustarLayoutResponsivo,
    atualizarInformacoesDoBloco,
    atualizarBlocoAgregado,
    atualizarGerarIPsButton,
    showNotification,
    mobileUtils,
    navigation
  };
})();

// Exportar globalmente para compatibilidade com código existente
window.UIController = UIController;