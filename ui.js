/**
 * Funções de interface do usuário para a calculadora de sub-redes IPv6
 */

console.log("Inicializando ui.js...");

// Objeto UI que conterá todas as funções relacionadas a interface
window.ui = {
  // Função para atualizar informações do bloco selecionado na sidebar
  atualizarInformacoesDoBloco: function() {
    console.log("Atualizando informações do bloco na sidebar");
    let checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
    if (checkboxes.length === 1) {
      let indice = parseInt(checkboxes[0].value);
      let blocoSelecionado = window.appState.subRedesGeradas[indice];
      document.getElementById('sidebarBlockCidr').innerText = window.utils.shortenIPv6(blocoSelecionado.subnet);
      let redeHex = blocoSelecionado.network.replace(/:/g, '');
      let redeBigInt = BigInt("0x" + redeHex);
      let gatewayIpBigInt = redeBigInt + 1n; 
      let gatewayIpFormatado = window.utils.formatIPv6Address(gatewayIpBigInt);
      let gatewayIpShort = window.utils.shortenIPv6(gatewayIpFormatado);
      document.getElementById('mainBlockGateway').innerText = gatewayIpShort;
    }
  },

  // Função para atualizar o bloco agregado
  atualizarBlocoAgregado: function() {
    console.log("Atualizando bloco agregado");
    let checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
    if (checkboxes.length === 0) {
      document.getElementById('aggregatedPrefix').innerText = "N/A";
      document.getElementById('aggregatedSidebar').style.display = 'none';
      return;
    }
    document.getElementById('aggregatedSidebar').style.display = 'block';
    let selectedSubnets = Array.from(checkboxes).map(checkbox => window.appState.subRedesGeradas[parseInt(checkbox.value)]);
    let aggregate = window.utils.calcularBlocoAgregado(selectedSubnets);
    if (aggregate === null) {
      document.getElementById('aggregatedPrefix').innerText = "Bloco inválido";
    } else {
      document.getElementById('aggregatedPrefix').innerText = window.utils.shortenIPv6(aggregate.network) + "/" + aggregate.prefix;
    }
  },

  // Função para atualizar botão gerar IPs
  atualizarGerarIPsButton: function() {
    console.log("Atualizando botão gerar IPs");
    let checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
    let btn = document.getElementById('gerarIPsButton');
    btn.style.display = (checkboxes.length === 1) ? 'inline-block' : 'none';
    if (checkboxes.length !== 1) {
      document.getElementById('ipsResult').style.display = 'none';
    }
  },

  // Função para selecionar/desselecionar todos os checkboxes
  toggleSelectAll: function() {
    console.log("Alternando seleção de todas as sub-redes");
    let checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]');
    let selectAll = document.getElementById('selectAll').checked;
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAll;
      checkbox.dispatchEvent(new Event('change'));
    });
  },

  // Função para carregar mais sub-redes na tabela
  carregarMaisSubRedes: function() {
    console.log("Carregando mais sub-redes na tabela");
    let tbody = document.getElementById('subnetsTable').getElementsByTagName('tbody')[0];
    let limite = Math.min(window.appState.subRedesExibidas + 100, window.appState.subRedesGeradas.length);
    for (let i = window.appState.subRedesExibidas; i < limite; i++) {
      let row = tbody.insertRow();
      let checkboxCell = row.insertCell(0);
      let checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = i;
      checkbox.setAttribute('aria-label', `Selecionar sub-rede ${window.utils.shortenIPv6(window.appState.subRedesGeradas[i].subnet)}`);
      checkbox.addEventListener('change', () => {
        this.atualizarBlocoAgregado();
        this.atualizarGerarIPsButton();
        this.atualizarInformacoesDoBloco();
        
        // Adicionar classe para destacar linha selecionada (melhoria mobile)
        row.classList.toggle('selected', checkbox.checked);
      });
      checkboxCell.appendChild(checkbox);
      row.insertCell(1).innerText = window.utils.shortenIPv6(window.appState.subRedesGeradas[i].subnet);
      row.insertCell(2).innerText = window.utils.shortenIPv6(window.appState.subRedesGeradas[i].initial);
      row.insertCell(3).innerText = window.utils.shortenIPv6(window.appState.subRedesGeradas[i].final);
      row.insertCell(4).innerText = window.utils.shortenIPv6(window.appState.subRedesGeradas[i].network);
    }
    window.appState.subRedesExibidas = limite;
    document.getElementById('loadMoreContainer').style.display = 
      window.appState.subRedesExibidas < window.appState.subRedesGeradas.length ? 'block' : 'none';
  },

  // Função para copiar texto (sidebar)
  copiarTexto: function(elementId, feedback = true) {
    console.log("Copiando texto do elemento:", elementId);
    let text;
    const element = document.getElementById(elementId);
    
    if (element.hasAttribute('data-value')) {
      text = element.getAttribute('data-value');
    } else {
      text = element.innerText;
    }
    
    navigator.clipboard.writeText(text)
      .then(() => {
        if (feedback) {
          let tooltip = document.createElement('span');
          tooltip.innerText = "Copiado!";
          tooltip.classList.add('sidebar-tooltip');
          element.parentNode.appendChild(tooltip);
          setTimeout(() => {
            if (element.parentNode && tooltip.parentNode === element.parentNode) {
              element.parentNode.removeChild(tooltip);
            }
          }, 1500);
        }
      })
      .catch(() => alert("Falha ao copiar o texto."));
  },

  // Função para adicionar IP à lista
  appendIpToList: function(ip, number, listId) {
    console.log(`Adicionando IP ${ip} à lista ${listId}`);
    // Usar o template para criar itens consistentes
    const ipsList = document.getElementById(listId);
    
    // Verificar se o navegador suporta templates
    if ('content' in document.createElement('template')) {
      const template = document.getElementById('ipItemTemplate');
      const clone = document.importNode(template.content, true);
      
      // Preencher o item clonado
      clone.querySelector('.ip-number').textContent = `${number}.`;
      clone.querySelector('.ip-text').textContent = ip;
      
      // Configurar botão de cópia
      const copyBtn = clone.querySelector('.copy-btn');
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(ip)
          .then(() => {
            const tooltip = document.createElement('span');
            tooltip.innerText = "Copiado!";
            tooltip.classList.add('ips-tooltip');
            copyBtn.appendChild(tooltip);
            setTimeout(() => {
              if (tooltip.parentNode === copyBtn) {
                copyBtn.removeChild(tooltip);
              }
            }, 1500);
          })
          .catch(() => alert("Falha ao copiar IP."));
      });
      
      ipsList.appendChild(clone);
    } else {
      // Fallback para navegadores que não suportam template
      const li = document.createElement('li');
      li.classList.add('ips-item');
      
      const numberSpan = document.createElement('span');
      numberSpan.classList.add('ip-number');
      numberSpan.textContent = `${number}.`;
      
      const ipSpan = document.createElement('span');
      ipSpan.textContent = ip;
      ipSpan.classList.add('ip-text');
      
      const copyIcon = document.createElement('button');
      copyIcon.innerHTML = "📋";
      copyIcon.classList.add('copy-btn');
      copyIcon.title = "Clique para copiar";
      copyIcon.addEventListener('click', () => {
        navigator.clipboard.writeText(ip)
          .then(() => {
            const tooltip = document.createElement('span');
            tooltip.innerText = "Copiado!";
            tooltip.classList.add('ips-tooltip');
            copyIcon.appendChild(tooltip);
            setTimeout(() => {
              if (tooltip.parentNode === copyIcon) {
                copyIcon.removeChild(tooltip);
              }
            }, 1500);
          })
          .catch(() => alert("Falha ao copiar IP."));
      });
      
      li.appendChild(numberSpan);
      li.appendChild(ipSpan);
      li.appendChild(copyIcon);
      ipsList.appendChild(li);
    }
  },

  // Função para alternar tema claro/escuro
  toggleTheme: function() {
    console.log("Alternando tema");
    document.body.classList.toggle('dark-mode');
  },
  
  // Função para ajustar o layout responsivo
  ajustarLayoutResponsive: function() {
    console.log("Ajustando layout responsivo");
    const isMobile = window.innerWidth <= 992;
    if (isMobile) {
      const infoSidebar = document.getElementById('infoSidebar');
      const aggregatedSidebar = document.getElementById('aggregatedSidebar');
      const container = document.querySelector('.container');
      if (infoSidebar && infoSidebar.style.display !== 'none') {
        if (!document.getElementById('infoSidebarMobile')) {
          const infoClone = infoSidebar.cloneNode(true);
          infoClone.id = 'infoSidebarMobile';
          infoClone.classList.remove('sidebar');
          infoClone.style.marginBottom = '20px';
          container.insertBefore(infoClone, container.firstChild.nextSibling);
        }
      }
      if (aggregatedSidebar && aggregatedSidebar.style.display !== 'none') {
        if (!document.getElementById('aggregatedSidebarMobile')) {
          const aggregatedClone = aggregatedSidebar.cloneNode(true);
          aggregatedClone.id = 'aggregatedSidebarMobile';
          aggregatedClone.classList.remove('sidebar');
          aggregatedClone.style.marginBottom = '20px';
          container.insertBefore(aggregatedClone, document.getElementById('resultado'));
        }
      }
    } else {
      const infoSidebarMobile = document.getElementById('infoSidebarMobile');
      const aggregatedSidebarMobile = document.getElementById('aggregatedSidebarMobile');
      if (infoSidebarMobile) infoSidebarMobile.remove();
      if (aggregatedSidebarMobile) aggregatedSidebarMobile.remove();
    }
  },

  // Detectar se é um dispositivo móvel
  isMobileDevice: function() {
    return (window.innerWidth <= 768) || 
          (navigator.maxTouchPoints > 0 && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  },

  // Otimizar para dispositivos móveis
  optimizeForMobile: function() {
    const isMobile = this.isMobileDevice();
    console.log("Dispositivo móvel detectado:", isMobile);
    
    // Adicionar classe para estilos específicos de mobile
    document.body.classList.toggle('mobile-device', isMobile);
    
    // Adicionar dica de rolagem para tabelas em dispositivos móveis
    if (isMobile) {
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        // Verificar se a tabela já está em um container
        if (!table.parentElement.classList.contains('table-container')) {
          // Criar container para rolagem horizontal
          const tableContainer = document.createElement('div');
          tableContainer.classList.add('table-container');
          
          // Adicionar dica de rolagem
          const scrollHint = document.createElement('div');
          scrollHint.classList.add('table-scroll-hint');
          scrollHint.textContent = 'Deslize para ver mais →';
          
          // Inserir elementos
          table.parentNode.insertBefore(tableContainer, table);
          tableContainer.appendChild(scrollHint);
          tableContainer.appendChild(table);
          
          // Detectar quando não há mais rolagem
          tableContainer.addEventListener('scroll', function() {
            if (this.scrollLeft + this.clientWidth >= this.scrollWidth - 10) {
              scrollHint.style.opacity = '0';
            } else {
              scrollHint.style.opacity = '1';
            }
          });
        }
      });
      
      // Reorganizar botões em pares
      this.reorganizarBotoesMobile();
      
      // Implementar deslize para fechar elementos
      this.implementarDeslizeParaFechar();
    }
  },

  // Reorganizar botões para layout mobile
  reorganizarBotoesMobile: function() {
    // Botões que devem ficar em pares
    const buttonGroups = [
      // Exemplo: [container, [botão1, botão2]]
      ['#mainBlockIpsContainer', ['#resetMainBlockIPsButton', '#moreMainBlockIpsBtn']],
      ['#ipsResult', ['#resetIPsButton', '#gerarMaisIPsButton']]
    ];
    
    buttonGroups.forEach(group => {
      const container = document.querySelector(group[0]);
      const buttons = group[1].map(selector => document.querySelector(selector));
      
      if (container && buttons.every(btn => btn)) {
        // Verificar se já existe um container para os botões
        let buttonContainer = container.querySelector('.two-button-container');
        
        if (!buttonContainer) {
          // Criar container para os botões
          buttonContainer = document.createElement('div');
          buttonContainer.classList.add('two-button-container');
          
          // Mover botões para o container
          buttons.forEach(btn => {
            // Remover o botão de onde ele estava
            if (btn.parentNode) {
              btn.parentNode.removeChild(btn);
            }
            // Adicionar ao novo container
            buttonContainer.appendChild(btn);
          });
          
          // Adicionar container ao final do elemento pai
          container.appendChild(buttonContainer);
        }
      }
    });
    
    // Adicionar classe full-width aos botões que devem ocupar toda a largura
    const fullWidthButtons = ['#calcularBtn', '#gerarIPsButton', '#gerarMaisIPsButton'];
    fullWidthButtons.forEach(selector => {
      const button = document.querySelector(selector);
      if (button) {
        button.classList.add('full-width-button');
      }
    });
  },

  // Implementar funcionalidade de deslize para fechar em listas
  implementarDeslizeParaFechar: function() {
    if (!this.isMobileDevice()) return;
    
    // Identificar listas que podem ter deslize
    const listas = [
      document.getElementById('ipsList'),
      document.getElementById('mainBlockIpsList')
    ];
    
    listas.forEach(lista => {
      if (!lista) return;
      
      // Adicionar evento de toque para cada item adicionado
      const observador = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach(node => {
              if (node.classList && node.classList.contains('ips-item')) {
                this.configurarDeslizeItem(node);
              }
            });
          }
        });
      });
      
      observador.observe(lista, { childList: true });
      
      // Configurar itens existentes
      Array.from(lista.querySelectorAll('.ips-item')).forEach(item => {
        this.configurarDeslizeItem(item);
      });
    });
  },

  // Configurar deslize para um item específico
  configurarDeslizeItem: function(item) {
    let startX, currentX;
    const threshold = 100; // Distância mínima para acionar a remoção
    
    item.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      item.style.transition = '';
    });
    
    item.addEventListener('touchmove', e => {
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      
      // Permitir apenas deslize para a esquerda
      if (diff < 0) {
        item.style.transform = `translateX(${diff}px)`;
        item.style.opacity = 1 + (diff / threshold);
      }
    });
    
    item.addEventListener('touchend', e => {
      if (startX && currentX && startX - currentX > threshold) {
        // Deslizou além do limite - remover
        item.style.transition = 'transform 0.3s, opacity 0.3s';
        item.style.transform = 'translateX(-100%)';
        item.style.opacity = '0';
        
        // Remover após animação
        setTimeout(() => {
          if (item.parentNode) {
            item.parentNode.removeChild(item);
          }
        }, 300);
      } else {
        // Não deslizou o suficiente - restaurar
        item.style.transition = 'transform 0.3s';
        item.style.transform = '';
        item.style.opacity = '';
      }
    });
  },

  // Esconder teclado ao tocar fora do campo de entrada
  setupHideKeyboard: function() {
    if (!this.isMobileDevice()) return;
    
    document.addEventListener('touchstart', function(e) {
      // Se não estiver tocando em um campo de entrada
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        // Encontrar o elemento com foco
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          // Esconder teclado
          activeElement.blur();
        }
      }
    });
  },

  // Ajustar zoom de visualização (viewport) para evitar problemas em iOS
  fixViewportForIOS: function() {
    // Verificar se é um dispositivo iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      // Ajustar meta viewport
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1';
        
        // Restaurar zoom após 1 segundo
        setTimeout(() => {
          viewportMeta.content = 'width=device-width, initial-scale=1';
        }, 1000);
      }
      
      // Corrigir problema de cálculo de altura em iOS
      const fixHeight = () => {
        document.documentElement.style.height = `${window.innerHeight}px`;
      };
      
      window.addEventListener('resize', fixHeight);
      fixHeight();
    }
  },

  // Inicializar todas as otimizações para dispositivos móveis
  initMobileOptimizations: function() {
    this.optimizeForMobile();
    this.setupHideKeyboard();
    this.fixViewportForIOS();
    
    // Reajustar quando a tela for redimensionada
    window.addEventListener('resize', () => this.optimizeForMobile());
    
    // Detectar orientação
    window.addEventListener('orientationchange', () => {
      // Pequeno delay para permitir que o navegador atualize dimensões
      setTimeout(() => this.optimizeForMobile(), 100);
    });
    
    // Configurar banner de dica para dispositivos móveis
    const closeTipButton = document.querySelector('.close-tip');
    if (closeTipButton) {
      closeTipButton.addEventListener('click', () => {
        const banner = document.getElementById('mobileTip');
        if (banner) {
          banner.style.display = 'none';
        }
      });
    }
  },

  // Funções para os botões de navegação
  scrollToTop: function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  },

  scrollToBottom: function() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }
};

// Exportar a função copiarTexto globalmente para uso nos eventos onclick do HTML
window.copiarTexto = function(elementId, feedback = true) {
  window.ui.copiarTexto(elementId, feedback);
};
