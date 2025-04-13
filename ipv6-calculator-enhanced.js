/**
 * Solução Completa para a Calculadora de Sub-Redes IPv6
 * 
 * Este script combina todas as melhorias em um único arquivo para facilitar a implementação.
 * Inclui:
 * 1. Melhorias no processamento de prefixos
 * 2. Mapa de calor aprimorado
 * 3. Otimizações de desempenho
 */

(function() {
  // Verificar se já inicializamos para evitar duplicação
  if (window.ipv6CalculatorEnhanced) return;
  window.ipv6CalculatorEnhanced = true;
  
  console.log("Inicializando melhorias para a Calculadora IPv6");
  
  // ====== PARTE 1: FUNÇÕES UTILITÁRIAS ======
  
  // Verificar se estamos em modo escuro
  function isDarkMode() {
    return document.body.classList.contains('dark-mode');
  }
  
  // Formatar números grandes
  function formatarNumeroGrande(numero) {
    // Converter para string primeiro
    const numStr = numero.toString();
    
    // Para números menores, mostrar valor exato
    if (numStr.length <= 6) {
      return numStr;
    }
    
    // Para números maiores, usar notação com sufixo
    const sufixos = ['', 'K', 'M', 'B', 'T'];
    const magnitude = Math.floor((numStr.length - 1) / 3);
    const shortMagnitude = Math.min(magnitude, sufixos.length - 1);
    
    if (shortMagnitude > 0) {
      const valorAbreviado = Number(numStr) / Math.pow(10, shortMagnitude * 3);
      return valorAbreviado.toFixed(1) + sufixos[shortMagnitude];
    }
    
    return numStr;
  }
  
  // Gerar dados de demonstração para o mapa de calor
  function generateDemoHeatmapData(dimension) {
    const matrix = Array(dimension).fill().map(() => Array(dimension).fill(0));
    let maxValue = 0;
    
    // Criar um padrão interessante para demonstração
    for (let y = 0; y < dimension; y++) {
      for (let x = 0; x < dimension; x++) {
        // Criar um padrão de gradiente com algumas áreas de concentração
        const distanceToCenter = Math.sqrt(
          Math.pow(x - dimension/2, 2) + 
          Math.pow(y - dimension/2, 2)
        );
        
        const value = Math.max(0, 10 - distanceToCenter) + Math.random() * 2;
        matrix[y][x] = value;
        maxValue = Math.max(maxValue, value);
      }
    }
    
    // Converter para o formato normalizado
    const normalized = [];
    for (let y = 0; y < dimension; y++) {
      for (let x = 0; x < dimension; x++) {
        normalized.push({
          x: x,
          y: y,
          value: matrix[y][x],
          intensity: matrix[y][x] / maxValue
        });
      }
    }
    
    return {
      normalized: normalized,
      maxValue: maxValue
    };
  }
  
  // Mostrar mensagem de sucesso temporária
  function showSuccessMessage(message) {
    const aviso = document.createElement('div');
    aviso.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--secondary-color);
      color: white;
      padding: 12px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: fadeIn 0.3s ease-out;
    `;
    
    aviso.innerHTML = `
      <span style="font-size: 18px;">✓</span>
      <span>${message}</span>
    `;
    
    document.body.appendChild(aviso);
    
    // Remover o aviso após alguns segundos
    setTimeout(() => {
      aviso.style.animation = 'fadeOut 0.5s ease-out forwards';
      setTimeout(() => {
        if (aviso.parentNode) {
          aviso.parentNode.removeChild(aviso);
        }
      }, 500);
    }, 5000);
  }
  
  // ====== PARTE 2: MELHORIA DO MAPA DE CALOR ======
  
  // Implementação aprimorada do mapa de calor
  function createImprovedHeatmap() {
    // Verificar se temos os dados e bibliotecas necessárias
    if (!window.ipv6viz || !window.ipv6viz.cache || !window.ipv6viz.cache.heatmapData) {
      console.error("Dados de mapa de calor não disponíveis");
      return;
    }
    
    if (!window.d3) {
      console.error("Biblioteca D3.js não está disponível");
      return;
    }
    
    const container = document.getElementById('heatmapChart');
    if (!container) {
      console.error("Container do mapa de calor não encontrado");
      return;
    }
    
    // Limpar o container
    container.innerHTML = '';
    
    // Definir dimensões
    const margin = { top: 40, right: 60, bottom: 60, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = Math.min(width, 500) - margin.top - margin.bottom;
    
    // Obter dados
    const heatmapData = window.ipv6viz.cache.heatmapData;
    const dimension = heatmapData.dimension || 12;
    
    // Se não temos dados suficientes, gerar dados de exemplo para demonstração
    if (!heatmapData.normalized || heatmapData.normalized.length === 0) {
      const demoData = generateDemoHeatmapData(dimension);
      heatmapData.normalized = demoData.normalized;
      heatmapData.maxValue = demoData.maxValue;
    }
    
    // Criar SVG
    const svg = d3.select(container)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Título e subtítulo
    svg.append("text")
      .attr("class", "heatmap-title")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", isDarkMode() ? "#e6edf3" : "#24292f")
      .text("Mapa de Calor do Espaço de Endereçamento IPv6");
    
    svg.append("text")
      .attr("class", "heatmap-subtitle")
      .attr("x", width / 2)
      .attr("y", -2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", isDarkMode() ? "#8b949e" : "#57606a")
      .text("Visualização da distribuição de sub-redes no espaço IPv6");
    
    // Definir escalas
    const x = d3.scaleBand()
      .range([0, width])
      .domain(Array.from({ length: dimension }, (_, i) => i))
      .padding(0.01);
    
    const y = d3.scaleBand()
      .range([0, height])
      .domain(Array.from({ length: dimension }, (_, i) => i))
      .padding(0.01);
    
    // Escala de cores melhorada
    const colorScale = d3.scaleSequential()
      .interpolator(isDarkMode() ? d3.interpolateInferno : d3.interpolateYlOrRd)
      .domain([0, heatmapData.maxValue]);
    
    // Adicionar eixos com rótulos personalizados
    // Eixo X
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 3 === 0)))
      .selectAll("text")
        .style("font-size", "10px")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
    
    // Eixo Y
    svg.append("g")
      .call(d3.axisLeft(y).tickValues(y.domain().filter((d, i) => i % 3 === 0)))
      .selectAll("text")
        .style("font-size", "10px");
    
    // Adicionar legendas para os eixos
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", isDarkMode() ? "#e6edf3" : "#24292f")
      .text("Segmentos do Espaço de Endereços (Eixo X)");
    
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", isDarkMode() ? "#e6edf3" : "#24292f")
      .text("Segmentos do Espaço de Endereços (Eixo Y)");
    
    // Criar células do mapa de calor com efeitos visuais
    svg.selectAll("rect")
      .data(heatmapData.normalized)
      .enter()
      .append("rect")
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => d.value === 0 ? 
               (isDarkMode() ? "#161b22" : "#f6f8fa") : 
               colorScale(d.value))
        .style("stroke", isDarkMode() ? "#30363d" : "#e1e4e8")
        .style("stroke-width", 0.5)
        // Adicionar efeitos de hover
        .on("mouseover", function(event, d) {
          // Destacar a célula ao passar o mouse
          d3.select(this)
            .style("stroke-width", 2)
            .style("stroke", isDarkMode() ? "#58a6ff" : "#0070d1");
            
          // Adicionar tooltip
          const tooltip = d3.select(container)
            .append("div")
            .attr("class", "heatmap-tooltip")
            .style("position", "absolute")
            .style("background", isDarkMode() ? "#30363d" : "white")
            .style("color", isDarkMode() ? "#e6edf3" : "#24292f")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("box-shadow", "0 2px 8px rgba(0,0,0,0.2)")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("left", `${event.pageX - container.getBoundingClientRect().left + 10}px`)
            .style("top", `${event.pageY - container.getBoundingClientRect().top - 40}px`);
            
          // Conteúdo do tooltip
          tooltip.html(`
            <div><strong>Posição:</strong> (${d.x}, ${d.y})</div>
            <div><strong>Densidade:</strong> ${d.value.toFixed(2)}</div>
            <div><strong>Intensidade:</strong> ${Math.round(d.intensity * 100)}%</div>
          `);
          
          // Animar o tooltip
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.95);
        })
        .on("mouseout", function() {
          // Remover destaque
          d3.select(this)
            .style("stroke-width", 0.5)
            .style("stroke", isDarkMode() ? "#30363d" : "#e1e4e8");
            
          // Remover tooltip
          d3.select(container).selectAll(".heatmap-tooltip").remove();
        })
        // Adicionar animação na carga inicial
        .style("opacity", 0)
        .transition()
        .duration(300)
        .delay((d, i) => i * 2)
        .style("opacity", 1);
    
    // Adicionar legenda de cores
    const legendWidth = 20;
    const legendHeight = height / 2;
    
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 10}, ${height/4})`);
    
    // Retângulos da legenda
    const numSteps = 20;
    for (let i = 0; i < numSteps; i++) {
      legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight / numSteps)
        .attr("y", i * (legendHeight / numSteps))
        .style("fill", colorScale(heatmapData.maxValue - (i / numSteps) * heatmapData.maxValue))
        .style("stroke", isDarkMode() ? "#30363d" : "#e1e4e8")
        .style("stroke-width", 0.5);
    }
    
    // Texto da legenda
    legend.append("text")
      .attr("x", legendWidth / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", isDarkMode() ? "#e6edf3" : "#24292f")
      .text("Densidade");
    
    legend.append("text")
      .attr("x", legendWidth + 5)
      .attr("y", 0)
      .style("font-size", "10px")
      .style("fill", isDarkMode() ? "#e6edf3" : "#24292f")
      .text("Alta");
    
    legend.append("text")
      .attr("x", legendWidth + 5)
      .attr("y", legendHeight)
      .style("font-size", "10px")
      .style("fill", isDarkMode() ? "#e6edf3" : "#24292f")
      .text("Baixa");
    
    // Adicionar informações sobre a visualização
    const infoText = svg.append("g")
      .attr("transform", `translate(0, ${height + 50})`);
    
    infoText.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .style("font-size", "11px")
      .style("fill", isDarkMode() ? "#8b949e" : "#57606a")
      .text("* A visualização representa como as sub-redes IPv6 estão distribuídas no espaço de endereçamento.");
  }
  
  // ====== PARTE 3: MELHORIA NO PROCESSAMENTO DE PREFIXOS ======
  
  // Remover limitação de prefixos mostrados
  function enhancePrefixLimitation() {
    // Verificar se estamos na página certa
    if (!document.getElementById('possiblePrefixesList')) {
      console.log("Lista de prefixos não encontrada");
      return false;
    }
    
    // Substituir a função de cálculo de sub-redes
    if (window.calcularSubRedes) {
      const originalFn = window.calcularSubRedes;
      
      window.calcularSubRedes = function() {
        // Remover qualquer aviso de prefixo anterior
        const avisoAnterior = document.querySelector('.prefix-warning');
        if (avisoAnterior) {
          avisoAnterior.remove();
        }
        
        // Chamar a função original primeiro
        originalFn.apply(this, arguments);
        
        try {
          // Agora vamos aprimorar a lista de prefixos
          const ipv6Input = document.getElementById('ipv6').value.trim();
          const [, prefixoInicial] = ipv6Input.split('/');
          if (!prefixoInicial) return;
          
          const prefixoNum = parseInt(prefixoInicial);
          const prefixesList = document.getElementById('possiblePrefixesList');
          
          // Limpar a lista existente
          prefixesList.innerHTML = '';
          
          // Determinar o número máximo de prefixos a mostrar
          const maxToShow = Math.min(88, 128 - prefixoNum);
          
          // Criar grupos de prefixos para melhor navegação
          const createPrefixGroup = (start, end, title) => {
            const group = document.createElement('div');
            group.className = 'prefix-group';
            group.innerHTML = `<div class="prefix-group-title">${title}</div>`;
            
            for (let i = start; i <= end; i++) {
              const div = document.createElement('div');
              div.className = 'prefix-item';
              div.innerText = `/${i}`;
              div.onclick = () => window.selecionarPrefixo(i);
              div.setAttribute('role', 'button');
              div.tabIndex = 0;
              div.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  window.selecionarPrefixo(i);
                }
              };
              group.appendChild(div);
            }
            
            return group;
          };
          
          // Adicionar grupos baseados em intervalos práticos
          if (prefixoNum < 40) {
            // Para prefixos iniciais pequenos, agrupar em blocos de 8
            for (let base = prefixoNum + 1; base <= Math.min(128, prefixoNum + maxToShow); base += 8) {
              const groupEnd = Math.min(base + 7, 128);
              const title = `/${base} - /${groupEnd}`;
              prefixesList.appendChild(createPrefixGroup(base, groupEnd, title));
            }
          } else if (prefixoNum < 80) {
            // Para prefixos médios, agrupar em blocos de 4
            for (let base = prefixoNum + 1; base <= Math.min(128, prefixoNum + maxToShow); base += 4) {
              const groupEnd = Math.min(base + 3, 128);
              const title = `/${base} - /${groupEnd}`;
              prefixesList.appendChild(createPrefixGroup(base, groupEnd, title));
            }
          } else {
            // Para prefixos grandes, mostrar individualmente
            const base = prefixoNum + 1;
            const groupEnd = Math.min(128, prefixoNum + maxToShow);
            const title = `/${base} - /${groupEnd}`;
            prefixesList.appendChild(createPrefixGroup(base, groupEnd, title));
          }
          
          // Adicionar indicações visuais para prefixos comuns
          const commonPrefixes = [48, 56, 64, 80, 96, 112, 128];
          document.querySelectorAll('.prefix-item').forEach(item => {
            const prefix = parseInt(item.innerText.substring(1));
            if (commonPrefixes.includes(prefix)) {
              item.classList.add('common-prefix');
              
              // Adicionar indicação do uso comum
              let usageNote = '';
              switch (prefix) {
                case 48: usageNote = 'Alocação típica para sites'; break;
                case 56: usageNote = 'Sub-rede por cliente/dep.'; break;
                case 64: usageNote = 'Sub-rede padrão'; break;
                case 80: usageNote = 'Sub-rede SOHO/Home'; break;
                case 96: usageNote = 'Unidade operacional'; break;
                case 112: usageNote = 'Ponto-a-ponto'; break;
                case 128: usageNote = 'Host único'; break;
              }
              
              if (usageNote) {
                item.setAttribute('title', usageNote);
                item.dataset.usage = usageNote;
              }
            }
          });
          
          return true;
        } catch (error) {
          console.error("Erro ao aprimorar lista de prefixos:", error);
          return false;
        }
      };
      
      console.log("Função calcularSubRedes aprimorada");
      return true;
    } else {
      console.error("Função calcularSubRedes não encontrada");
      return false;
    }
  }
  
  // Melhorar a função de seleção de prefixo
  function enhanceSelectPrefix() {
    if (window.selecionarPrefixo) {
      const originalFn = window.selecionarPrefixo;
      
      window.selecionarPrefixo = function(prefix) {
        try {
          // Remover qualquer aviso de prefixo anterior
          const prefixWarnings = document.querySelectorAll('.prefix-warning');
          prefixWarnings.forEach(warning => warning.remove());
          
          const ipv6Input = document.getElementById('ipv6').value.trim();
          const [, prefixoInicial] = ipv6Input.split('/');
          if (!prefixoInicial) {
            alert("Por favor, insira um endereço IPv6 válido com prefixo CIDR.");
            return;
          }
          
          const prefixoNum = parseInt(prefixoInicial);
          if (isNaN(prefixoNum)) {
            alert("Prefixo CIDR inválido.");
            return;
          }
          
          if (prefix <= prefixoNum) {
            alert("O prefixo selecionado deve ser maior que o prefixo inicial.");
            return;
          }
          
          // Cálculo de bits adicionais e número de sub-redes
          const bitsAdicionais = prefix - prefixoNum;
          let numSubRedes;
          
          try {
            numSubRedes = 1n << BigInt(bitsAdicionais);
          } catch (e) {
            // Fallback para navegadores sem suporte a BigInt
            if (bitsAdicionais <= 30) {
              numSubRedes = BigInt(1 << bitsAdicionais);
            } else {
              numSubRedes = BigInt(Math.pow(2, bitsAdicionais));
            }
          }
          
          // Limites práticos para evitar travamentos
          const maxSubRedesExibir = 10000n;
          const maxSubRedesProcessar = 1000000n;
          
          // Aviso para prefixos que geram muitas sub-redes
          if (numSubRedes > maxSubRedesProcessar) {
            const confirmacao = confirm(
              `Atenção: Você está prestes a gerar ${numSubRedes.toString()} sub-redes, o que pode ` +
              `consumir muita memória e causar lentidão. Por questões práticas, serão geradas apenas ` +
              `${maxSubRedesProcessar.toString()} sub-redes como amostra. Deseja continuar?`
            );
            
            if (!confirmacao) return;
            
            // Definir um estado global para indicar limitação
            window.appState = window.appState || {};
            window.appState.prefixLimitado = true;
            window.appState.prefixOriginal = prefix;
            window.appState.numSubRedesTotal = numSubRedes;
          } else {
            window.appState = window.appState || {};
            window.appState.prefixLimitado = false;
          }
          
          // Mostrar um aviso adicional se for muito grande para exibição completa
          if (numSubRedes > maxSubRedesExibir) {
            // Adicionar aviso à interface antes de chamar a função original
            const aviso = document.createElement('div');
            aviso.className = 'prefix-warning';
            aviso.innerHTML = `
              <div class="warning-icon">⚠️</div>
              <div class="warning-message">
                <strong>Atenção:</strong> Você selecionou o prefixo /${prefix}, que gerará 
                ${numSubRedes.toString()} sub-redes. 
                <br>
                Serão exibidas apenas as primeiras ${maxSubRedesExibir.toString()} sub-redes 
                para evitar sobrecarga do navegador.
              </div>
            `;
            
            // Inserir o aviso na interface
            const container = document.querySelector('.container');
            if (container) {
              container.insertBefore(aviso, container.firstChild.nextSibling);
            }
          }
          
          // Chamar a função original (que fará o processamento real)
          originalFn.call(this, prefix);
          
          return true;
        } catch (error) {
          console.error("Erro ao processar seleção de prefixo:", error);
          alert("Ocorreu um erro ao processar o prefixo selecionado. Verifique o console para mais detalhes.");
          return false;
        }
      };
      
      console.log("Função selecionarPrefixo aprimorada");
      return true;
    } else {
      console.error("Função selecionarPrefixo não encontrada");
      return false;
    }
  }
  
  // Melhorar a geração de sub-redes
  function enhanceSubnetGeneration() {
    // Verificar se a função existe
    if (window.utils && window.utils.gerarSubRedesAssincronamente) {
      const originalFn = window.utils.gerarSubRedesAssincronamente;
      
      window.utils.gerarSubRedesAssincronamente = function(ipv6BigInt, initialMask, prefix, numSubRedes, callback) {
        try {
          console.log(`Gerando sub-redes para prefixo /${prefix}`);
          let i = 0n;
          // Aumentar o tamanho do chunk para processamento mais rápido
          const chunkSize = 2000n;
          const subRedesGeradas = [];
          
          // Limitar o número de sub-redes para evitar travamentos
          const maxSubRedes = numSubRedes > 1000000n ? 1000000n : numSubRedes;
          
          // Mostrar progresso ao usuário
          const loadingMessage = document.querySelector('.loading-message');
          const originalMessage = loadingMessage ? loadingMessage.textContent : '';
          
          function updateProgress() {
            if (loadingMessage && maxSubRedes > 1000n) {
              const percent = Number((i * 100n / maxSubRedes));
              const percentFormatted = percent >= 99 ? 99 : Math.floor(percent);
              loadingMessage.textContent = `Gerando sub-redes (${percentFormatted}%)... Por favor, aguarde.`;
            }
          }
          
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
              
              subRedesGeradas.push({
                subnet: `${subnetFormatada}/${prefix}`,
                initial: subnetInitialFormatted,
                final: subnetFinalFormatted,
                network: `${subnetFormatada}`
              });
              
              i++;
              chunkCount++;
            }
            
            // Atualizar o progresso a cada chunk
            updateProgress();
            
            if (i < maxSubRedes) {
              setTimeout(processChunk, 0);
            } else {
              if (loadingMessage) {
                loadingMessage.textContent = originalMessage;
              }
              document.getElementById('loadingIndicator').style.display = 'none';
              
              // Se limitamos o número de sub-redes, mostrar aviso
              if (maxSubRedes < numSubRedes) {
                const totalSubRedesFormatted = formatarNumeroGrande(numSubRedes);
                const geradasFormatted = formatarNumeroGrande(maxSubRedes);
                
                // Adicionar aviso à interface de resultado
                const avisoLimite = document.createElement('div');
                avisoLimite.className = 'prefix-warning';
                avisoLimite.innerHTML = `
                  <div class="warning-icon">ℹ️</div>
                  <div class="warning-message">
                    <strong>Informação:</strong> Foram geradas ${geradasFormatted} sub-redes de um total possível de 
                    ${totalSubRedesFormatted} sub-redes para o prefixo /${prefix}.
                  </div>
                `;
                
                const resultadoDiv = document.getElementById('resultado');
                if (resultadoDiv && !resultadoDiv.querySelector('.prefix-warning')) {
                  resultadoDiv.insertBefore(avisoLimite, resultadoDiv.firstChild);
                }
              }
              
              callback(subRedesGeradas);
            }
          }
          
          processChunk();
        } catch (error) {
          console.error("Erro ao gerar sub-redes:", error);
          document.getElementById('loadingIndicator').style.display = 'none';
          alert("Erro ao gerar sub-redes: " + error.message);
        }
      };
      
      console.log("Função gerarSubRedesAssincronamente aprimorada");
      return true;
    } else {
      console.error("Função gerarSubRedesAssincronamente não encontrada");
      return false;
    }
  }
  
  // Melhorar a preparação de dados do mapa de calor
  function enhanceHeatmapData() {
    if (window.ipv6viz && window.ipv6viz.prepareHeatmapData) {
      const originalFn = window.ipv6viz.prepareHeatmapData;
      
      window.ipv6viz.prepareHeatmapData = function(subredes) {
        if (!subredes || subredes.length === 0) return;
        
        // Aumentar as dimensões para visualização mais detalhada
        const dimension = 12; // 12x12 = 144 células
        
        // Criar matriz para o mapa de calor
        const heatmapMatrix = Array(dimension).fill().map(() => Array(dimension).fill(0));
        
        // Determinar quantas sub-redes processar
        const samplesToProcess = Math.min(subredes.length, 1000);
        
        // Usar os octetos (ou grupos) do endereço IPv6 para determinar posição
        for (let i = 0; i < samplesToProcess; i++) {
          const subnet = subredes[i].subnet;
          const hexGroups = subnet.split('/')[0].split(':');
          
          // Usar os primeiros dois grupos como coordenadas
          // Converter hexadecimal para número e mapear para nossas dimensões
          const hex1 = parseInt(hexGroups[0], 16) || 0;
          const hex2 = parseInt(hexGroups[1], 16) || 0;
          
          // Mapear para as dimensões do nosso mapa de calor
          const x = Math.floor((hex1 % 0xffff) * dimension / 0xffff);
          const y = Math.floor((hex2 % 0xffff) * dimension / 0xffff);
          
          // Incrementar a célula correspondente
          if (x < dimension && y < dimension) {
            heatmapMatrix[y][x]++;
          }
        }
        
        // Encontrar o valor máximo
        let maxValue = 0;
        for (let y = 0; y < dimension; y++) {
          for (let x = 0; x < dimension; x++) {
            maxValue = Math.max(maxValue, heatmapMatrix[y][x]);
          }
        }
        
        // Se todas as células tiverem o mesmo valor, ajustar para visualização
        if (maxValue <= 1) {
          for (let y = 0; y < dimension; y++) {
            for (let x = 0; x < dimension; x++) {
              // Adicionar variação para melhor visualização
              if (heatmapMatrix[y][x] > 0) {
                heatmapMatrix[y][x] = 1 + (Math.random() * 0.5);
              }
            }
          }
          maxValue = 1.5;
        }
        
        // Normalizar os valores
        const normalizedData = [];
        for (let y = 0; y < dimension; y++) {
          for (let x = 0; x < dimension; x++) {
            // Incluir todas as células para um mapa completo
            normalizedData.push({
              x: x,
              y: y,
              value: heatmapMatrix[y][x],
              intensity: heatmapMatrix[y][x] / maxValue
            });
          }
        }
        
        this.cache.heatmapData = {
          dimension: dimension,
          matrix: heatmapMatrix,
          normalized: normalizedData,
          maxValue: maxValue
        };
      };
      
      // Também substituir a função de inicialização do mapa de calor
      window.ipv6viz.initHeatmapChart = createImprovedHeatmap;
      
      console.log("Função do mapa de calor aprimorada");
      return true;
    } else {
      console.error("Função prepareHeatmapData não encontrada");
      return false;
    }
  }
  
  // ====== PARTE 4: APLICAR ESTILOS CSS ======
  
  // Adicionar estilos CSS personalizados
  function addCustomStyles() {
    const style = document.createElement('style');
    style.textContent = `
      /* Estilos para grupos de prefixos */
      .prefix-group {
        margin-bottom: 12px;
        border: 1px solid var(--border-light);
        border-radius: var(--border-radius-sm);
        overflow: hidden;
      }
      
      body.dark-mode .prefix-group {
        border-color: var(--border-dark);
      }
      
      .prefix-group-title {
        background-color: var(--bg-light-accent);
        padding: 8px 12px;
        font-weight: 600;
        font-size: 14px;
        border-bottom: 1px solid var(--border-light);
      }
      
      body.dark-mode .prefix-group-title {
        background-color: var(--bg-dark-accent);
        border-color: var(--border-dark);
      }
      
      .prefix-item {
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .prefix-item:hover {
        background-color: rgba(0, 112, 209, 0.1);
      }
      
      body.dark-mode .prefix-item:hover {
        background-color: rgba(0, 112, 209, 0.2);
      }
      
      .common-prefix {
        font-weight: 600;
        color: var(--primary-color);
        position: relative;
      }
      
      .common-prefix::after {
        content: attr(data-usage);
        position: absolute;
        font-size: 11px;
        font-weight: normal;
        color: var(--text-light-secondary);
        right: 12px;
        opacity: 0.8;
      }
      
      body.dark-mode .common-prefix::after {
        color: var(--text-dark-secondary);
      }
      
      /* Estilos para avisos */
      .prefix-warning {
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
        color: #856404;
        padding: 12px;
        margin: 12px 0;
        border-radius: var(--border-radius-sm);
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }
      
      body.dark-mode .prefix-warning {
        background-color: #2d2c09;
        border-color: #473e00;
        color: #e5d352;
      }
      
      .warning-icon {
        font-size: 20px;
      }
      
      .warning-message {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
      }
      
      /* Estilos para informações sobre prefixos */
      .prefix-limit-info {
        padding: 8px 12px;
        margin-top: 8px;
        background-color: var(--bg-light-accent);
        border-radius: var(--border-radius-sm);
        font-size: 13px;
        color: var(--text-light-secondary);
      }
      
      body.dark-mode .prefix-limit-info {
        background-color: var(--bg-dark-accent);
        color: var(--text-dark-secondary);
      }
      
      /* Animações */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(20px); }
      }
      
      /* Estilização adicional para o mapa de calor */
      .heatmap-tooltip {
        background-color: rgba(255, 255, 255, 0.95);
        border: 1px solid #d0d7de;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        padding: 8px 12px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
      }
      
      body.dark-mode .heatmap-tooltip {
        background-color: rgba(22, 27, 34, 0.95);
        border-color: #30363d;
      }
    `;
    
    document.head.appendChild(style);
    return true;
  }
  
  // ====== PARTE 5: INICIALIZAÇÃO ======
  
  // Função principal para aplicar todas as melhorias
  function applyAllEnhancements() {
    // 1. Aplicar estilos CSS
    addCustomStyles();
    
    // 2. Melhorar o processamento de prefixos
    let prefixSuccesses = 0;
    if (enhancePrefixLimitation()) prefixSuccesses++;
    if (enhanceSelectPrefix()) prefixSuccesses++;
    if (enhanceSubnetGeneration()) prefixSuccesses++;
    
    // 3. Melhorar o mapa de calor
    let heatmapSuccess = enhanceHeatmapData();
    
    // 4. Adicionar dicas úteis na interface
    const suggestionsContainer = document.getElementById('suggestions');
    if (suggestionsContainer && !suggestionsContainer.querySelector('.prefix-limit-info')) {
      const infoDiv = document.createElement('div');
      infoDiv.className = 'prefix-limit-info';
      infoDiv.innerHTML = `
        <p><strong>Dicas sobre prefixos IPv6:</strong></p>
        <ul style="padding-left: 20px; margin-top: 8px;">
          <li>O <strong>prefixo /64</strong> é o mais comum para sub-redes IPv6.</li>
          <li>Prefixos <strong>/48 a /56</strong> são tipicamente alocados para sites.</li>
          <li>Prefixos <strong>/96 ou maiores</strong> são usados para necessidades específicas.</li>
          <li>Quanto <strong>maior o prefixo</strong>, mais sub-redes e menos endereços por sub-rede.</li>
        </ul>
      `;
      
      // Inserir após o título
      const title = suggestionsContainer.querySelector('h3');
      if (title) {
        title.parentNode.insertBefore(infoDiv, title.nextSibling);
      }
    }
    
    // 5. Verificar sucessos e mostrar mensagem
    const totalSuccesses = prefixSuccesses + (heatmapSuccess ? 1 : 0);
    if (totalSuccesses > 0) {
      showSuccessMessage("Calculadora IPv6 aprimorada");
      console.log(`Melhorias aplicadas: ${totalSuccesses} funcionalidades aprimoradas com sucesso`);
      return true;
    }
    
    return false;
  }
  
  // Executar quando o DOM estiver carregado
  function initialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(applyAllEnhancements, 500);
      });
    } else {
      setTimeout(applyAllEnhancements, 500);
    }
  }
  
  // Inicializar
  initialize();
})();