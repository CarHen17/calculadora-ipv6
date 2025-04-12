/**
 * Script combinado corrigido para calculadora IPv6
 * Este arquivo combina todas as funcionalidades em um único script
 * para eliminar problemas de ordem de carregamento e dependências.
 */

// Inicialização imediata
console.log("Iniciando calculadora IPv6...");

// PARTE 1: DEFINIÇÃO DO OBJETO GLOBAL DE ESTADO
// =============================================
window.appState = {
  subRedesGeradas: [],
  subRedesExibidas: 0,
  totalSubRedesGerar: 0,
  selectedBlock: null,
  currentIpOffset: 0,
  mainBlock: null,
  mainBlockCurrentOffset: 0,
  mainBlockIpsChunkSize: 100,
  isMainBlockIpsVisible: false
};
console.log("Estado global inicializado:", window.appState);

// PARTE 2: UTILITÁRIOS PARA MANIPULAÇÃO DE IPV6
// =============================================
window.utils = {
  // Função para validar IPv6 com prefixo
  isValidIPv6: function(addressCIDR) {
    try {
      console.log("Validando IPv6:", addressCIDR);
      let [addr, prefix] = addressCIDR.split('/');
      if (!prefix || isNaN(prefix)) return false;
      const prefixNum = parseInt(prefix);
      if (prefixNum < 1 || prefixNum > 128) return false;
      const regex = /^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$/;
      const expanded = this.expandIPv6Address(addressCIDR);
      if (expanded.startsWith("Erro")) return false;
      return regex.test(expanded);
    } catch (error) {
      console.error("Erro ao validar IPv6:", error);
      return false;
    }
  },

  // Função para validar e retornar mensagem de erro
  validateIPv6: function(addressCIDR) {
    try {
      console.log("Validando IPv6 com detalhes:", addressCIDR);
      const [addr, prefix] = addressCIDR.split('/');
      if (!addr || !prefix || isNaN(prefix)) {
        return "Por favor, insira um endereço IPv6 válido no formato CIDR (ex.: 2001:db8::/41).";
      }
      const prefixNum = parseInt(prefix);
      if (prefixNum < 1 || prefixNum > 128) {
        return "O prefixo inicial deve estar entre 1 e 128.";
      }
      const enderecoCompleto = this.expandIPv6Address(addressCIDR);
      if (enderecoCompleto.startsWith("Erro")) {
        return enderecoCompleto;
      }
      const groups = enderecoCompleto.split(':');
      for (let i = 0; i < groups.length; i++) {
        if (!/^[0-9a-fA-F]{4}$/.test(groups[i])) {
          return `Grupo ${i + 1} contém caracteres inválidos ou possui comprimento incorreto.`;
        }
      }
      return null;
    } catch (error) {
      console.error("Erro ao validar IPv6 com detalhes:", error);
      return "Erro ao processar o endereço IPv6.";
    }
  },

  // Função para expandir IPv6
  expandIPv6Address: function(addressCIDR) {
    try {
      let [addr, prefix] = addressCIDR.split('/');
      if (!addr) return "Erro: Endereço inválido.";
      let parts = addr.split("::");
      if (parts.length > 2) {
        return "Erro: Não pode haver mais de um '::'.";
      }
      let head = parts[0] ? parts[0].split(':') : [];
      let tail = parts.length === 2 && parts[1] ? parts[1].split(':') : [];
      let missing = 8 - (head.length + tail.length);
      if (missing < 0) return "Erro: Muitos grupos de hexadecimais.";
      let zeros = new Array(missing).fill("0000");
      let fullParts = head.concat(zeros).concat(tail);
      for (let i = 0; i < fullParts.length; i++) {
        if (!/^[0-9a-fA-F]{1,4}$/.test(fullParts[i])) {
          return `Erro: Grupo ${i + 1} contém caracteres inválidos.`;
        }
        fullParts[i] = fullParts[i].padStart(4, '0');
      }
      return fullParts.join(':');
    } catch (error) {
      console.error("Erro ao expandir IPv6:", error);
      return "Erro: Falha ao processar o endereço.";
    }
  },

  // Função para encurtar IPv6
  shortenIPv6: function(address) {
    try {
      let groups = address.split(':').map(g => g.replace(/^0+/, '') || '0');
      let bestStart = -1, bestLen = 0;
      let curStart = -1, curLen = 0;
      for (let i = 0; i < groups.length; i++) {
        if (groups[i] === '0') {
          if (curStart === -1) {
            curStart = i;
            curLen = 1;
          } else {
            curLen++;
          }
        } else {
          if (curLen > bestLen) {
            bestLen = curLen;
            bestStart = curStart;
          }
          curStart = -1;
          curLen = 0;
        }
      }
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
      if (bestLen < 2) {
        return groups.join(':');
      }
      let prefix = groups.slice(0, bestStart);
      let suffix = groups.slice(bestStart + bestLen);
      let result = '';
      if (prefix.length > 0) {
        result = prefix.join(':') + ':';
      }
      result += ':';
      if (suffix.length > 0) {
        result += suffix.join(':');
      }
      result = result.replace(/:{3,}/, '::');
      return result;
    } catch (error) {
      console.error("Erro ao encurtar IPv6:", error);
      return address; // Retorna o endereço original em caso de erro
    }
  },

  // Função para formatar IPv6 como string hexadecimal
  formatIPv6Address: function(ipv6BigInt) {
    try {
      console.log("Formatando IPv6 BigInt:", ipv6BigInt.toString());
      let hexStr = ipv6BigInt.toString(16).padStart(32, '0');
      return hexStr.match(/.{1,4}/g).join(':');
    } catch (error) {
      console.error("Erro ao formatar IPv6 BigInt:", error);
      return "0000:0000:0000:0000:0000:0000:0000:0000"; // Retorna endereço zero em caso de erro
    }
  },

  // Função para calcular bloco agregado
  calcularBlocoAgregado: function(selectedSubnets) {
    try {
      console.log("Calculando bloco agregado para", selectedSubnets.length, "sub-redes");
      if (selectedSubnets.length === 0) return null;
      let prefixLength = parseInt(selectedSubnets[0].subnet.split('/')[1]);
      for (let s of selectedSubnets) {
        let p = parseInt(s.subnet.split('/')[1]);
        if (p !== prefixLength) return null;
      }
      let networks = selectedSubnets.map(s => BigInt("0x" + s.network.replace(/:/g, '')));
      networks.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      let blockSize = 1n << (128n - BigInt(prefixLength));
      for (let i = 1; i < networks.length; i++) {
        if (networks[i] !== networks[i - 1] + blockSize) return null;
      }
      let n = BigInt(selectedSubnets.length);
      if ((n & (n - 1n)) !== 0n) return null;
      let bitsToRemove = 0;
      while ((1n << BigInt(bitsToRemove)) < n) {
        bitsToRemove++;
      }
      let newPrefix = prefixLength - bitsToRemove;
      if (newPrefix < 1) return null;
      let aggregatedNetwork = networks[0];
      let aggregatedHex = aggregatedNetwork.toString(16).padStart(32, '0');
      let aggregatedFormatted = aggregatedHex.match(/.{1,4}/g).join(':');
      return { network: aggregatedFormatted, prefix: newPrefix };
    } catch (error) {
      console.error("Erro ao calcular bloco agregado:", error);
      return null;
    }
  },

  // Função para gerar sub-redes assincronamente
  gerarSubRedesAssincronamente: function(ipv6BigInt, initialMask, prefix, numSubRedes, callback, appState) {
    try {
      console.log("Gerando sub-redes assincronamente:", {
        prefix: prefix,
        numSubRedes: numSubRedes.toString()
      });

// Adicionar um diagnóstico para verificar se os objetos globais estão acessíveis
window.addEventListener('load', function() {
  setTimeout(function() {
    console.log("Verificação final de objetos globais:");
    console.log("- window.utils disponível:", typeof window.utils !== 'undefined');
    console.log("- window.ui disponível:", typeof window.ui !== 'undefined');
    console.log("- window.appState disponível:", typeof window.appState !== 'undefined');
    
    const diagnosticoDiv = document.createElement('div');
    diagnosticoDiv.style.position = 'fixed';
    diagnosticoDiv.style.bottom = '10px';
    diagnosticoDiv.style.left = '10px';
    diagnosticoDiv.style.background = '#4CAF50';
    diagnosticoDiv.style.color = 'white';
    diagnosticoDiv.style.padding = '10px';
    diagnosticoDiv.style.borderRadius = '5px';
    diagnosticoDiv.style.zIndex = '9999';
    diagnosticoDiv.style.fontSize = '12px';
    
    if (typeof window.utils !== 'undefined' && typeof window.ui !== 'undefined' && typeof window.appState !== 'undefined') {
      diagnosticoDiv.textContent = "✓ Inicialização OK";
      diagnosticoDiv.style.cursor = 'pointer';
      diagnosticoDiv.title = "Clique para fechar";
      diagnosticoDiv.onclick = function() {
        document.body.removeChild(diagnosticoDiv);
      };
      setTimeout(function() {
        if (diagnosticoDiv.parentNode) {
          document.body.removeChild(diagnosticoDiv);
        }
      }, 5000);
    } else {
      diagnosticoDiv.textContent = "❌ Erro na inicialização";
      diagnosticoDiv.style.background = '#F44336';
    }
    
    document.body.appendChild(diagnosticoDiv);
  }, 1000);
});
      
      let i = 0n;
      const chunkSize = 1000n;
      
      function processChunk() {
        let chunkCount = 0n;
        while (i < numSubRedes && chunkCount < chunkSize) {
          let subnetBigInt = (ipv6BigInt & initialMask) + (i << (128n - BigInt(prefix)));
          let subnetHex = subnetBigInt.toString(16).padStart(32, '0');
          let subnetFormatada = subnetHex.match(/.{1,4}/g).join(':');
          let subnetInitial = subnetBigInt;
          let subnetFinal = subnetBigInt + (1n << (128n - BigInt(prefix))) - 1n;
          let subnetInitialFormatted = subnetInitial.toString(16).padStart(32, '0').match(/.{1,4}/g).join(':');
          let subnetFinalFormatted = subnetFinal.toString(16).padStart(32, '0').match(/.{1,4}/g).join(':');
          
          appState.subRedesGeradas.push({
            subnet: `${subnetFormatada}/${prefix}`,
            initial: subnetInitialFormatted,
            final: subnetFinalFormatted,
            network: `${subnetFormatada}`
          });
          
          i++;
          chunkCount++;
        }
        
        if (i < numSubRedes) {
          setTimeout(processChunk, 0);
        } else {
          document.getElementById('loadingIndicator').style.display = 'none';
          console.log("Geração de sub-redes concluída. Total:", appState.subRedesGeradas.length);
          callback();
        }
      }
      
      processChunk();
    } catch (error) {
      console.error("Erro ao gerar sub-redes:", error);
      document.getElementById('loadingIndicator').style.display = 'none';
      alert("Erro ao gerar sub-redes: " + error.message);
    }
  }
};
console.log("Utilitários inicializados:", Object.keys(window.utils));

