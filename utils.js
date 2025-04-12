/**
 * Utilitários para manipulação de endereços IPv6
 */

console.log("Inicializando utils.js...");

// Função para validar IPv6 com prefixo
function isValidIPv6(addressCIDR) {
  console.log("Validando IPv6:", addressCIDR);
  let [addr, prefix] = addressCIDR.split('/');
  if (!prefix || isNaN(prefix)) return false;
  const prefixNum = parseInt(prefix);
  if (prefixNum < 1 || prefixNum > 128) return false;
  const regex = /^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$/;
  const expanded = expandIPv6Address(addressCIDR);
  if (expanded.startsWith("Erro")) return false;
  return regex.test(expanded);
}

// Função para validar e retornar mensagem de erro
function validateIPv6(addressCIDR) {
  console.log("Validando IPv6 com detalhes:", addressCIDR);
  const [addr, prefix] = addressCIDR.split('/');
  if (!addr || !prefix || isNaN(prefix)) {
    return "Por favor, insira um endereço IPv6 válido no formato CIDR (ex.: 2001:db8::/41).";
  }
  const prefixNum = parseInt(prefix);
  if (prefixNum < 1 || prefixNum > 128) {
    return "O prefixo inicial deve estar entre 1 e 128.";
  }
  const enderecoCompleto = expandIPv6Address(addressCIDR);
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
}

// Função para expandir IPv6
function expandIPv6Address(addressCIDR) {
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
}

// Função para encurtar IPv6
function shortenIPv6(address) {
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
}

// Função para formatar IPv6 como string hexadecimal
function formatIPv6Address(ipv6BigInt) {
  console.log("Formatando IPv6 BigInt:", ipv6BigInt.toString());
  let hexStr = ipv6BigInt.toString(16).padStart(32, '0');
  return hexStr.match(/.{1,4}/g).join(':');
}

// Função para calcular bloco agregado
function calcularBlocoAgregado(selectedSubnets) {
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
