/**

 * Utilization Chart Module

 * 

 * Este módulo implementa o gráfico de utilização de sub-redes IPv6,

 * mostrando a distribuição e agrupamento das sub-redes geradas.

 */



const UtilizationChart = (function() {

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

    

    // Inicializar o gráfico de utilização

    initChart();

  }

  

  /**

   * Inicializa o gráfico de utilização

   */

  function initChart() {

    try {

      if (typeof Chart === 'undefined') {

        console.error("Chart.js não está disponível");

        return;

      }

      

      const utilizationCtx = document.getElementById('utilizationChart')?.getContext('2d');

      if (!utilizationCtx) {

        console.error("Contexto para gráfico de utilização não encontrado");

        return;

      }

      

      // Preparar dados para o gráfico de utilização

      prepareUtilizationData();

      

      if (!cache.utilizationData) {

        console.error("Dados de utilização não disponíveis");

        return;

      }

      

      // Destruir o gráfico anterior se existir

      if (charts.utilization) {

        charts.utilization.destroy();

      }

      

      // Criar o novo gráfico

      charts.utilization = new Chart(utilizationCtx, {

        type: 'bar',

        data: {

          labels: cache.utilizationData.labels,

          datasets: [{

            label: 'Número de Sub-redes',

            data: cache.utilizationData.data,

            backgroundColor: cache.utilizationData.colors,

            borderColor: cache.utilizationData.borderColors,

            borderWidth: 1

          }]

        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            title: {

              display: true,

              text: 'Distribuição de Sub-redes IPv6',

              font: {

                size: 16,

                weight: 'bold'

              },

              color: isDarkMode() ? colors.dark.text : '#333'

            },

            legend: {

              display: false

            },

            tooltip: {

              backgroundColor: isDarkMode() ? 'rgba(22, 27, 34, 0.9)' : 'rgba(255, 255, 255, 0.9)',

              titleColor: isDarkMode() ? colors.dark.text : '#333',

              bodyColor: isDarkMode() ? colors.dark.text : '#333',

              borderColor: isDarkMode() ? '#30363d' : '#ddd',

              borderWidth: 1

            }

          },

          scales: {

            y: {

              beginAtZero: true,

              title: {

                display: true,

                text: 'Número de Sub-redes',

                color: isDarkMode() ? colors.dark.text : '#333'

              },

              grid: {

                color: isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

              },

              ticks: {

                color: isDarkMode() ? colors.dark.text : '#333'

              }

            },

            x: {

              grid: {

                color: isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

              },

              ticks: {

                color: isDarkMode() ? colors.dark.text : '#333'

              }

            }

          }

        }

      });

      

      console.log("Gráfico de utilização inicializado com sucesso");

    } catch (error) {

      console.error("Erro ao inicializar gráfico de utilização:", error);

    }

  }

  

  /**

   * Prepara dados para o gráfico de utilização

   */

  function prepareUtilizationData() {

    try {

      // Obter sub-redes selecionadas

      const checkboxes = document.querySelectorAll('#subnetsTable tbody input[type="checkbox"]:checked');

      

      if (!window.appState || !window.appState.subRedesGeradas) {

        console.error("Estado da aplicação não encontrado");

        return;

      }

      

      const selectedSubnets = Array.from(checkboxes).map(checkbox => 

        window.appState.subRedesGeradas[parseInt(checkbox.value)]);

      

      if (selectedSubnets.length === 0) {

        console.warn("Nenhuma sub-rede selecionada para visualização");

        // Criar dados de exemplo para demonstração

        createDemoData();

        return;

      }

      

      // Gerar dados do gráfico

      const chartColors = [

        'rgba(0, 112, 209, 0.7)',

        'rgba(76, 175, 80, 0.7)',

        'rgba(255, 160, 0, 0.7)',

        'rgba(229, 57, 53, 0.7)',

        'rgba(156, 39, 176, 0.7)'

      ];

      

      const borderColors = [

        'rgba(0, 112, 209, 1)',

        'rgba(76, 175, 80, 1)',

        'rgba(255, 160, 0, 1)',

        'rgba(229, 57, 53, 1)',

        'rgba(156, 39, 176, 1)'

      ];

      

      // Agrupar sub-redes por prefixo

      const prefixGroups = {};

      selectedSubnets.forEach(subnet => {

        const prefix = subnet.subnet.split('/')[1];

        prefixGroups[prefix] = (prefixGroups[prefix] || 0) + 1;

      });

      

      const labels = Object.keys(prefixGroups).map(prefix => `Prefixo /${prefix}`);

      const data = Object.values(prefixGroups);

      

      // Armazenar no cache

      cache.utilizationData = {

        labels,

        data,

        colors: chartColors.slice(0, data.length),

        borderColors: borderColors.slice(0, data.length)

      };

    } catch (error) {

      console.error("Erro ao preparar dados de utilização:", error);

      createDemoData();

    }

  }

  

  /**

   * Cria dados de demonstração quando não há sub-redes selecionadas

   */

  function createDemoData() {

    const demoLabels = ['Prefixo /64', 'Prefixo /80', 'Prefixo /96', 'Prefixo /112'];

    const demoData = [45, 25, 15, 10];

    

    // Gerar cores

    const chartColors = [

      'rgba(0, 112, 209, 0.7)',

      'rgba(76, 175, 80, 0.7)',

      'rgba(255, 160, 0, 0.7)',

      'rgba(229, 57, 53, 0.7)'

    ];

    

    const borderColors = [

      'rgba(0, 112, 209, 1)',

      'rgba(76, 175, 80, 1)',

      'rgba(255, 160, 0, 1)',

      'rgba(229, 57, 53, 1)'

    ];

    

    cache.utilizationData = {

      labels: demoLabels,

      data: demoData,

      colors: chartColors,

      borderColors: borderColors

    };

  }

  

  // API pública

  return {

    initialize,

    prepareUtilizationData

  };

})();



// Exportar globalmente

window.UtilizationChart = UtilizationChart;