// PARTE 3: FUNÇÕES DE INTERFACE DO USUÁRIO
// =============================================
window.ui = {
  // Função para atualizar informações do bloco selecionado na sidebar
  atualizarInformacoesDoBloco: function() {
    try {
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
    } catch (error) {
      console.error("Erro ao atualizar informações do bloco:", error);
    }
  },

  // Função para atualizar o bloco agregado
  atualizarBlocoAgregado: function() {
    try {
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
    } catch (error) {
      console.error("Erro ao atualizar bloco agregado:", error);
    }
  },

  // Função para atualizar botão gerar IPs
  atualizarGerarIPsButton: function() {
    try {
      console.log("Atualizando botão gerar IPs");
      let checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      let btn = document.getElementById('gerarIPsButton');
      if (btn) {
        btn.style.display = (checkboxes.length === 1) ? 'inline-block' : 'none';
      }
      if (checkboxes.length !== 1) {
        document.getElementById('ipsResult').style.display = 'none';
      }
    } catch (error) {
      console.error("Erro ao atualizar botão gerar IPs:", error);
    }
  },

  // Função para selecionar/desselecionar todos os checkboxes
  toggleSelectAll: function() {
    try {
      console.log("Alternando seleção de todas as sub-redes");
      let selectAll = document.getElementById('selectAll');
      if (!selectAll) return;
      
      let checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]');
      let isChecked = selectAll.checked;
      checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        checkbox.dispatchEvent(new Event('change'));
      });
    } catch (error) {
      console.error("Erro ao alternar seleção de todas as sub-redes:", error);
    }
  },

  // Função para carregar mais sub-redes na tabela
  carregarMaisSubRedes: function() {
    try {
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
        
        let ui = this; // Guardar referência para this
        checkbox.addEventListener('change', function() {
          ui.atualizarBlocoAgregado();
          ui.atualizarGerarIPsButton();
          ui.atualizarInformacoesDoBloco();
          
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
      let loadMoreContainer = document.getElementById('loadMoreContainer');
      if (loadMoreContainer) {
        loadMoreContainer.style.display = 
          window.appState.subRedesExibidas < window.appState.subRedesGeradas.length ? 'block' : 'none';
      }
    } catch (error) {
      console.error("Erro ao carregar mais sub-redes:", error);
    }
  },

  // Função para copiar texto (sidebar)
  copiarTexto: function(elementId, feedback = true) {
    try {
      console.log("Copiando texto do elemento:", elementId);
      let text;
      const element = document.getElementById(elementId);
      
      if (!element) {
        console.error("Elemento não encontrado:", elementId);
        return;
      }
      
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
        .catch(error => {
          console.error("Erro ao copiar para clipboard:", error);
          alert("Falha ao copiar o texto.");
        });
    } catch (error) {
      console.error("Erro ao copiar texto:", error);
    }
  },

  // Função para adicionar IP à lista
  appendIpToList: function(ip, number, listId) {
    try {
      console.log(`Adicionando IP ${ip} à lista ${listId}`);
      // Usar o template para criar itens consistentes
      const ipsList = document.getElementById(listId);
      if (!ipsList) {
        console.error("Lista de IPs não encontrada:", listId);
        return;
      }
      
      // Verificar se o navegador suporta templates
      if ('content' in document.createElement('template')) {
        const template = document.getElementById('ipItemTemplate');
        if (!template) {
          console.error("Template de item IP não encontrado");
          return;
        }
        
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
            .catch(error => {
              console.error("Erro ao copiar IP:", error);
              alert("Falha ao copiar IP.");
            });
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
    } catch (error) {
      console.error("Erro ao adicionar IP à lista:", error);
    }
  },

  // Função para alternar tema claro/escuro
  toggleTheme: function() {
    try {
      console.log("Alternando tema");
      document.body.classList.toggle('dark-mode');
    } catch (error) {
      console.error("Erro ao alternar tema:", error);
    }
  },
  
  // Função para ajustar o layout responsivo
  ajustarLayoutResponsive: function() {
    try {
      console.log("Ajustando layout responsivo");
      const isMobile = window.innerWidth <= 992;
      if (isMobile) {
        const infoSidebar = document.getElementById('infoSidebar');
        const aggregatedSidebar = document.getElementById('aggregatedSidebar');
        const container = document.querySelector('.container');
        
        if (!container) {
          console.error("Container não encontrado");
          return;
        }
        
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
            
            const resultado = document.getElementById('resultado');
            if (resultado) {
              container.insertBefore(aggregatedClone, resultado);
            } else {
              container.appendChild(aggregatedClone);
            }
          }
        }
      } else {
        const infoSidebarMobile = document.getElementById('infoSidebarMobile');
        const aggregatedSidebarMobile = document.getElementById('aggregatedSidebarMobile');
        if (infoSidebarMobile) infoSidebarMobile.remove();
        if (aggregatedSidebarMobile) aggregatedSidebarMobile.remove();
      }
    } catch (error) {
      console.error("Erro ao ajustar layout responsivo:", error);
    }
  },

  // Detectar se é um dispositivo móvel
  isMobileDevice: function() {
    try {
      return (window.innerWidth <= 768) || 
            (navigator.maxTouchPoints > 0 && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    } catch (error) {
      console.error("Erro ao detectar dispositivo móvel:", error);
      return false;
    }
  },

  // Otimizar para dispositivos móveis
  optimizeForMobile: function() {
    try {
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
      }
    } catch (error) {
      console.error("Erro ao otimizar para dispositivos móveis:", error);
    }
  },

  // Inicializar todas as otimizações para dispositivos móveis
  initMobileOptimizations: function() {
    try {
      this.optimizeForMobile();
      
      // Reajustar quando a tela for redimensionada
      window.addEventListener('resize', () => this.optimizeForMobile());
      
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
    } catch (error) {
      console.error("Erro ao inicializar otimizações mobile:", error);
    }
  },

  // Funções para os botões de navegação
  scrollToTop: function() {
    try {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error("Erro ao rolar para o topo:", error);
      // Fallback para navegadores que não suportam comportamento smooth
      window.scrollTo(0, 0);
    }
  },

  scrollToBottom: function() {
    try {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    } catch (error) {
      console.error("Erro ao rolar para o fim:", error);
      // Fallback para navegadores que não suportam comportamento smooth
      window.scrollTo(0, document.body.scrollHeight);
    }
  }
};
console.log("Interface de usuário inicializada:", Object.keys(window.ui));

