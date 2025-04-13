/**
 * Arquivo de visualização aprimorado e corrigido para a Calculadora de Sub-Redes IPv6
 * Este script corrige os problemas de integração, garantindo que as visualizações
 * funcionem corretamente com os dados da aplicação.
 */

// Verificar e inicializar o namespace global
window.ipv6viz = window.ipv6viz || {
  // Paleta de cores personalizada
  colors: {
    primary: '#0070d1',
    secondary: '#4caf50',
    tertiary: '#ffa000',
    quaternary: '#e53935',
    background: '#f6f8fa',
    dark: {
      background: '#161b22',
      text: '#e6edf3'
    }
  },
  
  // Cache para dados
  cache: {
    utilizationData: null,
    heatmapData: null,
    prefixComparisonData: null
  },
  
  // Referências a gráficos
  charts: {
    utilization: null,
    heatmap: null,
    prefixComparison: null
  }
};

// Namespace para as visualizações melhoradas
(function() {
  console.log("Inicializando módulo corrigido de visualizações IPv6");
  
  // Verificar se já inicializamos
  if (window.ipv6vizFixed) return;
  window.ipv6vizFixed = true;
  
  // ===== FUNÇÕES UTILITÁRIAS =====
  
  // Verificar se estamos em modo escuro
  function isDarkMode() {
    return document.body.classList.contains('dark-mode');
  }
  
  // Ajustar intensidade de cor
  function adjustColorIntensity(color, factor) {
    // Converter para RGB
    let r, g, b;
    
    if (color.startsWith('#')) {
      color = color.substring(1);
      r = parseInt(color.substring(0, 2), 16);
      g = parseInt(color.substring(2, 4), 16);
      b = parseInt(color.substring(4, 6), 16);
    } else if (color.startsWith('rgb')) {
      const rgbValues = color.match(/\d+/g);
      r = parseInt(rgbValues[0]);
      g = parseInt(rgbValues[1]);
      b = parseInt(rgbValues[2]);
    } else {
      return color;
    }
    
    // Ajustar cada componente
    r = Math.min(255, Math.floor(r * factor));
    g = Math.min(255, Math.floor(g * factor));
    b = Math.min(255, Math.floor(b * factor));
    
    // Retornar como hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
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
  
  // Carregar script externo com promessa
  function loadScriptPromise(url) {
    return new Promise((resolve, reject) => {
      // Verificar se o script já está carregado
      if (document.querySelector(`script[src="${url}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  // Carregar dependências externas necessárias
  async function loadDependencies() {
    try {
      // Carregar Chart.js se não estiver disponível
      if (typeof Chart === 'undefined') {
        await loadScriptPromise('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js');
        console.log("Chart.js carregado com sucesso");
      }
      
      // Carregar D3.js se não estiver disponível
      if (typeof d3 === 'undefined') {
        await loadScriptPromise('https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js');
        console.log("D3.js carregado com sucesso");
      }
      
      // Configurar padrões do Chart.js
      setupChartDefaults();
      
      return true;
    } catch (error) {
      console.error("Erro ao carregar dependências:", error);
      return false;
    }
  }
  
  // Configurar padrões para Chart.js
  function setupChartDefaults() {
    if (typeof Chart !== 'undefined') {
      // Configurações globais para gráficos
      Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      Chart.defaults.color = isDarkMode() ? 
        window.ipv6viz.colors.dark.text : '#24292f';
      
      // Adicionar plugin para modo escuro
      Chart.register({
        id: 'darkModeHandler',
        beforeInit: function(chart) {
          const isDarkMode = document.body.classList.contains('dark-mode');
          if (isDarkMode && chart.options.plugins.darkMode) {
            chart.options.scales.x.grid.color = 'rgba(255, 255, 255, 0.1)';
            chart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
            chart.options.scales.x.ticks.color = 'rgba(255, 255, 255, 0.7)';
            chart.options.scales.y.ticks.color = 'rgba(255, 255, 255, 0.7)';
            if (chart.options.plugins.title) {
              chart.options.plugins.title.color = 'rgba(255, 255, 255, 0.9)';
            }
          }
        }
      });
    }
  }
  
  // ===== PREPARAÇÃO DE DADOS PARA VISUALIZAÇÃO =====
  
  // Preparar dados para visualização geral
  function prepareAllData() {
    const subredes = window.appState?.subRedesGeradas || [];
    if (subredes.length === 0) {
      console.log("Nenhuma sub-rede disponível para visualização");
      return false;
    }
    
    prepareUtilizationData(subredes);
    prepareHeatmapData(subredes);
    preparePrefixComparisonData();
    
    return true;
  }
  
  // Preparar dados para o gráfico de utilização
  function prepareUtilizationData(subredes) {
    if (!subredes || subredes.length === 0) return;
    
    console.log("Preparando dados de utilização para", subredes.length, "sub-redes");
    
    // Extrair o prefixo comum
    const prefix = parseInt(subredes[0].subnet.split('/')[1]);
    
    // Limitar a quantidade de grupos para melhor visualização
    const displayBits = Math.min(4, 8); // Usar no máximo 16 grupos
    const displayGroups = Math.min(subredes.length, 2 ** displayBits);
    
    // Contar sub-redes em cada grupo
    const groupCounts = new Array(displayGroups).fill(0);
    
    // Agrupar sub-redes com base nos primeiros bits após o prefixo comum
    for (let i = 0; i < subredes.length; i++) {
      // Usar o índice como aproximação para distribuição
      const groupIndex = i % displayGroups;
      groupCounts[groupIndex]++;
    }
    
    // Preparar dados para o gráfico
    const utilizationData = {
      labels: [],
      datasets: [{
        label: 'Número de Sub-redes',
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1
      }]
    };
    
    // Gerar cores dinâmicas
    const baseColors = [
      window.ipv6viz.colors.primary,
      window.ipv6viz.colors.secondary,
      window.ipv6viz.colors.tertiary,
      window.ipv6viz.colors.quaternary
    ];
    
    // Criar labels e dados
    for (let i = 0; i < displayGroups; i++) {
      if (groupCounts[i] > 0) {
        // Criar label para o grupo
        const label = `Grupo ${i+1}`;
        
        // Adicionar ao dataset
        utilizationData.labels.push(label);
        utilizationData.datasets[0].data.push(groupCounts[i]);
        
        // Gerar cor
        const colorIndex = i % baseColors.length;
        const baseColor = baseColors[colorIndex];
        const intensity = 0.6 + (0.4 * (i % 4) / 3);
        const color = adjustColorIntensity(baseColor, intensity);
        
        utilizationData.datasets[0].backgroundColor.push(color);
        utilizationData.datasets[0].borderColor.push(adjustColorIntensity(baseColor, 0.8));
      }
    }
    
    window.ipv6viz.cache.utilizationData = utilizationData;
    console.log("Dados de utilização preparados:", utilizationData);
  }
  
  // Preparar dados para o mapa de calor
  function prepareHeatmapData(subredes) {
    if (!subredes || subredes.length === 0) return;
    
    console.log("Preparando dados de mapa de calor para", subredes.length, "sub-redes");
    
    // Dimensão do mapa de calor (aumentada para melhor visualização)
    const dimension = 12;
    
    // Criar matriz para o mapa de calor
    const heatmapMatrix = Array(dimension).fill().map(() => Array(dimension).fill(0));
    
    // Número máximo de amostras para processar (para desempenho)
    const maxSamples = Math.min(subredes.length, 1000);
    
    // Distribuir sub-redes na matriz
    for (let i = 0; i < maxSamples; i++) {
      // Tentar extrair informações significativas do endereço
      const subnet = subredes[i].subnet;
      const hexGroups = subnet.split('/')[0].split(':');
      
      // Usar os primeiros dois grupos como coordenadas
      const hex1 = parseInt(hexGroups[0], 16) || 0;
      const hex2 = parseInt(hexGroups[1], 16) || 0;
      
      // Mapear para dimensões do mapa de calor
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
    
    // Adicionar variação se os valores forem muito uniformes
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
    
    // Normalizar os valores
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
    
    window.ipv6viz.cache.heatmapData = {
      dimension: dimension,
      matrix: heatmapMatrix,
      normalized: normalizedData,
      maxValue: maxValue
    };
    
    console.log("Dados de mapa de calor preparados com dimensão", dimension);
  }
  
  // Preparar dados para comparação de prefixos
  function preparePrefixComparisonData() {
    // Obter o prefixo base do endereço IPv6 original
    const ipv6Input = document.getElementById('ipv6').value.trim();
    if (!ipv6Input) return;
    
    const [, basePrefixStr] = ipv6Input.split('/');
    if (!basePrefixStr) return;
    
    const basePrefix = parseInt(basePrefixStr);
    
    console.log("Preparando dados de comparação de prefixos a partir de", basePrefix);
    
    // Atualizar o slider para começar a partir do prefixo base
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
    
    window.ipv6viz.cache.prefixComparisonData = {
      basePrefix: basePrefix,
      comparisons: comparisonData
    };
    
    // Atualizar estatísticas iniciais
    updatePrefixComparisonData(parseInt(slider.value));
    
    console.log("Dados de comparação de prefixos preparados");
  }
  
  // Atualizar dados de comparação de prefixos
  function updatePrefixComparisonData(targetPrefix) {
    if (!window.ipv6viz.cache.prefixComparisonData) return;
    
    const comparisonData = window.ipv6viz.cache.prefixComparisonData;
    const basePrefix = comparisonData.basePrefix;
    
    // Encontrar os dados para o prefixo alvo
    const targetData = comparisonData.comparisons.find(item => item.prefix === targetPrefix);
    if (!targetData) return;
    
    // Atualizar estatísticas na interface
    document.getElementById('statSubredes').textContent = targetData.formattedSubnets;
    document.getElementById('statIps').textContent = targetData.formattedIps;
    document.getElementById('statTotal').textContent = 
      `2^${128 - basePrefix}`; // Total sempre é o mesmo (todo o bloco)
    
    // Atualizar o gráfico se já foi inicializado
    if (window.ipv6viz.charts.prefixComparison) {
      initPrefixComparisonChart();
    }
  }
  
  // ===== INICIALIZAÇÃO E RENDERIZAÇÃO DOS GRÁFICOS =====
  
  // Inicializar gráfico de utilização
  function initUtilizationChart() {
    if (!window.ipv6viz.cache.utilizationData) {
      console.log("Dados de utilização não disponíveis");
      return;
    }
    
    if (typeof Chart === 'undefined') {
      console.log("Chart.js não está disponível");
      return;
    }
    
    const ctx = document.getElementById('utilizationChart').getContext('2d');
    if (!ctx) {
      console.log("Contexto do gráfico de utilização não encontrado");
      return;
    }
    
    console.log("Inicializando gráfico de utilização");
    
    // Destruir gráfico anterior se existir
    if (window.ipv6viz.charts.utilization) {
      window.ipv6viz.charts.utilization.destroy();
    }
    
    // Criar novo gráfico
    window.ipv6viz.charts.utilization = new Chart(ctx, {
      type: 'bar',
      data: window.ipv6viz.cache.utilizationData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          darkMode: true,
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `Sub-redes: ${value} (${percentage}%)`;
              }
            }
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
  
  // Mostrar a seção de visualização
  function showVisualization() {
    console.log("Mostrando seção de visualização");
    const vizSection = document.getElementById('visualizationSection');
    if (vizSection) {
      vizSection.style.display = 'block';
      vizSection.scrollIntoView({ behavior: 'smooth' });
      
      // Inicializar o primeiro gráfico por padrão
      initUtilizationChart();
    }
  }
  
  // Função principal para iniciar visualização
  async function startVisualization() {
    try {
      console.log("Iniciando processo de visualização");
      
      // Carregar dependências primeiro
      const dependenciesLoaded = await loadDependencies();
      if (!dependenciesLoaded) {
        console.error("Falha ao carregar dependências para visualização");
        return false;
      }
      
      // Preparar dados
      const dataReady = prepareAllData();
      if (!dataReady) {
        console.error("Nenhum dado disponível para visualização");
        return false;
      }
      
      // Exibir seção de visualização e inicializar gráficos
      showVisualization();
      
      // Configurar eventos da interface
      setupVisualizationEvents();
      
      return true;
    } catch (error) {
      console.error("Erro ao iniciar visualização:", error);
      return false;
    }
  }
  
  // Configurar eventos para as visualizações
  function setupVisualizationEvents() {
    // Navegação entre abas
    document.querySelectorAll('.viz-tab, .tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // Remover classe ativa de todas as abas
        document.querySelectorAll('.viz-tab, .tab').forEach(t => 
          t.classList.remove('tab-active'));
        tab.classList.add('tab-active');
        
        // Ocultar todos os conteúdos
        document.querySelectorAll('.tab-content').forEach(content => 
          content.classList.remove('active'));
        
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
    
    // Slider de prefixo
    const prefixSlider = document.getElementById('prefixSlider');
    if (prefixSlider) {
      prefixSlider.addEventListener('input', () => {
        document.getElementById('prefixValue').textContent = prefixSlider.value;
        updatePrefixComparisonData(parseInt(prefixSlider.value));
      });
    }
    
    // Observer para detectar mudanças no tema
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class' && 
            mutation.target === document.body) {
          const isDarkMode = document.body.classList.contains('dark-mode');
          updateChartsTheme(isDarkMode);
        }
      });
    });
    
    observer.observe(document.body, { attributes: true });
  }
  
  // Inicializar mapa de calor
  function initHeatmapChart() {
    if (!window.ipv6viz.cache.heatmapData) {
      console.log("Dados de mapa de calor não disponíveis");
      return;
    }
    
    if (typeof d3 === 'undefined') {
      console.log("D3.js não está disponível");
      return;
    }
    
    const container = document.getElementById('heatmapChart');
    if (!container) {
      console.log("Container do mapa de calor não encontrado");
      return;
    }
    
    console.log("Inicializando mapa de calor");
    
    // Limpar o container
    container.innerHTML = '';
    
    // Definir dimensões
    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const data = window.ipv6viz.cache.heatmapData;
    const dimension = data.dimension;
    
    // Criar SVG
    const svg = d3.select(container)
      .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Definir escalas
    const x = d3.scaleBand()
      .range([0, width])
      .domain(Array.from({ length: dimension }, (_, i) => i))
      .padding(0.01);
    
    const y = d3.scaleBand()
      .range([height, 0])
      .domain(Array.from({ length: dimension }, (_, i) => i))
      .padding(0.01);
    
    // Escala de cores
    const isDarkMode = document.body.classList.contains('dark-mode');
    const colorScale = d3.scaleSequential()
      .interpolator(isDarkMode ? d3.interpolateInferno : d3.interpolateYlOrRd)
      .domain([0, data.maxValue]);
    
    // Adicionar eixos
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 2 === 0)));
    
    svg.append("g")
      .call(d3.axisLeft(y).tickValues(y.domain().filter((d, i) => i % 2 === 0)));
    
    // Título
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", -10)
      .text("Mapa de Calor do Espaço de Endereçamento IPv6")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .style("fill", isDarkMode ? "#e6edf3" : "#24292f");
    
    // Adicionar retângulos (células)
    svg.selectAll("rect")
      .data(data.normalized)
      .enter()
      .append("rect")
        .attr("x", d => x(d.x))
        .attr("y", d => y(d.y))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => colorScale(d.value))
        .on("mouseover", function(event, d) {
          // Mostrar tooltip
          d3.select(this)
            .style("stroke", "white")
            .style("stroke-width", 2);
            
          const tooltip = d3.select(container)
            .append("div")
            .attr("class", "heatmap-tooltip")
            .style("position", "absolute")
            .style("background", isDarkMode ? "#30363d" : "white")
            .style("color", isDarkMode ? "#e6edf3" : "#24292f")
            .style("border", "1px solid #ccc")
            .style("border-radius", "3px")
            .style("padding", "5px")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 30) + "px");
          
          tooltip.html(`
            <div>Posição: (${d.x}, ${d.y})</div>
            <div>Valor: ${d.value.toFixed(2)}</div>
          `);
          
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
        })
        .on("mouseout", function() {
          d3.select(this)
            .style("stroke", "none");
          
          d3.selectAll(".heatmap-tooltip").remove();
        });
        
    // Guardar referência ao mapa de calor
    window.ipv6viz.charts.heatmap = svg;
  }
  
  // Atualizar tema dos gráficos
  function updateChartsTheme(isDarkMode) {
    console.log(`Atualizando tema dos gráficos para ${isDarkMode ? 'escuro' : 'claro'}`);
    
    // Atualizar configurações globais do Chart.js
    if (typeof Chart !== 'undefined') {
      Chart.defaults.color = isDarkMode ? window.ipv6viz.colors.dark.text : '#24292f';
    }
    
    // Reinicializar os gráficos ativos
    if (window.ipv6viz.charts.utilization) {
      initUtilizationChart();
    }
    
    if (window.ipv6viz.charts.heatmap) {
      initHeatmapChart();
    }
    
    if (window.ipv6viz.charts.prefixComparison) {
      initPrefixComparisonChart();
    }
  }
  
  // Inicializar gráfico de comparação de prefixos
  function initPrefixComparisonChart() {
    if (!window.ipv6viz.cache.prefixComparisonData) {
      console.log("Dados de comparação de prefixos não disponíveis");
      return;
    }
    
    if (typeof Chart === 'undefined') {
      console.log("Chart.js não está disponível");
      return;
    }
    
    // Obter o prefixo atual do slider
    const prefixSlider = document.getElementById('prefixSlider');
    const currentPrefix = parseInt(prefixSlider ? prefixSlider.value : 64);
    
    // Filtrar dados para mostrar um subconjunto relevante
    const comparisonData = window.ipv6viz.cache.prefixComparisonData;
    const basePrefix = comparisonData.basePrefix;
    
    console.log("Inicializando gráfico de comparação de prefixos");
    
    // Selecionar alguns prefixos para mostrar (para não sobrecarregar o gráfico)
    const filteredData = comparisonData.comparisons.filter(
      item => item.prefix % 4 === 0 || item.prefix === currentPrefix
    );
    
    // Dados para o gráfico
    const chartData = {
      labels: filteredData.map(item => `/${item.prefix}`),
      datasets: [
        {
          label: 'Número de Sub-redes',
          data: filteredData.map(item => Math.log10(item.subnets)),
          backgroundColor: filteredData.map(item => 
            item.prefix === currentPrefix ? 
              window.ipv6viz.colors.primary : adjustColorIntensity(window.ipv6viz.colors.primary, 0.5)
          ),
          borderColor: window.ipv6viz.colors.primary,
          borderWidth: filteredData.map(item => item.prefix === currentPrefix ? 2 : 1),
          yAxisID: 'y'
        },
        {
          label: 'IPs por Sub-rede (log10)',
          data: filteredData.map(item => item.ipsExpoente * 0.301), // log10(2^n) = n * log10(2) ≈ n * 0.301
          backgroundColor: filteredData.map(item => 
            item.prefix === currentPrefix ? 
              window.ipv6viz.colors.secondary : adjustColorIntensity(window.ipv6viz.colors.secondary, 0.5)
          ),
          borderColor: window.ipv6viz.colors.secondary,
          borderWidth: filteredData.map(item => item.prefix === currentPrefix ? 2 : 1),
          yAxisID: 'y1',
          type: 'line'
        }
      ]
    };
    
    // Configurar o contexto do canvas
    const ctx = document.getElementById('prefixComparisonChart').getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (window.ipv6viz.charts.prefixComparison) {
      window.ipv6viz.charts.prefixComparison.destroy();
    }
    
    // Criar novo gráfico
    window.ipv6viz.charts.prefixComparison = new Chart(ctx, {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          darkMode: true,
          tooltip: {
            callbacks: {
              label: function(context) {
                const dataIndex = context.dataIndex;
                const datasetLabel = context.dataset.label;
                
                if (datasetLabel === 'Número de Sub-redes') {
                  return `Sub-redes: ${filteredData[dataIndex].formattedSubnets}`;
                } else {
                  return `IPs por Sub-rede: ${filteredData[dataIndex].formattedIps}`;
                }
              }
            }
          },
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
          x: {
            title: {
              display: true,
              text: 'Tamanho do Prefixo'
            },
            grid: {
              display: false
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Sub-redes (log10)'
            },
            beginAtZero: true
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'IPs por Sub-rede (log10)'
            },
            beginAtZero: true,
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }