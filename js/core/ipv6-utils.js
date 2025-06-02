/**
 * IPv6 Utilities Module - Versão Corrigida e Simplificada
 * Módulo essencial para manipulação de endereços IPv6
 */

const IPv6Utils = (function() {
  'use strict';
  
  // Configurações
  const CONFIG = {
    MAX_SUBNETS_GENERATION: 100000,
    CHUNK_SIZE: 1000,
    PROGRESS_UPDATE_INTERVAL: 500
  };
  
  /**
   * Valida um endereço IPv6 com CIDR
   * @param {string} addressCIDR - Endereço no formato CIDR
   * @returns {string|null} - Mensagem de erro ou null se válido
   */
  function validateIPv6(addressCIDR) {
    try {
      if (!addressCIDR || typeof addressCIDR !== 'string') {
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
      
      // Validar formato básico do endereço
      if (!isValidIPv6Format(addr)) {
        return "Formato de endereço IPv6 inválido.";
      }
      
      return null;
    } catch (error) {
      console.error('[IPv6Utils] Erro na validação:', error);
      return "Erro ao processar o endereço IPv6.";
    }
  }
  
  /**
   * Verifica se o formato básico do IPv6 é válido
   * @param {string} addr - Endereço IPv6
   * @returns {boolean} - True se válido
   */
  function isValidIPv6Format(addr) {
    // Remover colchetes se presentes
    addr = addr.replace(/^\[|\]$/g, '');
    
    // Verificações básicas
    if (addr.includes(':::') || addr.split('::').length > 2) {
      return false;
    }
    
    const parts = addr.split('::');
    const beforeDouble = parts[0] ? parts[0].split(':') : [];
    const afterDouble = parts[1] ? parts[1].split(':') : [];
    
    // Se há :: mas total de grupos > 8
    if (parts.length === 2 && beforeDouble.length + afterDouble.length > 8) {
      return false;
    }
    
    // Se não há :: mas não tem 8 grupos
    if (parts.length === 1 && beforeDouble.length !== 8) {
      return false;
    }
    
    // Verificar cada grupo
    const allGroups = [...beforeDouble, ...afterDouble];
    return allGroups.every(group => {
      return group === '' || /^[0-9a-fA-F]{1,4}$/.test(group);
    });
  }
  
  /**
   * Expande um endereço IPv6 para formato completo
   * @param {string} addressCIDR - Endereço no formato CIDR
   * @returns {string} - Endereço expandido ou mensagem de erro
   */
  function expandIPv6Address(addressCIDR) {
    try {
      let [addr] = addressCIDR.split('/');
      
      if (!addr) {
        return "Erro: Endereço inválido.";
      }
      
      // Remover colchetes se presentes
      addr = addr.replace(/^\[|\]$/g, '');
      
      let parts = addr.split("::");
      
      if (parts.length > 2) {
        return "Erro: Não pode haver mais de um '::'.";
      }
      
      let head = parts[0] ? parts[0].split(':') : [];
      let tail = parts.length === 2 && parts[1] ? parts[1].split(':') : [];
      
      // Calcular grupos faltantes
      let missing = 8 - (head.length + tail.length);
      
      if (parts.length === 1) {
        // Sem :: - deve ter exatamente 8 grupos
        if (head.length !== 8) {
          return "Erro: Endereço deve ter 8 grupos ou usar notação '::'.";
        }
        missing = 0;
      }
      
      if (missing < 0) {
        return "Erro: Muitos grupos de hexadecimais.";
      }
      
      // Criar array com zeros
      let zeros = new Array(missing).fill("0000");
      let fullParts = head.concat(zeros).concat(tail);
      
      // Validar e padronizar cada grupo
      for (let i = 0; i < fullParts.length; i++) {
        if (!/^[0-9a-fA-F]{0,4}$/.test(fullParts[i])) {
          return `Erro: Grupo ${i + 1} contém caracteres inválidos.`;
        }
        fullParts[i] = fullParts[i].padStart(4, '0');
      }
      
      return fullParts.join(':');
    } catch (error) {
      console.error('[IPv6Utils] Erro na expansão:', error);
      return "Erro: Falha ao processar o endereço.";
    }
  }
  
  /**
   * Encurta um endereço IPv6 usando a notação "::"
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
   * Formata um BigInt em um endereço IPv6
   * @param {BigInt} ipv6BigInt - Número BigInt representando o endereço IPv6
   * @returns {string} - Endereço IPv6 formatado
   */
  function formatIPv6Address(ipv6BigInt) {
    try {
      if (typeof ipv6BigInt !== 'bigint') {
        console.error('[IPv6Utils] formatIPv6Address requer um BigInt');
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
   * Gera sub-redes de forma assíncrona
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
          const loadingMessage = document.querySelector('#loadingIndicator .loading-message');
          if (loadingMessage && total > 1000n) {
            const percent = Math.min(99, Math.floor(Number((current * 100n) / total)));
            loadingMessage.textContent = `Gerando sub-redes (${percent}%)... Por favor, aguarde.`;
          }
          lastProgressUpdate = now;
        }
      };
      
      // Processar em chunks
      function processChunk() {
        const startTime = performance.now();
        let chunkCount = 0n;
        
        while (i < maxSubRedes && chunkCount < chunkSize && (performance.now() - startTime) < 16) {
          try {
            // Calcular endereço de sub-rede
            const subnetBigInt = (ipv6BigInt & initialMask) + (i << (128n - BigInt(prefix)));
            
            // Formatar endereços
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
          const loadingIndicator = document.getElementById('loadingIndicator');
          if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
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
      const loadingIndicator = document.getElementById('loadingIndicator');
      if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
      }
      
      // Chamar callback com array vazio
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
      
      return validateIPv6(ipv6) === null;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Inicialização do módulo
   */
  function initialize() {
    console.log('[IPv6Utils] Módulo IPv6 Utils inicializado');
  }
  
  // API pública
  const publicAPI = {
    // Funções principais
    validateIPv6,
    expandIPv6Address,
    shortenIPv6,
    formatIPv6Address,
    isValidIPv6,
    gerarSubRedesAssincronamente,
    
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
