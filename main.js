/**
 * Código principal da Calculadora de Sub-Redes IPv6
 * 
 * Este arquivo contém as funções principais para manipulação de redes IPv6
 * e gerenciamento do estado da aplicação.
 */

// Adicionar logging de inicialização para debugging
console.log("Inicializando main.js...");

// Estado global da aplicação
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

// Função para calcular sub-redes
function calcularSubRedes() {
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
}

// Função para resetar a calculadora
function resetarCalculadora() {
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
}

// Função para alternar IPs do bloco principal
function toggleMainBlockIps() {
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
}

// Função para mostrar sugestões de divisão
function mostrarSugestoesDivisao() {
  console.log("Mostrando sugestões de divisão");
  document.getElementById('suggestions').style.display = 'block';
  document.getElementById('suggestions').scrollIntoView({ behavior: 'smooth' });
}

// Função para gerar IPs do bloco principal
function gerarIPsDoBloco() {
  console.log("Gerando IPs do bloco principal");
  if (!window.appState.mainBlock) return;
  document.getElementById('toggleMainBlockIpsBtn').disabled = true;
  document.getElementById('toggleMainBlockIpsBtn').innerHTML = '<span class="btn-icon">⌛</span> Gerando...';
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
      document.getElementById('toggleMainBlockIpsBtn').disabled = false;
      document.getElementById('toggleMainBlockIpsBtn').innerHTML = '<span class="btn-icon">⊖</span> Fechar IPs';
    }
  }
  processarLote();
}

// Função para gerar mais IPs do bloco principal
function gerarMaisIPsDoBloco() {
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
}

// Função para resetar IPs do bloco principal
function resetarIPsMainBlock() {
  console.log("Resetando IPs do bloco principal");
  window.appState.mainBlockCurrentOffset = 0;
  document.getElementById('mainBlockIpsList').innerHTML = '';
  document.getElementById('moreMainBlockIpsBtn').disabled = false;
  document.getElementById('moreMainBlockIpsBtn').innerHTML = '<span class="btn-icon">⊕</span> Gerar Mais 50 IPs';
}

// Função para gerar primeiros IPs
function gerarPrimeirosIPs() {
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
}

// Função para gerar mais IPs
function gerarMaisIPs() {
  console.log("Gerando mais IPs");
  if (!window.appState.selectedBlock) return;
  let redeCompleta = window.appState.selectedBlock.network;
  let redeHex = redeCompleta.replace(/:/g, '');
  let redeBigInt = BigInt("0x" + redeHex);
  let inicio = window.appState.currentIpOffset;
  let fim = inicio + 50;
  
  // Desabilitar o botão enquanto processa
  document.getElementById('gerarMaisIPsButton').disabled = true;
  
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
      document.getElementById('gerarMaisIPsButton').disabled = false;
    }
  }
  processarLote();
}

// Função para resetar IPs gerados
function resetarIPsGerados() {
  console.log("Resetando IPs gerados");
  window.appState.currentIpOffset = 0;
  document.getElementById('ipsList').innerHTML = '';
  document.getElementById('gerarIPsButton').style.display = 'none';
  document.getElementById('ipsResult').style.display = 'none';
}

// Função para selecionar prefixo
function selecionarPrefixo(prefix) {
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
