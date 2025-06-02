/**
 * IPv6 Calculator - Módulo Principal Corrigido
 * Implementa as funcionalidades principais da calculadora de sub-redes IPv6
 */

const IPv6Calculator = (function() {
  'use strict';
  
  /**
   * Verifica se os módulos essenciais estão disponíveis
   */
  function checkDependencies() {
    if (typeof window.IPv6Utils === 'undefined') {
      console.error("Erro: Módulo IPv6Utils não encontrado");
      return false;
    }
    
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
      
      // Obter o valor do input
      const ipv6Input = document.getElementById('ipv6');
      if (!ipv6Input) {
        console.error("Elemento 'ipv6' não encontrado no DOM");
        return false;
      }
      
      const inputValue = ipv6Input.value.trim();
      console.log("Validando entrada:", inputValue);
      
      // Validar o endereço IPv6
      const errorMessage = IPv6Utils.validateIPv6(inputValue);
      
      const errorMessageElement = document.getElementById('errorMessage');
      if (errorMessageElement) {
        errorMessageElement.style.display = 'none';
      }
      
      if (errorMessage) {
        if (errorMessageElement) {
          errorMessageElement.innerText = errorMessage;
          errorMessageElement.style.display = 'block';
        } else {
          alert("Erro: " + errorMessage);
        }
        return false;
      }
      
      // Processar o endereço IPv6 válido
      const [endereco, prefixoInicial] = inputValue.split('/');
      const prefixoNum = parseInt(prefixoInicial);
      const enderecoCompleto = IPv6Utils.expandIPv6Address(inputValue);
      
      // Verificar erro na expansão
      if (enderecoCompleto.startsWith("Erro")) {
        if (errorMessageElement) {
          errorMessageElement.innerText = enderecoCompleto;
          errorMessageElement.style.display = 'block';
        } else {
          alert("Erro: " + enderecoCompleto);
        }
        return false;
      }
      
      // Configurar o bloco principal
      const enderecoFormatado = IPv6Utils.shortenIPv6(enderecoCompleto);
      
      const mainBlockCidr = document.getElementById('mainBlockCidr');
      if (mainBlockCidr) {
        mainBlockCidr.innerText = `${enderecoFormatado}/${prefixoNum}`;
      }
      
      window.appState.mainBlock = {
        network: enderecoCompleto,
        prefix: prefixoNum
      };
      
      // Calcular o gateway
      const redeHex = enderecoCompleto.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);
      const gatewayIpBigInt = redeBigInt + 1n; 
      const gatewayIpFormatado = IPv6Utils.formatIPv6Address(gatewayIpBigInt);
      const gatewayIpShort = IPv6Utils.shortenIPv6(gatewayIpFormatado);
      
      // Atualizar elementos
      const mainBlockGateway = document.getElementById('mainBlockGateway');
      const sidebarBlockCidr = document.getElementById('sidebarBlockCidr');
      
      if (mainBlockGateway) {
        mainBlockGateway.innerText = gatewayIpShort;
      }
      
      if (sidebarBlockCidr) {
        sidebarBlockCidr.innerText = `${enderecoFormatado}/${prefixoNum}`;
      }
      
      // Resetar o estado da lista de IPs
      window.appState.mainBlockCurrentOffset = 0;
      window.appState.isMainBlockIpsVisible = false;
      
      const mainBlockIpsContainer = document.getElementById('mainBlockIpsContainer');
      const mainBlockIpsList = document.getElementById('mainBlockIpsList');
      
      if (mainBlockIpsContainer) {
        mainBlockIpsContainer.style.display = 'none';
      }
      
      if (mainBlockIpsList) {
        mainBlockIpsList.innerHTML = '';
      }
      
      // Mostrar seções
      const mainBlockSection = document.getElementById('mainBlockSection');
      const infoSidebar = document.getElementById('infoSidebar');
      const suggestions = document.getElementById('suggestions');
      
      if (mainBlockSection) {
        mainBlockSection.style.display = 'block';
      }
      
      if (infoSidebar) {
        infoSidebar.style.display = 'block';
      }
      
      if (suggestions) {
        suggestions.style.display = 'none';
      }
      
      // Atualizar os passos
      if (UIController && UIController.updateStep) {
        UIController.updateStep(2);
      }
      
      // Preencher lista de prefixos
      preencherListaPrefixos(prefixoNum);
      
      return true;
    } catch (error) {
      console.error("Erro ao calcular sub-redes:", error);
      alert("Ocorreu um erro ao processar o endereço IPv6. Por favor, verifique se o formato está correto.");
      return false;
    }
  }
  
  /**
   * Preenche a lista de prefixos possíveis
   */
  function preencherListaPrefixos(prefixoInicial) {
    try {
      const possiblePrefixesList = document.getElementById('possiblePrefixesList');
      if (!possiblePrefixesList) {
        console.error("Elemento 'possiblePrefixesList' não encontrado");
        return;
      }
      
      possiblePrefixesList.innerHTML = "";
      
      // Criar grupos de prefixos
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
      
      // Agrupar prefixos baseado no prefixo inicial
      if (prefixoInicial < 40) {
        for (let base = prefixoInicial + 1; base <= 128; base += 16) {
          const groupEnd = Math.min(base + 15, 128);
          const title = `/${base} - /${groupEnd}`;
          possiblePrefixesList.appendChild(createPrefixGroup(base, groupEnd, title));
        }
      } else if (prefixoInicial < 80) {
        for (let base = prefixoInicial + 1; base <= 128; base += 8) {
          const groupEnd = Math.min(base + 7, 128);
          const title = `/${base} - /${groupEnd}`;
          possiblePrefixesList.appendChild(createPrefixGroup(base, groupEnd, title));
        }
      } else {
        possiblePrefixesList.appendChild(createPrefixGroup(prefixoInicial + 1, 128, `/${prefixoInicial+1} - /128`));
      }
      
    } catch (error) {
      console.error("Erro ao preencher lista de prefixos:", error);
    }
  }
  
  /**
   * Seleciona um prefixo e gera sub-redes
   */
  function selecionarPrefixo(prefix) {
    try {
      console.log("Selecionando prefixo:", prefix);
      
      if (!checkDependencies()) {
        alert("Erro: Módulos necessários não foram carregados.");
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
      if (UIController && UIController.updateStep) {
        UIController.updateStep(3);
      }
      
      // Mostrar indicador de carregamento
      const loadingIndicator = document.getElementById('loadingIndicator');
      const suggestions = document.getElementById('suggestions');
      
      if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
      }
      
      if (suggestions) {
        suggestions.style.display = 'none';
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
          `100.000 sub-redes como amostra. Deseja continuar?`
        );
        
        if (!confirmacao) {
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
          return false;
        }
      }
      
      // Limpar tabela existente
      window.appState.subRedesGeradas = [];
      window.appState.subRedesExibidas = 0;
      
      const subnetsTableBody = document.querySelector('#subnetsTable tbody');
      if (subnetsTableBody) {
        subnetsTableBody.innerHTML = "";
      }
      
      // Máscara inicial para o cálculo
      const initialMask = ((1n << BigInt(prefixoNum)) - 1n) << (128n - BigInt(prefixoNum));
      
      // Gerar sub-redes assincronamente
      setTimeout(() => {
        try {
          if (IPv6Utils && IPv6Utils.gerarSubRedesAssincronamente) {
            IPv6Utils.gerarSubRedesAssincronamente(
              ipv6BigInt, 
              initialMask, 
              prefix, 
              numSubRedes, 
              onSubRedesGenerated, 
              window.appState
            );
          } else {
            console.error("Função IPv6Utils.gerarSubRedesAssincronamente não disponível");
            
            if (loadingIndicator) {
              loadingIndicator.style.display = 'none';
            }
            
            alert("Função necessária para gerar sub-redes não está disponível.");
          }
        } catch (error) {
          console.error("Erro ao gerar sub-redes de forma assíncrona:", error);
          
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
          
          alert("Erro ao gerar sub-redes: " + error.message);
        }
      }, 50);
      
      return true;
    } catch (error) {
      console.error("Erro ao selecionar prefixo:", error);
      
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      alert("Ocorreu um erro ao gerar as sub-redes. Por favor, tente novamente.");
      return false;
    }
  }
  
  /**
   * Callback chamado quando as sub-redes são geradas
   */
  function onSubRedesGenerated() {
    try {
      // Carregar as primeiras sub-redes na tabela
      if (UIController && UIController.carregarMaisSubRedes) {
        UIController.carregarMaisSubRedes(0, 100);
      }
      
      // Atualizar controles
      const loadMoreContainer = document.getElementById('loadMoreContainer');
      const resultado = document.getElementById('resultado');
      const mainBlockSection = document.getElementById('mainBlockSection');
      const loadingIndicator = document.getElementById('loadingIndicator');
      
      // Atualizar visibilidade do botão "Carregar Mais"
      if (loadMoreContainer) {
        loadMoreContainer.style.display = 
          window.appState.subRedesGeradas.length > 100 ? 'block' : 'none';
      }
      
      // Mostrar a seção de resultado e ocultar outras seções
      if (resultado) {
        resultado.style.display = 'block';
      }
      
      if (mainBlockSection) {
        mainBlockSection.style.display = 'none';
      }
      
      // Ocultar indicador de carregamento
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
    } catch (error) {
      console.error("Erro ao processar sub-redes geradas:", error);
      
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
      // Lista de elementos a resetar
      const elementsToReset = [
        { id: 'ipv6', action: 'clear' },
        { id: 'mainBlockSection', action: 'hide' },
        { id: 'suggestions', action: 'hide' },
        { id: 'resultado', action: 'hide' },
        { id: 'ipsResult', action: 'hide' },
        { id: 'infoSidebar', action: 'hide' },
        { id: 'loadingIndicator', action: 'hide' },
        { id: 'errorMessage', action: 'hide' },
        { id: 'ipsList', action: 'empty' },
        { id: 'mainBlockIpsList', action: 'empty' }
      ];
      
      elementsToReset.forEach(({ id, action }) => {
        const element = document.getElementById(id);
        if (element) {
          switch (action) {
            case 'clear':
              element.value = '';
              break;
            case 'hide':
              element.style.display = 'none';
              break;
            case 'empty':
              element.innerHTML = '';
              break;
          }
        }
      });
      
      // Reiniciar estado
      resetState();
      
      // Voltar para o primeiro passo
      if (UIController && UIController.updateStep) {
        UIController.updateStep(1);
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
    window.appState.subRedesGeradas = [];
    window.appState.subRedesExibidas = 0;
    window.appState.selectedBlock = null;
    window.appState.currentIpOffset = 0;
    window.appState.mainBlock = null;
    window.appState.mainBlockCurrentOffset = 0;
    window.appState.isMainBlockIpsVisible = false;
    window.appState.currentStep = 1;
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
      
      if (window.appState.isMainBlockIpsVisible) {
        ipsContainer.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> Exibir IPs';
        window.appState.isMainBlockIpsVisible = false;
      } else {
        ipsContainer.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-times"></i> Fechar IPs';
        window.appState.isMainBlockIpsVisible = true;
        
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
      }
    } catch (error) {
      console.error("Erro ao mostrar sugestões de divisão:", error);
    }
  }
  
  /**
   * Gera IPs do bloco principal
   */
  function gerarIPsDoBloco() {
    try {
      if (!window.appState.mainBlock) {
        console.error("appState.mainBlock não definido");
        return;
      }
      
      const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');
      if (toggleBtn) {
        toggleBtn.disabled = true;
        toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
      }
      
      const redeCompleta = window.appState.mainBlock.network;
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
      window.appState.mainBlockCurrentOffset = 0;
      
      for (let i = 0; i < 50; i++) {
        const ipBigInt = redeBigInt + BigInt(i);
        const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);
        const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);
        
        if (UIController && UIController.appendIpToList) {
          UIController.appendIpToList(ipEnd, i + 1, 'mainBlockIpsList');
        }
      }
      
      window.appState.mainBlockCurrentOffset = 50;
      
      if (toggleBtn) {
        toggleBtn.disabled = false;
        toggleBtn.innerHTML = '<i class="fas fa-times"></i> Fechar IPs';
      }
      
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
      if (!window.appState.mainBlock) {
        console.error("appState.mainBlock não definido");
        return;
      }
      
      const btn = document.getElementById('moreMainBlockIpsBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
      }
      
      const redeCompleta = window.appState.mainBlock.network;
      const redeHex = redeCompleta.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);
      const inicio = window.appState.mainBlockCurrentOffset;
      const fim = inicio + 50;
      
      for (let i = inicio; i < fim; i++) {
        const ipBigInt = redeBigInt + BigInt(i);
        const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);
        const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);
        
        if (UIController && UIController.appendIpToList) {
          UIController.appendIpToList(ipEnd, i + 1, 'mainBlockIpsList');
        }
      }
      
      window.appState.mainBlockCurrentOffset = fim;
      
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
      }
      
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
      window.appState.mainBlockCurrentOffset = 0;
      
      const mainBlockIpsList = document.getElementById('mainBlockIpsList');
      if (mainBlockIpsList) {
        mainBlockIpsList.innerHTML = '';
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
      if (isNaN(indice) || !window.appState.subRedesGeradas[indice]) {
        console.error("Índice inválido ou sub-rede não encontrada");
        return;
      }
      
      window.appState.selectedBlock = window.appState.subRedesGeradas[indice];
      window.appState.currentIpOffset = 0;
      
      const redeCompleta = window.appState.selectedBlock.network;
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
        
        if (UIController && UIController.appendIpToList) {
          UIController.appendIpToList(ipEnd, i + 1, 'ipsList');
        }
      }
      
      window.appState.currentIpOffset = 50;
      
      const ipsResult = document.getElementById('ipsResult');
      if (ipsResult) {
        ipsResult.style.display = 'block';
        ipsResult.scrollIntoView({ behavior: 'smooth' });
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
      if (!window.appState.selectedBlock) {
        console.error("Nenhum bloco selecionado");
        return;
      }
      
      const redeCompleta = window.appState.selectedBlock.network;
      const redeHex = redeCompleta.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);
      const inicio = window.appState.currentIpOffset;
      const fim = inicio + 50;
      
      // Desabilitar o botão enquanto processa
      const btn = document.getElementById('gerarMaisIPsButton');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
      }
      
      for (let i = inicio; i < fim; i++) {
        const ipBigInt = redeBigInt + BigInt(i);
        const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);
        const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);
        
        if (UIController && UIController.appendIpToList) {
          UIController.appendIpToList(ipEnd, i + 1, 'ipsList');
        }
      }
      
      window.appState.currentIpOffset = fim;
      
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
      }
      
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
      window.appState.currentIpOffset = 0;
      
      const ipsList = document.getElementById('ipsList');
      if (ipsList) {
        ipsList.innerHTML = '';
      }
    } catch (error) {
      console.error("Erro ao resetar IPs gerados:", error);
    }
  }
  
  /**
   * Configuração de event listeners
   */
  function setupEventListeners() {
    try {
      // Configurar eventos para os botões principais
      const buttons = [
        { id: 'calcularBtn', fn: calcularSubRedes },
        { id: 'resetBtn', fn: resetarCalculadora },
        { id: 'toggleMainBlockIpsBtn', fn: toggleMainBlockIps },
        { id: 'continuarBtn', fn: mostrarSugestoesDivisao },
        { id: 'moreMainBlockIpsBtn', fn: gerarMaisIPsDoBloco },
        { id: 'resetMainBlockIPsButton', fn: resetarIPsMainBlock },
        { id: 'gerarIPsButton', fn: gerarPrimeirosIPs },
        { id: 'gerarMaisIPsButton', fn: gerarMaisIPs },
        { id: 'resetIPsButton', fn: resetarIPsGerados }
      ];
      
      buttons.forEach(({ id, fn }) => {
        const button = document.getElementById(id);
        if (button && !button.hasAttribute('data-calculator-ready')) {
          button.addEventListener('click', fn);
          button.setAttribute('data-calculator-ready', 'true');
        }
      });
      
      // Tratamento especial para o loadMoreButton
      const loadMoreButton = document.getElementById('loadMoreButton');
      if (loadMoreButton && !loadMoreButton.hasAttribute('data-calculator-ready')) {
        loadMoreButton.addEventListener('click', () => {
          if (UIController && UIController.carregarMaisSubRedes) {
            UIController.carregarMaisSubRedes(window.appState.subRedesExibidas, 100);
          }
        });
        loadMoreButton.setAttribute('data-calculator-ready', 'true');
      }
      
    } catch (error) {
      console.error("Erro ao configurar event listeners:", error);
    }
  }
  
  /**
   * Inicialização do módulo
   */
  function initialize() {
    try {
      console.log("Inicializando módulo IPv6Calculator...");
      
      // Verificar dependências
      checkDependencies();
      
      // Configurar event listeners
      setupEventListeners();
      
      console.log("Módulo IPv6Calculator inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar IPv6Calculator:", error);
    }
  }
  
  // Inicializar quando o DOM estiver pronto
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
    resetarIPsGerados
  };
})();

// Exportar globalmente
window.IPv6Calculator = IPv6Calculator;