// Exportar a função copiarTexto globalmente para uso nos eventos onclick do HTML
window.copiarTexto = function(elementId, feedback = true) {
  window.ui.copiarTexto(elementId, feedback);
};

// PARTE 4: FUNÇÕES PRINCIPAIS DA CALCULADORA
// =============================================

// Adicionar as funções globalmente para que possam ser acessadas pelo HTML
window.calcularSubRedes = calcularSubRedes;
window.resetarCalculadora = resetarCalculadora;
window.toggleMainBlockIps = toggleMainBlockIps;
window.mostrarSugestoesDivisao = mostrarSugestoesDivisao;
window.gerarIPsDoBloco = gerarIPsDoBloco;
window.gerarMaisIPsDoBloco = gerarMaisIPsDoBloco; 
window.resetarIPsMainBlock = resetarIPsMainBlock;
window.gerarPrimeirosIPs = gerarPrimeirosIPs;
window.gerarMaisIPs = gerarMaisIPs;
window.resetarIPsGerados = resetarIPsGerados;
window.selecionarPrefixo = selecionarPrefixo;

// PARTE 5: INICIALIZAÇÃO DA APLICAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log("DOM carregado - iniciando aplicação");
    
    // Associar funções aos elementos
    if (document.getElementById('calcularBtn')) {
      document.getElementById('calcularBtn').addEventListener('click', calcularSubRedes);
      console.log("Evento click adicionado ao botão calcularBtn");
    } else {
      console.error("Elemento calcularBtn não encontrado!");
    }
    
    if (document.getElementById('resetBtn')) {
      document.getElementById('resetBtn').addEventListener('click', resetarCalculadora);
      console.log("Evento click adicionado ao botão resetBtn");
    } else {
      console.error("Elemento resetBtn não encontrado!");
    }
    
    if (document.getElementById('toggleThemeButton')) {
      document.getElementById('toggleThemeButton').addEventListener('click', window.ui.toggleTheme);
      console.log("Evento click adicionado ao botão toggleThemeButton");
    } else {
      console.error("Elemento toggleThemeButton não encontrado!");
    }
    
    if (document.getElementById('toggleMainBlockIpsBtn')) {
      document.getElementById('toggleMainBlockIpsBtn').addEventListener('click', toggleMainBlockIps);
      console.log("Evento click adicionado ao botão toggleMainBlockIpsBtn");
    } else {
      console.error("Elemento toggleMainBlockIpsBtn não encontrado!");
    }
    
    if (document.getElementById('loadMoreButton')) {
      document.getElementById('loadMoreButton').addEventListener('click', function() {
        window.ui.carregarMaisSubRedes();
      });
      console.log("Evento click adicionado ao botão loadMoreButton");
    } else {
      console.error("Elemento loadMoreButton não encontrado!");
    }
    
    if (document.getElementById('gerarIPsButton')) {
      document.getElementById('gerarIPsButton').addEventListener('click', gerarPrimeirosIPs);
      console.log("Evento click adicionado ao botão gerarIPsButton");
    } else {
      console.error("Elemento gerarIPsButton não encontrado!");
    }
    
    if (document.getElementById('gerarMaisIPsButton')) {
      document.getElementById('gerarMaisIPsButton').addEventListener('click', gerarMaisIPs);
      console.log("Evento click adicionado ao botão gerarMaisIPsButton");
    } else {
      console.error("Elemento gerarMaisIPsButton não encontrado!");
    }
    
    if (document.getElementById('resetIPsButton')) {
      document.getElementById('resetIPsButton').addEventListener('click', resetarIPsGerados);
      console.log("Evento click adicionado ao botão resetIPsButton");
    } else {
      console.error("Elemento resetIPsButton não encontrado!");
    }
    
    if (document.getElementById('moreMainBlockIpsBtn')) {
      document.getElementById('moreMainBlockIpsBtn').addEventListener('click', gerarMaisIPsDoBloco);
      console.log("Evento click adicionado ao botão moreMainBlockIpsBtn");
    } else {
      console.error("Elemento moreMainBlockIpsBtn não encontrado!");
    }
    
    if (document.getElementById('resetMainBlockIPsButton')) {
      document.getElementById('resetMainBlockIPsButton').addEventListener('click', resetarIPsMainBlock);
      console.log("Evento click adicionado ao botão resetMainBlockIPsButton");
    } else {
      console.error("Elemento resetMainBlockIPsButton não encontrado!");
    }
    
    if (document.getElementById('continuarBtn')) {
      document.getElementById('continuarBtn').addEventListener('click', mostrarSugestoesDivisao);
      console.log("Evento click adicionado ao botão continuarBtn");
    } else {
      console.error("Elemento continuarBtn não encontrado!");
    }
    
    if (document.getElementById('selectAll')) {
      document.getElementById('selectAll').addEventListener('change', window.ui.toggleSelectAll);
      console.log("Evento change adicionado ao elemento selectAll");
    } else {
      console.error("Elemento selectAll não encontrado!");
    }
    
    // Botões de navegação
    if (document.getElementById('topBtn')) {
      document.getElementById('topBtn').addEventListener('click', window.ui.scrollToTop);
      console.log("Evento click adicionado ao botão topBtn");
    } else {
      console.error("Elemento topBtn não encontrado!");
    }
    
    if (document.getElementById('bottomBtn')) {
      document.getElementById('bottomBtn').addEventListener('click', window.ui.scrollToBottom);
      console.log("Evento click adicionado ao botão bottomBtn");
    } else {
      console.error("Elemento bottomBtn não encontrado!");
    }
    
    // Detectar preferência de tema escuro do sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      window.ui.toggleTheme();
      console.log("Tema escuro ativado baseado na preferência do sistema");
    }
    
    // Inicializar otimizações móveis
    window.ui.initMobileOptimizations();
    console.log("Otimizações para dispositivos móveis inicializadas");
    
    // Adicionar listener para redimensionamento da janela
    window.addEventListener('resize', window.ui.ajustarLayoutResponsive);
    console.log("Listener de redimensionamento adicionado");
    
    console.log("Inicialização completa da calculadora IPv6");
  } catch (error) {
    console.error("Erro durante a inicialização da aplicação:", error);
    alert("Ocorreu um erro ao inicializar a aplicação. Verifique o console para mais detalhes.");
  }
});

