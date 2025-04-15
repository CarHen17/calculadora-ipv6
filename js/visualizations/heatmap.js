/**

 * Heatmap Chart Module

 * 

 * Este módulo implementa o mapa de calor para visualização da distribuição

 * espacial das sub-redes IPv6 no espaço de endereçamento.

 */



const HeatmapChart = (function() {

  'use strict';

  

  // Referências para compartilhamento com o módulo principal

  let cache = null;

  let charts = null;

  let colors = null;

  

  /**

   * Verifica se estamos em modo escuro

   * @returns {boolean} - Verdadeiro se o modo escuro estiver ativado

   */

  function isDarkMode() {

    return document.body.classList.contains('dark-mode');

  }

  

  /**

   * Inicializa o módulo com referências do módulo principal

   * @param {Object} globalCache - Cache global de dados

   * @param {Object} globalCharts - Referências aos objetos de gráficos

   * @param {Object} globalColors - Cores definidas para a aplicação

   */

  function initialize(globalCache, globalCharts, globalColors) {

    cache = globalCache;

    charts = globalCharts;

    colors = globalColors;

    

    // Inicializar o mapa de calor

    initChart();

  }

  

  /**

   * Inicializa o mapa de calor

   */

  function initChart() {

    try {

      if (typeof d3 === 'undefined') {

        console.error("D3.js não está disponível");

        return;

      }

      

      const container = document.getElementById('heatmapChart');

      if (!container) {

        console.error("Container do mapa de calor não encontrado");

        return;

      }

      

      // Preparar dados para o mapa de calor

      prepareHeatmapData();

      

      // Limpar o container

      container.innerHTML = '';

      

      // Verificar se temos dados para visualizar

      if (!cache.heatmapData) {

        console.error("Dados para mapa de calor não disponíveis");

        container.innerHTML = `

          <div style="padding: 20px; text-align: center; color: ${isDarkMode() ? '#e6edf3' : '#666'};">

            <p><strong>Nenhuma sub-rede selecionada para visualização</strong></p>

            <p>Selecione sub-redes na tabela para visualizar o mapa de calor.</p>

          </div>

        `;

        return;

      }

      

      // Definir dimensões

      const margin = { top: 40, right: 60, bottom: 50, left: 60 };

      const width = container.clientWidth - margin.left - margin.right;

      const height = 300 - margin.top - margin.bottom;

      

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

        .style("fill", isDarkMode() ? "#e6edf3" : "#24292f")

        .text("Mapa de Calor de Distribuição IPv6");

      

      // Definir escalas

      const x = d3.scaleBand()

        .range([0, width])

        .domain(Array.from({ length: cache.heatmapData.dimension }, (_, i) => i))

        .padding(0.05);

      

      const y = d3.scaleBand()

        .range([0, height])

        .domain(Array.from({ length: cache.heatmapData.dimension }, (_, i) => i))

        .padding(0.05);

      

      // Escala de cores

      const colorScale = d3.scaleSequential()

        .interpolator(isDarkMode() ? d3.interpolateInferno : d3.interpolateYlOrRd)

        .domain([0, cache.heatmapData.maxValue]);

      

      // Adicionar eixos

      svg.append("g")

        .attr("transform", `translate(0,${height})`)

        .call(d3.axisBottom(x))

        .selectAll("text")

        .style("fill", isDarkMode() ? "#e6edf3" : "#24292f");

      

      svg.append("g")

        .call(d3.axisLeft(y))

        .selectAll("text")

        .style("fill", isDarkMode() ? "#e6edf3" : "#24292f");

      

      // Adicionar células do mapa de calor

      svg.selectAll("rect")

        .data(cache.heatmapData.cells)

        .enter()

        .append("rect")

          .attr("x", d => x(d.x))

          .attr("y", d => y(d.y))

          .attr("width", x.bandwidth())

          .attr("height", y.bandwidth())

          .style("fill", d => colorScale(d.value))

          .style("stroke", isDarkMode() ? "#30363d" : "#e1e4e8")

          .style("stroke-width", 1)

          // Adicionar interatividade

          .on("mouseover", function(event, d) {

            // Destacar célula

            d3.select(this)

              .style("stroke", "#fff")

              .style("stroke-width", 2);

            

            // Criar tooltip

            const tooltip = document.createElement('div');

            tooltip.className = 'heatmap-tooltip';

            tooltip.style.position = 'absolute';

            tooltip.style.left = (event.pageX + 10) + 'px';

            tooltip.style.top = (event.pageY - 30) + 'px';

            tooltip.style.backgroundColor = isDarkMode() ? 

              'rgba(36, 41, 47, 0.95)' : 'rgba(255, 255, 255, 0.95)';

            tooltip.style.border = '1px solid #ccc';

            tooltip.style.borderRadius = '4px';

            tooltip.style.padding = '8px';

            tooltip.style.pointerEvents = 'none';

            tooltip.style.zIndex = '1000';

            tooltip.style.color = isDarkMode() ? '#e6edf3' : '#24292f';

            

            tooltip.innerHTML = `

              <div><strong>Posição:</strong> (${d.x}, ${d.y})</div>

              <div><strong>Valor:</strong> ${d.value.toFixed(2)}</div>

            `;

            

            document.body.appendChild(tooltip);

          })

          .on("mouseout", function() {

            // Remover destaque

            d3.select(this)

              .style("stroke", isDarkMode() ? "#30363d" : "#e1e4e8")

              .style("stroke-width", 1);

            

            // Remover tooltips

            document.querySelectorAll('.heatmap-tooltip').forEach(el => {

              if (el.parentNode) el.parentNode.removeChild(el);

            });

          });

      

      // Adicionar legenda de cores

      const legendWidth = 20;

      const legendHeight = height / 2;

      

      const legend = svg.append("g")

        .attr("transform", `translate(${width + 20}, ${height/4})`);

      

      // Gradiente para a legenda

      const numSteps = 20;

      for (let i = 0; i < numSteps; i++) {

        legend.append("rect")

          .attr("width", legendWidth)

          .attr("height", legendHeight / numSteps)

          .attr("y", i * (legendHeight / numSteps))

          .style("fill", colorScale(cache.heatmapData.maxValue - (i / numSteps) * cache.heatmapData.maxValue));

      }

      

      // Textos da legenda

      legend.append("text")

        .attr("x", legendWidth / 2)

        .attr("y", -10)

        .attr("text-anchor", "middle")

        .style("font-size", "12px")

        .style("fill", isDarkMode() ? "#e6edf3" : "#24292f")

        .text("Densidade");

      

      legend.append("text")

        .attr("x", legendWidth + 5)

        .attr("y", 0)

        .attr("text-anchor", "start")

        .style("font-size", "10px")

        .style("fill", isDarkMode() ? "#e6edf3" : "#24292f")

        .text("Alta");

      

      legend.append("text")

        .attr("x", legendWidth + 5)

        .attr("y", legendHeight)

        .attr("text-anchor", "start")

        .style("font-size", "10px")

        .style("fill", isDarkMode() ? "#e6edf3" : "#24292f")

        .text("Baixa");

      

      // Salvar referência

      charts.heatmap = svg;

      

      console.log("Mapa de calor inicializado com sucesso");

    } catch (error) {

      console.error("Erro ao inicializar mapa de calor:", error);

      

      // Exibir mensagem de erro no container

      const container = document.getElementById('heatmapChart');

      if (container) {

        container.innerHTML = `

          <div style="padding: 20px; text-align: center; color: #e53935;">

            <p><strong>Erro ao renderizar mapa de calor</strong></p>

            <p>Detalhes do erro: ${error.message}</p>

            <p>Tente recarregar a página ou selecionar outras sub-redes.</p>

          </div>

        `;

      }

    }

  }

  

  /**

   * Prepara dados para o mapa de calor

   */

  function prepareHeatmapData() {

    try {

      // Obter sub-redes selecionadas

      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');

      

      if (!window.appState || !window.appState.subRedesGeradas) {

        console.error("Estado da aplicação não encontrado");

        createDemoData();

        return;

      }

      

      const selectedSubnets = Array.from(checkboxes).map(checkbox => 

        window.appState.subRedesGeradas[parseInt(checkbox.value)]);

      

      if (selectedSubnets.length === 0) {

        console.warn("Nenhuma sub-rede selecionada para visualização");

        createDemoData();

        return;

      }

      

      // Dimensão da matriz para o mapa de calor

      const dimension = 8;

      

      // Criar matriz para armazenar valores

      const matrix = Array(dimension).fill().map(() => Array(dimension).fill(0));

      

      // Preencher matriz com dados das sub-redes

      selectedSubnets.forEach((subnet, index) => {

        // Extrair os primeiros dois grupos do endereço como indicadores de posição

        const parts = subnet.subnet.split('/')[0].split(':');

        let x = 0, y = 0;

        

        if (parts.length >= 2) {

          // Converter hexadecimal para inteiro e normalizar para dimensão

          const firstGroup = parseInt(parts[0], 16) || 0;

          const secondGroup = parseInt(parts[1], 16) || 0;

          

          x = Math.floor((firstGroup % 65536) * dimension / 65536);

          y = Math.floor((secondGroup % 65536) * dimension / 65536);

        } else {

          // Fallback para endereços malformados

          x = index % dimension;

          y = Math.floor(index / dimension) % dimension;

        }

        

        // Garantir que estamos dentro dos limites

        x = Math.min(Math.max(x, 0), dimension - 1);

        y = Math.min(Math.max(y, 0), dimension - 1);

        

        // Incrementar o valor na matriz

        matrix[y][x] += 1;

      });

      

      // Adicionar alguma variação para tornar a visualização mais interessante

      for (let y = 0; y < dimension; y++) {

        for (let x = 0; x < dimension; x++) {

          if (matrix[y][x] === 0) {

            // Adicionar ruído de fundo

            matrix[y][x] = Math.random() * 0.2;

          } else {

            // Adicionar variação para valores existentes

            matrix[y][x] += Math.random() * 0.5;

          }

        }

      }

      

      // Encontrar valor máximo

      let maxValue = 0;

      for (let y = 0; y < dimension; y++) {

        for (let x = 0; x < dimension; x++) {

          maxValue = Math.max(maxValue, matrix[y][x]);

        }

      }

      

      // Garantir que temos um valor máximo razoável

      maxValue = Math.max(maxValue, 1);

      

      // Converter para formato de células

      const cells = [];

      for (let y = 0; y < dimension; y++) {

        for (let x = 0; x < dimension; x++) {

          cells.push({

            x: x,

            y: y,

            value: matrix[y][x]

          });

        }

      }

      

      // Armazenar no cache

      cache.heatmapData = {

        dimension: dimension,

        maxValue: maxValue,

        cells: cells

      };

    } catch (error) {

      console.error("Erro ao preparar dados para mapa de calor:", error);

      createDemoData();

    }

  }

  

  /**

   * Cria dados de demonstração para o mapa de calor

   */

  function createDemoData() {

    const dimension = 8;

    const fallbackCells = [];

    

    // Criar alguns clusters para tornar a demonstração visualmente interessante

    const hotspots = [

      { x: 1, y: 1, intensity: 10 },

      { x: 6, y: 2, intensity: 8 },

      { x: 3, y: 6, intensity: 5 }

    ];

    

    // Gerar matriz com hotspots

    const matrix = Array(dimension).fill().map(() => Array(dimension).fill(0));

    

    for (let y = 0; y < dimension; y++) {

      for (let x = 0; x < dimension; x++) {

        // Valor base com um pouco de ruído

        let value = Math.random() * 0.5;

        

        // Adicionar influência dos hotspots

        hotspots.forEach(spot => {

          // Distância euclidiana ao hotspot

          const distance = Math.sqrt(Math.pow(x - spot.x, 2) + Math.pow(y - spot.y, 2));

          // Influência diminui com o quadrado da distância

          const influence = spot.intensity / (1 + distance * distance);

          value += influence;

        });

        

        matrix[y][x] = value;

      }

    }

    

    // Encontrar valor máximo

    let maxValue = 0;

    for (let y = 0; y < dimension; y++) {

      for (let x = 0; x < dimension; x++) {

        maxValue = Math.max(maxValue, matrix[y][x]);

      }

    }

    

    // Converter para formato de células

    const cells = [];

    for (let y = 0; y < dimension; y++) {

      for (let x = 0; x < dimension; x++) {

        cells.push({

          x: x,

          y: y,

          value: matrix[y][x]

        });

      }

    }

    

    // Armazenar no cache

    cache.heatmapData = {

      dimension: dimension,

      maxValue: maxValue,

      cells: cells

    };

  }

  

  // API pública

  return {

    initialize,

    prepareHeatmapData

  };

})();



// Exportar globalmente

window.HeatmapChart = HeatmapChart;