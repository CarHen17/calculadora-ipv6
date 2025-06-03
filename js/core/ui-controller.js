/**
 * UI Controller - Versão com Agregação e Seleção Individual de Blocos
 * Gerencia todas as funcionalidades de interface da aplicação incluindo agregação e seleção individual
 */

const UIController = (function() {
  'use strict';
  
  // Configurações
  const CONFIG = {
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    THEME_STORAGE_KEY: 'themePreference'
  };
  
  // Flag para evitar inicialização dupla
  let initialized = false;
  
  // Estado da agregação
  let currentAggregation = null;
  let aggregationIpOffset = 0;
  
  // Estado do bloco selecionado individualmente
  let selectedIndividualBlock = null;
  
  /**
   * Obtém elemento de forma segura
   */
  function getElement(id) {
    if (typeof id === 'string') {
      return document.getElementById(id);
    }
    return id;
  }
  
  /**
   * Atualiza o passo atual no indicador de progresso
   */
  function updateStep(step) {
    try {
      const steps = document.querySelectorAll('.step');
      if (steps.length === 0) return;
      
      // Remover classe ativa de todos os passos
      steps.forEach(el => el.classList.remove('active'));
      
      // Ativar passo atual
      const currentStep = getElement(`step${step}`);
      if (currentStep) {
        currentStep.classList.add('active');
      }
      
      // Atualizar estado global
      if (window.appState) {
        window.appState.currentStep = step;
      }
    } catch (error) {
      console.error('[UIController] Erro em updateStep:', error);
    }
  }
  
  /**
   * Gerencia o tema da aplicação
   */
  const themeManager = {
    toggle() {
      try {
        const isDark = document.body.classList.toggle('dark-mode');
        
        // Atualizar botão
        const themeBtn = getElement('toggleThemeBtn');
        if (themeBtn) {
          const icon = isDark ? 'fa-sun' : 'fa-moon';
          themeBtn.innerHTML = `<i class="fas ${icon}"></i> Tema`;
        }
        
        // Salvar preferência
        localStorage.setItem(CONFIG.THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
        
        console.log(`[UIController] Tema alterado para: ${isDark ? 'escuro' : 'claro'}`);
      } catch (error) {
        console.error('[UIController] Erro ao alternar tema:', error);
      }
    },
    
    loadPreference() {
      try {
        const saved = localStorage.getItem(CONFIG.THEME_STORAGE_KEY);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let shouldUseDark = false;
        
        if (saved === 'dark') {
          shouldUseDark = true;
        } else if (saved === 'light') {
          shouldUseDark = false;
        } else {
          shouldUseDark = prefersDark;
        }
        
        // Aplicar tema
        document.body.classList.toggle('dark-mode', shouldUseDark);
        
        // Atualizar botão
        const themeBtn = getElement('toggleThemeBtn');
        if (themeBtn) {
          const icon = shouldUseDark ? 'fa-sun' : 'fa-moon';
          themeBtn.innerHTML = `<i class="fas ${icon}"></i> Tema`;
        }
      } catch (error) {
        console.error('[UIController] Erro ao carregar preferência de tema:', error);
      }
    }
  };
  
  /**
   * Adiciona um item à lista de IPs
   */
  function appendIpToList(ip, number, listId) {
    try {
      const ipsList = getElement(listId);
      if (!ipsList) {
        console.error(`[UIController] Lista "${listId}" não encontrada`);
        return;
      }
      
      // Criar elementos
      const li = document.createElement('li');
      li.className = 'ip-item';
      li.innerHTML = `
        <span class="ip-number">${number}.</span>
        <span class="ip-text" title="${ip}">${ip}</span>
        <button class="copy-btn" type="button" title="Copiar IP" onclick="copyToClipboard('${ip}')">
          <i class="fas fa-copy"></i>
        </button>
      `;
      
      ipsList.appendChild(li);
      
    } catch (error) {
      console.error('[UIController] Erro em appendIpToList:', error);
    }
  }
  
  /**
   * Atualiza as informações da sidebar com um bloco específico
   */
  function updateSidebarWithBlock(blockData) {
    try {
      console.log('[UIController] updateSidebarWithBlock chamada com:', blockData);
      
      if (!blockData) {
        console.error('[UIController] Dados do bloco não fornecidos');
        return;
      }
      
      // Função para encurtar IPv6 se disponível
      const shortenIPv6 = window.IPv6Utils && window.IPv6Utils.shortenIPv6 
        ? window.IPv6Utils.shortenIPv6 
        : (addr) => addr;
      
      // Usar sempre a versão encurtada do network
      let networkToDisplay = blockData.network;
      if (networkToDisplay) {
        // Se o network estiver no formato expandido, encurtar primeiro
        networkToDisplay = shortenIPv6(networkToDisplay);
      }
      
      // Calcular gateway do bloco selecionado usando a versão completa
      let gatewayIp = '-';
      if (window.IPv6Utils && blockData.network) {
        try {
          console.log('[UIController] Calculando gateway para:', blockData.network);
          // Usar o network original (completo) para o cálculo
          const networkBigInt = window.IPv6Utils.ipv6ToBigInt(blockData.network);
          const gatewayBigInt = networkBigInt + 1n;
          const gatewayFormatted = window.IPv6Utils.formatIPv6Address(gatewayBigInt);
          // Mas exibir na versão encurtada
          gatewayIp = shortenIPv6(gatewayFormatted);
          console.log('[UIController] Gateway calculado:', gatewayIp);
        } catch (error) {
          console.warn('[UIController] Erro ao calcular gateway:', error);
          gatewayIp = '-';
        }
      }
      
      // Criar CIDR sempre com versão encurtada
      let subnetDisplay;
      if (blockData.subnet) {
        // Se já temos o subnet formatado, verificar se precisa encurtar
        const [subnetNetwork, prefix] = blockData.subnet.split('/');
        const shortNetwork = shortenIPv6(subnetNetwork);
        subnetDisplay = `${shortNetwork}/${prefix}`;
      } else {
        // Criar CIDR com versão encurtada
        subnetDisplay = `${networkToDisplay}/${blockData.prefix}`;
      }
      
      console.log('[UIController] Atualizando elementos da sidebar...');
      console.log('- CIDR (encurtado):', subnetDisplay);
      console.log('- Gateway (encurtado):', gatewayIp);
      
      // Atualizar elementos da sidebar
      const sidebarBlockCidr = getElement('sidebarBlockCidr');
      const mainBlockGateway = getElement('mainBlockGateway');
      
      if (sidebarBlockCidr) {
        sidebarBlockCidr.textContent = subnetDisplay;
        console.log('[UIController] CIDR atualizado na sidebar');
      } else {
        console.error('[UIController] Elemento sidebarBlockCidr não encontrado');
      }
      
      if (mainBlockGateway) {
        mainBlockGateway.textContent = gatewayIp;
        console.log('[UIController] Gateway atualizado na sidebar');
      } else {
        console.error('[UIController] Elemento mainBlockGateway não encontrado');
      }
      
      // Armazenar bloco selecionado
      selectedIndividualBlock = blockData;
      
      console.log('[UIController] Sidebar atualizada com bloco:', subnetDisplay);
      
      // Atualizar título da sidebar para indicar seleção individual
      const sidebarTitle = document.querySelector('#infoSidebar h3');
      if (sidebarTitle) {
        sidebarTitle.innerHTML = '<i class="fas fa-info-circle"></i> Bloco Selecionado';
        sidebarTitle.style.color = '#4caf50';
      }
      
      // Forçar uma atualização visual com efeito
      const sidebar = getElement('infoSidebar');
      if (sidebar) {
        sidebar.style.transition = 'all 0.3s ease';
        sidebar.style.transform = 'scale(0.98)';
        sidebar.style.boxShadow = '0 8px 20px rgba(76, 175, 80, 0.2)';
        
        setTimeout(() => {
          sidebar.style.transform = 'scale(1)';
          sidebar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        }, 150);
      }
      
    } catch (error) {
      console.error('[UIController] Erro ao atualizar sidebar com bloco:', error);
    }
  }
  
  /**
   * Restaura as informações da sidebar para o bloco principal
   */
  function restoreSidebarToMainBlock() {
    try {
      if (!window.appState || !window.appState.mainBlock) {
        console.log('[UIController] Nenhum bloco principal disponível');
        return;
      }
      
      const mainBlock = window.appState.mainBlock;
      
      // Função para encurtar IPv6 se disponível
      const shortenIPv6 = window.IPv6Utils && window.IPv6Utils.shortenIPv6 
        ? window.IPv6Utils.shortenIPv6 
        : (addr) => addr;
      
      // Usar sempre a versão encurtada do network principal
      const shortMainNetwork = shortenIPv6(mainBlock.network);
      
      // Calcular gateway do bloco principal
      let gatewayIp = '-';
      if (window.IPv6Utils && mainBlock.network) {
        try {
          // Usar o network original (completo) para o cálculo
          const networkBigInt = window.IPv6Utils.ipv6ToBigInt(mainBlock.network);
          const gatewayBigInt = networkBigInt + 1n;
          const gatewayFormatted = window.IPv6Utils.formatIPv6Address(gatewayBigInt);
          // Mas exibir na versão encurtada
          gatewayIp = shortenIPv6(gatewayFormatted);
        } catch (error) {
          console.warn('[UIController] Erro ao calcular gateway do bloco principal:', error);
        }
      }
      
      // Atualizar elementos da sidebar com versões encurtadas
      const sidebarBlockCidr = getElement('sidebarBlockCidr');
      const mainBlockGateway = getElement('mainBlockGateway');
      
      if (sidebarBlockCidr) {
        sidebarBlockCidr.textContent = `${shortMainNetwork}/${mainBlock.prefix}`;
      }
      
      if (mainBlockGateway) {
        mainBlockGateway.textContent = gatewayIp;
      }
      
      // Restaurar título da sidebar
      const sidebarTitle = document.querySelector('#infoSidebar h3');
      if (sidebarTitle) {
        sidebarTitle.innerHTML = '<i class="fas fa-info-circle"></i> Informações do Bloco';
        sidebarTitle.style.color = '';
      }
      
      // Limpar seleção individual
      selectedIndividualBlock = null;
      
      console.log('[UIController] Sidebar restaurada para bloco principal (versão encurtada)');
      
    } catch (error) {
      console.error('[UIController] Erro ao restaurar sidebar:', error);
    }
  }
  
  /**
   * Carrega mais sub-redes na tabela
   */
  function carregarMaisSubRedes(startIndex, limit) {
    try {
      if (!window.appState || !window.appState.subRedesGeradas) {
        console.error('[UIController] Estado da aplicação não inicializado');
        return;
      }
      
      const tbody = document.querySelector('#subnetsTable tbody');
      if (!tbody) {
        console.error('[UIController] Tabela de sub-redes não encontrada');
        return;
      }
      
      const endIndex = Math.min(startIndex + limit, window.appState.subRedesGeradas.length);
      const fragment = document.createDocumentFragment();
      
      for (let i = startIndex; i < endIndex; i++) {
        const subnet = window.appState.subRedesGeradas[i];
        
        if (!subnet || !subnet.subnet || !subnet.initial || !subnet.final || !subnet.network) {
          console.warn(`[UIController] Sub-rede inválida no índice ${i}:`, subnet);
          continue;
        }
        
        const row = document.createElement('tr');
        row.dataset.index = i; // Adicionar índice para identificação
        
        // Função para encurtar IPv6 se disponível
        const shortenIPv6 = window.IPv6Utils && window.IPv6Utils.shortenIPv6 
          ? window.IPv6Utils.shortenIPv6 
          : (addr) => addr;
        
        row.innerHTML = `
          <td>
            <input type="checkbox" value="${i}" aria-label="Selecionar sub-rede ${shortenIPv6(subnet.subnet)}">
          </td>
          <td>${shortenIPv6(subnet.subnet)}</td>
          <td>${shortenIPv6(subnet.initial)}</td>
          <td>${shortenIPv6(subnet.final)}</td>
          <td>${shortenIPv6(subnet.network)}</td>
        `;
        
        // Configurar checkbox
        const checkbox = row.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function() {
          row.classList.toggle('selected', this.checked);
          
          // Habilitar/desabilitar botão de gerar IPs
          updateGenerateIPsButton();
          
          // Atualizar agregação
          updateAggregationDisplay();
        });
        
        // Adicionar evento de clique na linha para seleção individual
        row.addEventListener('click', function(e) {
          console.log('[UIController] Clique na linha detectado:', e.target);
          
          // Não processar se o clique foi no checkbox ou em um botão
          if (e.target.type === 'checkbox' || e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            console.log('[UIController] Clique ignorado - checkbox ou botão');
            return;
          }
          
          e.preventDefault();
          e.stopPropagation();
          
          // Remover seleção anterior de linha individual
          const previousSelected = tbody.querySelector('tr.individual-selected');
          if (previousSelected) {
            previousSelected.classList.remove('individual-selected');
            console.log('[UIController] Seleção anterior removida');
          }
          
          // Adicionar seleção atual
          this.classList.add('individual-selected');
          console.log('[UIController] Nova linha selecionada:', this.dataset.index);
          
          // CORREÇÃO: Garantir que a linha permaneça visível
          setTimeout(() => {
            // Scroll suave para manter a linha visível sem deslocamento brusco
            this.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center', // Centralizar na viewport
              inline: 'nearest' 
            });
          }, 100); // Pequeno delay para permitir que o CSS seja aplicado
          
          // Atualizar sidebar com informações deste bloco
          const blockIndex = parseInt(this.dataset.index);
          const blockData = window.appState.subRedesGeradas[blockIndex];
          
          console.log('[UIController] Dados do bloco:', blockData);
          
          if (blockData) {
            // Preparar dados do bloco para a sidebar
            const [network, prefixStr] = blockData.subnet.split('/');
            const blockInfo = {
              network: blockData.network,
              prefix: parseInt(prefixStr),
              subnet: blockData.subnet,
              initial: blockData.initial,
              final: blockData.final,
              index: blockIndex
            };
            
            console.log('[UIController] Atualizando sidebar com:', blockInfo);
            updateSidebarWithBlock(blockInfo);
            
            // Mostrar notificação de sucesso com versão encurtada
            if (window.showNotification) {
              // Usar a função shortenIPv6 se disponível, senão usar o subnet já encurtado da tabela
              const shortenIPv6 = window.IPv6Utils && window.IPv6Utils.shortenIPv6 
                ? window.IPv6Utils.shortenIPv6 
                : (addr) => addr;
              
              // Obter versão encurtada do subnet
              const [subnetNetwork, subnetPrefix] = blockData.subnet.split('/');
              const shortSubnet = `${shortenIPv6(subnetNetwork)}/${subnetPrefix}`;
              
              window.showNotification(`Bloco ${shortSubnet} selecionado`, 'success');
            }
          } else {
            console.error('[UIController] Dados do bloco não encontrados para índice:', blockIndex);
          }
        });
        
        fragment.appendChild(row);
      }
      
      // Adicionar todas as linhas de uma vez
      tbody.appendChild(fragment);
      
      // Atualizar estado
      window.appState.subRedesExibidas = endIndex;
      
      // Atualizar controles
      const loadMoreContainer = getElement('loadMoreContainer');
      if (loadMoreContainer) {
        const shouldShow = window.appState.subRedesExibidas < window.appState.subRedesGeradas.length;
        loadMoreContainer.style.display = shouldShow ? 'block' : 'none';
      }
      
    } catch (error) {
      console.error('[UIController] Erro em carregarMaisSubRedes:', error);
    }
  }
  
  /**
   * Atualiza a visibilidade do botão de gerar IPs
   */
  function updateGenerateIPsButton() {
    try {
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      const generateBtn = getElement('gerarIPsButton');
      
      if (generateBtn) {
        generateBtn.style.display = checkboxes.length === 1 ? 'inline-block' : 'none';
      }
    } catch (error) {
      console.error('[UIController] Erro em updateGenerateIPsButton:', error);
    }
  }
  
  /**
   * Obtém os blocos selecionados
   */
  function getSelectedBlocks() {
    try {
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
      const selectedIndices = Array.from(checkboxes).map(checkbox => parseInt(checkbox.value));
      
      if (!window.appState || !window.appState.subRedesGeradas) {
        return [];
      }
      
      return selectedIndices.map(index => {
        const subnet = window.appState.subRedesGeradas[index];
        if (!subnet) return null;
        
        const [network, prefixStr] = subnet.subnet.split('/');
        return {
          network: network,
          prefix: parseInt(prefixStr),
          subnet: subnet.subnet,
          index: index
        };
      }).filter(block => block !== null);
      
    } catch (error) {
      console.error('[UIController] Erro ao obter blocos selecionados:', error);
      return [];
    }
  }
  
  /**
   * Atualiza a exibição da agregação na sidebar
   */
  function updateAggregationDisplay() {
    try {
      if (!window.IPv6Utils || !window.IPv6Utils.canAggregateBlocks) {
        return;
      }
      
      const selectedBlocks = getSelectedBlocks();
      const sidebar = getElement('infoSidebar');
      
      if (!sidebar) {
        return;
      }
      
      // Remover seção de agregação anterior
      const existingAggregation = sidebar.querySelector('.aggregation-section');
      if (existingAggregation) {
        existingAggregation.remove();
      }
      
      if (selectedBlocks.length < 2) {
        currentAggregation = null;
        
        // Se não há seleção múltipla, restaurar sidebar para o bloco individual ou principal
        if (selectedBlocks.length === 0) {
          // Nenhum bloco selecionado - verificar se há seleção individual
          const individualSelected = document.querySelector('#subnetsTable tbody tr.individual-selected');
          if (individualSelected) {
            // Manter a seleção individual atual
            return;
          } else {
            // Restaurar para bloco principal
            restoreSidebarToMainBlock();
          }
        }
        return;
      }
      
      // Verificar agregação
      const aggregationResult = window.IPv6Utils.canAggregateBlocks(selectedBlocks);
      
      // Criar seção de agregação
      const aggregationSection = document.createElement('div');
      aggregationSection.className = 'aggregation-section';
      aggregationSection.style.marginTop = '20px';
      aggregationSection.style.paddingTop = '20px';
      aggregationSection.style.borderTop = '1px solid var(--border-light)';
      
      if (aggregationResult.canAggregate) {
        currentAggregation = aggregationResult.aggregatedBlock;
        aggregationIpOffset = 0;
        
        // Calcular gateway agregado
        const aggregatedNetworkBigInt = window.IPv6Utils.ipv6ToBigInt(currentAggregation.network);
        const gatewayBigInt = aggregatedNetworkBigInt + 1n;
        const gatewayFormatted = window.IPv6Utils.shortenIPv6(window.IPv6Utils.formatIPv6Address(gatewayBigInt));
        
        aggregationSection.innerHTML = `
          <h4><i class="fas fa-layer-group"></i> Bloco Agregado</h4>
          
          <div class="info-item">
            <span class="info-label">CIDR Agregado:</span>
            <div class="info-value-container">
              <div class="info-value">${currentAggregation.subnet}</div>
              <button class="copy-btn" onclick="copyToClipboard('${currentAggregation.subnet}')" title="Copiar CIDR">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          
          <div class="info-item">
            <span class="info-label">Rede:</span>
            <div class="info-value-container">
              <div class="info-value">${currentAggregation.network}</div>
              <button class="copy-btn" onclick="copyToClipboard('${currentAggregation.network}')" title="Copiar Rede">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          
          <div class="info-item">
            <span class="info-label">Gateway:</span>
            <div class="info-value-container">
              <div class="info-value">${gatewayFormatted}</div>
              <button class="copy-btn" onclick="copyToClipboard('${gatewayFormatted}')" title="Copiar Gateway">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          
          <div class="info-item">
            <span class="info-label">Blocos Originais:</span>
            <div class="info-desc">${currentAggregation.blockCount} blocos /${selectedBlocks[0].prefix}</div>
          </div>
          
          <div class="action-buttons" style="margin-top: 16px;">
            <button id="toggleAggregatedIpsBtn" class="btn-primary">
              <i class="fas fa-list"></i> Exibir IPs
            </button>
          </div>
          
          <div id="aggregatedIpsContainer" style="display: none; margin-top: 16px;">
            <h4>IPs do Bloco Agregado:</h4>
            <ul id="aggregatedIpsList" class="ip-list"></ul>
            <div class="action-buttons">
              <button id="moreAggregatedIpsBtn" class="btn-primary">
                <i class="fas fa-plus"></i> Gerar Mais 50 IPs
              </button>
              <button id="resetAggregatedIpsBtn" class="btn-secondary">
                <i class="fas fa-redo-alt"></i> Resetar Lista
              </button>
            </div>
          </div>
        `;
        
      } else {
        currentAggregation = null;
        
        aggregationSection.innerHTML = `
          <h4><i class="fas fa-exclamation-triangle"></i> Agregação</h4>
          <div class="aggregation-warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-message">
              <strong>Blocos não podem ser agregados:</strong><br>
              ${aggregationResult.reason}
            </div>
          </div>
        `;
      }
      
      // Adicionar ao final da sidebar
      sidebar.appendChild(aggregationSection);
      
      // Configurar event listeners para botões de agregação
      setupAggregationEventListeners();
      
    } catch (error) {
      console.error('[UIController] Erro ao atualizar exibição de agregação:', error);
    }
  }
  
  /**
   * Configura event listeners para funcionalidades de agregação
   */
  function setupAggregationEventListeners() {
    try {
      const toggleBtn = getElement('toggleAggregatedIpsBtn');
      const moreBtn = getElement('moreAggregatedIpsBtn');
      const resetBtn = getElement('resetAggregatedIpsBtn');
      
      if (toggleBtn && !toggleBtn.hasAttribute('data-aggregation-ready')) {
        toggleBtn.addEventListener('click', toggleAggregatedIps);
        toggleBtn.setAttribute('data-aggregation-ready', 'true');
      }
      
      if (moreBtn && !moreBtn.hasAttribute('data-aggregation-ready')) {
        moreBtn.addEventListener('click', generateMoreAggregatedIps);
        moreBtn.setAttribute('data-aggregation-ready', 'true');
      }
      
      if (resetBtn && !resetBtn.hasAttribute('data-aggregation-ready')) {
        resetBtn.addEventListener('click', resetAggregatedIps);
        resetBtn.setAttribute('data-aggregation-ready', 'true');
      }
      
    } catch (error) {
      console.error('[UIController] Erro ao configurar eventos de agregação:', error);
    }
  }
  
  /**
   * Alterna a exibição dos IPs do bloco agregado
   */
  function toggleAggregatedIps() {
    try {
      if (!currentAggregation) {
        return;
      }
      
      const container = getElement('aggregatedIpsContainer');
      const toggleBtn = getElement('toggleAggregatedIpsBtn');
      
      if (!container || !toggleBtn) {
        return;
      }
      
      if (container.style.display === 'none') {
        container.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-times"></i> Fechar IPs';
        
        // Gerar IPs se a lista estiver vazia
        const ipsList = getElement('aggregatedIpsList');
        if (ipsList && ipsList.innerHTML === '') {
          generateAggregatedIps();
        }
      } else {
        container.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> Exibir IPs';
      }
      
    } catch (error) {
      console.error('[UIController] Erro ao alternar IPs agregados:', error);
    }
  }
  
  /**
   * Gera IPs do bloco agregado
   */
  function generateAggregatedIps() {
    try {
      if (!currentAggregation || !window.IPv6Utils) {
        return;
      }
      
      const toggleBtn = getElement('toggleAggregatedIpsBtn');
      if (toggleBtn) {
        toggleBtn.disabled = true;
        toggleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
      }
      
      const networkBigInt = window.IPv6Utils.ipv6ToBigInt(currentAggregation.network);
      const ipsList = getElement('aggregatedIpsList');
      
      if (!ipsList) {
        return;
      }
      
      ipsList.innerHTML = '';
      aggregationIpOffset = 0;
      
      for (let i = 0; i < 50; i++) {
        const ipBigInt = networkBigInt + BigInt(i);
        const ipFormatted = window.IPv6Utils.formatIPv6Address(ipBigInt);
        const ipShort = window.IPv6Utils.shortenIPv6(ipFormatted);
        
        appendIpToList(ipShort, i + 1, 'aggregatedIpsList');
      }
      
      aggregationIpOffset = 50;
      
      if (toggleBtn) {
        toggleBtn.disabled = false;
        toggleBtn.innerHTML = '<i class="fas fa-times"></i> Fechar IPs';
      }
      
    } catch (error) {
      console.error('[UIController] Erro ao gerar IPs agregados:', error);
      const toggleBtn = getElement('toggleAggregatedIpsBtn');
      if (toggleBtn) {
        toggleBtn.disabled = false;
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> Exibir IPs';
      }
    }
  }
  
  /**
   * Gera mais IPs do bloco agregado
   */
  function generateMoreAggregatedIps() {
    try {
      if (!currentAggregation || !window.IPv6Utils) {
        return;
      }
      
      const btn = getElement('moreAggregatedIpsBtn');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
      }
      
      const networkBigInt = window.IPv6Utils.ipv6ToBigInt(currentAggregation.network);
      const inicio = aggregationIpOffset;
      const fim = inicio + 50;
      
      for (let i = inicio; i < fim; i++) {
        const ipBigInt = networkBigInt + BigInt(i);
        const ipFormatted = window.IPv6Utils.formatIPv6Address(ipBigInt);
        const ipShort = window.IPv6Utils.shortenIPv6(ipFormatted);
        
        appendIpToList(ipShort, i + 1, 'aggregatedIpsList');
      }
      
      aggregationIpOffset = fim;
      
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
      }
      
    } catch (error) {
      console.error('[UIController] Erro ao gerar mais IPs agregados:', error);
      const btn = getElement('moreAggregatedIpsBtn');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-plus"></i> Gerar Mais 50 IPs';
      }
    }
  }
  
  /**
   * Reseta a lista de IPs agregados
   */
  function resetAggregatedIps() {
    try {
      aggregationIpOffset = 0;
      
      const ipsList = getElement('aggregatedIpsList');
      if (ipsList) {
        ipsList.innerHTML = '';
      }
      
    } catch (error) {
      console.error('[UIController] Erro ao resetar IPs agregados:', error);
    }
  }
  
  /**
   * Seleciona/desmarca todas as sub-redes
   */
  function toggleSelectAll() {
    try {
      const selectAll = getElement('selectAll');
      if (!selectAll) {
        console.warn('[UIController] Checkbox "selectAll" não encontrado');
        return;
      }
      
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]');
      const isChecked = selectAll.checked;
      
      checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        
        // Atualizar linha visualmente
        const row = checkbox.closest('tr');
        if (row) {
          row.classList.toggle('selected', isChecked);
        }
      });
      
      // Limpar seleção individual se estiver selecionando tudo
      if (isChecked) {
        const individualSelected = document.querySelector('#subnetsTable tbody tr.individual-selected');
        if (individualSelected) {
          individualSelected.classList.remove('individual-selected');
        }
        selectedIndividualBlock = null;
        
        // Restaurar sidebar para bloco principal quando selecionar tudo
        restoreSidebarToMainBlock();
      }
      
      // Atualizar botão de gerar IPs
      updateGenerateIPsButton();
      
      // Atualizar agregação
      updateAggregationDisplay();
      
    } catch (error) {
      console.error('[UIController] Erro em toggleSelectAll:', error);
    }
  }
  
  /**
   * Utilitários de navegação
   */
  const navigation = {
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    scrollToBottom() {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };
  
  /**
   * Configuração de event listeners
   */
  function setupEventListeners() {
    console.log('[UIController] Configurando event listeners...');
    
    // Botão de tema
    const themeBtn = getElement('toggleThemeBtn');
    if (themeBtn && !themeBtn.hasAttribute('data-ui-ready')) {
      themeBtn.addEventListener('click', themeManager.toggle);
      themeBtn.setAttribute('data-ui-ready', 'true');
    }
    
    // Navegação
    const topBtn = getElement('topBtn');
    const bottomBtn = getElement('bottomBtn');
    
    if (topBtn && !topBtn.hasAttribute('data-ui-ready')) {
      topBtn.addEventListener('click', navigation.scrollToTop);
      topBtn.setAttribute('data-ui-ready', 'true');
    }
    
    if (bottomBtn && !bottomBtn.hasAttribute('data-ui-ready')) {
      bottomBtn.addEventListener('click', navigation.scrollToBottom);
      bottomBtn.setAttribute('data-ui-ready', 'true');
    }
    
    // Checkbox "Selecionar Todos"
    const selectAll = getElement('selectAll');
    if (selectAll && !selectAll.hasAttribute('data-ui-ready')) {
      selectAll.addEventListener('change', toggleSelectAll);
      selectAll.setAttribute('data-ui-ready', 'true');
    }
    
    // Botão "Carregar Mais"
    const loadMoreBtn = getElement('loadMoreButton');
    if (loadMoreBtn && !loadMoreBtn.hasAttribute('data-ui-ready')) {
      loadMoreBtn.addEventListener('click', () => {
        carregarMaisSubRedes(window.appState.subRedesExibidas || 0, 100);
      });
      loadMoreBtn.setAttribute('data-ui-ready', 'true');
    }
    
    // Responsividade
    window.addEventListener('resize', () => {
      const isMobile = window.innerWidth <= 768;
      document.body.classList.toggle('mobile-device', isMobile);
    });
  }
  
  /**
   * Limpa todas as seleções e restaura estado inicial da sidebar
   */
  function clearAllSelections() {
    try {
      // Limpar seleções de checkbox
      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        const row = checkbox.closest('tr');
        if (row) {
          row.classList.remove('selected');
        }
      });
      
      // Limpar seleção individual
      const individualSelected = document.querySelector('#subnetsTable tbody tr.individual-selected');
      if (individualSelected) {
        individualSelected.classList.remove('individual-selected');
      }
      
      // Limpar checkbox "Selecionar Todos"
      const selectAll = getElement('selectAll');
      if (selectAll) {
        selectAll.checked = false;
      }
      
      // Restaurar sidebar para bloco principal
      restoreSidebarToMainBlock();
      
      // Atualizar controles
      updateGenerateIPsButton();
      updateAggregationDisplay();
      
      console.log('[UIController] Todas as seleções foram limpas');
      
    } catch (error) {
      console.error('[UIController] Erro ao limpar seleções:', error);
    }
  }
  
  /**
   * Inicialização do módulo
   */
  function initialize() {
    if (initialized) {
      console.log('[UIController] Já inicializado, ignorando chamada dupla');
      return;
    }
    
    console.log('[UIController] Inicializando UI Controller...');
    
    try {
      // Configurar sistema de temas
      themeManager.loadPreference();
      
      // Configurar layout responsivo
      const isMobile = window.innerWidth <= 768;
      document.body.classList.toggle('mobile-device', isMobile);
      
      // Configurar eventos
      setupEventListeners();
      
      // Marcar como inicializado
      initialized = true;
      
      console.log('[UIController] UI Controller inicializado com sucesso');
      
    } catch (error) {
      console.error('[UIController] Erro na inicialização:', error);
    }
  }
  
  // API pública
  const publicAPI = {
    // Funções principais
    updateStep,
    appendIpToList,
    carregarMaisSubRedes,
    toggleSelectAll,
    updateGenerateIPsButton,
    clearAllSelections,
    
    // Funções de seleção individual
    updateSidebarWithBlock,
    restoreSidebarToMainBlock,
    
    // Funções de agregação
    updateAggregationDisplay,
    getSelectedBlocks,
    toggleAggregatedIps,
    generateAggregatedIps,
    generateMoreAggregatedIps,
    resetAggregatedIps,
    
    // Sistemas especializados
    theme: themeManager,
    navigation,
    
    // Utilitários
    getElement,
    
    // Informações de estado
    isInitialized: () => initialized,
    getSelectedIndividualBlock: () => selectedIndividualBlock
  };
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 100);
  }
  
  return publicAPI;
})();

// Exportar globalmente
window.UIController = UIController;