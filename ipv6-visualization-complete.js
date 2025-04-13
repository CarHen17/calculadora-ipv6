/**
 * Solução Completa para Visualizações da Calculadora IPv6
 * Este script integra todas as funcionalidades de visualização em um único arquivo
 * e corrige os problemas de inicialização dos gráficos.
 */

(function() {
  // Definir namespace global para visualizações
  window.ipv6viz = {
    // Estado dos gráficos
    charts: {
      utilization: null,
      heatmap: null,
      prefixComparison: null
    },
    
    // Cache para dados
    cache: {
      utilizationData: null,
      heatmapData: null,
      prefixComparisonData: null
    },
    
    // Cores padrão
    colors: {
      primary: '#0070d1',
      secondary: '#4caf50',
      tertiary: '#ffa000',
      quaternary: '#e53935'
    }
  };
  
  console.log("Inicializando módulo de visualização IPv6...");
  
  // PARTE 1: FUNÇÕES UTILITÁRIAS
  // =============================================
  
  // Verificar se estamos em modo escuro
  function isDarkMode() {
    return document.body.classList.contains('dark-mode');
  }
  
  // Gerar dados para o mapa de calor
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
      maxValue: maxValue,
      dimension: dimension
    };
  }
  
  // PARTE 2: PREPARAÇÃO DE DADOS
  // =============================================
  
  // Preparar dados para o gráfico de utilização
  window.ipv6viz.prepareUtilizationData = function(subredes) {
    console.log("Preparando dados para o gráfico de utilização");
    if (!subredes || subredes.length === 0) {
      console.warn("Sem sub-redes para preparar dados de utilização");
      return;
    }
    
    // Extrair prefixo para agrupar dados
    const prefix = parseInt(subredes[0].subnet.split('/')[1]);
    
    // Criar grupos de sub-redes para visualização
    const numGroups = Math.min(10, subredes.length);
    const groupSize = Math.ceil(subredes.length / numGroups);
    
    const groups = {};
    let groupIndex = 0;
    
    // Distribuir sub-redes em grupos
    for (let i = 0; i < subredes.length; i++) {
      const currentGroup = Math.floor(i / groupSize);
      const groupLabel = `Grupo ${currentGroup + 1}`;
      
      if (!groups[groupLabel]) {
        groups[groupLabel] = 0;
      }
      
      groups[groupLabel]++;
    }
    
    // Criar dados para o gráfico
    const labels = Object.keys(groups);
    const data = labels.map(label => groups[label]);
    
    // Gerar cores para os grupos
    const baseColors = [
      this.colors.primary,
      this.colors.secondary,
      this.colors.tertiary,
      this.colors.quaternary
    ];
    
    const backgroundColors = labels.map((_, i) => {
      const color = baseColors[i % baseColors.length];
      return color + (isDarkMode() ? '99' : 'B3'); // Adicionar transparência
    });
    
    const borderColors = labels.map((_, i) => {
      return baseColors[i % baseColors.length];
    });
    
    // Armazenar dados no cache
    this.cache.utilizationData = {
      labels: labels,
      datasets: [{
        label: 'Número de Sub-redes',
        data: data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1
      }]
    };
    
    console.log("Dados de utilização preparados com", labels.length, "grupos");
  };
  
  // Preparar dados para o mapa de calor
  window.ipv6viz.prepareHeatmapData = function(subredes) {
    console.log("Preparando dados para o mapa de calor");
    if (!subredes || subredes.length === 0) {
      console.warn("Sem sub-redes para preparar mapa de calor");
      
      // Gerar dados de exemplo para demonstração
      const demoData = generateDemoHeatmapData(12);
      this.cache.heatmapData = demoData;
      return;
    }
    
    // Definir a dimensão do mapa de calor
    const dimension = 12;
    
    // Criar matriz para o mapa de calor
    const heatmapMatrix = Array(dimension).fill().map(() => Array(dimension).fill(0));
    
    // Determinar quantas sub-redes processar (limitado por performance)
    const samplesToProcess = Math.min(subredes.length, 1000);
    
    // Distribuir sub-redes na matriz
    for (let i = 0; i < samplesToProcess; i++) {
      try {
        const subnet = subredes[i].subnet;
        const hexGroups = subnet.split('/')[0].split(':');
        
        // Usar os primeiros dois grupos como coordenadas
        const hex1 = parseInt(hexGroups[0], 16) || 0;
        const hex2 = parseInt(hexGroups[1], 16) || 0;
        
        // Mapear para as dimensões do mapa de calor
        const x = Math.floor((hex1 % 0xffff) * dimension / 0xffff);
        const y = Math.floor((hex2 % 0xffff) * dimension / 0xffff);
        
        // Incrementar a célula correspondente
        if (x < dimension && y < dimension) {
          heatmapMatrix[y][x]++;
        }
      } catch (error) {
        console.error("Erro ao processar sub-rede para mapa de calor:", error);
      }
    }
    
    // Encontrar o valor máximo
    let maxValue = 0;
    for (let y = 0; y < dimension; y++) {
      for (let x = 0; x < dimension; x++) {
        maxValue = Math.max(maxValue, heatmapMatrix[y][x]);
      }
    }
    
    // Se todas as células tiverem o mesmo valor, adicionar variação
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
        normalizedData.push({
          x: x,
          y: y,
          value: heatmapMatrix[y][x],
          intensity: heatmapMatrix[y][x] / maxValue
        });
      }
    }
    
    // Armazenar no cache
    this.cache.heatmapData = {
      dimension: dimension,
      matrix: heatmapMatrix,
      normalized: normalizedData,
      maxValue: maxValue
    };
    
    console.log("Dados do mapa de calor preparados com dimensão", dimension);
  };
  
  // Preparar dados para comparação de prefixos
  window.ipv6viz.preparePrefixComparisonData = function() {
    console.log("Preparando dados para comparação de prefixos");
    
    // Obter o prefixo base do endereço IPv6 original
    const ipv6Input = document.getElementById('ipv6').value.trim();
    if (!ipv6Input) {
      console.warn("Sem endereço IPv6 para comparação de prefixos");
      return;
    }
    
    const [, basePrefixStr] = ipv6Input.split('/');
    if (!basePrefixStr) {
      console.warn("Prefixo inválido para comparação");
      return;
    }
    
    const basePrefix = parseInt(basePrefixStr);
    
    // Atualizar o slider para começar a partir do prefixo base
    const slider = document.getElementById('prefixSlider');
    if (slider) {
      slider.min = basePrefix + 1;
      slider.max = Math.min(basePrefix + 32, 128);
      slider.value = Math.min(basePrefix + 8, 128);
      
      const prefixValueElement = document.getElementById('prefixValue');
      if (prefixValueElement) {
        prefixValueElement.textContent = slider.value;
      }
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
        formattedIps: `2^${ipsPerSubnetExpoente}`
      });
    }
    
    // Armazenar no cache
    this.cache.prefixComparisonData = {
      basePrefix: basePrefix,
      comparisons: comparisonData
    };
    
    console.log("Dados de comparação de prefixos preparados");
    
    // Atualizar estatísticas com o prefixo inicial
    this.updatePrefixStats(parseInt(slider.value));
  };
  
  // Atualizar estatísticas de prefixo
  window.ipv6viz.updatePrefixStats = function(prefixValue) {
    console.log("Atualizando estatísticas para prefixo", prefixValue);
    
    if (!this.cache.prefixComparisonData) return;
    
    const data = this.cache.prefixComparisonData;
    const basePrefix = data.basePrefix;
    
    // Encontrar dados para o prefixo selecionado
    const prefixData = data.comparisons.find(item => item.prefix === prefixValue);
    if (!prefixData) return;
    
    // Formatar números grandes
    function formatNumber(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + ' M';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + ' K';
      }
      return num.toString();
    }
    
    // Atualizar estatísticas na interface
    const statSubredes = document.getElementById('statSubredes');
    if (statSubredes) {
      statSubredes.textContent = formatNumber(prefixData.subnets);
    }
    
    const statIps = document.getElementById('statIps');
    if (statIps) {
      statIps.textContent = prefixData.formattedIps;
    }
    
    const statTotal = document.getElementById('statTotal');
    if (statTotal) {
      statTotal.textContent = `2^${128 - basePrefix}`;
    }
  };
  
  // PARTE 3: INICIALIZAÇÃO DOS GRÁFICOS
  // =============================================
  
  // Inicializar gráfico de utilização
  window.ipv6viz.initUtilizationChart = function() {
    console.log("Inicializando gráfico de utilização");
    
    if (!this.cache.utilizationData) {
      console.warn("Sem dados para o gráfico de utilização");
      return;
    }
    
    const ctx = document.getElementById('utilizationChart');
    if (!ctx) {
      console.error("Canvas para gráfico de utilização não encontrado");
      return;
    }
    
    // Destruir gráfico anterior se existir
    if (this.charts.utilization) {
      this.charts.utilization.destroy();
      this.charts.utilization = null;
    }
    
    // Criar novo gráfico
    try {
      this.charts.utilization = new Chart(ctx, {
        type: 'bar',
        data: this.cache.utilizationData,
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
                size: 16
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
                text: 'Grupos de Sub-redes'
              }
            }
          }
        }
      });
      
      console.log("Gráfico de utilização inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar gráfico de utilização:", error);
    }
  };
  
  // Inicializar mapa de calor
  window.ipv6viz.initHeatmapChart = function() {
    console.log("Inicializando mapa de calor");
    
    if (!this.cache.heatmapData) {
      console.warn("Sem dados para o mapa de calor");
      return;
    }
    
    const container = document.getElementById('heatmapChart');
    if (!container) {
      console.error("Container para mapa de calor não encontrado");
      return;
    }
    
    // Limpar o container
    container.innerHTML = '';
    
    // Usar D3.js para criar o mapa de calor
    if (typeof d3 === 'undefined') {
      console.error("D3.js não está carregado");
      container.innerHTML = '<div style="padding: 20px; text-align: center;">Erro: D3.js não está disponível</div>';
      return;
    }
    
    try {
      // Definir dimensões
      const margin = { top: 40, right: 30, bottom: 50, left: 60 };
      const width = Math.min(container.clientWidth - margin.left - margin.right, 600);
      const height = Math.min(width, 400) - margin.top - margin.bottom;
      
      // Dados para o mapa de calor
      const data = this.cache.heatmapData;
      const dimension = data.dimension;
      
      // Criar SVG
      const svg = d3.select(container)
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
      
      // Título
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
      const isDark = isDarkMode();
      const colorScale = d3.scaleSequential()
        .domain([0, data.maxValue])
        .interpolator(isDark ? d3.interpolateInferno : d3.interpolateYlOrRd);
      
      // Adicionar células ao mapa de calor
      svg.selectAll()
        .data(data.normalized)
        .enter()
        .append("rect")
          .attr("x", d => x(d.x))
          .attr("y", d => y(d.y))
          .attr("width", x.bandwidth())
          .attr("height", y.bandwidth())
          .style("fill", d => d.value > 0 ? colorScale(d.value) : (isDark ? "#161b22" : "#f6f8fa"))
          .style("stroke", "none");
      
      // Adicionar eixos
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => i % 3 === 0)));
      
      svg.append("g")
        .call(d3.axisLeft(y).tickValues(y.domain().filter((d, i) => i % 3 === 0)));
      
      // Adicionar legendas dos eixos
      svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .text("Segmento X do Espaço de Endereços");
      
      svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("y", -40)
        .attr("x", -height / 2)
        .text("Segmento Y do Espaço de Endereços");
      
      console.log("Mapa de calor inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar mapa de calor:", error);
      container.innerHTML = '<div style="padding: 20px; text-align: center;">Erro ao criar mapa de calor</div>';
    }
  };
  
  // Inicializar gráfico de comparação de prefixos
  window.ipv6viz.initPrefixComparisonChart = function() {
    console.log("Inicializando gráfico de comparação de prefixos");
    
    if (!this.cache.prefixComparisonData) {
      console.warn("Sem dados para comparação de prefixos");
      return;
    }
    
    const ctx = document.getElementById('prefixComparisonChart');
    if (!ctx) {
      console.error("Canvas para gráfico de comparação não encontrado");
      return;
    }
    
    // Destruir gráfico anterior se existir
    if (this.charts.prefixComparison) {
      this.charts.prefixComparison.destroy();
      this.charts.prefixComparison = null;
    }
    
    try {
      // Obter prefixo atual do slider
      const slider = document.getElementById('prefixSlider');
      const currentPrefix = parseInt(slider ? slider.value : 64);
      
      // Filtrar dados para mostrar um subconjunto relevante
      const data = this.cache.prefixComparisonData;
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
            backgroundColor: this.colors.primary + (isDarkMode() ? '99' : 'B3'),
            borderColor: this.colors.primary,
            borderWidth: 1,
            yAxisID: 'y',
            order: 1
          },
          {
            label: 'IPs por Sub-rede (log10)',
            data: selectedPrefixes.map(item => item.ipsExpoente * 0.301), // log10(2^n) ≈ n * 0.301
            backgroundColor: 'transparent',
            borderColor: this.colors.secondary,
            borderWidth: 2,
            type: 'line',
            yAxisID: 'y1',
            pointBackgroundColor: this.colors.secondary,
            pointRadius: 3,
            order: 0
          }
        ]
      };
      
      // Criar gráfico
      this.charts.prefixComparison = new Chart(ctx, {
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
                size: 16
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
      
      console.log("Gráfico de comparação de prefixos inicializado com sucesso");
    } catch (error) {
      console.error("Erro ao inicializar gráfico de comparação:", error);
    }
  };
  
  // PARTE 4: FUNÇÃO PRINCIPAL DE VISUALIZAÇÃO
  // =============================================
  
  // Inicializar visualizações
  window.ipv6viz.initializeVisualization = function() {
    console.log("Inicializando todas as visualizações");
    
    const subredes = window.appState?.subRedesGeradas || [];
    if (subredes.length === 0) {
      console.warn("Nenhuma sub-rede gerada para visualização");
    }
    
    // Preparar todos os dados
    this.prepareUtilizationData(subredes);
    this.prepareHeatmapData(subredes);
    this.preparePrefixComparisonData();
    
    // Inicializar o primeiro gráfico (visualização padrão)
    this.initUtilizationChart();
    
    // Configurar eventos para navegação entre visualizações
    this.setupVisualizationEvents();
    
    return true;
  };
  
  // Configurar eventos para visualizações
  window.ipv6viz.setupVisualizationEvents = function() {
    console.log("Configurando eventos para visualizações");
    
    // Configurar navegação entre abas
    const tabs = document.querySelectorAll('.tab');
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
          this.initUtilizationChart();
        } else if (tabId === 'heatmapTab') {
          document.getElementById('heatmapContent').classList.add('active');
          this.initHeatmapChart();
        } else if (tabId === 'prefixComparisonTab') {
          document.getElementById('prefixComparisonContent').classList.add('active');
          this.initPrefixComparisonChart();
        }
      });
    });
    
    // Configurar slider de prefixo
    const slider = document.getElementById('prefixSlider');
    if (slider) {
      slider.addEventListener('input', () => {
        document.getElementById('prefixValue').textContent = slider.value;
        this.updatePrefixStats(parseInt(slider.value));
      });
    }
  };
})();

/**
 * Função de inicialização da visualização (exposta globalmente para acesso do HTML)
 */
function mostrarVisualizacao() {
  try {
    console.log("Função mostrarVisualizacao chamada");
    
    // Verificar se há sub-redes
    if (window.appState.subRedesGeradas.length === 0) {
      alert("Gere sub-redes primeiro para visualizar os dados.");
      return;
    }
    
    // Atualizar o passo atual
    if (window.ui && window.ui.updateStep) {
      window.ui.updateStep(4);
    }
    
    // Mostrar a seção de visualização
    const vizSection = document.getElementById('visualizationSection');
    if (vizSection) {
      vizSection.style.display = 'block';
      vizSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Verificar se temos a função de visualização disponível
    if (window.ipv6viz && window.ipv6viz.initializeVisualization) {
      window.ipv6viz.initializeVisualization();
    } else {
      // Se o módulo de visualização não foi carregado, usar o método de fallback
      console.warn("Módulo ipv6viz não disponível, usando método de fallback");
      if (window.ui && window.ui.initializeCharts) {
        // Destruir gráficos existentes primeiro
        if (Chart && Chart.instances) {
          Object.values(Chart.instances).forEach(chart => {
            try {
              chart.destroy();
            } catch (e) {
              console.warn("Erro ao destruir gráfico:", e);
            }
          });
        }
        window.ui.initializeCharts();
      } else {
        console.error("Nenhum método de visualização disponível");
        alert("Erro: Módulo de visualização não está disponível.");
      }
    }
  } catch (error) {
    console.error("Erro ao mostrar visualização:", error);
    alert("Ocorreu um erro ao carregar as visualizações. Verifique o console para detalhes.");
  }
}

// Adicionar evento ao botão de visualização
document.addEventListener('DOMContentLoaded', function() {
  const visualizarBtn = document.getElementById('visualizarBtn');
  if (visualizarBtn) {
    visualizarBtn.addEventListener('click', mostrarVisualizacao);
    console.log("Evento click adicionado ao botão visualizarBtn");
  }
});
