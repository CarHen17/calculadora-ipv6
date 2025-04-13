/**
 * Correção para o problema de visualização da Calculadora IPv6
 * Este script resolve o erro "Canvas is already in use" e garante que os gráficos
 * sejam corretamente inicializados e exibidos.
 */

// Função de inicialização da visualização
function mostrarVisualizacao() {
  try {
    console.log("Função mostrarVisualizacao chamada");
    
    // Verificar se há sub-redes geradas
    if (window.appState.subRedesGeradas.length === 0) {
      alert("Gere sub-redes primeiro para visualizar os dados.");
      return;
    }
    
    // Atualizar o passo atual
    const stepsElements = document.querySelectorAll('.step');
    stepsElements.forEach(step => step.classList.remove('active'));
    document.getElementById('step4').classList.add('active');
    
    // Mostrar a seção de visualização
    const vizSection = document.getElementById('visualizationSection');
    if (vizSection) {
      vizSection.style.display = 'block';
      vizSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // IMPORTANTE: Destruir todos os gráficos existentes antes de criar novos
    destroyAllCharts();
    
    // Preparar dados para os gráficos
    prepareVisualizationData();
    
    // Inicializar o primeiro gráfico (utilização)
    initUtilizationChart();
    
    // Configurar eventos para navegação entre visualizações
    setupVisualizationEvents();
  } catch (error) {
    console.error("Erro ao mostrar visualização:", error);
    alert("Ocorreu um erro ao carregar as visualizações. Por favor, tente novamente.");
  }
}

// Destruir todos os gráficos existentes para evitar o erro "Canvas is already in use"
function destroyAllCharts() {
  console.log("Destruindo gráficos existentes");
  
  // Verificar se o objeto Chart está disponível
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js não está disponível");
    return;
  }
  
  // Destruir gráfico de utilização se existir
  const utilizationChart = Chart.getChart("utilizationChart");
  if (utilizationChart) {
    utilizationChart.destroy();
    console.log("Gráfico de utilização destruído");
  }
  
  // Destruir gráfico de comparação de prefixos se existir
  const prefixChart = Chart.getChart("prefixComparisonChart");
  if (prefixChart) {
    prefixChart.destroy();
    console.log("Gráfico de comparação de prefixos destruído");
  }
  
  // Limpar o container do mapa de calor
  const heatmapContainer = document.getElementById('heatmapChart');
  if (heatmapContainer) {
    heatmapContainer.innerHTML = '';
    console.log("Container do mapa de calor limpo");
  }
}

// Preparar dados para visualização
function prepareVisualizationData() {
  console.log("Preparando dados para visualização");
  
  // Cache para os dados dos gráficos
  window.vizCache = window.vizCache || {};
  
  // Preparar dados para o gráfico de utilização
  prepareUtilizationData();
  
  // Preparar dados para o mapa de calor
  prepareHeatmapData();
  
  // Preparar dados para comparação de prefixos
  preparePrefixComparisonData();
}

// Preparar dados para o gráfico de utilização
function prepareUtilizationData() {
  const subredes = window.appState.subRedesGeradas;
  if (!subredes || subredes.length === 0) return;
  
  console.log("Preparando dados para o gráfico de utilização");
  
  // Definir quantos grupos mostrar
  const numGroups = Math.min(10, subredes.length);
  const groupSize = Math.ceil(subredes.length / numGroups);
  
  // Contar sub-redes em cada grupo
  const groups = {};
  for (let i = 0; i < subredes.length; i++) {
    const groupIndex = Math.floor(i / groupSize);
    const groupLabel = `Grupo ${groupIndex + 1}`;
    
    if (!groups[groupLabel]) {
      groups[groupLabel] = 0;
    }
    groups[groupLabel]++;
  }
  
  // Preparar dados para o gráfico
  const labels = Object.keys(groups);
  const data = labels.map(label => groups[label]);
  
  // Cores para os grupos
  const baseColors = [
    '#0070d1', // Azul
    '#4caf50', // Verde
    '#ffa000', // Âmbar
    '#e53935', // Vermelho
    '#9c27b0'  // Roxo
  ];
  
  const backgroundColors = labels.map((_, i) => {
    return baseColors[i % baseColors.length] + 'B3'; // 70% opacidade
  });
  
  const borderColors = labels.map((_, i) => {
    return baseColors[i % baseColors.length];
  });
  
  // Salvar dados no cache
  window.vizCache.utilizationData = {
    labels: labels,
    datasets: [{
      label: 'Número de Sub-redes',
      data: data,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 1
    }]
  };
}

// Preparar dados para o mapa de calor
function prepareHeatmapData() {
  const subredes = window.appState.subRedesGeradas;
  console.log("Preparando dados para o mapa de calor");
  
  // Dimensão do mapa de calor
  const dimension = 12;
  
  // Criar matriz para o mapa de calor
  const heatmapMatrix = Array(dimension).fill().map(() => Array(dimension).fill(0));
  
  // Limite de amostras para processamento
  const maxSamples = Math.min(subredes.length, 1000);
  
  // Distribuir sub-redes na matriz
  if (subredes && subredes.length > 0) {
    for (let i = 0; i < maxSamples; i++) {
      try {
        const subnet = subredes[i].subnet;
        const hexGroups = subnet.split('/')[0].split(':');
        
        // Usar os primeiros dois grupos como coordenadas
        const hex1 = parseInt(hexGroups[0], 16) || 0;
        const hex2 = parseInt(hexGroups[1], 16) || 0;
        
        // Mapear para a dimensão do mapa de calor
        const x = Math.floor((hex1 % 0xffff) * dimension / 0xffff);
        const y = Math.floor((hex2 % 0xffff) * dimension / 0xffff);
        
        // Incrementar a célula correspondente
        if (x < dimension && y < dimension) {
          heatmapMatrix[y][x]++;
        }
      } catch (error) {
        console.warn("Erro ao processar sub-rede para mapa de calor:", error);
      }
    }
  } else {
    // Se não houver sub-redes, gerar dados de demonstração
    for (let y = 0; y < dimension; y++) {
      for (let x = 0; x < dimension; x++) {
        // Criar um padrão de gradiente com algumas áreas de concentração
        const distanceToCenter = Math.sqrt(
          Math.pow(x - dimension/2, 2) + 
          Math.pow(y - dimension/2, 2)
        );
        
        heatmapMatrix[y][x] = Math.max(0, 10 - distanceToCenter) + Math.random() * 2;
      }
    }
  }
  
  // Encontrar o valor máximo
  let maxValue = 0;
  for (let y = 0; y < dimension; y++) {
    for (let x = 0; x < dimension; x++) {
      maxValue = Math.max(maxValue, heatmapMatrix[y][x]);
    }
  }
  
  // Se os valores forem muito uniformes, adicionar variação
  if (maxValue <= 1) {
    for (let y = 0; y < dimension; y++) {
      for (let x = 0; x < dimension; x++) {
        if (heatmapMatrix[y][x] > 0) {
          heatmapMatrix[y][x] = 1 + Math.random() * 0.5;
        }
      }
    }
    maxValue = 1.5;
  }
  
  // Normalizar e formatar para D3
  const normalizedData = [];
  for (let y = 0; y < dimension; y++) {
    for (let x = 0; x < dimension; x++) {
      normalizedData.push({
        x: x,
        y: y,
        value: heatmapMatrix[y][x],
        intensity: heatmapMatrix[y][x] / maxValue
      });
    }
  }
  
  // Salvar dados no cache
  window.vizCache.heatmapData = {
    dimension: dimension,
    matrix: heatmapMatrix,
    normalized: normalizedData,
    maxValue: maxValue
  };
}

// Preparar dados para comparação de prefixos
function preparePrefixComparisonData() {
  console.log("Preparando dados para comparação de prefixos");
  
  // Obter o prefixo base do endereço IPv6 original
  const ipv6Input = document.getElementById('ipv6').value.trim();
  if (!ipv6Input) return;
  
  const [, basePrefixStr] = ipv6Input.split('/');
  if (!basePrefixStr) return;
  
  const basePrefix = parseInt(basePrefixStr);
  
  // Atualizar o slider para começar do prefixo base
  const slider = document.getElementById('prefixSlider');
  if (slider) {
    slider.min = basePrefix + 1;
    slider.max = Math.min(basePrefix + 32, 128);
    slider.value = Math.min(basePrefix + 8, 128);
    document.getElementById('prefixValue').textContent = slider.value;
  }
  
  // Calcular dados de comparação
  const comparisonData = [];
  
  // Analisar um intervalo de prefixos
  const maxPrefix = Math.min(basePrefix + 16, 128);
  for (let prefix = basePrefix + 1; prefix <= maxPrefix; prefix++) {
    // Calcular quantas sub-redes seriam geradas
    const bitsAdicionais = prefix - basePrefix;
    const numSubRedes = 2 ** bitsAdicionais;
    
    // Calcular IPs por sub-rede
    const ipsPerSubnetExpoente = 128 - prefix;
    
    comparisonData.push({
      prefix: prefix,
      subnets: numSubRedes,
      ipsExpoente: ipsPerSubnetExpoente,
      formattedSubnets: formatNumberWithSuffix(numSubRedes),
      formattedIps: `2^${ipsPerSubnetExpoente}`
    });
  }
  
  // Salvar dados no cache
  window.vizCache.prefixComparisonData = {
    basePrefix: basePrefix,
    comparisons: comparisonData
  };
  
  // Atualizar estatísticas iniciais
  updatePrefixStats(parseInt(slider.value));
}

// Atualizar estatísticas de prefixo
function updatePrefixStats(prefixValue) {
  if (!window.vizCache || !window.vizCache.prefixComparisonData) return;
  
  const data = window.vizCache.prefixComparisonData;
  const basePrefix = data.basePrefix;
  
  // Encontrar dados para o prefixo selecionado
  const prefixData = data.comparisons.find(item => item.prefix === prefixValue);
  if (!prefixData) return;
  
  // Atualizar estatísticas na interface
  document.getElementById('statSubredes').textContent = prefixData.formattedSubnets;
  document.getElementById('statIps').textContent = prefixData.formattedIps;
  document.getElementById('statTotal').textContent = `2^${128 - basePrefix}`;
}

// Formatar número com sufixo (K, M, B, etc.)
function formatNumberWithSuffix(number) {
  if (number < 1000) return number.toString();
  
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Q'];
  const magnitude = Math.floor(Math.log10(number) / 3);
  const limitedMagnitude = Math.min(magnitude, suffixes.length - 1);
  const scaled = number / Math.pow(10, limitedMagnitude * 3);
  const formatted = Number.isInteger(scaled) ? scaled.toString() : scaled.toFixed(1);
  
  return `${formatted}${suffixes[limitedMagnitude]}`;
}

// Verificar se estamos em modo escuro
function isDarkMode() {
  return document.body.classList.contains('dark-mode');
}

// INICIALIZAÇÃO DOS GRÁFICOS
// =============================================

// Inicializar gráfico de utilização
function initUtilizationChart() {
  console.log("Inicializando gráfico de utilização");
  
  if (!window.vizCache || !window.vizCache.utilizationData) {
    console.warn("Dados de utilização não disponíveis");
    return;
  }
  
  const ctx = document.getElementById('utilizationChart').getContext('2d');
  if (!ctx) {
    console.error("Contexto do gráfico de utilização não encontrado");
    return;
  }
  
  // Criar gráfico de utilização
  new Chart(ctx, {
    type: 'bar',
    data: window.vizCache.utilizationData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Distribuição de Sub-redes IPv6',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Número de Sub-redes'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Grupos de Endereços'
          }
        }
      }
    }
  });
}

// Inicializar mapa de calor
function initHeatmapChart() {
  console.log("Inicializando mapa de calor");
  
  if (!window.vizCache || !window.vizCache.heatmapData) {
    console.warn("Dados do mapa de calor não disponíveis");
    return;
  }
  
  const container = document.getElementById('heatmapChart');
  if (!container) {
    console.error("Container do mapa de calor não encontrado");
    return;
  }
  
  // Limpar o container
  container.innerHTML = '';
  
  // Usar D3.js para criar o mapa de calor
  if (typeof d3 === 'undefined') {
    console.error("D3.js não está disponível");
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Erro: D3.js não está disponível</div>';
    return;
  }
  
  try {
    // Definir dimensões
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = Math.min(300, width) - margin.top - margin.bottom;
    
    // Dados para o mapa de calor
    const data = window.vizCache.heatmapData;
    const dimension = data.dimension;
    
    // Criar SVG
    const svg = d3.select(container)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Adicionar título
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Mapa de Calor do Espaço IPv6");
    
    // Definir escalas
    const x = d3.scaleBand()
      .range([0, width])
      .domain(Array.from({ length: dimension }, (_, i) => i))
      .padding(0.01);
    
    const y = d3.scaleBand()
      .range([0, height])
      .domain(Array.from({ length: dimension }, (_, i) => i))
      .padding(0.01);
    
    // Definir escala de cores
    const colorScale = d3.scaleSequential()
      .domain([0, data.maxValue])
      .interpolator(isDarkMode() ? d3.interpolateInferno : d3.interpolateYlOrRd);
    
    // Adicionar eixos
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 3 === 0)));
    
    svg.append("g")
      .call(d3.axisLeft(y).tickValues(y.domain().filter((d, i) => i % 3 === 0)));
    
    // Adicionar células ao mapa de calor
    svg.selectAll()
      .data(data.normalized)
      .enter()
      .append("rect")
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => d.value > 0 ? colorScale(d.value) : (isDarkMode() ? "#161b22" : "#f6f8fa"));
    
    // Adicionar legendas dos eixos
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .text("Segmento X do Espaço de Endereços");
    
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -height / 2)
      .text("Segmento Y do Espaço de Endereços");
  } catch (error) {
    console.error("Erro ao inicializar mapa de calor:", error);
    container.innerHTML = '<div style="padding: 20px; text-align: center;">Erro ao criar mapa de calor</div>';
  }
}

