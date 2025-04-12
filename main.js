/**
 * Código principal da Calculadora de Sub-Redes IPv6
 */

// Estado da aplicação
const appState = {
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

/**
 * Funções de gerenciamento de sub-redes e IPs
 */

// Função para gerar primeiros IPs
function gerarPrimeirosIPs() {
  let checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');
  if (checkboxes.length !== 1) {
    alert("Selecione exatamente um bloco para gerar os IPs.");
    return;
  }
  
  // Resetar a lista de IPs
  resetarIPsGerados();
  
  let indice = parseInt(checkboxes[0].value);
  appState.selectedBlock = appState.subRedesGeradas[indice];
  appState.currentIpOffset = 0;
  let redeCompleta = appState.selectedBlock.network;
  let redeHex = redeCompleta.replace(/:/g, '');
  let redeBigInt = BigInt("0x" + redeHex);
  let ipsList = document.getElementById('ipsList');
  ipsList.innerHTML = "";
  for (let i = 0; i < 50; i++) {
    let ipBigInt = redeBigInt + BigInt(i);
    let ipFormatado = utils.formatIPv6Address(ipBigInt);
    let ipEnd = utils.shortenIPv6(ipFormatado);
    ui.appendIpToList(ipEnd, i + 1, 'ipsList');
  }
  appState.currentIpOffset = 50;
  document.getElementById('ipsResult').style.display = 'block';
  document.getElementById('gerarMaisIPsButton').style.display = 'block';
}

// Função para gerar mais IPs
function gerarMaisIPs() {
  if (!appState.selectedBlock) return;
  let redeCompleta = appState.selectedBlock.network;
  let redeHex = redeCompleta.replace(/:/g, '');
  let redeBigInt = BigInt("0x" + redeHex);
  let inicio = appState.currentIpOffset;
  let fim = inicio + 50;
  
  // Desabilitar o botão enquanto processa
  document.getElementById('gerarMaisIPsButton').disabled = true;
  
  function processarLote() {
    let limite = Math.min(appState.currentIpOffset + 10, fim);
    for (let i = appState.currentIpOffset; i < limite; i++) {
      let ipBigInt = redeBigInt + BigInt(i);
      let ipFormatado = utils.formatIPv6Address(ipBigInt);
      let ipEnd = utils.shortenIPv6(ipFormatado);
      ui.appendIpToList(ipEnd, i + 1, 'ipsList');
    }
    appState.currentIpOffset = limite;
    if (appState.currentIpOffset < fim) {
      setTimeout(processarLote, 0);
    } else {
      document.getElementById('gerarMaisIPsButton').disabled = false;
    }
  }
  processarLote();
}

// Função para gerar IPs do bloco principal
function gerarIPsDoBloco() {
  if (!appState.mainBlock) return;
  document.getElementById('toggleMainBlockIpsBtn').disabled = true;
  document.getElementById('toggleMainBlockIpsBtn').innerHTML = '<span class="btn-icon">⌛</span> Gerando...';
  let redeCompleta = appState.mainBlock.network;
  let redeHex = redeCompleta.replace(/:/g, '');
  let redeBigInt = BigInt("0x" + redeHex);
  let ipsList = document.getElementById('mainBlockIpsList');
  ipsList.innerHTML = "";
  appState.mainBlockCurrentOffset = 0;
  
  function processarLote() {
    let limite = Math.min(appState.mainBlockCurrentOffset + 10, 50);
    for (let i = appState.mainBlockCurrentOffset; i < limite; i++) {
      let ipBigInt = redeBigInt + BigInt(i);
      let ipFormatado = utils.formatIPv6Address(ipBigInt);
      let ipEnd = utils.shortenIPv6(ipFormatado);
      ui.appendIpToList(ipEnd, i + 1, 'mainBlockIpsList');
    }
    appState.mainBlockCurrentOffset = limite;
    if (appState.mainBlockCurrentOffset < 50) {
      setTimeout(processarLote, 0);
    } else {
      document.getElementById('toggleMainBlockIpsBtn').disabled = false;
      document.getElementById('toggleMainBlockIpsBtn').innerHTML = '<span class="btn-icon">⊖</span> Fechar IPs';
    }
  }
  processarLote();
}

// Função para gerar mais IPs do bloco principal
function gerarMaisIPsDoBloco() {
  if (!appState.mainBlock) return;
  const btn = document.getElementById('moreMainBlockIpsBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-icon">⌛</span> Gerando...';
  let redeCompleta = appState.mainBlock.network;
  let redeHex = redeCompleta.replace(/:/g, '');
  let redeBigInt = BigInt("0x" + redeHex);
  let inicio = appState.mainBlockCurrentOffset;
  let fim = inicio + 50;
  
  function processarLote() {
    let limite = Math.min(appState.mainBlockCurrentOffset + 10, fim);
    for (let i = appState.mainBlockCurrentOffset; i < limite; i++) {
      let ipBigInt = redeBigInt + BigInt(i);
      let ipFormatado = utils.formatIPv6Address(ipBigInt);
      let ipEnd = utils.shortenIPv6(ipFormatado);
      ui.appendIpToList(ipEnd, i + 1, 'mainBlockIpsList');
    }
    appState.mainBlockCurrentOffset = limite;
    if (appState.mainBlockCurrentOffset < fim) {
      setTimeout(processarLote, 0);
    } else {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">⊕</span> Gerar Mais 50 IPs';
    }
  }
  processarLote();
}

// Função para alternar IPs do bloco principal
function toggleMainBlockIps() {
  const ipsContainer = document.getElementById('mainBlockIpsContainer');
  const toggleBtn = document.getElementById('toggleMainBlockIpsBtn');
  if (appState.isMainBlockIpsVisible) {
    ipsContainer.style.display = 'none';
    toggleBtn.innerHTML = '<span class="btn-icon">⊕</span> Exibir IPs';
    appState.isMainBlockIpsVisible = false;
  } else {
    ipsContainer.style.display = 'block';
    toggleBtn.innerHTML = '<span class="btn-icon">⊖</span> Fechar IPs';
    appState.isMainBlockIpsVisible = true;
    if (document.getElementById('mainBlockIpsList').innerHTML === '') {
      gerarIPsDoBloco();
    }
  }
}

// Função para mostrar sugestões de divisão
function mostrarSugestoesDivisao() {
  document.getElementById('suggestions').style.display = 'block';
  document.getElementById('suggestions').scrollIntoView({ behavior: 'smooth' });
}

// Função para resetar IPs gerados
function resetarIPsGerados() {
  appState.currentIpOffset = 0;
  document.getElementById('ipsList').innerHTML = '';
  document.getElementById('gerarIPsButton').style.display = 'none';
  document.getElementById('ipsResult').style.display = 'none';
}

// Função para resetar IPs do bloco principal
function resetarIPsMainBlock() {
  appState.mainBlockCurrentOffset = 0;
  document.getElementById('mainBlockIpsList').innerHTML = '';
  document.getElementById('moreMainBlockIpsBtn').disabled = false;
  document.getElementById('moreMainBlockIpsBtn').innerHTML = '<span class="btn-icon">⊕</span> Gerar Mais 50 IPs';
}

// Função para selecionar prefixo
function selecionarPrefixo(prefix) {
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
  let enderecoCompleto = utils.expandIPv6Address(ipv6Input);
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
  appState.subRedesGeradas = [];
  appState.subRedesExibidas = 0;
  document.getElementById('subnetsTable').getElementsByTagName('tbody')[0].innerHTML = "";
  appState.totalSubRedesGerar = Number(numSubRedes);
  setTimeout(() => {
    utils.gerarSubRedesAssincronamente(ipv6BigInt, initialMask, prefix, numSubRedes, () => {
      ui.carregarMaisSubRedes();
      document.getElementById('loadMoreContainer').style.display = appState.subRedesGeradas.length > 100 ? 'block' : 'none';
      document.getElementById('resultado').style.display = 'block';
      document.getElementById('mainBlockSection').style.display = 'none';
      document.getElementById('aggregatedSidebar').style.display = 'none';
      document.getElementById('aggregatedPrefix').innerText = "N/A";
      ui.ajustarLayoutResponsive();
    }, appState);
  }, 50);
}

// Função para calcular sub-redes
function calcularSubRedes() {
  // Limpeza do estado anterior
  appState.subRedesGeradas = [];
  appState.subRedesExibidas = 0;
  appState.selectedBlock = null;
  appState.currentIpOffset = 0;
  document.getElementById('resultado').style.display = 'none';
  document.getElementById('ipsResult').style.display = 'none';
  document.getElementById('ipsList').innerHTML = '';
  
  let ipv6Input = document.getElementById('ipv6').value.trim();
  let errorMessage = utils.validateIPv6(ipv6Input);
  document.getElementById('errorMessage').style.display = 'none';
  
  if (errorMessage) {
    document.getElementById('errorMessage').innerText = errorMessage;
    document.getElementById('errorMessage').style.display = 'block';
    return;
  }
  
  let [endereco, prefixoInicial] = ipv6Input.split('/');
  prefixoInicial = parseInt(prefixoInicial);
  let enderecoCompleto = utils.expandIPv6Address(ipv6Input);
  
  // Configurar o bloco principal
  let enderecoFormatado = utils.shortenIPv6(enderecoCompleto);
  document.getElementById('mainBlockCidr').innerText = `${enderecoFormatado}/${prefixoInicial}`;
  appState.mainBlock = {
    network: enderecoCompleto,
    prefix: prefixoInicial
  };
  
  // Calcular o gateway
  let redeHex = enderecoCompleto.replace(/:/g, '');
  let redeBigInt = BigInt("0x" + redeHex);
  let gatewayIpBigInt = redeBigInt + 1n; 
  let gatewayIpFormatado = utils.formatIPv6Address(gatewayIpBigInt);
  let gatewayIpShort = utils.shortenIPv6(gatewayIpFormatado);
  
  document.getElementById('mainBlockGateway').innerText = gatewayIpShort;
  
  appState.mainBlockCurrentOffset = 0;
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
  ui.ajustarLayoutResponsive();
}

// Função para resetar a calculadora
function resetarCalculadora() {
  document.getElementById('ipv6').value = '';
  document.getElementById('mainBlockSection').style.display = 'none';
  document.getElementById('suggestions').style.display = 'none';
  document.getElementById('resultado').style.display = 'none';
  document.getElementById('aggregatedSidebar').style.display = 'none';
  document.getElementById('infoSidebar').style.display = 'none';
  document.getElementById('loadingIndicator').style.display = 'none';
  document.getElementById('errorMessage').style.display = 'none';
  
  // Reiniciar variáveis
  appState.subRedesGeradas = [];
  appState.subRedesExibidas = 0;
  appState.totalSubRedesGerar = 0;
  appState.selectedBlock = null;
  appState.currentIpOffset = 0;
  appState.mainBlock = null;
  appState.mainBlockCurrentOffset = 0;
  appState.isMainBlockIpsVisible = false;
  
  // Limpar listas de IPs
  document.getElementById('ipsList').innerHTML = '';
  document.getElementById('mainBlockIpsList').innerHTML = '';
  
  // Focar no campo de entrada
  document.getElementById('ipv6').focus();
}

/**
 * Inicialização da aplicação
 */
document.addEventListener('DOMContentLoaded', () => {
  // Associar funções aos elementos
  if (document.getElementById('calcularBtn')) {
    document.getElementById('calcularBtn').addEventListener('click', calcularSubRedes);
  }
  if (document.getElementById('resetBtn')) {
    document.getElementById('resetBtn').addEventListener('click', resetarCalculadora);
  }
  if (document.getElementById('toggleThemeButton')) {
    document.getElementById('toggleThemeButton').addEventListener('click', ui.toggleTheme);
  }
  if (document.getElementById('toggleMainBlockIpsBtn')) {
    document.getElementById('toggleMainBlockIpsBtn').addEventListener('click', toggleMainBlockIps);
  }
  if (document.getElementById('loadMoreButton')) {
    document.getElementById('loadMoreButton').addEventListener('click', function() {
      ui.carregarMaisSubRedes();
    });
  }
  if (document.getElementById('gerarIPsButton')) {
    document.getElementById('gerarIPsButton').addEventListener('click', gerarPrimeirosIPs);
  }
  if (document.getElementById('gerarMaisIPsButton')) {
    document.getElementById('gerarMaisIPsButton').addEventListener('click', gerarMaisIPs);
  }
  if (document.getElementById('resetIPsButton')) {
    document.getElementById('resetIPsButton').addEventListener('click', resetarIPsGerados);
  }
  if (document.getElementById('moreMainBlockIpsBtn')) {
    document.getElementById('moreMainBlockIpsBtn').addEventListener('click', gerarMaisIPsDoBloco);
  }
  if (document.getElementById('resetMainBlockIPsButton')) {
    document.getElementById('resetMainBlockIPsButton').addEventListener('click', resetarIPsMainBlock);
  }
  if (document.getElementById('continuarBtn')) {
    document.getElementById('continuarBtn').addEventListener('click', mostrarSugestoesDivisao);
  }
  if (document.getElementById('selectAll')) {
    document.getElementById('selectAll').addEventListener('change', ui.toggleSelectAll);
  }
  
  // Botões de navegação
  if (document.getElementById('topBtn')) {
    document.getElementById('topBtn').addEventListener('click', ui.scrollToTop);
  }
  if (document.getElementById('bottomBtn')) {
    document.getElementById('bottomBtn').addEventListener('click', ui.scrollToBottom);
  }
  
  // Detectar preferência de tema escuro do sistema
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    ui.toggleTheme();
  }
  
  // Inicializar otimizações móveis
  ui.initMobileOptimizations();
  
  // Adicionar listener para redimensionamento da janela
  window.addEventListener('resize', ui.ajustarLayoutResponsive);