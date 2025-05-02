/**
 * IPv6 Utilities Module
 * 
 * Este módulo contém funções utilitárias para manipulação de endereços IPv6.
 */

// Definir no escopo global explicitamente usando uma IIFE
window.IPv6Utils = (function() {
  'use strict';
  
  /**
   * Verifica se um endereço IPv6 com prefixo CIDR é válido
   * @param {string} addressCIDR - Endereço no formato CIDR (ex: 2001:db8::/41)
   * @returns {boolean} - Verdadeiro se o endereço for válido
   */
  function isValidIPv6(addressCIDR) {
    try {
      const [addr, prefix] = addressCIDR.split('/');
      if (!prefix || isNaN(prefix)) return false;
      
      const prefixNum = parseInt(prefix);
      if (prefixNum < 1 || prefixNum > 128) return false;
      
      const expanded = expandIPv6Address(addressCIDR);
      if (expanded.startsWith("Erro")) return false;
      
      const regex = /^([0-9a-fA-F]{1,4}:){7}([0-9a-fA-F]{1,4})$/;
      return regex.test(expanded);
    } catch (error) {
      console.error("Erro ao validar IPv6:", error);
      return false;
    }
  }
  
  /**
   * Valida um endereço IPv6 e retorna mensagem de erro se houver
   * @param {string} addressCIDR - Endereço no formato CIDR
   * @returns {string|null} - Mensagem de erro ou null se válido
   */
  function validateIPv6(addressCIDR) {
    try {
      if (!addressCIDR) {
        return "Por favor, insira um endereço IPv6 válido no formato CIDR (ex.: 2001:db8::/41).";
      }
      
      const parts = addressCIDR.split('/');
      if (parts.length !== 2) {
        return "Por favor, insira um endereço IPv6 válido no formato CIDR (ex.: 2001:db8::/41).";
      }
      
      const [addr, prefix] = parts;
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
      if (groups.length !== 8) {
        return "Endereço IPv6 deve conter exatamente 8 grupos.";
      }
      
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
  }
  
  /**
   * Expande um endereço IPv6 para formato completo
   * @param {string} addressCIDR - Endereço no formato CIDR
   * @returns {string} - Endereço expandido ou mensagem de erro
   */
  function expandIPv6Address(addressCIDR) {
    try {
      let [addr, prefix] = addressCIDR.split('/');
      if (!addr) return "Erro: Endereço inválido.";
      
      // Remover colchetes IPv6 literais se presentes (para compatibilidade com URLs)
      addr = addr.replace(/^\[|\]$/g, '');
      
      let parts = addr.split("::");
      if (parts.length > 2) {
        return "Erro: Não pode haver mais de um '::'.";
      }
      
      let head = parts[0] ? parts[0].split(':') : [];
      let tail = parts.length === 2 && parts[1] ? parts[1].split(':') : [];
      
      // Verificar número de grupos
      if (head.length + tail.length > 8) {
        return "Erro: Muitos grupos de hexadecimais.";
      }
      
      let missing = 8 - (head.length + tail.length);
      if (parts.length === 2 && missing < 0) {
        return "Erro: Muitos grupos de hexadecimais para notação '::'.";
      }
      
      let zeros = new Array(missing).fill("0000");
      let fullParts = head.concat(zeros).concat(tail);
      
      // Validar e padronizar cada grupo
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
  }
  
  /**
   * Encurta um endereço IPv6 usando a notação "::"
   * @param {string} address - Endereço IPv6 completo
   * @returns {string} - Endereço encurtado
   */
  function shortenIPv6(address) {
    try {
      if (!address || typeof address !== 'string') {
        console.warn("Endereço IPv6 inválido para encurtamento:", address);
        return address || "";
      }
      
      // Se o endereço já estiver na forma curta, retorná-lo como está
      if (address.includes('::')) {
        return address;
      }
      
      let groups = address.split(':').map(g => g.replace(/^0+/, '') || '0');
      
      // Se não tiver 8 grupos, retorna como está para evitar problemas
      if (groups.length !== 8) {
        return address;
      }
      
      let bestStart = -1, bestLen = 0;
      let curStart = -1, curLen = 0;
      
      // Encontrar a maior sequência de zeros
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
      
      // Verificar a última sequência
      if (curLen > bestLen) {
        bestLen = curLen;
        bestStart = curStart;
      }
      
      // Se a maior sequência é menor que 2, não vale a pena usar ::
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
      
      // Corrigir casos especiais
      result = result.replace(/^::/, '::');  // No início
      result = result.replace(/::$/, '::');  // No final
      result = result.replace(/:{3,}/, '::'); // No meio
      
      return result;
    } catch (error) {
      console.error("Erro ao encurtar IPv6:", error);
      return address; // Retorna o endereço original em caso de erro
    }
  }
  
  /**
   * Formata um BigInt em um endereço IPv6
   * @param {BigInt} ipv6BigInt - Número BigInt representando o endereço IPv6
   * @returns {string} - Endereço IPv6 formatado
   */
  function formatIPv6Address(ipv6BigInt) {
    try {
      if (typeof ipv6BigInt !== 'bigint') {
        console.error("Erro: formatIPv6Address requer um BigInt, recebeu:", typeof ipv6BigInt);
        return "0000:0000:0000:0000:0000:0000:0000:0000";
      }
      
      let hexStr = ipv6BigInt.toString(16).padStart(32, '0');
      return hexStr.match(/.{1,4}/g).join(':');
    } catch (error) {
      console.error("Erro ao formatar IPv6 BigInt:", error);
      return "0000:0000:0000:0000:0000:0000:0000:0000"; // Endereço zero em caso de erro
    }
  }
  
  /**
   * Verifica se há sobreposição entre dois prefixos IPv6
   * @param {string} prefix1 - Primeiro prefixo IPv6 com CIDR (ex: 2001:db8::/64)
   * @param {string} prefix2 - Segundo prefixo IPv6 com CIDR (ex: 2001:db8:1::/64)
   * @returns {boolean} - true se houver sobreposição, false caso contrário
   */
  function checkIPv6Overlap(prefix1, prefix2) {
    try {
      // Extrair endereço e prefixo
      const [addr1, cidr1] = prefix1.split('/');
      const [addr2, cidr2] = prefix2.split('/');
      
      // Expandir os endereços
      const expanded1 = expandIPv6Address(addr1).replace(/:/g, '');
      const expanded2 = expandIPv6Address(addr2).replace(/:/g, '');
      
      if (expanded1.startsWith('Erro') || expanded2.startsWith('Erro')) {
        console.error("Erro ao expandir endereços IPv6");
        return false;
      }
      
      // Converter para BigInt
      const bigInt1 = BigInt('0x' + expanded1);
      const bigInt2 = BigInt('0x' + expanded2);
      
      // Calcular máscaras
      const prefix1Value = parseInt(cidr1);
      const prefix2Value = parseInt(cidr2);
      
      // Usar o menor prefixo para determinar o tamanho do bloco
      const smallerPrefix = Math.min(prefix1Value, prefix2Value);
      
      // Criar máscara para o prefixo menor
      const mask = ((1n << BigInt(128 - smallerPrefix)) - 1n) ^ ((1n << BigInt(128)) - 1n);
      
      // Aplicar máscara para obter o início do bloco
      const network1 = bigInt1 & mask;
      const network2 = bigInt2 & mask;
      
      // Se os blocos de rede são iguais, há sobreposição
      return network1 === network2;
    } catch (error) {
      console.error("Erro ao verificar sobreposição:", error);
      return false;
    }
  }
  
  /**
   * Sugere um prefixo alternativo que não causa sobreposição
   * @param {string} currentPrefix - Prefixo atual que tem sobreposição
   * @param {string} conflictingPrefix - Prefixo com o qual há conflito
   * @param {number} desiredNewMask - Máscara desejada para o novo prefixo
   * @returns {string} - Prefixo alternativo sugerido
   */
  function suggestNonOverlappingPrefix(currentPrefix, conflictingPrefix, desiredNewMask) {
    try {
      // Extrair endereço e prefixo
      const [addr1, cidr1] = currentPrefix.split('/');
      const [addr2, cidr2] = conflictingPrefix.split('/');
      
      // Expandir os endereços
      const expanded1 = expandIPv6Address(addr1).replace(/:/g, '');
      const expanded2 = expandIPv6Address(addr2).replace(/:/g, '');
      
      if (expanded1.startsWith('Erro') || expanded2.startsWith('Erro')) {
        return "Erro ao expandir endereços IPv6";
      }
      
      // Converter para BigInt
      const bigInt1 = BigInt('0x' + expanded1);
      const bigInt2 = BigInt('0x' + expanded2);
      
      // Calcular máscaras
      const prefix1Value = parseInt(cidr1);
      const prefix2Value = parseInt(cidr2);
      const conflictPrefixValue = Math.min(prefix1Value, prefix2Value, desiredNewMask);
      
      // Criar máscara para o prefixo de conflito
      const conflictMask = ((1n << BigInt(128 - conflictPrefixValue)) - 1n) ^ ((1n << BigInt(128)) - 1n);
      
      // Calcular os blocos de rede
      const conflictNetwork = bigInt2 & conflictMask;
      
      // Tamanho do bloco
      const blockSize = 1n << BigInt(128 - conflictPrefixValue);
      
      // Sugerir próximo bloco sem sobreposição
      const suggestedNetwork = conflictNetwork + blockSize;
      
      // Formatar o endereço sugerido
      const suggestedNetworkHex = suggestedNetwork.toString(16).padStart(32, '0');
      const suggestedFormatted = suggestedNetworkHex.match(/.{1,4}/g).join(':');
      
      // Criar um endereço base com ::1 no final
      const parts = suggestedFormatted.split(':');
      parts[7] = '0001';  // Certifique-se de que temos o ::1 no final
      const baseAddress = shortenIPv6(parts.join(':'));
      
      return `${baseAddress}/${desiredNewMask}`;
    } catch (error) {
      console.error("Erro ao sugerir prefixo sem sobreposição:", error);
      return "Erro ao calcular prefixo alternativo";
    }
  }
  
  /**
   * Calcula um bloco agregado a partir de sub-redes selecionadas
   * @param {Array} selectedSubnets - Array de sub-redes selecionadas
   * @returns {Object|null} - Objeto com rede e prefixo agregados ou null se não for possível
   */
  function calcularBlocoAgregado(selectedSubnets) {
    try {
      if (!selectedSubnets || !Array.isArray(selectedSubnets) || selectedSubnets.length === 0) {
        console.warn("Nenhuma sub-rede selecionada para agregação");
        return null;
      }
      
      // Verificar se todas as sub-redes têm o mesmo tamanho de prefixo
      let prefixLength = parseInt(selectedSubnets[0].subnet.split('/')[1]);
      for (let s of selectedSubnets) {
        if (!s.subnet) {
          console.warn("Sub-rede inválida na lista", s);
          return null;
        }
        
        let p = parseInt(s.subnet.split('/')[1]);
        if (p !== prefixLength) {
          console.warn("Sub-redes com prefixos diferentes não podem ser agregadas");
          return null;
        }
      }
      
      // Converter sub-redes para números e ordenar
      let networks = [];
      for (let s of selectedSubnets) {
        if (!s.network) {
          console.warn("Sub-rede sem propriedade 'network'", s);
          return null;
        }
        
        try {
          const networkHex = s.network.replace(/:/g, '');
          networks.push(BigInt("0x" + networkHex));
        } catch (e) {
          console.error("Erro ao converter rede para BigInt:", e);
          return null;
        }
      }
      
      networks.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      
      // Verificar se as sub-redes são contíguas
      let blockSize = 1n << (128n - BigInt(prefixLength));
      for (let i = 1; i < networks.length; i++) {
        if (networks[i] !== networks[i - 1] + blockSize) {
          console.warn("Sub-redes não contíguas não podem ser agregadas");
          return null;
        }
      }
      
      // Verificar se o número de sub-redes é uma potência de 2
      let n = BigInt(selectedSubnets.length);
      if ((n & (n - 1n)) !== 0n) {
        console.warn("Número de sub-redes não é potência de 2");
        return null;
      }
      
      // Calcular quantos bits remover do prefixo
      let bitsToRemove = 0;
      while ((1n << BigInt(bitsToRemove)) < n) {
        bitsToRemove++;
      }
      
      let newPrefix = prefixLength - bitsToRemove;
      if (newPrefix < 1) {
        console.warn("Prefixo resultante seria menor que 1");
        return null;
      }
      
      // Formatar resultado
      let aggregatedNetwork = networks[0];
      let aggregatedHex = aggregatedNetwork.toString(16).padStart(32, '0');
      let aggregatedFormatted = aggregatedHex.match(/.{1,4}/g).join(':');
      
      return { network: aggregatedFormatted, prefix: newPrefix };
    } catch (error) {
      console.error("Erro ao calcular bloco agregado:", error);
      return null;
    }
  }
  
  /**
   * Gera sub-redes IPv6 de forma assíncrona
   * @param {BigInt} ipv6BigInt - Endereço IPv6 como BigInt
   * @param {BigInt} initialMask - Máscara inicial como BigInt
   * @param {number} prefix - Tamanho do prefixo
   * @param {BigInt} numSubRedes - Número de sub-redes a gerar
   * @param {Function} callback - Função de callback
   * @param {Object} appState - Estado da aplicação
   */
  function gerarSubRedesAssincronamente(ipv6BigInt, initialMask, prefix, numSubRedes, callback, appState) {
    try {
      // Verificar se os parâmetros são válidos
      if (typeof ipv6BigInt !== 'bigint') {
        throw new Error("Parâmetro ipv6BigInt deve ser um BigInt");
      }
      
      if (typeof initialMask !== 'bigint') {
        throw new Error("Parâmetro initialMask deve ser um BigInt");
      }
      
      if (typeof prefix !== 'number' || prefix < 1 || prefix > 128) {
        throw new Error("Prefixo deve ser um número entre 1 e 128");
      }
      
      if (typeof numSubRedes !== 'bigint') {
        throw new Error("Parâmetro numSubRedes deve ser um BigInt");
      }
      
      // Verificar se appState existe
      appState = appState || { subRedesGeradas: [] };
      
      // Definir quantidade máxima de sub-redes a gerar (evitar travamento)
      const maxSubRedes = numSubRedes > 1000000n ? 1000000n : numSubRedes;
      
      // Tamanho do lote para processamento assíncrono
      const chunkSize = 2000n;
      let i = 0n;
      
      // Função para mostrar progresso
      const updateProgress = (i, total) => {
        const loadingMessage = document.querySelector('.loading-message');
        if (loadingMessage && total > 1000n) {
          const percent = Number((i * 100n / total));
          const percentFormatted = percent >= 99 ? 99 : Math.floor(percent);
          loadingMessage.textContent = `Gerando sub-redes (${percentFormatted}%)... Por favor, aguarde.`;
        }
      };
      
      // Processar em chunks para não bloquear a UI
      function processChunk() {
        let chunkCount = 0n;
        
        while (i < maxSubRedes && chunkCount < chunkSize) {
          try {
            // Calcular endereço de sub-rede
            let subnetBigInt = (ipv6BigInt & initialMask) + (i << (128n - BigInt(prefix)));
            
            // Formatar endereço para exibição
            let subnetHex = subnetBigInt.toString(16).padStart(32, '0');
            let subnetFormatada = subnetHex.match(/.{1,4}/g).join(':');
            
            // Calcular primeiro e último endereço da sub-rede
            let subnetInitial = subnetBigInt;
            let subnetFinal = subnetBigInt + (1n << (128n - BigInt(prefix))) - 1n;
            
            // Formatar endereços para exibição
            let subnetInitialFormatted = subnetInitial.toString(16).padStart(32, '0').match(/.{1,4}/g).join(':');
            let subnetFinalFormatted = subnetFinal.toString(16).padStart(32, '0').match(/.{1,4}/g).join(':');
            
            // Adicionar sub-rede ao estado
            appState.subRedesGeradas.push({
              subnet: `${subnetFormatada}/${prefix}`,
              initial: subnetInitialFormatted,
              final: subnetFinalFormatted,
              network: `${subnetFormatada}`
            });
            
            i++;
            chunkCount++;
          } catch (error) {
            console.error("Erro ao processar sub-rede:", error);
            i++;
            chunkCount++;
          }
        }
        
        // Atualizar progresso
        updateProgress(i, maxSubRedes);
        
        if (i < maxSubRedes) {
          // Agendar próximo chunk
          setTimeout(processChunk, 0);
        } else {
          // Ocultar indicador de carregamento
          const loadingIndicator = document.getElementById('loadingIndicator');
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
          }
          
          // Mostrar aviso se limitamos o número de sub-redes
          if (maxSubRedes < numSubRedes) {
            showLimitationWarning(numSubRedes, maxSubRedes);
          }
          
          // Chamar o callback
          if (typeof callback === 'function') {
            callback(appState.subRedesGeradas);
          }
        }
      }
      
      // Iniciar processamento
      processChunk();
    } catch (error) {
      console.error("Erro ao gerar sub-redes:", error);
      
      // Ocultar indicador de carregamento em caso de erro
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      // Notificar o usuário
      alert("Erro ao gerar sub-redes: " + error.message);
      
      // Chamar o callback com array vazio
      if (typeof callback === 'function') {
        callback([]);
      }
    }
  }
  
  /**
   * Mostra aviso de limitação do número de sub-redes
   * @param {BigInt} total - Total teórico de sub-redes
   * @param {BigInt} geradas - Sub-redes efetivamente geradas
   */
  function showLimitationWarning(total, geradas) {
    try {
      // Formatador para números grandes
      const formatarNumero = (num) => {
        if (num < 1000n) return num.toString();
        if (num < 1000000n) return `${(Number(num) / 1000).toFixed(1)}K`;
        if (num < 1000000000n) return `${(Number(num) / 1000000).toFixed(1)}M`;
        return num.toString();
      };
      
      const resultado = document.getElementById('resultado');
      if (!resultado) return;
      
      // Verificar se já existe um aviso
      let aviso = resultado.querySelector('.prefix-warning');
      if (!aviso) {
        aviso = document.createElement('div');
        aviso.className = 'prefix-warning';
        
        aviso.innerHTML = `
          <div class="warning-icon">ℹ️</div>
          <div class="warning-message">
            <strong>Informação:</strong> Foram geradas ${formatarNumero(geradas)} sub-redes de um total possível de 
            ${formatarNumero(total)} sub-redes.
          </div>
        `;
        
        resultado.insertBefore(aviso, resultado.firstChild);
      }
    } catch (error) {
      console.error("Erro ao mostrar aviso de limitação:", error);
    }
  }
  
  // Inicialização - Registro no console para confirmação
  console.log("Módulo IPv6Utils inicializado e disponível globalmente");
  
  // API pública
  return {
    isValidIPv6,
    validateIPv6,
    expandIPv6Address,
    shortenIPv6,
    formatIPv6Address,
    calcularBlocoAgregado,
    gerarSubRedesAssincronamente,
    checkIPv6Overlap,
    suggestNonOverlappingPrefix
  };
})();