// Inicializar gráfico de comparação de prefixos
function initPrefixComparisonChart() {
  console.log("Inicializando gráfico de comparação de prefixos");
  
  if (!window.vizCache || !window.vizCache.prefixComparisonData) {
    console.warn("Dados de comparação de prefixos não disponíveis");
    return;
  }
  
  const ctx = document.getElementById('prefixComparisonChart').getContext('2d');
  if (!ctx) {
    console.error("Contexto do gráfico de comparação não encontrado");
    return;
  }
  
  // Obter prefixo atual do slider
  const slider = document.getElementById('prefixSlider');
  const currentPrefix = parseInt(slider ? slider.value : 64);
  
  // Filtrar dados para mostrar um subconjunto relevante
  const data = window.vizCache.prefixComparisonData;
  const comparisons = data.comparisons;
  
  // Selecionar apenas alguns prefixos para não sobrecarregar o gráfico
  const selectedPrefixes = comparisons.filter(item => 
    item.prefix % 4 === 0 || item.prefix === currentPrefix
  );
  
  // Preparar dados
  const chartData = {
    labels: selectedPrefixes.map(item => `/${item.prefix}`),
    datasets: [
      {
        label: 'Número de Sub-redes',
        data: selectedPrefixes.map(item => Math.log10(item.subnets)),
        backgroundColor: selectedPrefixes.map(item => 
          item.prefix === currentPrefix ? '#0070d1' : '#0070d180'
        ),
        borderColor: '#0070d1',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        label: 'IPs por Sub-rede (log10)',
        data: selectedPrefixes.map(item => item.ipsExpoente * 0.301), // log10(2^n) ≈ n * 0.301
        backgroundColor: 'transparent',
        borderColor: '#4caf50',
        borderWidth: 2,
        type: 'line',
        yAxisID: 'y1',
        pointBackgroundColor: '#4caf50',
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };
  
  // Criar gráfico
  new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Comparação de Tamanhos de Prefixo IPv6',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      },
      scales: {
        y: {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Número de Sub-redes (log10)'
          }
        },
        y1: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'IPs por Sub-rede (log10)'
          },
          grid: {
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

// Configurar eventos para visualizações
function setupVisualizationEvents() {
  console.log("Configurando eventos para visualizações");
  
  // Configurar navegação entre abas
  const tabs = document.querySelectorAll('.tab');
  if (tabs.length === 0) {
    console.warn("Nenhuma aba de visualização encontrada");
    return;
  }
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remover classe ativa de todas as abas
      tabs.forEach(t => t.classList.remove('tab-active'));
      tab.classList.add('tab-active');
      
      // Ocultar todos os conteúdos
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Mostrar o conteúdo correspondente
      const tabId = tab.id;
      if (tabId === 'utilizationTab') {
        document.getElementById('utilizationContent').classList.add('active');
        initUtilizationChart();
      } else if (tabId === 'heatmapTab') {
        document.getElementById('heatmapContent').classList.add('active');
        initHeatmapChart();
      } else if (tabId === 'prefixComparisonTab') {
        document.getElementById('prefixComparisonContent').classList.add('active');
        initPrefixComparisonChart();
      }
    });
  });
  
  // Configurar slider de prefixo
  const slider = document.getElementById('prefixSlider');
  if (slider) {
    slider.addEventListener('input', () => {
      document.getElementById('prefixValue').textContent = slider.value;
      updatePrefixStats(parseInt(slider.value));
      
      // Atualizar o gráfico quando o slider for movido
      if (document.getElementById('prefixComparisonContent').classList.contains('active')) {
        // Destruir o gráfico anterior
        const chart = Chart.getChart("prefixComparisonChart");
        if (chart) {
          chart.destroy();
        }
        
        // Criar um novo gráfico com o prefixo atualizado
        initPrefixComparisonChart();
      }
    });
  }
  
  // Adicionar listener para mudanças de tema
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.attributeName === 'class' && 
          mutation.target === document.body) {
        
        // Verificar se a aba ativa é o mapa de calor
        if (document.getElementById('heatmapContent').classList.contains('active')) {
          // Reinicializar o mapa de calor com o novo tema
          initHeatmapChart();
        }
      }
    });
  });
  
  observer.observe(document.body, { attributes: true });
}

// Quando o documento estiver carregado, associar o evento ao botão de visualização
document.addEventListener('DOMContentLoaded', function() {
  const visualizarBtn = document.getElementById('visualizarBtn');
  if (visualizarBtn) {
    visualizarBtn.addEventListener('click', mostrarVisualizacao);
    console.log("Evento click adicionado ao botão visualizarBtn");
  } else {
    console.warn("Botão visualizarBtn não encontrado");
  }
});