// Função para calcular sub-redes
function calcularSubRedes() {
  try {
    console.log("Função calcularSubRedes chamada");
    // Limpeza do estado anterior
    window.appState.subRedesGeradas = [];
    window.appState.subRedesExibidas = 0;
    window.appState.selectedBlock = null;
    window.appState.currentIpOffset = 0;
    document.getElementById('resultado').style.display = 'none';
    document.getElementById('ipsResult').style.display = 'none';
    document.getElementById('ipsList').innerHTML = '';
    
    let ipv6Input = document.getElementById('ipv6').value.trim();
    console.log("Input IPv6:", ipv6Input);
    
    let errorMessage = window.utils.validateIPv6(ipv6Input);
    document.getElementById('errorMessage').style.display = 'none';
    
    if (errorMessage) {
      document.getElementById('errorMessage').innerText = errorMessage;
      document.getElementById('errorMessage').style.display = 'block';
      return;
    }
    
    let [endereco, prefixoInicial] = ipv6Input.split('/');
    prefixoInicial = parseInt(prefixoInicial);
    let enderecoCompleto = window.utils.expandIPv6Address(ipv6Input);
    
    // Configurar o bloco principal
    let enderecoFormatado = window.utils.shortenIPv6(enderecoCompleto);
    document.getElementById('mainBlockCidr').innerText = `${enderecoFormatado}/${prefixoInicial}`;
    window.appState.mainBlock = {
      network: enderecoCompleto,
      prefix: prefixoInicial
    };
    
    // Calcular o gateway
    let redeHex = enderecoCompleto.replace(/:/g, '');
    let redeBigInt = BigInt("0x" + redeHex);
    let gatewayIpBigInt = redeBigInt + 1n; 
    let gatewayIpFormatado = window.utils.formatIPv6Address(gatewayIpBigInt);
    let gatewayIpShort = window.utils.shortenIPv6(gatewayIpFormatado);
    
    document.getElementById('mainBlockGateway').innerText = gatewayIpShort;
    document.getElementById('sidebarBlockCidr').innerText = `${enderecoFormatado}/${prefixoInicial}`;
    
    window.appState.mainBlockCurrentOffset = 0;
    document.getElementById('mainBlockIpsContainer').style.display = 'none';
    
    // Exibir a seção de IPs do bloco principal e a sidebar de informações
    document.getElementById('mainBlockSection').style.display = 'block';
    document.getElementById('infoSidebar').style.display = 'block';
    document.getElementById('aggregatedSidebar').style.display = 'none';
    
    // Pré-preencher a lista de possíveis prefixos
    document.getElementById('possiblePrefixesList').innerHTML = "";
    let possiblePrefixes = [];
    for (let i = prefixoInicial + 1; i <= 128; i++) {
      possiblePrefixes.push(i);
    }
    let suggestionsList = document.getElementById('possiblePrefixesList');
    possiblePrefixes.forEach(prefix => {
      let div = document.createElement('div');
      div.innerText = `/${prefix}`;
      div.tabIndex = 0;
      div.setAttribute('role', 'button');
      div.onclick = () => selecionarPrefixo(prefix);
      div.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          selecionarPrefixo(prefix);
        }
      };
      suggestionsList.appendChild(div);
    });
    
    // Ajustar layout responsivo
    window.ui.ajustarLayoutResponsive();
  } catch (error) {
    console.error("Erro ao calcular sub-redes:", error);
    alert("Ocorreu um erro ao calcular as sub-redes. Verifique o console para mais detalhes.");
  }
}

