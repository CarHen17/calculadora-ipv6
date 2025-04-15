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

   * Calcula sub-redes com base no endereço IPv6 fornecido

   */

  function calcularSubRedes() {

    try {

      console.log("Iniciando cálculo de sub-redes");

      

      // Limpar estado anterior

      resetState();

      

      const ipv6Input = document.getElementById('ipv6').value.trim();

      console.log("Validando entrada:", ipv6Input);

      

      // Validar o endereço IPv6

      const errorMessage = IPv6Utils.validateIPv6(ipv6Input);

      document.getElementById('errorMessage').style.display = 'none';

      

      if (errorMessage) {

        document.getElementById('errorMessage').innerText = errorMessage;

        document.getElementById('errorMessage').style.display = 'block';

        return;

      }

      

      // Processar o endereço IPv6 válido

      const [endereco, prefixoInicial] = ipv6Input.split('/');

      const prefixoNum = parseInt(prefixoInicial);

      const enderecoCompleto = IPv6Utils.expandIPv6Address(ipv6Input);

      

      // Configurar o bloco principal

      const enderecoFormatado = IPv6Utils.shortenIPv6(enderecoCompleto);

      document.getElementById('mainBlockCidr').innerText = `${enderecoFormatado}/${prefixoNum}`;

      

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

      

      document.getElementById('mainBlockGateway').innerText = gatewayIpShort;

      document.getElementById('sidebarBlockCidr').innerText = `${enderecoFormatado}/${prefixoNum}`;

      

      // Resetar o estado da lista de IPs

      appState.mainBlockCurrentOffset = 0;

      appState.isMainBlockIpsVisible = false;

      document.getElementById('mainBlockIpsContainer').style.display = 'none';

      document.getElementById('mainBlockIpsList').innerHTML = '';

      

      // Mostrar a seção do bloco principal e a sidebar

      document.getElementById('mainBlockSection').style.display = 'block';

      document.getElementById('infoSidebar').style.display = 'block';

      document.getElementById('suggestions').style.display = 'none';

      document.getElementById('aggregatedSidebar').style.display = 'none';

      

      // Atualizar os passos de progresso

      UIController.updateStep(2);

      

      // Preencher a lista de prefixos possíveis

      preencherListaPrefixos(prefixoNum);

      

      // Ajustar layout para dispositivos móveis

      UIController.ajustarLayoutResponsivo();

      

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

      if (!possiblePrefixesList) return;

      

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

      

      const ipv6Input = document.getElementById('ipv6').value.trim();

      const [endereco, prefixoInicial] = ipv6Input.split('/');

      const prefixoNum = parseInt(prefixoInicial);

      

      // Validações

      if (prefix <= prefixoNum) {

        alert("O prefixo selecionado deve ser maior que o prefixo inicial.");

        return;

      }

      

      const enderecoCompleto = IPv6Utils.expandIPv6Address(ipv6Input);

      if (enderecoCompleto.startsWith("Erro")) {

        alert(enderecoCompleto);

        return;

      }

      

      // Atualizar o passo atual

      UIController.updateStep(3);

      

      // Mostrar indicador de carregamento

      document.getElementById('loadingIndicator').style.display = 'flex';

      document.getElementById('suggestions').style.display = 'none';

      

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

        

        if (!confirmacao) return;

      }

      

      // Limpar tabela existente

      appState.subRedesGeradas = [];

      appState.subRedesExibidas = 0;

      document.getElementById('subnetsTable').getElementsByTagName('tbody')[0].innerHTML = "";

      

      // Máscara inicial para o cálculo

      const initialMask = ((1n << BigInt(prefixoNum)) - 1n) << (128n - BigInt(prefixoNum));

      

      // Gerar sub-redes assincronamente

      setTimeout(() => {

        IPv6Utils.gerarSubRedesAssincronamente(

          ipv6BigInt, 

          initialMask, 

          prefix, 

          numSubRedes, 

          onSubRedesGenerated, 

          appState

        );

      }, 50);

      

      return true;

    } catch (error) {

      console.error("Erro ao selecionar prefixo:", error);

      

      // Ocultar indicador de carregamento em caso de erro

      document.getElementById('loadingIndicator').style.display = 'none';

      

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

      UIController.carregarMaisSubRedes(0, 100);

      

      // Atualizar visibilidade do botão "Carregar Mais"

      document.getElementById('loadMoreContainer').style.display = 

        appState.subRedesGeradas.length > 100 ? 'block' : 'none';

      

      // Mostrar a seção de resultado e ocultar outras seções

      document.getElementById('resultado').style.display = 'block';

      document.getElementById('mainBlockSection').style.display = 'none';

      document.getElementById('aggregatedSidebar').style.display = 'none';

      document.getElementById('aggregatedPrefix').innerText = "N/A";

      

      // Ajustar layout para dispositivos móveis

      UIController.ajustarLayoutResponsivo();

    } catch (error) {

      console.error("Erro ao processar sub-redes geradas:", error);

    }

  }

  

  /**

   * Resetar a calculadora para o estado inicial

   */

  function resetarCalculadora() {

    try {

      document.getElementById('ipv6').value = '';

      document.getElementById('mainBlockSection').style.display = 'none';

      document.getElementById('suggestions').style.display = 'none';

      document.getElementById('resultado').style.display = 'none';

      document.getElementById('ipsResult').style.display = 'none';

      document.getElementById('aggregatedSidebar').style.display = 'none';

      document.getElementById('infoSidebar').style.display = 'none';

      document.getElementById('loadingIndicator').style.display = 'none';

      document.getElementById('errorMessage').style.display = 'none';

      document.getElementById('visualizationSection').style.display = 'none';

      

      // Reiniciar variáveis

      resetState();

      

      // Limpar listas

      document.getElementById('ipsList').innerHTML = '';

      document.getElementById('mainBlockIpsList').innerHTML = '';

      

      // Voltar para o primeiro passo

      UIController.updateStep(1);

      

      // Focar no campo de entrada

      document.getElementById('ipv6').focus();

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

      

      if (appState.isMainBlockIpsVisible) {

        ipsContainer.style.display = 'none';

        toggleBtn.innerHTML = '<i class="fas fa-list"></i> Exibir IPs';

        appState.isMainBlockIpsVisible = false;

      } else {

        ipsContainer.style.display = 'block';

        toggleBtn.innerHTML = '<i class="fas fa-times"></i> Fechar IPs';

        appState.isMainBlockIpsVisible = true;

        

        if (document.getElementById('mainBlockIpsList').innerHTML === '') {

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

      document.getElementById('suggestions').style.display = 'block';

      document.getElementById('suggestions').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {

      console.error("Erro ao mostrar sugestões de divisão:", error);

    }

  }

  

  /**

   * Gera os primeiros IPs do bloco principal

   */

  function gerarIPsDoBloco() {

    try {

      if (!appState.mainBlock) return;

      

      const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');

      toggleBtn.disabled = true;

      toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

      

      const redeCompleta = appState.mainBlock.network;

      const redeHex = redeCompleta.replace(/:/g, '');

      const redeBigInt = BigInt("0x" + redeHex);

      const ipsList = document.getElementById('mainBlockIpsList');

      ipsList.innerHTML = "";

      appState.mainBlockCurrentOffset = 0;

      

      function processarLote() {

        const limite = Math.min(appState.mainBlockCurrentOffset + 10, 50);

        for (let i = appState.mainBlockCurrentOffset; i < limite; i++) {

          const ipBigInt = redeBigInt + BigInt(i);

          const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);

          const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);

          UIController.appendIpToList(ipEnd, i + 1, 'mainBlockIpsList');

        }

        

        appState.mainBlockCurrentOffset = limite;

        

        if (appState.mainBlockCurrentOffset < 50) {

          setTimeout(processarLote, 0);

        } else {

          toggleBtn.disabled = false;

          toggleBtn.innerHTML = '<i class="fas fa-times"></i> Fechar IPs';

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

      if (!appState.mainBlock) return;

      

      const btn = document.getElementById('moreMainBlockIpsBtn');

      btn.disabled = true;

      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

      

      const redeCompleta = appState.mainBlock.network;

      const redeHex = redeCompleta.replace(/:/g, '');

      const redeBigInt = BigInt("0x" + redeHex);

      const inicio = appState.mainBlockCurrentOffset;

      const fim = inicio + 50;

      

      function processarLote() {

        const limite = Math.min(appState.mainBlockCurrentOffset + 10, fim);

        for (let i = appState.mainBlockCurrentOffset; i < limite; i++) {

          const ipBigInt = redeBigInt + BigInt(i);

          const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);

          const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);

          UIController.appendIpToList(ipEnd, i + 1, 'mainBlockIpsList');

        }

        

        appState.mainBlockCurrentOffset = limite;

        

        if (appState.mainBlockCurrentOffset < fim) {

          setTimeout(processarLote, 0);

        } else {

          btn.disabled = false;

          btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';

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

      document.getElementById('mainBlockIpsList').innerHTML = '';

      document.getElementById('moreMainBlockIpsBtn').disabled = false;

      document.getElementById('moreMainBlockIpsBtn').innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';

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

      appState.selectedBlock = appState.subRedesGeradas[indice];

      appState.currentIpOffset = 0;

      

      const redeCompleta = appState.selectedBlock.network;

      const redeHex = redeCompleta.replace(/:/g, '');

      const redeBigInt = BigInt("0x" + redeHex);

      const ipsList = document.getElementById('ipsList');

      ipsList.innerHTML = "";

      

      for (let i = 0; i < 50; i++) {

        const ipBigInt = redeBigInt + BigInt(i);

        const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);

        const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);

        UIController.appendIpToList(ipEnd, i + 1, 'ipsList');

      }

      

      appState.currentIpOffset = 50;

      document.getElementById('ipsResult').style.display = 'block';

      document.getElementById('ipsResult').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {

      console.error("Erro ao gerar primeiros IPs:", error);

    }

  }

  

  /**

   * Gera mais IPs da sub-rede selecionada

   */

  function gerarMaisIPs() {

    try {

      if (!appState.selectedBlock) return;

      

      const redeCompleta = appState.selectedBlock.network;

      const redeHex = redeCompleta.replace(/:/g, '');

      const redeBigInt = BigInt("0x" + redeHex);

      const inicio = appState.currentIpOffset;

      const fim = inicio + 50;

      

      // Desabilitar o botão enquanto processa

      const btn = document.getElementById('gerarMaisIPsButton');

      btn.disabled = true;

      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

      

      function processarLote() {

        const limite = Math.min(appState.currentIpOffset + 10, fim);

        for (let i = appState.currentIpOffset; i < limite; i++) {

          const ipBigInt = redeBigInt + BigInt(i);

          const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);

          const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);

          UIController.appendIpToList(ipEnd, i + 1, 'ipsList');

        }

        

        appState.currentIpOffset = limite;

        

        if (appState.currentIpOffset < fim) {

          setTimeout(processarLote, 0);

        } else {

          btn.disabled = false;

          btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';

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

      document.getElementById('ipsList').innerHTML = '';

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

      UIController.updateStep(4);

      

      // Exibir a seção de visualização

      const visualizationSection = document.getElementById('visualizationSection');

      visualizationSection.style.display = 'block';

      visualizationSection.scrollIntoView({ behavior: 'smooth' });

      

      // Inicializar visualizações

      if (window.VisualizationModule && typeof window.VisualizationModule.initializeAllCharts === 'function') {

        window.VisualizationModule.initializeAllCharts();

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

      // Botões principais

      const addListener = (id, fn) => {

        const el = document.getElementById(id);

        if (el) el.addEventListener('click', fn);

      };

      

      addListener('calcularBtn', calcularSubRedes);

      addListener('resetBtn', resetarCalculadora);

      addListener('toggleMainBlockIpsBtn', toggleMainBlockIps);

      addListener('continuarBtn', mostrarSugestoesDivisao);

      addListener('moreMainBlockIpsBtn', gerarMaisIPsDoBloco);

      addListener('resetMainBlockIPsButton', resetarIPsMainBlock);

      addListener('loadMoreButton', () => UIController.carregarMaisSubRedes(appState.subRedesExibidas, 100));

      addListener('gerarIPsButton', gerarPrimeirosIPs);

      addListener('gerarMaisIPsButton', gerarMaisIPs);

      addListener('resetIPsButton', resetarIPsGerados);

      addListener('visualizarBtn', mostrarVisualizacao);

      

      // Checkbox "Selecionar Todos"

      const selectAll = document.getElementById('selectAll');

      if (selectAll) {

        selectAll.addEventListener('change', UIController.toggleSelectAll);

      }

      

      // Botões de navegação

      addListener('topBtn', UIController.navigation.scrollToTop);

      addListener('bottomBtn', UIController.navigation.scrollToBottom);

      

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

          document.getElementById(contentId).classList.add('active');

          

          // Atualizar visualização se necessário

          if (window.VisualizationModule) {

            switch (this.id) {

              case 'utilizationTab':

                VisualizationModule.initUtilizationChart();

                break;

              case 'heatmapTab':

                VisualizationModule.initHeatmapChart();

                break;

              case 'prefixComparisonTab':

                VisualizationModule.initPrefixComparisonChart();

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