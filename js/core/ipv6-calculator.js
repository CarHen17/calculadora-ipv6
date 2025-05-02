/**
 * Calculadora IPv6 - Módulo Principal
 * 
 * Este módulo implementa as funcionalidades principais da calculadora de sub-redes IPv6,
 * incluindo cálculos, geração de sub-redes e manipulação dos resultados.
 */

const IPv6Calculator = (function() {
  'use strict';
  
  /**
   * Estado da aplicação
   */
  let appState = {
    subRedesGeradas: [],
    subRedesExibidas: 0,
    selectedBlock: null,
    currentIpOffset: 0,
    mainBlock: null,
    mainBlockCurrentOffset: 0,
    isMainBlockIpsVisible: false,
    currentStep: 1
  };
  
  /**
   * Inicializa o estado global da aplicação
   */
  function initAppState() {
    // Expor o objeto appState globalmente para compatibilidade com código existente
    window.appState = appState;
  }
  
  /**
   * Verifica se os módulos essenciais estão disponíveis
   * @returns {boolean} Verdadeiro se todos os módulos estão disponíveis
   */
  function checkDependencies() {
    // Verificar se IPv6Utils está disponível
    if (typeof window.IPv6Utils === 'undefined') {
      console.error("Erro: Módulo IPv6Utils não encontrado");
      return false;
    }
    
    // Verificar se UIController está disponível
    if (typeof window.UIController === 'undefined') {
      console.error("Erro: Módulo UIController não encontrado");
      return false;
    }
    
    return true;
  }
  
  /**
   * Calcula sub-redes com base no endereço IPv6 fornecido
   */
  function calcularSubRedes() {
    try {
      console.log("Iniciando cálculo de sub-redes");
      
      // Verificar dependências
      if (!checkDependencies()) {
        alert("Alguns módulos necessários não foram carregados corretamente.");
        return false;
      }
      
      // Limpar estado anterior
      resetState();
      
      // Obter o valor do input - com verificação de existência
      const ipv6Input = document.getElementById('ipv6');
      if (!ipv6Input) {
        console.error("Elemento 'ipv6' não encontrado no DOM");
        return false;
      }
      
      const inputValue = ipv6Input.value.trim();
      console.log("Validando entrada:", inputValue);
      
      // Validar o endereço IPv6
      const errorMessage = IPv6Utils.validateIPv6(inputValue);
      
      // Verificar se o elemento de erro existe
      const errorMessageElement = document.getElementById('errorMessage');
      if (errorMessageElement) {
        errorMessageElement.style.display = 'none';
      } else {
        console.warn("Elemento 'errorMessage' não encontrado");
      }
      
      if (errorMessage) {
        if (errorMessageElement) {
          errorMessageElement.innerText = errorMessage;
          errorMessageElement.style.display = 'block';
        } else {
          console.error("Erro de validação:", errorMessage);
          alert("Erro: " + errorMessage);
        }
        return false;
      }
      
      // Processar o endereço IPv6 válido
      const [endereco, prefixoInicial] = inputValue.split('/');
      const prefixoNum = parseInt(prefixoInicial);
      const enderecoCompleto = IPv6Utils.expandIPv6Address(inputValue);
      
      // Verificar erro na expansão do endereço
      if (enderecoCompleto.startsWith("Erro")) {
        if (errorMessageElement) {
          errorMessageElement.innerText = enderecoCompleto;
          errorMessageElement.style.display = 'block';
        } else {
          alert("Erro: " + enderecoCompleto);
        }
        return false;
      }
      
      // Configurar o bloco principal (com verificações de existência)
      const enderecoFormatado = IPv6Utils.shortenIPv6(enderecoCompleto);
      
      const mainBlockCidr = document.getElementById('mainBlockCidr');
      if (mainBlockCidr) {
        mainBlockCidr.innerText = `${enderecoFormatado}/${prefixoNum}`;
      } else {
        console.warn("Elemento 'mainBlockCidr' não encontrado");
      }
      
      appState.mainBlock = {
        network: enderecoCompleto,
        prefix: prefixoNum
      };
      
      // Calcular o gateway
      const redeHex = enderecoCompleto.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);
      const gatewayIpBigInt = redeBigInt + 1n; 
      const gatewayIpFormatado = IPv6Utils.formatIPv6Address(gatewayIpBigInt);
      const gatewayIpShort = IPv6Utils.shortenIPv6(gatewayIpFormatado);
      
      // Atualizar elementos com verificação de existência
      const mainBlockGateway = document.getElementById('mainBlockGateway');
      const sidebarBlockCidr = document.getElementById('sidebarBlockCidr');
      
      if (mainBlockGateway) {
        mainBlockGateway.innerText = gatewayIpShort;
      } else {
        console.warn("Elemento 'mainBlockGateway' não encontrado");
      }
      
      if (sidebarBlockCidr) {
        sidebarBlockCidr.innerText = `${enderecoFormatado}/${prefixoNum}`;
      } else {
        console.warn("Elemento 'sidebarBlockCidr' não encontrado");
      }
      
      // Resetar o estado da lista de IPs
      appState.mainBlockCurrentOffset = 0;
      appState.isMainBlockIpsVisible = false;
      
      const mainBlockIpsContainer = document.getElementById('mainBlockIpsContainer');
      const mainBlockIpsList = document.getElementById('mainBlockIpsList');
      
      if (mainBlockIpsContainer) {
        mainBlockIpsContainer.style.display = 'none';
      } else {
        console.warn("Elemento 'mainBlockIpsContainer' não encontrado");
      }
      
      if (mainBlockIpsList) {
        mainBlockIpsList.innerHTML = '';
      } else {
        console.warn("Elemento 'mainBlockIpsList' não encontrado");
      }
      
      // Mostrar a seção do bloco principal e a sidebar (com verificações)
      const mainBlockSection = document.getElementById('mainBlockSection');
      const infoSidebar = document.getElementById('infoSidebar');
      const suggestions = document.getElementById('suggestions');
      const aggregatedContent = document.getElementById('aggregatedContent');
      
      if (mainBlockSection) {
        mainBlockSection.style.display = 'block';
      } else {
        console.warn("Elemento 'mainBlockSection' não encontrado");
      }
      
      if (infoSidebar) {
        infoSidebar.style.display = 'block';
      } else {
        console.warn("Elemento 'infoSidebar' não encontrado");
      }
      
      if (suggestions) {
        suggestions.style.display = 'none';
      } else {
        console.warn("Elemento 'suggestions' não encontrado");
      }
      
      if (aggregatedContent) {
        aggregatedContent.style.display = 'none';
      } else {
        console.warn("Elemento 'aggregatedContent' não encontrado");
      }
      
      // Atualizar os passos de progresso
      if (typeof UIController !== 'undefined' && typeof UIController.updateStep === 'function') {
        UIController.updateStep(2);
      } else {
        console.warn("UIController.updateStep não está disponível");
      }
      
      // Preencher a lista de prefixos possíveis
      preencherListaPrefixos(prefixoNum);
      
      // Ajustar layout para dispositivos móveis
      if (typeof UIController !== 'undefined' && typeof UIController.ajustarLayoutResponsivo === 'function') {
        UIController.ajustarLayoutResponsivo();
      } else {
        console.warn("UIController.ajustarLayoutResponsivo não está disponível");
      }
      
      return true;
    } catch (error) {
      console.error("Erro ao calcular sub-redes:", error);
      alert("Ocorreu um erro ao processar o endereço IPv6. Por favor, verifique se o formato está correto.");
      return false;
    }
  }
  
  /**
   * Preenche a lista de prefixos possíveis para seleção
   * @param {number} prefixoInicial - Prefixo inicial do endereço IPv6
   */
  function preencherListaPrefixos(prefixoInicial) {
    try {
      const possiblePrefixesList = document.getElementById('possiblePrefixesList');
      if (!possiblePrefixesList) {
        console.error("Elemento 'possiblePrefixesList' não encontrado");
        return;
      }
      
      possiblePrefixesList.innerHTML = "";
      
      // Criar grupos de prefixos para melhor navegação
      const createPrefixGroup = (start, end, title) => {
        const group = document.createElement('div');
        group.className = 'prefix-group';
        group.innerHTML = `<div class="prefix-group-title">${title}</div>`;
        
        for (let i = start; i <= end; i++) {
          const div = document.createElement('div');
          div.className = 'prefix-item';
          div.innerText = `/${i}`;
          div.onclick = () => selecionarPrefixo(i);
          div.setAttribute('role', 'button');
          div.tabIndex = 0;
          div.onkeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              selecionarPrefixo(i);
            }
          };
          
          // Destacar prefixos comuns
          if ([48, 56, 64, 80, 96, 112, 128].includes(i)) {
            div.classList.add('common-prefix');
            
            // Adicionar dica sobre uso comum
            let usageNote = '';
            switch (i) {
              case 48: usageNote = 'Alocação típica para sites'; break;
              case 56: usageNote = 'Sub-rede por cliente/dep.'; break;
              case 64: usageNote = 'Sub-rede padrão'; break;
              case 80: usageNote = 'Sub-rede SOHO/Home'; break;
              case 96: usageNote = 'Unidade operacional'; break;
              case 112: usageNote = 'Ponto-a-ponto'; break;
              case 128: usageNote = 'Host único'; break;
            }
            
            if (usageNote) {
              div.setAttribute('title', usageNote);
              div.dataset.usage = usageNote;
            }
          }
          
          group.appendChild(div);
        }
        
        return group;
      };
      
      // Determinar como agrupar os prefixos com base no prefixo inicial
      if (prefixoInicial < 40) {
        // Para prefixos iniciais pequenos, agrupar em blocos de 16
        for (let base = prefixoInicial + 1; base <= 128; base += 16) {
          const groupEnd = Math.min(base + 15, 128);
          const title = `/${base} - /${groupEnd}`;
          possiblePrefixesList.appendChild(createPrefixGroup(base, groupEnd, title));
        }
      } else if (prefixoInicial < 80) {
        // Para prefixos médios, agrupar em blocos de 8
        for (let base = prefixoInicial + 1; base <= 128; base += 8) {
          const groupEnd = Math.min(base + 7, 128);
          const title = `/${base} - /${groupEnd}`;
          possiblePrefixesList.appendChild(createPrefixGroup(base, groupEnd, title));
        }
      } else {
        // Para prefixos grandes, mostrar individualmente
        possiblePrefixesList.appendChild(createPrefixGroup(prefixoInicial + 1, 128, `/${prefixoInicial+1} - /128`));
      }
      
      // Adicionar dicas úteis na interface
      if (!possiblePrefixesList.querySelector('.prefix-info')) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'prefix-info';
        infoDiv.innerHTML = `
          <p><strong>Dicas sobre prefixos IPv6:</strong></p>
          <ul>
            <li>Prefixo <strong>/64</strong> é o padrão para sub-redes IPv6.</li>
            <li>Prefixos <strong>/48 a /56</strong> são comuns para sites.</li>
            <li>Quanto <strong>maior o prefixo</strong>, mais sub-redes e menos IPs por sub-rede.</li>
          </ul>
        `;
        possiblePrefixesList.appendChild(infoDiv);
      }
    } catch (error) {
      console.error("Erro ao preencher lista de prefixos:", error);
    }
  }
  
  /**
   * Seleciona um prefixo e gera sub-redes
   * @param {number} prefix - Prefixo selecionado
   */
  function selecionarPrefixo(prefix) {
    try {
      console.log("Selecionando prefixo:", prefix);
      
      // Verificar se IPv6Utils está disponível
      if (typeof IPv6Utils === 'undefined') {
        console.error("Módulo IPv6Utils não disponível");
        alert("Erro: Módulo IPv6Utils não foi carregado corretamente.");
        return false;
      }
      
      const ipv6Input = document.getElementById('ipv6');
      if (!ipv6Input) {
        console.error("Elemento 'ipv6' não encontrado");
        return false;
      }
      
      const inputValue = ipv6Input.value.trim();
      const [endereco, prefixoInicial] = inputValue.split('/');
      const prefixoNum = parseInt(prefixoInicial);
      
      // Validações
      if (prefix <= prefixoNum) {
        alert("O prefixo selecionado deve ser maior que o prefixo inicial.");
        return false;
      }
      
      const enderecoCompleto = IPv6Utils.expandIPv6Address(inputValue);
      if (enderecoCompleto.startsWith("Erro")) {
        alert(enderecoCompleto);
        return false;
      }
      
      // Atualizar o passo atual
      if (typeof UIController !== 'undefined' && typeof UIController.updateStep === 'function') {
        UIController.updateStep(3);
      } else {
        console.warn("UIController.updateStep não está disponível");
      }
      
      // Mostrar indicador de carregamento
      const loadingIndicator = document.getElementById('loadingIndicator');
      const suggestions = document.getElementById('suggestions');
      
      if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
      } else {
        console.warn("Elemento 'loadingIndicator' não encontrado");
      }
      
      if (suggestions) {
        suggestions.style.display = 'none';
      } else {
        console.warn("Elemento 'suggestions' não encontrado");
      }
      
      // Processar o endereço IPv6
      const ipv6SemDoisPontos = enderecoCompleto.replace(/:/g, '');
      const ipv6BigInt = BigInt("0x" + ipv6SemDoisPontos);
      const bitsAdicionais = prefix - prefixoNum;
      const numSubRedes = 1n << BigInt(bitsAdicionais);
      
      // Verificar se o número de sub-redes é muito grande
      if (numSubRedes > 1000000n) {
        const confirmacao = confirm(
          `Atenção: Você está prestes a gerar ${numSubRedes.toString()} sub-redes, o que pode ` +
          `consumir muita memória e causar lentidão. Por questões práticas, serão geradas apenas ` +
          `1.000.000 sub-redes como amostra. Deseja continuar?`
        );
        
        if (!confirmacao) {
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
          return false;
        }
      }
      
      // Limpar tabela existente
      appState.subRedesGeradas = [];
      appState.subRedesExibidas = 0;
      
      const subnetsTableBody = document.querySelector('#subnetsTable tbody');
      if (subnetsTableBody) {
        subnetsTableBody.innerHTML = "";
      } else {
        console.warn("Elemento '#subnetsTable tbody' não encontrado");
      }
      
      // Máscara inicial para o cálculo
      const initialMask = ((1n << BigInt(prefixoNum)) - 1n) << (128n - BigInt(prefixoNum));
      
      // Gerar sub-redes assincronamente
      setTimeout(() => {
        try {
          if (typeof IPv6Utils !== 'undefined' && typeof IPv6Utils.gerarSubRedesAssincronamente === 'function') {
            IPv6Utils.gerarSubRedesAssincronamente(
              ipv6BigInt, 
              initialMask, 
              prefix, 
              numSubRedes, 
              onSubRedesGenerated, 
              appState
            );
          } else {
            console.error("Função IPv6Utils.gerarSubRedesAssincronamente não disponível");
            
            // Ocultar indicador de carregamento
            if (loadingIndicator) {
              loadingIndicator.style.display = 'none';
            }
            
            alert("Função necessária para gerar sub-redes não está disponível.");
          }
        } catch (error) {
          console.error("Erro ao gerar sub-redes de forma assíncrona:", error);
          
          // Ocultar indicador de carregamento em caso de erro
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
          
          alert("Erro ao gerar sub-redes: " + error.message);
        }
      }, 50);
      
      return true;
    } catch (error) {
      console.error("Erro ao selecionar prefixo:", error);
      
      // Ocultar indicador de carregamento em caso de erro
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      alert("Ocorreu um erro ao gerar as sub-redes. Por favor, tente novamente.");
      return false;
    }
  }
  
  /**
   * Callback chamado quando as sub-redes são geradas com sucesso
   */
  function onSubRedesGenerated() {
    try {
      // Carregar as primeiras sub-redes na tabela
      if (typeof UIController !== 'undefined' && typeof UIController.carregarMaisSubRedes === 'function') {
        UIController.carregarMaisSubRedes(0, 100);
      } else {
        console.error("Função UIController.carregarMaisSubRedes não disponível");
      }
      
      // Verificar elementos antes de manipulá-los
      const loadMoreContainer = document.getElementById('loadMoreContainer');
      const resultado = document.getElementById('resultado');
      const mainBlockSection = document.getElementById('mainBlockSection');
      const aggregatedContent = document.getElementById('aggregatedContent');
      const aggregatedPrefix = document.getElementById('aggregatedPrefix');
      const loadingIndicator = document.getElementById('loadingIndicator');
      
      // Atualizar visibilidade do botão "Carregar Mais"
      if (loadMoreContainer) {
        loadMoreContainer.style.display = 
          appState.subRedesGeradas.length > 100 ? 'block' : 'none';
      } else {
        console.warn("Elemento 'loadMoreContainer' não encontrado");
      }
      
      // Mostrar a seção de resultado e ocultar outras seções
      if (resultado) {
        resultado.style.display = 'block';
      } else {
        console.warn("Elemento 'resultado' não encontrado");
      }
      
      if (mainBlockSection) {
        mainBlockSection.style.display = 'none';
      } else {
        console.warn("Elemento 'mainBlockSection' não encontrado");
      }
      
      if (aggregatedContent) {
        aggregatedContent.style.display = 'none';
      } else {
        console.warn("Elemento 'aggregatedContent' não encontrado");
      }
      
      if (aggregatedPrefix) {
        aggregatedPrefix.innerText = "N/A";
      } else {
        console.warn("Elemento 'aggregatedPrefix' não encontrado");
      }
      
      // Ajustar layout para dispositivos móveis
      if (typeof UIController !== 'undefined' && typeof UIController.ajustarLayoutResponsivo === 'function') {
        UIController.ajustarLayoutResponsivo();
      } else {
        console.warn("UIController.ajustarLayoutResponsivo não está disponível");
      }
      
      // Ocultar indicador de carregamento
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      } else {
        console.warn("Elemento 'loadingIndicator' não encontrado");
      }
    } catch (error) {
      console.error("Erro ao processar sub-redes geradas:", error);
      
      // Ocultar indicador de carregamento em caso de erro
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
    }
  }
  
  /**
   * Resetar a calculadora para o estado inicial
   */
  function resetarCalculadora() {
    try {
      // Lista de IDs de elementos a verificar e manipular
      const elementIds = [
        'ipv6',
        'mainBlockSection',
        'suggestions',
        'resultado',
        'ipsResult',
        'infoSidebar',
        'loadingIndicator',
        'errorMessage',
        'ipsList',
        'mainBlockIpsList'
      ];
      
      // Verificar e manipular cada elemento
      elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          if (id === 'ipv6') {
            element.value = '';
          } else if (id === 'ipsList' || id === 'mainBlockIpsList') {
            element.innerHTML = '';
          } else {
            element.style.display = 'none';
          }
        } else {
          console.warn(`Elemento '${id}' não encontrado para resetar`);
        }
      });
      
      // Reiniciar variáveis
      resetState();
      
      // Voltar para o primeiro passo
      if (typeof UIController !== 'undefined' && typeof UIController.updateStep === 'function') {
        UIController.updateStep(1);
      } else {
        console.warn("UIController.updateStep não está disponível");
      }
      
      // Focar no campo de entrada
      const ipv6Input = document.getElementById('ipv6');
      if (ipv6Input) {
        ipv6Input.focus();
      }
    } catch (error) {
      console.error("Erro ao resetar calculadora:", error);
    }
  }
  
  /**
   * Reseta o estado da aplicação
   */
  function resetState() {
    appState.subRedesGeradas = [];
    appState.subRedesExibidas = 0;
    appState.selectedBlock = null;
    appState.currentIpOffset = 0;
    appState.mainBlock = null;
    appState.mainBlockCurrentOffset = 0;
    appState.isMainBlockIpsVisible = false;
    appState.currentStep = 1;
  }
  
  /**
   * Alterna a exibição dos IPs do bloco principal
   */
  function toggleMainBlockIps() {
    try {
      const ipsContainer = document.getElementById('mainBlockIpsContainer');
      const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');
      
      if (!ipsContainer || !toggleBtn) {
        console.error("Elementos necessários não encontrados para toggleMainBlockIps");
        return;
      }
      
      if (appState.isMainBlockIpsVisible) {
        ipsContainer.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> Exibir IPs';
        appState.isMainBlockIpsVisible = false;
      } else {
        ipsContainer.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-times"></i> Fechar IPs';
        appState.isMainBlockIpsVisible = true;
        
        const mainBlockIpsList = document.getElementById('mainBlockIpsList');
        if (mainBlockIpsList && mainBlockIpsList.innerHTML === '') {
          gerarIPsDoBloco();
        }
      }
    } catch (error) {
      console.error("Erro ao alternar visibilidade dos IPs do bloco principal:", error);
    }
  }
  
  /**
   * Exibe a seção de sugestões de divisão
   */
  function mostrarSugestoesDivisao() {
    try {
      const suggestions = document.getElementById('suggestions');
      if (suggestions) {
        suggestions.style.display = 'block';
        suggestions.scrollIntoView({ behavior: 'smooth' });
      } else {
        console.warn("Elemento 'suggestions' não encontrado");
      }
    } catch (error) {
      console.error("Erro ao mostrar sugestões de divisão:", error);
    }
  }
  
  /**
   * Gera os primeiros IPs do bloco principal
   */
  function gerarIPsDoBloco() {
    try {
      if (!appState.mainBlock) {
        console.error("appState.mainBlock não definido");
        return;
      }
      
      const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');
      if (toggleBtn) {
        toggleBtn.disabled = true;
        toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
      }
      
      const redeCompleta = appState.mainBlock.network;
      const redeHex = redeCompleta.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);
      
      const ipsList = document.getElementById('mainBlockIpsList');
      if (!ipsList) {
        console.error("Elemento 'mainBlockIpsList' não encontrado");
        if (toggleBtn) {
          toggleBtn.disabled = false;
          toggleBtn.innerHTML = '<i class="fas fa-list"></i> Exibir IPs';
        }
        return;
      }
      
      ipsList.innerHTML = "";
      appState.mainBlockCurrentOffset = 0;
      
      function processarLote() {
        const limite = Math.min(appState.mainBlockCurrentOffset + 10, 50);
        
        try {
          for (let i = appState.mainBlockCurrentOffset; i < limite; i++) {
            const ipBigInt = redeBigInt + BigInt(i);
            const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);
            const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);
            
            if (typeof UIController !== 'undefined' && typeof UIController.appendIpToList === 'function') {
              UIController.appendIpToList(ipEnd, i + 1, 'mainBlockIpsList');
            } else {
              // Fallback se UIController não estiver disponível
              const li = document.createElement('li');
              li.className = 'ip-item';
              
              const numberSpan = document.createElement('span');
              numberSpan.className = 'ip-number';
              numberSpan.textContent = `${i + 1}.`;
              
              const ipSpan = document.createElement('span');
              ipSpan.className = 'ip-text';
              ipSpan.textContent = ipEnd;
              
              const copyBtn = document.createElement('button');
              copyBtn.className = 'copy-btn';
              copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
              copyBtn.title = "Copiar IP";
              
              li.appendChild(numberSpan);
              li.appendChild(ipSpan);
              li.appendChild(copyBtn);
              ipsList.appendChild(li);
            }
          }
          
          appState.mainBlockCurrentOffset = limite;
          
          if (appState.mainBlockCurrentOffset < 50) {
            setTimeout(processarLote, 0);
          } else if (toggleBtn) {
            toggleBtn.disabled = false;
            toggleBtn.innerHTML = '<i class="fas fa-times"></i> Fechar IPs';
          }
        } catch (error) {
          console.error("Erro ao processar lote de IPs:", error);
          if (toggleBtn) {
            toggleBtn.disabled = false;
            toggleBtn.innerHTML = '<i class="fas fa-list"></i> Exibir IPs';
          }
        }
      }
      
      processarLote();
    } catch (error) {
      console.error("Erro ao gerar IPs do bloco principal:", error);
      const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');
      if (toggleBtn) {
        toggleBtn.disabled = false;
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> Exibir IPs';
      }
    }
  }
  
  /**
   * Gera mais IPs do bloco principal
   */
  function gerarMaisIPsDoBloco() {
    try {
      if (!appState.mainBlock) {
        console.error("appState.mainBlock não definido");
        return;
      }
      
      const btn = document.getElementById('moreMainBlockIpsBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
      }
      
      const redeCompleta = appState.mainBlock.network;
      const redeHex = redeCompleta.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);
      const inicio = appState.mainBlockCurrentOffset;
      const fim = inicio + 50;
      
      function processarLote() {
        try {
          const limite = Math.min(appState.mainBlockCurrentOffset + 10, fim);
          for (let i = appState.mainBlockCurrentOffset; i < limite; i++) {
            const ipBigInt = redeBigInt + BigInt(i);
            const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);
            const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);
            
            if (typeof UIController !== 'undefined' && typeof UIController.appendIpToList === 'function') {
              UIController.appendIpToList(ipEnd, i + 1, 'mainBlockIpsList');
            } else {
              // Fallback se UIController não estiver disponível
              const ipsList = document.getElementById('mainBlockIpsList');
              if (ipsList) {
                const li = document.createElement('li');
                li.className = 'ip-item';
                
                const numberSpan = document.createElement('span');
                numberSpan.className = 'ip-number';
                numberSpan.textContent = `${i + 1}.`;
                
                const ipSpan = document.createElement('span');
                ipSpan.className = 'ip-text';
                ipSpan.textContent = ipEnd;
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyBtn.title = "Copiar IP";
                
                li.appendChild(numberSpan);
                li.appendChild(ipSpan);
                li.appendChild(copyBtn);
                ipsList.appendChild(li);
              }
            }
          }
          
          appState.mainBlockCurrentOffset = limite;
          
          if (appState.mainBlockCurrentOffset < fim) {
            setTimeout(processarLote, 0);
          } else if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
          }
        } catch (error) {
          console.error("Erro ao processar lote de IPs adicionais:", error);
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
          }
        }
      }
      
      processarLote();
    } catch (error) {
      console.error("Erro ao gerar mais IPs do bloco principal:", error);
      const btn = document.getElementById('moreMainBlockIpsBtn');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
      }
    }
  }
  
  /**
   * Reseta a lista de IPs do bloco principal
   */
  function resetarIPsMainBlock() {
    try {
      appState.mainBlockCurrentOffset = 0;
      
      const mainBlockIpsList = document.getElementById('mainBlockIpsList');
      const moreMainBlockIpsBtn = document.getElementById('moreMainBlockIpsBtn');
      
      if (mainBlockIpsList) {
        mainBlockIpsList.innerHTML = '';
      } else {
        console.warn("Elemento 'mainBlockIpsList' não encontrado");
      }
      
      if (moreMainBlockIpsBtn) {
        moreMainBlockIpsBtn.disabled = false;
        moreMainBlockIpsBtn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
      } else {
        console.warn("Elemento 'moreMainBlockIpsBtn' não encontrado");
      }
    } catch (error) {
      console.error("Erro ao resetar IPs do bloco principal:", error);
    }
  }
  
  /**
   * Gera os primeiros IPs de uma sub-rede selecionada
   */
  function gerarPrimeirosIPs() {
    try {
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      if (checkboxes.length !== 1) {
        alert("Selecione exatamente um bloco para gerar os IPs.");
        return;
      }
      
      // Resetar a lista de IPs
      resetarIPsGerados();
      
      const indice = parseInt(checkboxes[0].value);
      if (isNaN(indice) || !appState.subRedesGeradas[indice]) {
        console.error("Índice inválido ou sub-rede não encontrada");
        return;
      }
      
      appState.selectedBlock = appState.subRedesGeradas[indice];
      appState.currentIpOffset = 0;
      
      const redeCompleta = appState.selectedBlock.network;
      const redeHex = redeCompleta.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);
      
      const ipsList = document.getElementById('ipsList');
      if (!ipsList) {
        console.error("Elemento 'ipsList' não encontrado");
        return;
      }
      
      ipsList.innerHTML = "";
      
      for (let i = 0; i < 50; i++) {
        const ipBigInt = redeBigInt + BigInt(i);
        const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);
        const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);
        
        if (typeof UIController !== 'undefined' && typeof UIController.appendIpToList === 'function') {
          UIController.appendIpToList(ipEnd, i + 1, 'ipsList');
        } else {
          // Fallback se UIController não estiver disponível
          const li = document.createElement('li');
          li.className = 'ip-item';
          
          const numberSpan = document.createElement('span');
          numberSpan.className = 'ip-number';
          numberSpan.textContent = `${i + 1}.`;
          
          const ipSpan = document.createElement('span');
          ipSpan.className = 'ip-text';
          ipSpan.textContent = ipEnd;
          
          const copyBtn = document.createElement('button');
          copyBtn.className = 'copy-btn';
          copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
          copyBtn.title = "Copiar IP";
          
          li.appendChild(numberSpan);
          li.appendChild(ipSpan);
          li.appendChild(copyBtn);
          ipsList.appendChild(li);
        }
      }
      
      appState.currentIpOffset = 50;
      
      const ipsResult = document.getElementById('ipsResult');
      if (ipsResult) {
        ipsResult.style.display = 'block';
        ipsResult.scrollIntoView({ behavior: 'smooth' });
      } else {
        console.warn("Elemento 'ipsResult' não encontrado");
      }
    } catch (error) {
      console.error("Erro ao gerar primeiros IPs:", error);
    }
  }
  
  /**
   * Gera mais IPs da sub-rede selecionada
   */
  function gerarMaisIPs() {
    try {
      if (!appState.selectedBlock) {
        console.error("Nenhum bloco selecionado");
        return;
      }
      
      const redeCompleta = appState.selectedBlock.network;
      const redeHex = redeCompleta.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);
      const inicio = appState.currentIpOffset;
      const fim = inicio + 50;
      
      // Desabilitar o botão enquanto processa
      const btn = document.getElementById('gerarMaisIPsButton');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
      }
      
      function processarLote() {
        try {
          const limite = Math.min(appState.currentIpOffset + 10, fim);
          for (let i = appState.currentIpOffset; i < limite; i++) {
            const ipBigInt = redeBigInt + BigInt(i);
            const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);
            const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);
            
            if (typeof UIController !== 'undefined' && typeof UIController.appendIpToList === 'function') {
              UIController.appendIpToList(ipEnd, i + 1, 'ipsList');
            } else {
              // Fallback se UIController não estiver disponível
              const ipsList = document.getElementById('ipsList');
              if (ipsList) {
                const li = document.createElement('li');
                li.className = 'ip-item';
                
                const numberSpan = document.createElement('span');
                numberSpan.className = 'ip-number';
                numberSpan.textContent = `${i + 1}.`;
                
                const ipSpan = document.createElement('span');
                ipSpan.className = 'ip-text';
                ipSpan.textContent = ipEnd;
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                copyBtn.title = "Copiar IP";
                
                li.appendChild(numberSpan);
                li.appendChild(ipSpan);
                li.appendChild(copyBtn);
                ipsList.appendChild(li);
              }
            }
          }
          
          appState.currentIpOffset = limite;
          
          if (appState.currentIpOffset < fim) {
            setTimeout(processarLote, 0);
          } else if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
          }
        } catch (error) {
          console.error("Erro ao processar lote de IPs da sub-rede:", error);
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
          }
        }
      }
      
      processarLote();
    } catch (error) {
      console.error("Erro ao gerar mais IPs:", error);
      const btn = document.getElementById('gerarMaisIPsButton');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
      }
    }
  }
  
  /**
   * Reseta a lista de IPs gerados da sub-rede
   */
  function resetarIPsGerados() {
    try {
      appState.currentIpOffset = 0;
      
      const ipsList = document.getElementById('ipsList');
      if (ipsList) {
        ipsList.innerHTML = '';
      } else {
        console.warn("Elemento 'ipsList' não encontrado");
      }
    } catch (error) {
      console.error("Erro ao resetar IPs gerados:", error);
    }
  }
  
  /**
   * Mostra a seção de visualização de dados
   */
  function mostrarVisualizacao() {
    try {
      // Verificar se há sub-redes geradas
      if (appState.subRedesGeradas.length === 0) {
        alert("Gere sub-redes primeiro para poder visualizar os dados.");
        return;
      }
      
      // Verificar se há sub-redes selecionadas
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      if (checkboxes.length === 0) {
        alert("Selecione pelo menos uma sub-rede para visualizar os dados.");
        return;
      }
      
      // Atualizar o passo atual
      if (typeof UIController !== 'undefined' && typeof UIController.updateStep === 'function') {
        UIController.updateStep(4);
      }
      
      // Exibir a seção de visualização
      const visualizationSection = document.getElementById('visualizationSection');
      if (visualizationSection) {
        visualizationSection.style.display = 'block';
        visualizationSection.scrollIntoView({ behavior: 'smooth' });
        
        // Inicializar visualizações
        if (window.VisualizationModule && typeof window.VisualizationModule.initializeAllCharts === 'function') {
          window.VisualizationModule.initializeAllCharts();
        } else {
          console.warn("Módulo de visualização não disponível");
        }
      } else {
        console.error("Elemento 'visualizationSection' não encontrado");
        alert("O módulo de visualização não foi carregado corretamente.");
      }
    } catch (error) {
      console.error("Erro ao mostrar visualização:", error);
    }
  }
  
  /**
   * Inicializa o módulo da calculadora
   */
  function initialize() {
    try {
      console.log("Inicializando módulo IPv6Calculator...");
      
      // Verificar dependências
      checkDependencies();
      
      // Inicializar estado global
      initAppState();
      
      // Configurar event listeners
      setupEventListeners();
      
      console.log("Módulo IPv6Calculator inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar IPv6Calculator:", error);
    }
  }
  
  /**
   * Configura os event listeners
   */
  function setupEventListeners() {
    try {
      // Adicionar event listener com verificação de existência do elemento
      const addListener = (id, fn) => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('click', fn);
        } else {
          console.warn(`Elemento '${id}' não encontrado para adicionar evento`);
        }
      };
      
      // Configurar eventos para os botões principais
      addListener('calcularBtn', calcularSubRedes);
      addListener('resetBtn', resetarCalculadora);
      addListener('toggleMainBlockIpsBtn', toggleMainBlockIps);
      addListener('continuarBtn', mostrarSugestoesDivisao);
      addListener('moreMainBlockIpsBtn', gerarMaisIPsDoBloco);
      addListener('resetMainBlockIPsButton', resetarIPsMainBlock);
      
      // Tratamento especial para o loadMoreButton pois usa uma função inline
      addListener('loadMoreButton', () => {
        if (typeof UIController !== 'undefined' && typeof UIController.carregarMaisSubRedes === 'function') {
          UIController.carregarMaisSubRedes(appState.subRedesExibidas, 100);
        } else {
          console.error("Função UIController.carregarMaisSubRedes não disponível");
        }
      });
      
      // Botões para geração de IPs
      addListener('gerarIPsButton', gerarPrimeirosIPs);
      addListener('gerarMaisIPsButton', gerarMaisIPs);
      addListener('resetIPsButton', resetarIPsGerados);
      addListener('visualizarBtn', mostrarVisualizacao);
      
      // Checkbox "Selecionar Todos"
      const selectAll = document.getElementById('selectAll');
      if (selectAll) {
        selectAll.addEventListener('change', () => {
          if (typeof UIController !== 'undefined' && typeof UIController.toggleSelectAll === 'function') {
            UIController.toggleSelectAll();
          } else {
            // Fallback básico se UIController não estiver disponível
            const isChecked = selectAll.checked;
            document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]').forEach(checkbox => {
              checkbox.checked = isChecked;
              
              // Disparar evento change para atualizar linhas selecionadas
              const changeEvent = new Event('change');
              checkbox.dispatchEvent(changeEvent);
            });
          }
        });
      } else {
        console.warn("Elemento 'selectAll' não encontrado");
      }
      
      // Botões de navegação
      addListener('topBtn', () => {
        if (typeof UIController !== 'undefined' && 
            typeof UIController.navigation !== 'undefined' && 
            typeof UIController.navigation.scrollToTop === 'function') {
          UIController.navigation.scrollToTop();
        } else {
          window.scrollTo(0, 0);
        }
      });
      
      addListener('bottomBtn', () => {
        if (typeof UIController !== 'undefined' && 
            typeof UIController.navigation !== 'undefined' && 
            typeof UIController.navigation.scrollToBottom === 'function') {
          UIController.navigation.scrollToBottom();
        } else {
          window.scrollTo(0, document.body.scrollHeight);
        }
      });
      
      // Configurar abas de visualização
      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
          // Remover classe ativa de todas as abas
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab-active'));
          this.classList.add('tab-active');
          
          // Ocultar todos os conteúdos
          document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
          });
          
          // Mostrar o conteúdo correspondente
          const contentId = this.id.replace('Tab', 'Content');
          const contentElement = document.getElementById(contentId);
          if (contentElement) {
            contentElement.classList.add('active');
          } else {
            console.warn(`Elemento de conteúdo '${contentId}' não encontrado`);
          }
          
          // Atualizar visualização se necessário
          if (window.VisualizationModule) {
            switch (this.id) {
              case 'utilizationTab':
                if (typeof VisualizationModule.initUtilizationChart === 'function') {
                  VisualizationModule.initUtilizationChart();
                }
                break;
              case 'heatmapTab':
                if (typeof VisualizationModule.initHeatmapChart === 'function') {
                  VisualizationModule.initHeatmapChart();
                }
                break;
              case 'prefixComparisonTab':
                if (typeof VisualizationModule.initPrefixComparisonChart === 'function') {
                  VisualizationModule.initPrefixComparisonChart();
                }
                break;
            }
          }
        });
      });
      
      // Configurar evento do slider de prefixo
      const prefixSlider = document.getElementById('prefixSlider');
      if (prefixSlider) {
        prefixSlider.addEventListener('input', function() {
          const prefixValue = document.getElementById('prefixValue');
          if (prefixValue) {
            prefixValue.textContent = this.value;
          }
          
          if (window.VisualizationModule && typeof VisualizationModule.updatePrefixStats === 'function') {
            VisualizationModule.updatePrefixStats(parseInt(this.value));
          }
        });
      }
    } catch (error) {
      console.error("Erro ao configurar event listeners:", error);
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
    calcularSubRedes,
    resetarCalculadora,
    selecionarPrefixo,
    toggleMainBlockIps,
    mostrarSugestoesDivisao,
    gerarIPsDoBloco,
    gerarMaisIPsDoBloco,
    resetarIPsMainBlock,
    gerarPrimeirosIPs,
    gerarMaisIPs,
    resetarIPsGerados,
    mostrarVisualizacao,
    appState
  };
})();

// Exportar globalmente
window.IPv6Calculator = IPv6Calculator;