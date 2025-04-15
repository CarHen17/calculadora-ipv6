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
  }
  
  /**
   * Encurta um endereço IPv6 usando a notação "::"
   * @param {string} address - Endereço IPv6 completo
   * @returns {string} - Endereço encurtado
   */
  function shortenIPv6(address) {
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
  }
  
  /**
   * Formata um BigInt em um endereço IPv6
   * @param {BigInt} ipv6BigInt - Número BigInt representando o endereço IPv6
   * @returns {string} - Endereço IPv6 formatado
   */
  function formatIPv6Address(ipv6BigInt) {
    try {
      let hexStr = ipv6BigInt.toString(16).padStart(32, '0');
      return hexStr.match(/.{1,4}/g).join(':');
    } catch (error) {
      console.error("Erro ao formatar IPv6 BigInt:", error);
      return "0000:0000:0000:0000:0000:0000:0000:0000"; // Endereço zero em caso de erro
    }
  }
  
  /**
   * Calcula um bloco agregado a partir de sub-redes selecionadas
   * @param {Array} selectedSubnets - Array de sub-redes selecionadas
   * @returns {Object|null} - Objeto com rede e prefixo agregados ou null se não for possível
   */
  function calcularBlocoAgregado(selectedSubnets) {
    try {
      if (selectedSubnets.length === 0) return null;
      
      // Verificar se todas as sub-redes têm o mesmo tamanho de prefixo
      let prefixLength = parseInt(selectedSubnets[0].subnet.split('/')[1]);
      for (let s of selectedSubnets) {
        let p = parseInt(s.subnet.split('/')[1]);
        if (p !== prefixLength) return null;
      }
      
      // Converter sub-redes para números e ordenar
      let networks = selectedSubnets.map(s => BigInt("0x" + s.network.replace(/:/g, '')));
      networks.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      
      // Verificar se as sub-redes são contíguas
      let blockSize = 1n << (128n - BigInt(prefixLength));
      for (let i = 1; i < networks.length; i++) {
        if (networks[i] !== networks[i - 1] + blockSize) return null;
      }
      
      // Verificar se o número de sub-redes é uma potência de 2
      let n = BigInt(selectedSubnets.length);
      if ((n & (n - 1n)) !== 0n) return null;
      
      // Calcular quantos bits remover do prefixo
      let bitsToRemove = 0;
      while ((1n << BigInt(bitsToRemove)) < n) {
        bitsToRemove++;
      }
      
      let newPrefix = prefixLength - bitsToRemove;
      if (newPrefix < 1) return null;
      
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
      // Verificar se appState existe
      appState = appState || { subRedesGeradas: [] };
      
      let i = 0n;
      const chunkSize = 2000n; // Processamento em lotes para evitar bloqueio da UI
      
      // Função para mostrar progresso
      const updateProgress = (i, total) => {
        const loadingMessage = document.querySelector('.loading-message');
        if (loadingMessage && total > 1000n) {
          const percent = Number((i * 100n / total));
          const percentFormatted = percent >= 99 ? 99 : Math.floor(percent);
          loadingMessage.textContent = `Gerando sub-redes (${percentFormatted}%)... Por favor, aguarde.`;
        }
      };
      
      // Limite prático para não travar o navegador
      const maxSubRedes = numSubRedes > 1000000n ? 1000000n : numSubRedes;
      
      // Processar em chunks para não bloquear a UI
      function processChunk() {
        let chunkCount = 0n;
        
        while (i < maxSubRedes && chunkCount < chunkSize) {
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
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      alert("Erro ao gerar sub-redes: " + error.message);
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
    gerarSubRedesAssincronamente
  };
})();

// Verificação adicional para garantir que foi exposto globalmente
if (typeof window.IPv6Utils === 'undefined') {
  console.error("ALERTA: Falha ao expor IPv6Utils globalmente");
  
  // Tentar novamente com uma abordagem alternativa
  window.IPv6Utils = window.IPv6Utils || {};
  if (!window.IPv6Utils.validateIPv6) {
    // Implementar funções básicas diretamente se a exportação original falhou
    window.IPv6Utils.validateIPv6 = function(addressCIDR) {
      console.warn("Usando implementação de fallback para validateIPv6");
      try {
        const [addr, prefix] = addressCIDR.split('/');
        if (!addr || !prefix || isNaN(prefix)) {
          return "Por favor, insira um endereço IPv6 válido no formato CIDR (ex.: 2001:db8::/41).";
        }
        
        const prefixNum = parseInt(prefix);
        if (prefixNum < 1 || prefixNum > 128) {
          return "O prefixo inicial deve estar entre 1 e 128.";
        }
        
        return null;
      } catch (error) {
        return "Erro ao processar o endereço IPv6.";
      }
    };
    
    window.IPv6Utils.shortenIPv6 = function(address) {
      return address; // Versão simplificada para fallback
    };
    
    window.IPv6Utils.expandIPv6Address = function(addressCIDR) {
      try {
        let [addr, prefix] = addressCIDR.split('/');
        return addr;
      } catch (error) {
        return "Erro: Falha ao processar o endereço.";
      }
    };
  }
} else {
  console.log("Verificação de IPv6Utils: OK");
}