// Função para resetar a calculadora
function resetarCalculadora() {
  try {
    console.log("Função resetarCalculadora chamada");
    document.getElementById('ipv6').value = '';
    document.getElementById('mainBlockSection').style.display = 'none';
    document.getElementById('suggestions').style.display = 'none';
    document.getElementById('resultado').style.display = 'none';
    document.getElementById('aggregatedSidebar').style.display = 'none';
    document.getElementById('infoSidebar').style.display = 'none';
    document.getElementById('loadingIndicator').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    
    // Reiniciar variáveis
    window.appState.subRedesGeradas = [];
    window.appState.subRedesExibidas = 0;
    window.appState.totalSubRedesGerar = 0;
    window.appState.selectedBlock = null;
    window.appState.currentIpOffset = 0;
    window.appState.mainBlock = null;
    window.appState.mainBlockCurrentOffset = 0;
    window.appState.isMainBlockIpsVisible = false;
    
    // Limpar listas de IPs
    document.getElementById('ipsList').innerHTML = '';
    document.getElementById('mainBlockIpsList').innerHTML = '';
    
    // Focar no campo de entrada
    document.getElementById('ipv6').focus();
  } catch (error) {
    console.error("Erro ao resetar calculadora:", error);
  }
}

// Função para alternar IPs do bloco principal
function toggleMainBlockIps() {
  try {
    console.log("Alternando visibilidade dos IPs do bloco principal");
    const ipsContainer = document.getElementById('mainBlockIpsContainer');
    const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');
    if (window.appState.isMainBlockIpsVisible) {
      ipsContainer.style.display = 'none';
      toggleBtn.innerHTML = '<span class="btn-icon">⊕</span> Exibir IPs';
      window.appState.isMainBlockIpsVisible = false;
    } else {
      ipsContainer.style.display = 'block';
      toggleBtn.innerHTML = '<span class="btn-icon">⊖</span> Fechar IPs';
      window.appState.isMainBlockIpsVisible = true;
      if (document.getElementById('mainBlockIpsList').innerHTML === '') {
        gerarIPsDoBloco();
      }
    }
  } catch (error) {
    console.error("Erro ao alternar IPs do bloco principal:", error);
  }
}

