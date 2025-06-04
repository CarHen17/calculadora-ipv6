/**
 * IPv6 Calculator - Módulo Principal com Exportação e Seleção Individual
 * Implementa as funcionalidades principais da calculadora de sub-redes IPv6
 * Versão com reset automático antes de novos cálculos
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
   * NOVO: Reset automático antes de iniciar novo cálculo
   */
  function calcularSubRedes() {
    try {
      console.log("🚀 Iniciando cálculo de sub-redes");
      if (!checkDependencies()) {
        alert("Alguns módulos necessários não foram carregados corretamente.");
        return false;
      }

      // NOVA FUNCIONALIDADE: Verificação específica para seção "Sub-redes Geradas"
      const resultadoSection = document.getElementById('resultado');
      const needsReset = (
        (resultadoSection && resultadoSection.style.display === 'block') ||
        (window.appState && window.appState.subRedesGeradas && window.appState.subRedesGeradas.length > 0) ||
        document.querySelector('#subnetsTable tbody')?.children.length > 0
      );

      if (needsReset) {
        console.log("🔄 Detectada seção 'Sub-redes Geradas' ativa - executando reset automático");
        resetarCalculadoraSilenciosamente();
      }

      resetState();
      const ipv6Input = document.getElementById('ipv6');
      if (!ipv6Input) {
        console.error("Elemento 'ipv6' não encontrado no DOM");
        return false;
      }
      const inputValue = ipv6Input.value.trim();
      console.log("✅ Validando entrada:", inputValue);
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
      const [endereco, prefixoInicial] = inputValue.split('/');
      const prefixoNum = parseInt(prefixoInicial);
      const enderecoCompleto = IPv6Utils.expandIPv6Address(inputValue);
      if (enderecoCompleto.startsWith("Erro")) {
        if (errorMessageElement) {
          errorMessageElement.innerText = enderecoCompleto;
          errorMessageElement.style.display = 'block';
        } else {
          alert("Erro: " + enderecoCompleto);
        }
        return false;
      }
      const enderecoFormatado = IPv6Utils.shortenIPv6(enderecoCompleto);
      const mainBlockCidr = document.getElementById('mainBlockCidr');
      if (mainBlockCidr) {
        mainBlockCidr.innerText = `${enderecoFormatado}/${prefixoNum}`;
      }
      window.appState.mainBlock = {
        network: enderecoCompleto, // Manter versão completa para cálculos
        prefix: prefixoNum
      };
      const redeHex = enderecoCompleto.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);
      const gatewayIpBigInt = redeBigInt + 1n;
      const gatewayIpFormatado = IPv6Utils.formatIPv6Address(gatewayIpBigInt);
      const gatewayIpShort = IPv6Utils.shortenIPv6(gatewayIpFormatado);
      const mainBlockGateway = document.getElementById('mainBlockGateway');
      const sidebarBlockCidr = document.getElementById('sidebarBlockCidr');
      if (mainBlockGateway) {
        mainBlockGateway.innerText = gatewayIpShort;
      }
      if (sidebarBlockCidr) {
        sidebarBlockCidr.innerText = `${enderecoFormatado}/${prefixoNum}`;
      }
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
      hideExportButtons();
      const mainBlockSection = document.getElementById('mainBlockSection');
      const infoSidebar = document.getElementById('infoSidebar');
      const suggestions = document.getElementById('suggestions');
      if (mainBlockSection) {
        mainBlockSection.style.display = 'block';
      }
      if (infoSidebar) {
        infoSidebar.style.display = 'block';
        infoSidebar.classList.remove('block-selected');
      }
      if (suggestions) {
        suggestions.style.display = 'none';
      }
      if (UIController && UIController.updateStep) {
        UIController.updateStep(2);
      }
      preencherListaPrefixos(prefixoNum);
      console.log("✅ Cálculo inicial concluído - bloco principal configurado");
      return true;
    } catch (error) {
      console.error("❌ Erro ao calcular sub-redes:", error);
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
      if (prefix <= prefixoNum) {
        alert("O prefixo selecionado deve ser maior que o prefixo inicial.");
        return false;
      }
      const enderecoCompleto = IPv6Utils.expandIPv6Address(inputValue);
      if (enderecoCompleto.startsWith("Erro")) {
        alert(enderecoCompleto);
        return false;
      }
      if (UIController && UIController.updateStep) {
        UIController.updateStep(3);
      }
      const loadingIndicator = document.getElementById('loadingIndicator');
      const suggestions = document.getElementById('suggestions');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
      }
      if (suggestions) {
        suggestions.style.display = 'none';
      }
      const ipv6SemDoisPontos = enderecoCompleto.replace(/:/g, '');
      const ipv6BigInt = BigInt("0x" + ipv6SemDoisPontos);
      const bitsAdicionais = prefix - prefixoNum;
      const numSubRedes = 1n << BigInt(bitsAdicionais);
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
      clearSubnetsState();
      const initialMask = ((1n << BigInt(prefixoNum)) - 1n) << (128n - BigInt(prefixoNum));
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
   * Limpa o estado das sub-redes e seleções
   */
  function clearSubnetsState() {
    try {
      console.log('🧹 [clearSubnetsState] Iniciando limpeza do estado das sub-redes');
      
      // Limpar dados do estado global
      if (window.appState) {
        window.appState.subRedesGeradas = [];
        window.appState.subRedesExibidas = 0;
        window.appState.selectedBlock = null;
        window.appState.currentIpOffset = 0;
        console.log('🧹 [clearSubnetsState] Estados globais resetados');
      }
      
      // Limpar tabela de sub-redes completamente
      const subnetsTable = document.getElementById('subnetsTable');
      if (subnetsTable) {
        const tbody = subnetsTable.querySelector('tbody');
        if (tbody) {
          tbody.innerHTML = "";
          console.log('🧹 [clearSubnetsState] Tabela de sub-redes limpa');
        }
      }
      
      // Limpar checkbox "selecionar todos"
      const selectAllCheckbox = document.getElementById('selectAll');
      if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        console.log('🧹 [clearSubnetsState] Checkbox "Selecionar Todos" desmarcado');
      }
      
      // Usar UIController para limpar seleções se disponível
      if (UIController && UIController.clearAllSelections) {
        UIController.clearAllSelections();
        console.log('🧹 [clearSubnetsState] Seleções do UIController limpas');
      }
      
      // Ocultar botão "Carregar Mais"
      const loadMoreContainer = document.getElementById('loadMoreContainer');
      if (loadMoreContainer) {
        loadMoreContainer.style.display = 'none';
        console.log('🧹 [clearSubnetsState] Container "Carregar Mais" ocultado');
      }
      
      // Ocultar botão "Gerar IPs"
      const gerarIPsButton = document.getElementById('gerarIPsButton');
      if (gerarIPsButton) {
        gerarIPsButton.style.display = 'none';
        console.log('🧹 [clearSubnetsState] Botão "Gerar IPs" ocultado');
      }
      
      console.log('✅ [clearSubnetsState] Limpeza do estado das sub-redes concluída');
    } catch (error) {
      console.error('❌ [clearSubnetsState] Erro ao limpar estado das sub-redes:', error);
    }
  }

  /**
   * Callback chamado quando as sub-redes são geradas
   */
  function onSubRedesGenerated() {
    try {
      if (UIController && UIController.carregarMaisSubRedes) {
        UIController.carregarMaisSubRedes(0, 100);
      }
      const loadMoreContainer = document.getElementById('loadMoreContainer');
      const resultado = document.getElementById('resultado');
      const mainBlockSection = document.getElementById('mainBlockSection');
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadMoreContainer) {
        loadMoreContainer.style.display =
          window.appState.subRedesGeradas.length > 100 ? 'block' : 'none';
      }
      if (resultado) {
        resultado.style.display = 'block';
      }
      if (mainBlockSection) {
        mainBlockSection.style.display = 'none';
      }
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      if (UIController && UIController.restoreSidebarToMainBlock) {
        UIController.restoreSidebarToMainBlock();
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
   * NOVA FUNÇÃO: Resetar a calculadora silenciosamente (sem notificação)
   * Usada internamente antes de calcular um novo bloco
   */
  function resetarCalculadoraSilenciosamente() {
    try {
      console.log("🔄 [Reset Automático] Iniciando reset silencioso...");
      
      // 1. CRÍTICO: Ocultar seção "Sub-redes Geradas" completamente
      const resultado = document.getElementById('resultado');
      if (resultado) {
        resultado.style.display = 'none';
        console.log("🔄 [Reset Automático] Seção 'Sub-redes Geradas' ocultada");
      }
      
      // 2. Limpar tabela de sub-redes primeiro
      const subnetsTableBody = document.querySelector('#subnetsTable tbody');
      if (subnetsTableBody) {
        subnetsTableBody.innerHTML = "";
        console.log("🔄 [Reset Automático] Tabela de sub-redes limpa");
      }
      
      // 3. Limpar seleções no UIController
      if (UIController && UIController.clearAllSelections) {
        UIController.clearAllSelections();
        console.log("🔄 [Reset Automático] Seleções limpas");
      }
      
      // 4. Resetar checkbox "selecionar todos"
      const selectAll = document.getElementById('selectAll');
      if (selectAll) {
        selectAll.checked = false;
      }
      
      // 5. Ocultar todas as outras seções relacionadas
      const elementsToReset = [
        { id: 'ipsResult', action: 'hide' },
        { id: 'loadingIndicator', action: 'hide' },
        { id: 'loadMoreContainer', action: 'hide' },
        { id: 'errorMessage', action: 'hide' },
        { id: 'ipsList', action: 'empty' },
        { id: 'mainBlockIpsList', action: 'empty' },
        { id: 'mainBlockIpsContainer', action: 'hide' }
      ];
      
      elementsToReset.forEach(({ id, action }) => {
        const element = document.getElementById(id);
        if (element) {
          switch (action) {
            case 'hide': 
              element.style.display = 'none'; 
              console.log(`🔄 [Reset Automático] ${id} ocultado`);
              break;
            case 'empty': 
              element.innerHTML = ''; 
              console.log(`🔄 [Reset Automático] ${id} esvaziado`);
              break;
          }
        }
      });
      
      // 6. Resetar botões para estado inicial
      const toggleMainBlockBtn = document.getElementById('toggleMainBlockIpsBtn');
      if (toggleMainBlockBtn) {
        toggleMainBlockBtn.innerHTML = '<i class="fas fa-list"></i> Exibir IPs';
        toggleMainBlockBtn.disabled = false;
      }
      
      // 7. Ocultar todos os botões de exportação e ação
      hideExportButtons();
      const additionalButtons = [
        'gerarIPsButton',
        'moreMainBlockIpsBtn', 
        'resetMainBlockIPsButton',
        'gerarMaisIPsButton',
        'resetIPsButton'
      ];
      additionalButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
          button.style.display = 'none';
        }
      });
      
      // 8. Resetar estados internos ANTES de limpar
      resetState();
      clearSubnetsState();
      console.log("🔄 [Reset Automático] Estados internos resetados");
      
      // 9. Limpar sidebar e remover agregação
      const sidebar = document.getElementById('infoSidebar');
      if (sidebar) {
        const existingAggregation = sidebar.querySelector('.aggregation-section');
        if (existingAggregation) {
          existingAggregation.remove();
          console.log("🔄 [Reset Automático] Seção de agregação removida");
        }
        // MANTER sidebar visível para mostrar o novo bloco
        sidebar.classList.remove('block-selected', 'individual-selected');
      }
      
      // 10. NÃO atualizar step indicator aqui - deixar no passo 2 para continuar o fluxo
      
      console.log("✅ [Reset Automático] Reset silencioso concluído - pronto para novo cálculo");
      
    } catch (error) {
      console.error("❌ [Reset Automático] Erro ao resetar calculadora silenciosamente:", error);
    }
  }

  /**
   * Resetar a calculadora para o estado inicial (versão manual com notificação)
   */
  function resetarCalculadora() {
    try {
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
            case 'clear': element.value = ''; break;
            case 'hide': element.style.display = 'none'; break;
            case 'empty': element.innerHTML = ''; break;
          }
        }
      });
      hideExportButtons();
      resetState();
      clearSubnetsState();
      if (UIController && UIController.updateStep) {
        UIController.updateStep(1);
      }
      const ipv6Input = document.getElementById('ipv6');
      if (ipv6Input) {
        ipv6Input.focus();
      }
      if (window.showNotification) {
        window.showNotification('Calculadora resetada', 'info');
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
    window.appState.currentAggregation = null;
    window.appState.aggregationIpOffset = 0;
    window.appState.isAggregationVisible = false;
  }

  /**
   * Oculta todos os botões de exportação
   */
  function hideExportButtons() {
    const exportButtons = [
      'exportIPsButton',
      'exportMainBlockIPsButton'
      // Adicionar outros botões de exportação se houver (ex: agregação)
    ];
    exportButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.style.display = 'none';
      }
    });
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
        const exportBtn = document.getElementById('exportMainBlockIPsButton');
        if (exportBtn) {
          exportBtn.style.display = 'none';
        }
      } else {
        ipsContainer.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-times"></i> Fechar IPs';
        window.appState.isMainBlockIpsVisible = true;
        const mainBlockIpsList = document.getElementById('mainBlockIpsList');
        if (mainBlockIpsList && mainBlockIpsList.innerHTML === '') {
          // Gerar os primeiros IPs ao abrir pela primeira vez
          gerarIPsDoBloco();
        } else {
           // Se já tem IPs, apenas mostrar o botão de exportar
           const exportBtn = document.getElementById('exportMainBlockIPsButton');
           if (exportBtn && mainBlockIpsList && mainBlockIpsList.children.length > 0) {
             exportBtn.style.display = 'inline-block';
           }
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
   * Gera os primeiros 50 IPs do bloco principal
   */
  function gerarIPsDoBloco() {
    try {
      if (!window.appState.mainBlock) {
        console.error("appState.mainBlock não definido");
        return;
      }
      const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');
      const moreBtn = document.getElementById('moreMainBlockIpsBtn');
      const resetBtn = document.getElementById('resetMainBlockIPsButton');

      if (toggleBtn) {
        toggleBtn.disabled = true;
        toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
      }
      if (moreBtn) moreBtn.style.display = 'none'; // Ocultar "Gerar Mais" inicialmente
      if (resetBtn) resetBtn.style.display = 'none'; // Ocultar "Resetar" inicialmente

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
      ipsList.innerHTML = ""; // Limpar lista antes de gerar
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
      // Mostrar botões "Gerar Mais" e "Resetar"
      if (moreBtn) moreBtn.style.display = 'inline-block';
      if (resetBtn) resetBtn.style.display = 'inline-block';

      // Mostrar botão de exportação
      const exportBtn = document.getElementById('exportMainBlockIPsButton');
      if (exportBtn) {
        exportBtn.style.display = 'inline-block';
      }
    } catch (error) {
      console.error("Erro ao gerar IPs do bloco principal:", error);
      const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');
      if (toggleBtn) {
        toggleBtn.disabled = false;
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> Exibir IPs';
      }
       // Garantir que botões de controle sejam reativados/visíveis em caso de erro
      const moreBtn = document.getElementById('moreMainBlockIpsBtn');
      const resetBtn = document.getElementById('resetMainBlockIPsButton');
      if (moreBtn) moreBtn.style.display = 'inline-block';
      if (resetBtn) resetBtn.style.display = 'inline-block';
    }
  }

  /**
   * Gera mais 50 IPs do bloco principal
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
          // O número do IP deve continuar a sequência
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
      // Ocultar botões relacionados aos IPs do bloco principal
      const exportBtn = document.getElementById('exportMainBlockIPsButton');
      const moreBtn = document.getElementById('moreMainBlockIpsBtn');
      const resetBtn = document.getElementById('resetMainBlockIPsButton');
      if (exportBtn) exportBtn.style.display = 'none';
      if (moreBtn) moreBtn.style.display = 'none';
      if (resetBtn) resetBtn.style.display = 'none';

      // Gerar os primeiros IPs novamente ao resetar, se a seção estiver visível
      if (window.appState.isMainBlockIpsVisible) {
          gerarIPsDoBloco();
      }

    } catch (error) {
      console.error("Erro ao resetar IPs do bloco principal:", error);
    }
  }

  /**
   * Exporta IPs do bloco principal
   */
  function exportarIPsBlocoPrincipal() {
    try {
      if (!window.appState.mainBlock) {
        alert("Nenhum bloco principal disponível para exportação.");
        return;
      }
      if (!window.ExportUtils) {
        alert("Módulo de exportação não está disponível.");
        return;
      }
      const mainBlockCidrElement = document.getElementById('mainBlockCidr');
      const subnetInfo = mainBlockCidrElement ? mainBlockCidrElement.textContent : 'Bloco Principal';
      window.ExportUtils.showExportModal('mainBlockIpsList', subnetInfo);
    } catch (error) {
      console.error("Erro ao exportar IPs do bloco:", error);
      alert("Erro ao abrir opções de exportação.");
    }
  }

  /**
   * Gera os primeiros 50 IPs de uma sub-rede selecionada na tabela
   */
  function gerarPrimeirosIPs() {
     try {
      // Verificar se exatamente um bloco está selecionado na tabela
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      if (checkboxes.length !== 1) {
        alert("Selecione exatamente uma sub-rede na tabela para gerar os IPs.");
        return;
      }

      // Obter o índice do bloco selecionado
      const indice = parseInt(checkboxes[0].value);
      if (isNaN(indice) || !window.appState.subRedesGeradas || !window.appState.subRedesGeradas[indice]) {
        console.error("Índice inválido ou sub-rede não encontrada no estado:", indice);
        alert("Erro ao obter informações da sub-rede selecionada.");
        return;
      }

      // Definir o bloco selecionado no estado global
      window.appState.selectedBlock = window.appState.subRedesGeradas[indice];
      window.appState.currentIpOffset = 0; // Resetar offset para IPs da sub-rede

      // Obter elementos da UI
      const ipsList = document.getElementById('ipsList');
      const ipsResultSection = document.getElementById('ipsResult');
      const titleElement = ipsResultSection ? ipsResultSection.querySelector('h3') : null;
      const gerarMaisBtn = document.getElementById('gerarMaisIPsButton');
      const resetIPsBtn = document.getElementById('resetIPsButton');
      const exportIPsBtn = document.getElementById('exportIPsButton');

      if (!ipsList || !ipsResultSection || !titleElement || !gerarMaisBtn || !resetIPsBtn || !exportIPsBtn) {
          console.error("Elementos da UI para IPs da sub-rede não encontrados.");
          alert("Erro ao preparar a exibição dos IPs.");
          return;
      }

      // Limpar lista de IPs anterior
      ipsList.innerHTML = '';

      // Obter informações da rede
      const redeCompleta = window.appState.selectedBlock.network; // Usar network completo para cálculo
      const redeHex = redeCompleta.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);

      // Gerar os primeiros 50 IPs
      for (let i = 0; i < 50; i++) {
        const ipBigInt = redeBigInt + BigInt(i);
        const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);
        const ipEnd = IPv6Utils.shortenIPv6(ipFormatado); // Exibir versão curta
        if (UIController && UIController.appendIpToList) {
          UIController.appendIpToList(ipEnd, i + 1, 'ipsList');
        }
      }
      window.appState.currentIpOffset = 50; // Atualizar offset

      // Atualizar título da seção com informações da sub-rede (versão curta)
      const subnetInfoShort = IPv6Utils.shortenIPv6(window.appState.selectedBlock.subnet);
      titleElement.innerHTML = `IPs da Sub-rede: <code>${subnetInfoShort}</code>`;

      // Mostrar seção e botões
      ipsResultSection.style.display = 'block';
      gerarMaisBtn.style.display = 'inline-block';
      resetIPsBtn.style.display = 'inline-block';
      exportIPsBtn.style.display = 'inline-block';

      // Scroll para a seção de IPs
      ipsResultSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
      console.error("Erro ao gerar primeiros IPs da sub-rede:", error);
      alert("Ocorreu um erro ao gerar os IPs da sub-rede selecionada.");
    }
  }


  /**
   * Gera mais 50 IPs da sub-rede selecionada
   */
  function gerarMaisIPs() {
    try {
      if (!window.appState.selectedBlock) {
        console.error("Nenhum bloco selecionado para gerar mais IPs");
        return;
      }
      const btn = document.getElementById('gerarMaisIPsButton');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
      }
      const redeCompleta = window.appState.selectedBlock.network;
      const redeHex = redeCompleta.replace(/:/g, '');
      const redeBigInt = BigInt("0x" + redeHex);
      const inicio = window.appState.currentIpOffset;
      const fim = inicio + 50;

      for (let i = inicio; i < fim; i++) {
        const ipBigInt = redeBigInt + BigInt(i);
        const ipFormatado = IPv6Utils.formatIPv6Address(ipBigInt);
        const ipEnd = IPv6Utils.shortenIPv6(ipFormatado);
        if (UIController && UIController.appendIpToList) {
          // O número do IP deve continuar a sequência
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
   * Reseta a lista de IPs gerados da sub-rede selecionada
   */
  function resetarIPsGerados() {
    try {
      window.appState.currentIpOffset = 0;
      const ipsList = document.getElementById('ipsList');
      if (ipsList) {
        ipsList.innerHTML = '';
      }
      // Ocultar botões relacionados aos IPs da sub-rede
      const exportBtn = document.getElementById('exportIPsButton');
      const moreBtn = document.getElementById('gerarMaisIPsButton');
      const resetBtn = document.getElementById('resetIPsButton');
      const ipsResultSection = document.getElementById('ipsResult');

      if (exportBtn) exportBtn.style.display = 'none';
      if (moreBtn) moreBtn.style.display = 'none';
      if (resetBtn) resetBtn.style.display = 'none';
      if (ipsResultSection) ipsResultSection.style.display = 'none'; // Ocultar a seção inteira

      // Não regerar automaticamente, esperar nova seleção e clique em "Gerar IPs"

    } catch (error) {
      console.error("Erro ao resetar IPs gerados:", error);
    }
  }

  /**
   * Abre modal de exportação para IPs gerados da sub-rede selecionada
   */
  function exportarIPsGerados() {
    try {
      if (!window.appState.selectedBlock) {
        alert("Nenhuma sub-rede selecionada para exportação.");
        return;
      }
      if (!window.ExportUtils) {
        alert("Módulo de exportação não está disponível.");
        return;
      }
      // Usar a versão curta do subnet para o nome do arquivo/modal
      const subnetInfo = IPv6Utils.shortenIPv6(window.appState.selectedBlock.subnet);
      window.ExportUtils.showExportModal('ipsList', subnetInfo);
    } catch (error) {
      console.error("Erro ao exportar IPs:", error);
      alert("Erro ao abrir opções de exportação.");
    }
  }

  /**
   * Configuração de event listeners
   */
  function setupEventListeners() {
    try {
      const buttons = [
        { id: 'calcularBtn', fn: calcularSubRedes },
        { id: 'resetBtn', fn: resetarCalculadora },
        { id: 'toggleMainBlockIpsBtn', fn: toggleMainBlockIps },
        { id: 'continuarBtn', fn: mostrarSugestoesDivisao }, // Botão para mostrar prefixos
        { id: 'moreMainBlockIpsBtn', fn: gerarMaisIPsDoBloco },
        { id: 'resetMainBlockIPsButton', fn: resetarIPsMainBlock },
        { id: 'exportMainBlockIPsButton', fn: exportarIPsBlocoPrincipal },
        { id: 'gerarIPsButton', fn: gerarPrimeirosIPs }, // Botão na tabela de sub-redes
        { id: 'gerarMaisIPsButton', fn: gerarMaisIPs }, // Botão na seção de IPs da sub-rede
        { id: 'resetIPsButton', fn: resetarIPsGerados }, // Botão na seção de IPs da sub-rede
        { id: 'exportIPsButton', fn: exportarIPsGerados } // Botão na seção de IPs da sub-rede
      ];

      buttons.forEach(({ id, fn }) => {
        const button = document.getElementById(id);
        // Verificar se o botão existe e se o listener já não foi adicionado
        if (button && !button.hasAttribute('data-calculator-ready')) {
          button.addEventListener('click', fn);
          button.setAttribute('data-calculator-ready', 'true'); // Marcar como configurado
        } else if (!button) {
           // console.warn(`Botão com ID '${id}' não encontrado no DOM.`);
        }
      });

      // Listener para o botão "Carregar Mais" sub-redes
      const loadMoreButton = document.getElementById('loadMoreButton');
      if (loadMoreButton && !loadMoreButton.hasAttribute('data-calculator-ready')) {
        loadMoreButton.addEventListener('click', () => {
          if (UIController && UIController.carregarMaisSubRedes) {
            UIController.carregarMaisSubRedes(window.appState.subRedesExibidas, 100);
          }
        });
        loadMoreButton.setAttribute('data-calculator-ready', 'true');
      }

      // Listener para tecla Enter no input IPv6
      const ipv6Input = document.getElementById('ipv6');
      if (ipv6Input && !ipv6Input.hasAttribute('data-calculator-ready')) {
        ipv6Input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            calcularSubRedes();
          }
        });
        ipv6Input.setAttribute('data-calculator-ready', 'true');
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
      if (!checkDependencies()) {
         console.error("Falha na verificação de dependências. Inicialização abortada.");
         // Poderia mostrar uma mensagem ao usuário aqui
         return;
      }
      setupEventListeners();
      console.log("Módulo IPv6Calculator inicializado com sucesso");
    } catch (error) {
      console.error("Erro fatal ao inicializar IPv6Calculator:", error);
      // Poderia mostrar uma mensagem de erro mais visível ao usuário
    }
  }

  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM já carregado
    initialize();
  }

  // API pública
  return {
    calcularSubRedes,
    resetarCalculadora,
    resetarCalculadoraSilenciosamente, // NOVA FUNÇÃO exposta
    selecionarPrefixo,
    toggleMainBlockIps,
    mostrarSugestoesDivisao,
    gerarIPsDoBloco,
    gerarMaisIPsDoBloco,
    resetarIPsMainBlock,
    exportarIPsBlocoPrincipal,
    gerarPrimeirosIPs,
    gerarMaisIPs,
    resetarIPsGerados,
    exportarIPsGerados,
    clearSubnetsState // Expor se necessário por outros módulos, embora pareça interno
  };
})();

// Exportar globalmente para que outros scripts possam usar
window.IPv6Calculator = IPv6Calculator;
