/**
 * IPv6 Utilities Module - Versão Refatorada
 * 
 * Módulo otimizado para manipulação de endereços IPv6 com melhor
 * gerenciamento de erros e performance.
 */

const IPv6Utils = (function() {
  'use strict';
  
  // Cache para otimização
  const validationCache = new Map();
  const expansionCache = new Map();
  
  // Configurações
  const CONFIG = {
    MAX_CACHE_SIZE: 1000,
    MAX_SUBNETS_GENERATION: 1000000,
    CHUNK_SIZE: 2000,
    PROGRESS_UPDATE_INTERVAL: 1000
  };
  
  // Regex para validação IPv6 (compilada uma vez)
  const IPV6_REGEX = /^([0-9a-fA-F]{1,4}:){1,7}([0-9a-fA-F]{1,4}|:)$/;
  
  /**
   * Limpa caches quando ficam muito grandes
   */
  function cleanupCaches() {
    if (validationCache.size > CONFIG.MAX_CACHE_SIZE) {
      const entries = Array.from(validationCache.entries());
      // Manter apenas os 500 mais recentes
      validationCache.clear();
      entries.slice(-500).forEach(([key, value]) => {
        validationCache.set(key, value);
      });
    }
    
    if (expansionCache.size > CONFIG.MAX_CACHE_SIZE) {
      const entries = Array.from(expansionCache.entries());
      expansionCache.clear();
      entries.slice(-500).forEach(([key, value]) => {
        expansionCache.set(key, value);
      });
    }
  }
  
  /**
   * Valida um endereço IPv6 com cache
   * @param {string} addressCIDR - Endereço no formato CIDR
   * @returns {string|null} - Mensagem de erro ou null se válido
   */
  function validateIPv6(addressCIDR) {
    // Verificar cache primeiro
    if (validationCache.has(addressCIDR)) {
      return validationCache.get(addressCIDR);
    }
    
    let result = null;
    
    try {
      if (!addressCIDR || typeof addressCIDR !== 'string') {
        result = "Por favor, insira um endereço IPv6 válido no formato CIDR (ex.: 2001:db8::/41).";
      } else {
        const parts = addressCIDR.split('/');
        
        if (parts.length !== 2) {
          result = "Por favor, insira um endereço IPv6 válido no formato CIDR (ex.: 2001:db8::/41).";
        } else {
          const [addr, prefix] = parts;
          
          if (!addr || !prefix || isNaN(prefix)) {
            result = "Por favor, insira um endereço IPv6 válido no formato CIDR (ex.: 2001:db8::/41).";
          } else {
            const prefixNum = parseInt(prefix);
            
            if (prefixNum < 1 || prefixNum > 128) {
              result = "O prefixo inicial deve estar entre 1 e 128.";
            } else {
              // Validar o endereço em si
              const expanded = expandIPv6Address(addressCIDR);
              
              if (expanded.startsWith("Erro")) {
                result = expanded;
              } else {
                const groups = expanded.split(':');
                
                if (groups.length !== 8) {
                  result = "Endereço IPv6 deve conter exatamente 8 grupos.";
                } else {
                  // Verificar cada grupo
                  for (let i = 0; i < groups.length; i++) {
                    if (!/^[0-9a-fA-F]{4}$/.test(groups[i])) {
                      result = `Grupo ${i + 1} contém caracteres inválidos ou possui comprimento incorreto.`;
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[IPv6Utils] Erro na validação:', error);
      result = "Erro ao processar o endereço IPv6.";
    }
    
    // Adicionar ao cache
    validationCache.set(addressCIDR, result);
    cleanupCaches();
    
    return result;
  }
  
  /**
   * Expande um endereço IPv6 para formato completo com cache
   * @param {string} addressCIDR - Endereço no formato CIDR
   * @returns {string} - Endereço expandido ou mensagem de erro
   */
  function expandIPv6Address(addressCIDR) {
    // Verificar cache primeiro
    if (expansionCache.has(addressCIDR)) {
      return expansionCache.get(addressCIDR);
    }
    
    let result;
    
    try {
      let [addr, prefix] = addressCIDR.split('/');
      
      if (!addr) {
        result = "Erro: Endereço inválido.";
      } else {
        // Remover colchetes IPv6 literais se presentes
        addr = addr.replace(/^\[|\]$/g, '');
        
        let parts = addr.split("::");
        
        if (parts.length > 2) {
          result = "Erro: Não pode haver mais de um '::'.";
        } else {
          let head = parts[0] ? parts[0].split(':') : [];
          let tail = parts.length === 2 && parts[1] ? parts[1].split(':') : [];
          
          // Verificar número de grupos
          if (head.length + tail.length > 8) {
            result = "Erro: Muitos grupos de hexadecimais.";
          } else {
            let missing = 8 - (head.length + tail.length);
            
            if (parts.length === 2 && missing < 0) {
              result = "Erro: Muitos grupos de hexadecimais para notação '::'.";
            } else {
              let zeros = new Array(missing).fill("0000");
              let fullParts = head.concat(zeros).concat(tail);
              
              // Validar e padronizar cada grupo
              let allValid = true;
              for (let i = 0; i < fullParts.length; i++) {
                if (!/^[0-9a-fA-F]{1,4}$/.test(fullParts[i])) {
                  result = `Erro: Grupo ${i + 1} contém caracteres inválidos.`;
                  allValid = false;
                  break;
                }
                fullParts[i] = fullParts[i].padStart(4, '0');
              }
              
              if (allValid) {
                result = fullParts.join(':');
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[IPv6Utils] Erro na expansão:', error);
      result = "Erro: Falha ao processar o endereço.";
    }
    
    // Adicionar ao cache
    expansionCache.set(addressCIDR, result);
    cleanupCaches();
    
    return result;
  }
  
  /**
   * Encurta um endereço IPv6 usando a notação "::" de forma otimizada
   * @param {string} address - Endereço IPv6 completo
   * @returns {string} - Endereço encurtado
   */
  function shortenIPv6(address) {
    if (!address || typeof address !== 'string') {
      return address || "";
    }
    
    // Se já estiver na forma curta, retornar como está
    if (address.includes('::')) {
      return address;
    }
    
    const groups = address.split(':').map(g => g.replace(/^0+/, '') || '0');
    
    // Se não tiver 8 grupos, retorna como está
    if (groups.length !== 8) {
      return address;
    }
    
    // Encontrar a maior sequência de zeros
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
    
    // Verificar a última sequência
    if (curLen > bestLen) {
      bestLen = curLen;
      bestStart = curStart;
    }
    
    // Se a maior sequência é menor que 2, não vale a pena usar ::
    if (bestLen < 2) {
      return groups.join(':');
    }
    
    const prefix = groups.slice(0, bestStart);
    const suffix = groups.slice(bestStart + bestLen);
    
    let result = '';
    if (prefix.length > 0) {
      result = prefix.join(':') + ':';
    }
    
    result += ':';
    
    if (suffix.length > 0) {
      result += suffix.join(':');
    }
    
    // Corrigir casos especiais
    result = result.replace(/^::/, '::');
    result = result.replace(/::$/, '::');
    result = result.replace(/:{3,}/, '::');
    
    return result;
  }
  
  /**
   * Formata um BigInt em um endereço IPv6 de forma otimizada
   * @param {BigInt} ipv6BigInt - Número BigInt representando o endereço IPv6
   * @returns {string} - Endereço IPv6 formatado
   */
  function formatIPv6Address(ipv6BigInt) {
    try {
      if (typeof ipv6BigInt !== 'bigint') {
        console.error('[IPv6Utils] formatIPv6Address requer um BigInt, recebeu:', typeof ipv6BigInt);
        return "0000:0000:0000:0000:0000:0000:0000:0000";
      }
      
      const hexStr = ipv6BigInt.toString(16).padStart(32, '0');
      return hexStr.match(/.{1,4}/g).join(':');
    } catch (error) {
      console.error('[IPv6Utils] Erro ao formatar IPv6 BigInt:', error);
      return "0000:0000:0000:0000:0000:0000:0000:0000";
    }
  }
  
  /**
   * Verifica sobreposição entre dois prefixos IPv6 de forma otimizada
   * @param {string} prefix1 - Primeiro prefixo IPv6 com CIDR
   * @param {string} prefix2 - Segundo prefixo IPv6 com CIDR
   * @returns {boolean} - true se houver sobreposição
   */
  function checkIPv6Overlap(prefix1, prefix2) {
    try {
      const [addr1, cidr1] = prefix1.split('/');
      const [addr2, cidr2] = prefix2.split('/');
      
      const expanded1 = expandIPv6Address(addr1).replace(/:/g, '');
      const expanded2 = expandIPv6Address(addr2).replace(/:/g, '');
      
      if (expanded1.startsWith('Erro') || expanded2.startsWith('Erro')) {
        console.error('[IPv6Utils] Erro ao expandir endereços IPv6 para verificação de sobreposição');
        return false;
      }
      
      const bigInt1 = BigInt('0x' + expanded1);
      const bigInt2 = BigInt('0x' + expanded2);
      
      const prefix1Value = parseInt(cidr1);
      const prefix2Value = parseInt(cidr2);
      const smallerPrefix = Math.min(prefix1Value, prefix2Value);
      
      // Criar máscara otimizada
      const mask = ((1n << BigInt(128 - smallerPrefix)) - 1n) ^ ((1n << BigInt(128)) - 1n);
      
      const network1 = bigInt1 & mask;
      const network2 = bigInt2 & mask;
      
      return network1 === network2;
    } catch (error) {
      console.error('[IPv6Utils] Erro ao verificar sobreposição:', error);
      return false;
    }
  }
  
  /**
   * Sugere um prefixo alternativo de forma otimizada
   * @param {string} currentPrefix - Prefixo atual que tem sobreposição
   * @param {string} conflictingPrefix - Prefixo com o qual há conflito
   * @param {number} desiredNewMask - Máscara desejada para o novo prefixo
   * @returns {string} - Prefixo alternativo sugerido
   */
  function suggestNonOverlappingPrefix(currentPrefix, conflictingPrefix, desiredNewMask) {
    try {
      const [addr1, cidr1] = currentPrefix.split('/');
      const [addr2, cidr2] = conflictingPrefix.split('/');
      
      const expanded1 = expandIPv6Address(addr1).replace(/:/g, '');
      const expanded2 = expandIPv6Address(addr2).replace(/:/g, '');
      
      if (expanded1.startsWith('Erro') || expanded2.startsWith('Erro')) {
        return "Erro ao expandir endereços IPv6";
      }
      
      const bigInt1 = BigInt('0x' + expanded1);
      const bigInt2 = BigInt('0x' + expanded2);
      
      const prefix1Value = parseInt(cidr1);
      const prefix2Value = parseInt(cidr2);
      const conflictPrefixValue = Math.min(prefix1Value, prefix2Value, desiredNewMask);
      
      const conflictMask = ((1n << BigInt(128 - conflictPrefixValue)) - 1n) ^ ((1n << BigInt(128)) - 1n);
      const conflictNetwork = bigInt2 & conflictMask;
      const blockSize = 1n << BigInt(128 - conflictPrefixValue);
      const suggestedNetwork = conflictNetwork + blockSize;
      
      const suggestedNetworkHex = suggestedNetwork.toString(16).padStart(32, '0');
      const suggestedFormatted = suggestedNetworkHex.match(/.{1,4}/g).join(':');
      
      // Criar um endereço base com ::1 no final
      const parts = suggestedFormatted.split(':');
      parts[7] = '0001';
      const baseAddress = shortenIPv6(parts.join(':'));
      
      return `${baseAddress}/${desiredNewMask}`;
    } catch (error) {
      console.error('[IPv6Utils] Erro ao sugerir prefixo sem sobreposição:', error);
      return "Erro ao calcular prefixo alternativo";
    }
  }
  
  /**
   * Calcula bloco agregado otimizado
   * @param {Array} selectedSubnets - Array de sub-redes selecionadas
   * @returns {Object|null} - Objeto com rede e prefixo agregados ou null
   */
  function calcularBlocoAgregado(selectedSubnets) {
    try {
      if (!selectedSubnets || !Array.isArray(selectedSubnets) || selectedSubnets.length === 0) {
        return null;
      }
      
      // Verificar se todas as sub-redes têm o mesmo tamanho de prefixo
      const prefixLength = parseInt(selectedSubnets[0].subnet.split('/')[1]);
      
      for (const subnet of selectedSubnets) {
        if (!subnet.subnet) {
          console.warn('[IPv6Utils] Sub-rede inválida na lista', subnet);
          return null;
        }
        
        const p = parseInt(subnet.subnet.split('/')[1]);
        if (p !== prefixLength) {
          console.warn('[IPv6Utils] Sub-redes com prefixos diferentes não podem ser agregadas');
          return null;
        }
      }
      
      // Converter sub-redes para números e ordenar
      const networks = [];
      for (const subnet of selectedSubnets) {
        if (!subnet.network) {
          console.warn('[IPv6Utils] Sub-rede sem propriedade "network"', subnet);
          return null;
        }
        
        try {
          const networkHex = subnet.network.replace(/:/g, '');
          networks.push(BigInt("0x" + networkHex));
        } catch (e) {
          console.error('[IPv6Utils] Erro ao converter rede para BigInt:', e);
          return null;
        }
      }
      
      networks.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      
      // Verificar se as sub-redes são contíguas
      const blockSize = 1n << (128n - BigInt(prefixLength));
      for (let i = 1; i < networks.length; i++) {
        if (networks[i] !== networks[i - 1] + blockSize) {
          console.warn('[IPv6Utils] Sub-redes não contíguas não podem ser agregadas');
          return null;
        }
      }
      
      // Verificar se o número de sub-redes é uma potência de 2
      const n = BigInt(selectedSubnets.length);
      if ((n & (n - 1n)) !== 0n) {
        console.warn('[IPv6Utils] Número de sub-redes não é potência de 2');
        return null;
      }
      
      // Calcular quantos bits remover do prefixo
      let bitsToRemove = 0;
      while ((1n << BigInt(bitsToRemove)) < n) {
        bitsToRemove++;
      }
      
      const newPrefix = prefixLength - bitsToRemove;
      if (newPrefix < 1) {
        console.warn('[IPv6Utils] Prefixo resultante seria menor que 1');
        return null;
      }
      
      // Formatar resultado
      const aggregatedNetwork = networks[0];
      const aggregatedHex = aggregatedNetwork.toString(16).padStart(32, '0');
      const aggregatedFormatted = aggregatedHex.match(/.{1,4}/g).join(':');
      
      return { network: aggregatedFormatted, prefix: newPrefix };
    } catch (error) {
      console.error('[IPv6Utils] Erro ao calcular bloco agregado:', error);
      return null;
    }
  }
  
  /**
   * Gera sub-redes de forma assíncrona e otimizada
   * @param {BigInt} ipv6BigInt - Endereço IPv6 como BigInt
   * @param {BigInt} initialMask - Máscara inicial como BigInt
   * @param {number} prefix - Tamanho do prefixo
   * @param {BigInt} numSubRedes - Número de sub-redes a gerar
   * @param {Function} callback - Função de callback
   * @param {Object} appState - Estado da aplicação
   */
  function gerarSubRedesAssincronamente(ipv6BigInt, initialMask, prefix, numSubRedes, callback, appState) {
    try {
      // Validação de parâmetros
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
      
      appState = appState || { subRedesGeradas: [] };
      
      const maxSubRedes = numSubRedes > BigInt(CONFIG.MAX_SUBNETS_GENERATION) 
        ? BigInt(CONFIG.MAX_SUBNETS_GENERATION) 
        : numSubRedes;
      
      const chunkSize = BigInt(CONFIG.CHUNK_SIZE);
      let i = 0n;
      let lastProgressUpdate = Date.now();
      
      // Função para atualizar progresso
      const updateProgress = (current, total) => {
        const now = Date.now();
        if (now - lastProgressUpdate > CONFIG.PROGRESS_UPDATE_INTERVAL) {
          const loadingMessage = DOMCache?.elements?.loadingIndicator?.querySelector?.('.loading-message');
          if (loadingMessage && total > 1000n) {
            const percent = Math.min(99, Math.floor(Number((current * 100n) / total)));
            loadingMessage.textContent = `Gerando sub-redes (${percent}%)... Por favor, aguarde.`;
          }
          lastProgressUpdate = now;
        }
      };
      
      // Processar em chunks otimizados
      function processChunk() {
        const startTime = performance.now();
        let chunkCount = 0n;
        
        while (i < maxSubRedes && chunkCount < chunkSize && (performance.now() - startTime) < 16) {
          try {
            // Calcular endereço de sub-rede
            const subnetBigInt = (ipv6BigInt & initialMask) + (i << (128n - BigInt(prefix)));
            
            // Formatar endereços de forma otimizada
            const subnetHex = subnetBigInt.toString(16).padStart(32, '0');
            const subnetFormatada = subnetHex.match(/.{1,4}/g).join(':');
            
            const subnetInitial = subnetBigInt;
            const subnetFinal = subnetBigInt + (1n << (128n - BigInt(prefix))) - 1n;
            
            const subnetInitialHex = subnetInitial.toString(16).padStart(32, '0');
            const subnetFinalHex = subnetFinal.toString(16).padStart(32, '0');
            
            const subnetInitialFormatted = subnetInitialHex.match(/.{1,4}/g).join(':');
            const subnetFinalFormatted = subnetFinalHex.match(/.{1,4}/g).join(':');
            
            appState.subRedesGeradas.push({
              subnet: `${subnetFormatada}/${prefix}`,
              initial: subnetInitialFormatted,
              final: subnetFinalFormatted,
              network: subnetFormatada
            });
            
            i++;
            chunkCount++;
          } catch (error) {
            console.error('[IPv6Utils] Erro ao processar sub-rede:', error);
            i++;
            chunkCount++;
          }
        }
        
        // Atualizar progresso
        updateProgress(i, maxSubRedes);
        
        if (i < maxSubRedes) {
          // Usar requestAnimationFrame para melhor performance
          requestAnimationFrame(processChunk);
        } else {
          // Finalizar geração
          const loadingIndicator = DOMCache?.elements?.loadingIndicator;
          if (loadingIndicator) {
            DOMCache.utils.hide(loadingIndicator);
          }
          
          // Mostrar aviso se limitamos o número de sub-redes
          if (maxSubRedes < numSubRedes) {
            showLimitationWarning(numSubRedes, maxSubRedes);
          }
          
          // Chamar callback
          if (typeof callback === 'function') {
            callback(appState.subRedesGeradas);
          }
        }
      }
      
      // Iniciar processamento
      requestAnimationFrame(processChunk);
      
    } catch (error) {
      console.error('[IPv6Utils] Erro ao gerar sub-redes:', error);
      
      // Ocultar indicador de carregamento em caso de erro
      const loadingIndicator = DOMCache?.elements?.loadingIndicator;
      if (loadingIndicator) {
        DOMCache.utils.hide(loadingIndicator);
      }
      
      // Notificar o usuário
      if (window.UIController && typeof window.UIController.showNotification === 'function') {
        window.UIController.showNotification("Erro ao gerar sub-redes: " + error.message, 'error');
      } else {
        alert("Erro ao gerar sub-redes: " + error.message);
      }
      
      // Chamar callback com array vazio
      if (typeof callback === 'function') {
        callback([]);
      }
    }
  }
  
  /**
   * Mostra aviso de limitação do número de sub-redes de forma otimizada
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
      
      const resultado = DOMCache?.elements?.resultado;
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
      console.error('[IPv6Utils] Erro ao mostrar aviso de limitação:', error);
    }
  }
  
  /**
   * Verifica se um endereço IPv6 é válido (versão rápida)
   * @param {string} ipv6 - Endereço IPv6 com CIDR
   * @returns {boolean} - True se for válido
   */
  function isValidIPv6(ipv6) {
    try {
      if (!ipv6 || typeof ipv6 !== 'string' || !ipv6.includes('/')) {
        return false;
      }
      
      const [addr, prefix] = ipv6.split('/');
      const prefixNum = parseInt(prefix);
      
      if (isNaN(prefixNum) || prefixNum < 1 || prefixNum > 128) {
        return false;
      }
      
      if (!addr || addr.split(':').length < 2) {
        return false;
      }
      
      // Usar função de validação completa se cache não estiver disponível
      return validateIPv6(ipv6) === null;
    } catch (error) {
      console.error('[IPv6Utils] Erro ao validar IPv6 (versão rápida):', error);
      return false;
    }
  }
  
  /**
   * Utilitários para debug e estatísticas
   */
  const debug = {
    /**
     * Limpa todos os caches
     */
    clearCaches() {
      validationCache.clear();
      expansionCache.clear();
      console.log('[IPv6Utils] Caches limpos');
    },
    
    /**
     * Obtém estatísticas dos caches
     */
    getCacheStats() {
      return {
        validation: {
          size: validationCache.size,
          maxSize: CONFIG.MAX_CACHE_SIZE
        },
        expansion: {
          size: expansionCache.size,
          maxSize: CONFIG.MAX_CACHE_SIZE
        }
      };
    },
    
    /**
     * Mostra estatísticas no console
     */
    showStats() {
      const stats = this.getCacheStats();
      console.table(stats);
    },
    
    /**
     * Testa performance de validação
     */
    testValidationPerformance(iterations = 1000) {
      const testAddresses = [
        '2001:db8::/32',
        '2001:db8:85a3::8a2e:370:7334/64',
        'fe80::/10',
        '::1/128',
        '2001:db8:85a3:0:0:8a2e:370:7334/96'
      ];
      
      console.time('[IPv6Utils] Teste de Performance - Validação');
      
      for (let i = 0; i < iterations; i++) {
        const addr = testAddresses[i % testAddresses.length];
        validateIPv6(addr);
      }
      
      console.timeEnd('[IPv6Utils] Teste de Performance - Validação');
      
      const stats = this.getCacheStats();
      console.log(`Cache hits: ${stats.validation.size} entradas`);
    }
  };
  
  /**
   * Inicialização do módulo
   */
  function initialize() {
    console.log('[IPv6Utils] Módulo IPv6 Utils inicializado');
    
    // Registrar no sistema de módulos se disponível
    if (window.ModuleManager) {
      window.ModuleManager.register('IPv6Utils', publicAPI);
    }
    
    // Configurar limpeza periódica de cache
    setInterval(cleanupCaches, 30000); // A cada 30 segundos
  }
  
  // API pública
  const publicAPI = {
    // Funções principais
    validateIPv6,
    expandIPv6Address,
    shortenIPv6,
    formatIPv6Address,
    isValidIPv6,
    
    // Operações avançadas
    checkIPv6Overlap,
    suggestNonOverlappingPrefix,
    calcularBlocoAgregado,
    gerarSubRedesAssincronamente,
    
    // Debug (apenas em desenvolvimento)
    ...(location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? { debug } : {}),
    
    // Configuração
    config: CONFIG
  };
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  return publicAPI;
})();

// Exportar globalmente
window.IPv6Utils = IPv6Utils;