// Função para mostrar sugestões de divisão
function mostrarSugestoesDivisao() {
  try {
    console.log("Mostrando sugestões de divisão");
    document.getElementById('suggestions').style.display = 'block';
    document.getElementById('suggestions').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error("Erro ao mostrar sugestões de divisão:", error);
  }
}

// Função para gerar IPs do bloco principal
function gerarIPsDoBloco() {
  try {
    console.log("Gerando IPs do bloco principal");
    if (!window.appState.mainBlock) return;
    
    const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');
    toggleBtn.disabled = true;
    toggleBtn.innerHTML = '<span class="btn-icon">⌛</span> Gerando...';
    
    let redeCompleta = window.appState.mainBlock.network;
    let redeHex = redeCompleta.replace(/:/g, '');
    let redeBigInt = BigInt("0x" + redeHex);
    let ipsList = document.getElementById('mainBlockIpsList');
    ipsList.innerHTML = "";
    window.appState.mainBlockCurrentOffset = 0;
    
    function processarLote() {
      let limite = Math.min(window.appState.mainBlockCurrentOffset + 10, 50);
      for (let i = window.appState.mainBlockCurrentOffset; i < limite; i++) {
        let ipBigInt = redeBigInt + BigInt(i);
        let ipFormatado = window.utils.formatIPv6Address(ipBigInt);
        let ipEnd = window.utils.shortenIPv6(ipFormatado);
        window.ui.appendIpToList(ipEnd, i + 1, 'mainBlockIpsList');
      }
      window.appState.mainBlockCurrentOffset = limite;
      if (window.appState.mainBlockCurrentOffset < 50) {
        setTimeout(processarLote, 0);
      } else {
        toggleBtn.disabled = false;
        toggleBtn.innerHTML = '<span class="btn-icon">⊖</span> Fechar IPs';
      }
    }
    processarLote();
  } catch (error) {
    console.error("Erro ao gerar IPs do bloco principal:", error);
    const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');
    if (toggleBtn) {
      toggleBtn.disabled = false;
      toggleBtn.innerHTML = '<span class="btn-icon">⊕</span> Exibir IPs';
    }
  }
}

// Função para gerar mais IPs do bloco principal
function gerarMaisIPsDoBloco() {
  try {
    console.log("Gerando mais IPs do bloco principal");
    if (!window.appState.mainBlock) return;
    
    const btn = document.getElementById('moreMainBlockIpsBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⌛</span> Gerando...';
    
    let redeCompleta = window.appState.mainBlock.network;
    let redeHex = redeCompleta.replace(/:/g, '');
    let redeBigInt = BigInt("0x" + redeHex);
    let inicio = window.appState.mainBlockCurrentOffset;
    let fim = inicio + 50;
    
    function processarLote() {
      let limite = Math.min(window.appState.mainBlockCurrentOffset + 10, fim);
      for (let i = window.appState.mainBlockCurrentOffset; i < limite; i++) {
        let ipBigInt = redeBigInt + BigInt(i);
        let ipFormatado = window.utils.formatIPv6Address(ipBigInt);
        let ipEnd = window.utils.shortenIPv6(ipFormatado);
        window.ui.appendIpToList(ipEnd, i + 1, 'mainBlockIpsList');
      }
      window.appState.mainBlockCurrentOffset = limite;
      if (window.appState.mainBlockCurrentOffset < fim) {
        setTimeout(processarLote, 0);
      } else {
        btn.disabled = false;
        btn.innerHTML = '<span class="btn-icon">⊕</span> Gerar Mais 50 IPs';
      }
    }
    processarLote();
  } catch (error) {
    console.error("Erro ao gerar mais IPs do bloco principal:", error);
    const btn = document.getElementById('moreMainBlockIpsBtn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">⊕</span> Gerar Mais 50 IPs';
    }
  }
}

// Função para resetar IPs do bloco principal
function resetarIPsMainBlock() {
  try {
    console.log("Resetando IPs do bloco principal");
    window.appState.mainBlockCurrentOffset = 0;
    document.getElementById('mainBlockIpsList').innerHTML = '';
    document.getElementById('moreMainBlockIpsBtn').disabled = false;
    document.getElementById('moreMainBlockIpsBtn').innerHTML = '<span class="btn-icon">⊕</span> Gerar Mais 50 IPs';
  } catch (error) {
    console.error("Erro ao resetar IPs do bloco principal:", error);
  }
}

// Função para gerar primeiros IPs
function gerarPrimeirosIPs() {
  try {
    console.log("Gerando primeiros IPs");
    let checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
    if (checkboxes.length !== 1) {
      alert("Selecione exatamente um bloco para gerar os IPs.");
      return;
    }
    
    // Resetar a lista de IPs
    resetarIPsGerados();
    
    let indice = parseInt(checkboxes[0].value);
    window.appState.selectedBlock = window.appState.subRedesGeradas[indice];
    window.appState.currentIpOffset = 0;
    let redeCompleta = window.appState.selectedBlock.network;
    let redeHex = redeCompleta.replace(/:/g, '');
    let redeBigInt = BigInt("0x" + redeHex);
    let ipsList = document.getElementById('ipsList');
    ipsList.innerHTML = "";
    
    for (let i = 0; i < 50; i++) {
      let ipBigInt = redeBigInt + BigInt(i);
      let ipFormatado = window.utils.formatIPv6Address(ipBigInt);
      let ipEnd = window.utils.shortenIPv6(ipFormatado);
      window.ui.appendIpToList(ipEnd, i + 1, 'ipsList');
    }
    
    window.appState.currentIpOffset = 50;
    document.getElementById('ipsResult').style.display = 'block';
    document.getElementById('gerarMaisIPsButton').style.display = 'block';
  } catch (error) {
    console.error("Erro ao gerar primeiros IPs:", error);
  }
}

// Função para gerar mais IPs
function gerarMaisIPs() {
  try {
    console.log("Gerando mais IPs");
    if (!window.appState.selectedBlock) return;
    
    let redeCompleta = window.appState.selectedBlock.network;
    let redeHex = redeCompleta.replace(/:/g, '');
    let redeBigInt = BigInt("0x" + redeHex);
    let inicio = window.appState.currentIpOffset;
    let fim = inicio + 50;
    
    // Desabilitar o botão enquanto processa
    const btn = document.getElementById('gerarMaisIPsButton');
    btn.disabled = true;
    
    function processarLote() {
      let limite = Math.min(window.appState.currentIpOffset + 10, fim);
      for (let i = window.appState.currentIpOffset; i < limite; i++) {
        let ipBigInt = redeBigInt + BigInt(i);
        let ipFormatado = window.utils.formatIPv6Address(ipBigInt);
        let ipEnd = window.utils.shortenIPv6(ipFormatado);
        window.ui.appendIpToList(ipEnd, i + 1, 'ipsList');
      }
      window.appState.currentIpOffset = limite;
      if (window.appState.currentIpOffset < fim) {
        setTimeout(processarLote, 0);
      } else {
        btn.disabled = false;
      }
    }
    processarLote();
  } catch (error) {
    console.error("Erro ao gerar mais IPs:", error);
    const btn = document.getElementById('gerarMaisIPsButton');
    if (btn) btn.disabled = false;
  }
}

// Função para resetar IPs gerados
function resetarIPsGerados() {
  try {
    console.log("Resetando IPs gerados");
    window.appState.currentIpOffset = 0;
    document.getElementById('ipsList').innerHTML = '';
    document.getElementById('gerarIPsButton').style.display = 'none';
    document.getElementById('ipsResult').style.display = 'none';
  } catch (error) {
    console.error("Erro ao resetar IPs gerados:", error);
  }
}

// Função para selecionar prefixo
// PARTE 5: INICIALIZAÇÃO DA APLICAÇÃO
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log("DOM carregado - iniciando aplicação");
    
    // Associar funções aos elementos
    if (document.getElementById('calcularBtn')) {
      document.getElementById('calcularBtn').addEventListener('click', calcularSubRedes);
      console.log("Evento click adicionado ao botão calcularBtn");
    } else {
      console.error("Elemento calcularBtn não encontrado!");
    }
    
    if (document.getElementById('resetBtn')) {
      document.getElementById('resetBtn').addEventListener('click', resetarCalculadora);
      console.log("Evento click adicionado ao botão resetBtn");
    } else {
      console.error("Elemento resetBtn não encontrado!");
    }
    
    if (document.getElementById('toggleThemeButton')) {
      document.getElementById('toggleThemeButton').addEventListener('click', window.ui.toggleTheme);
      console.log("Evento click adicionado ao botão toggleThemeButton");
    } else {
      console.error("Elemento toggleThemeButton não encontrado!");
    }
    
    if (document.getElementById('toggleMainBlockIpsBtn')) {
      document.getElementById('toggleMainBlockIpsBtn').addEventListener('click', toggleMainBlockIps);
      console.log("Evento click adicionado ao botão toggleMainBlockIpsBtn");
    } else {
      console.error("Elemento toggleMainBlockIpsBtn não encontrado!");
    }
    
    if (document.getElementById('loadMoreButton')) {
      document.getElementById('loadMoreButton').addEventListener('click', function() {
        window.ui.carregarMaisSubRedes();
      });
      console.log("Evento click adicionado ao botão loadMoreButton");
    } else {
      console.error("Elemento loadMoreButton não encontrado!");
    }
    
    if (document.getElementById('gerarIPsButton')) {
      document.getElementById('gerarIPsButton').addEventListener('click', gerarPrimeirosIPs);
      console.log("Evento click adicionado ao botão gerarIPsButton");
    } else {
      console.error("Elemento gerarIPsButton não encontrado!");
    }
    
    if (document.getElementById('gerarMaisIPsButton')) {
      document.getElementById('gerarMaisIPsButton').addEventListener('click', gerarMaisIPs);
      console.log("Evento click adicionado ao botão gerarMaisIPsButton");
    } else {
  try {
    console.log("Selecionando prefixo:", prefix);
    let ipv6Input = document.getElementById('ipv6').value.trim();
    let [endereco, prefixoInicial] = ipv6Input.split('/');
    prefixoInicial = parseInt(prefixoInicial);
    
    if (!endereco || isNaN(prefixoInicial)) {
      alert("Por favor, insira um endereço IPv6 válido no formato CIDR (ex.: 2001:db8::/41).");
      return;
    }
    
    if (prefix <= prefixoInicial) {
      alert("O prefixo selecionado deve ser maior que o prefixo inicial.");
      return;
    }
    
    let enderecoCompleto = window.utils.expandIPv6Address(ipv6Input);
    if (enderecoCompleto.startsWith("Erro")) {
      alert(enderecoCompleto);
      return;
    }
    
    let ipv6SemDoisPontos = enderecoCompleto.replace(/:/g, '');
    let ipv6BigInt = BigInt("0x" + ipv6SemDoisPontos);
    let bitsAdicionais = prefix - prefixoInicial;
    let numSubRedes = 1n << BigInt(bitsAdicionais);
    
    document.getElementById('loadingIndicator').style.display = 'flex';
    document.getElementById('suggestions').style.display = 'none';
    
    let initialMask = ((1n << BigInt(prefixoInicial)) - 1n) << (128n - BigInt(prefixoInicial));
    window.appState.subRedesGeradas = [];
    window.appState.subRedesExibidas = 0;
    document.getElementById('subnetsTable').getElementsByTagName('tbody')[0].innerHTML = "";
    window.appState.totalSubRedesGerar = Number(numSubRedes);
    
    setTimeout(() => {
      window.utils.gerarSubRedesAssincronamente(ipv6BigInt, initialMask, prefix, numSubRedes, () => {
        window.ui.carregarMaisSubRedes();
        document.getElementById('loadMoreContainer').style.display = window.appState.subRedesGeradas.length > 100 ? 'block' : 'none';
        document.getElementById('resultado').style.display = 'block';
        document.getElementById('mainBlockSection').style.display = 'none';
        document.getElementById('aggregatedSidebar').style.display = 'none';
        document.getElementById('aggregatedPrefix').innerText = "N/A";
        window.ui.ajustarLayoutResponsive();
      }, window.appState);
    }, 50);
  } catch (error) {
    console.error("Erro ao selecionar prefixo:", error);
    document.getElementById('loadingIndicator').style.display = 'none';
    alert("Ocorreu um erro ao processar as sub-redes. Verifique o console para mais detalhes.");
  }
}
