/**

 * Charts Core Module

 * 

 * Módulo central para gerenciamento de visualizações da Calculadora IPv6.

 * Este arquivo contém a inicialização e funções compartilhadas entre

 * todos os diferentes tipos de gráficos e visualizações.

 */



const VisualizationModule = (function() {

  'use strict';

  

  /**

   * Cache de dados para as visualizações

   * @private

   */

  const cache = {

    utilizationData: null,

    heatmapData: null,

    prefixComparisonData: null

  };

  

  /**

   * Referências aos objetos de gráficos

   * @private

   */

  const charts = {

    utilization: null,

    heatmap: null,

    prefixComparison: null

  };

  

  /**

   * Cores usadas nas visualizações

   */

  const colors = {

    primary: '#0070d1',

    secondary: '#4caf50',

    tertiary: '#ffa000',

    quaternary: '#e53935',

    background: '#f6f8fa',

    dark: {

      background: '#161b22',

      text: '#e6edf3'

    }

  };

  

  /**

   * Verifica se estamos em modo escuro

   * @returns {boolean} - Verdadeiro se o modo escuro estiver ativado

   */

  function isDarkMode() {

    return document.body.classList.contains('dark-mode');

  }

  

  /**

   * Carrega bibliotecas necessárias para visualizações

   * @param {Function} callback - Função a ser chamada quando tudo estiver carregado

   */

  function loadDependencies(callback) {

    let dependenciesToLoad = 0;

    let dependenciesLoaded = 0;

    

    function checkComplete() {

      dependenciesLoaded++;

      if (dependenciesLoaded === dependenciesToLoad) {

        if (callback) callback();

      }

    }

    

    // Verificar Chart.js

    if (typeof Chart === 'undefined') {

      dependenciesToLoad++;

      loadScript('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js', checkComplete);

    }

    

    // Verificar D3.js

    if (typeof d3 === 'undefined') {

      dependenciesToLoad++;

      loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js', checkComplete);

    }

    

    // Se todas as dependências já estão carregadas

    if (dependenciesToLoad === 0) {

      if (callback) callback();

    }

  }

  

  /**

   * Carrega um script externo

   * @param {string} url - URL do script

   * @param {Function} callback - Função a ser chamada quando o script for carregado

   */

  function loadScript(url, callback) {

    // Verificar se o script já está carregado

    if (document.querySelector(`script[src="${url}"]`)) {

      if (callback) callback();

      return;

    }

    

    const script = document.createElement('script');

    script.src = url;

    script.onload = callback;

    script.onerror = function() {

      console.error(`Erro ao carregar script: ${url}`);

    };

    document.head.appendChild(script);

  }

  

  /**

   * Inicializa todas as visualizações

   */

  function initializeAllCharts() {

    loadDependencies(function() {

      // Primeiro identificar qual aba está ativa

      const activeTab = document.querySelector('.tab.tab-active');

      if (activeTab) {

        switch (activeTab.id) {

          case 'utilizationTab':

            initUtilizationChart();

            break;

          case 'heatmapTab':

            initHeatmapChart();

            break;

          case 'prefixComparisonTab':

            initPrefixComparisonChart();

            break;

        }

      } else {

        // Se nenhuma aba estiver ativa, ativar a primeira e mostrar seu conteúdo

        const firstTab = document.querySelector('.tab');

        if (firstTab) {

          firstTab.classList.add('tab-active');

          const contentId = firstTab.id.replace('Tab', 'Content');

          const content = document.getElementById(contentId);

          if (content) {

            content.classList.add('active');

          }

          

          // Inicializar o gráfico da primeira aba

          initUtilizationChart();

        }

      }

    });

  }

  

  /**

   * Atualiza as estatísticas de prefixo na interface

   * @param {number} prefix - Valor do prefixo

   */

  function updatePrefixStats(prefix) {

    try {

      // Obter o prefixo base do endereço IPv6 original

      const ipv6Input = document.getElementById('ipv6').value.trim();

      const [, prefixoInicial] = ipv6Input.split('/');

      const basePrefix = parseInt(prefixoInicial) || 48; // Usar 48 como fallback

      

      // Calcular estatísticas

      const bitsAdicionais = prefix - basePrefix;

      const numSubRedes = Math.pow(2, bitsAdicionais);

      const ipsPerSubnet = Math.pow(2, 128 - prefix);

      

      // Formatar números grandes

      function formatBigNumber(num) {

        if (num < 1000) return num.toString();

        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';

        if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';

        if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';

        return num.toExponential(2);

      }

      

      // Atualizar elementos na interface

      document.getElementById('statSubredes').textContent = formatBigNumber(numSubRedes);

      document.getElementById('statIps').textContent = `${(128 - prefix).toFixed(0)} bits (~ ${ipsPerSubnet.toExponential(2)})`;

      document.getElementById('statTotal').textContent = formatBigNumber(numSubRedes * ipsPerSubnet);

    } catch (error) {

      console.error("Erro ao atualizar estatísticas de prefixo:", error);

    }

  }

  

  /**

   * Atualiza todos os gráficos quando o tema muda

   */

  function updateChartsForTheme() {

    const visualizationSection = document.getElementById('visualizationSection');

    if (visualizationSection && visualizationSection.style.display === 'block') {

      initializeAllCharts();

    }

  }

  

  /**

   * Inicializa o gráfico de utilização

   */

  function initUtilizationChart() {

    if (typeof UtilizationChart !== 'undefined' && typeof UtilizationChart.initialize === 'function') {

      UtilizationChart.initialize(cache, charts, colors);

    } else {

      console.error("Módulo de gráfico de utilização não encontrado");

    }

  }

  

  /**

   * Inicializa o mapa de calor

   */

  function initHeatmapChart() {

    if (typeof HeatmapChart !== 'undefined' && typeof HeatmapChart.initialize === 'function') {

      HeatmapChart.initialize(cache, charts, colors);

    } else {

      console.error("Módulo de mapa de calor não encontrado");

    }

  }

  

  /**

   * Inicializa o gráfico de comparação de prefixos

   */

  function initPrefixComparisonChart() {

    if (typeof PrefixComparisonChart !== 'undefined' && typeof PrefixComparisonChart.initialize === 'function') {

      PrefixComparisonChart.initialize(cache, charts, colors);

    } else {

      console.error("Módulo de comparação de prefixos não encontrado");

    }

  }

  

  /**

   * Inicializa o módulo de visualização

   */

  function initialize() {

    try {

      console.log("Inicializando módulo de visualização base...");

      

      // Verificar se as bibliotecas necessárias estão presentes

      loadDependencies(function() {

        console.log("Dependências de visualização carregadas com sucesso");

      });

      

      console.log("Módulo base de visualização inicializado com sucesso");

    } catch (error) {

      console.error("Erro ao inicializar módulo base de visualização:", error);

    }

  }

  

  // Executar inicialização quando o DOM estiver pronto

  if (document.readyState === 'loading') {

    document.addEventListener('DOMContentLoaded', initialize);

  } else {

    initialize();

  }

  

  // API pública

  return {

    initializeAllCharts,

    initUtilizationChart,

    initHeatmapChart,

    initPrefixComparisonChart,

    updatePrefixStats,

    updateChartsForTheme,

    colors,

    cache,

    charts

  };

})();



// Expor globalmente para compatibilidade com código existente

window.VisualizationModule = VisualizationModule;