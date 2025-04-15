/**

 * Prefix Comparison Chart Module

 * 

 * Este módulo implementa o gráfico de comparação de prefixos IPv6,

 * mostrando a relação entre o tamanho do prefixo, número de sub-redes

 * e número de IPs por sub-rede.

 */



const PrefixComparisonChart = (function() {

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

    

    // Inicializar o gráfico de comparação de prefixos

    initChart();

  }

  

  /**

   * Inicializa o gráfico de comparação de prefixos

   */

  function initChart() {

    try {

      if (typeof Chart === 'undefined') {

        console.error("Chart.js não está disponível");

        return;

      }

      

      const comparisonCtx = document.getElementById('prefixComparisonChart')?.getContext('2d');

      if (!comparisonCtx) {

        console.error("Contexto para gráfico de comparação não encontrado");

        return;

      }

      

      // Preparar dados para o gráfico de comparação

      preparePrefixComparisonData();

      

      if (!cache.prefixComparisonData) {

        console.error("Dados de comparação de prefixos não disponíveis");

        return;

      }

      

      // Destruir o gráfico anterior se existir

      if (charts.prefixComparison) {

        charts.prefixComparison.destroy();

      }

      

      // Criar o novo gráfico

      charts.prefixComparison = new Chart(comparisonCtx, {

        type: 'bar',

        data: {

          labels: cache.prefixComparisonData.labels,

          datasets: [

            {

              label: 'Número de Sub-redes',

              data: cache.prefixComparisonData.subnetsData,

              backgroundColor: 'rgba(0, 112, 209, 0.5)',

              borderColor: 'rgba(0, 112, 209, 1)',

              borderWidth: 1,

              yAxisID: 'y'

            },

            {

              label: 'IPs por Sub-rede (log10)',

              data: cache.prefixComparisonData.ipsData,

              backgroundColor: 'rgba(76, 175, 80, 0.5)',

              borderColor: 'rgba(76, 175, 80, 1)',

              borderWidth: 1,

              yAxisID: 'y1',

              type: 'line'

            }

          ]

        },

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

              },

              color: isDarkMode() ? colors.dark.text : '#333'

            },

            tooltip: {

              backgroundColor: isDarkMode() ? 'rgba(22, 27, 34, 0.9)' : 'rgba(255, 255, 255, 0.9)',

              titleColor: isDarkMode() ? colors.dark.text : '#333',

              bodyColor: isDarkMode() ? colors.dark.text : '#333',

              borderColor: isDarkMode() ? '#30363d' : '#ddd',

              borderWidth: 1,

              callbacks: {

                label: function(context) {

                  const dataIndex = context.dataIndex;

                  const prefix = cache.prefixComparisonData.prefixes[dataIndex];

                  

                  if (context.dataset.label === 'Número de Sub-redes') {

                    const subnet = Math.pow(2, prefix - cache.prefixComparisonData.basePrefix);

                    return `Número de Sub-redes: ${subnet.toExponential(2)}`;

                  } else {

                    const ips = Math.pow(2, 128 - prefix);

                    return `IPs por Sub-rede: ${ips.toExponential(2)}`;

                  }

                }

              }

            }

          },

          scales: {

            y: {

              type: 'linear',

              position: 'left',

              title: {

                display: true,

                text: 'Número de Sub-redes (log)',

                color: isDarkMode() ? colors.dark.text : '#333'

              },

              beginAtZero: true,

              grid: {

                color: isDarkMode() ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

              },

              ticks: {

                color: isDarkMode() ? colors.dark.text : '#333'

              }

            },

            y1: {

              type: 'linear',

              position: 'right',

              title: {

                display: true,

                text: 'IPs por Sub-rede (log)',

                color: isDarkMode() ? colors.dark.text : '#333'

              },

              beginAtZero: true,

              grid: {

                drawOnChartArea: false,

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

      

      // Atualizar estatísticas

      const prefixSlider = document.getElementById('prefixSlider');

      if (prefixSlider && window.VisualizationModule) {

        window.VisualizationModule.updatePrefixStats(parseInt(prefixSlider.value));

      }

      

      console.log("Gráfico de comparação de prefixos inicializado com sucesso");

    } catch (error) {

      console.error("Erro ao inicializar gráfico de comparação de prefixos:", error);

    }

  }

  

  /**

   * Prepara dados para o gráfico de comparação de prefixos

   */

  function preparePrefixComparisonData() {

    try {

      // Obter o prefixo atual do slider

      const prefixSlider = document.getElementById('prefixSlider');

      const currentPrefix = parseInt(prefixSlider?.value) || 64;

      

      // Obter o prefixo base do endereço IPv6 original

      const ipv6Input = document.getElementById('ipv6').value.trim();

      const [, prefixoInicial] = ipv6Input.split('/');

      const basePrefix = parseInt(prefixoInicial) || 48; // Usar 48 como fallback

      

      // Definir faixa de prefixos para comparação

      const prefixes = [

        basePrefix + 4, 

        basePrefix + 8, 

        basePrefix + 12, 

        basePrefix + 16, 

        basePrefix + 20

      ];

      

      // Certificar que o prefixo atual está incluído

      if (!prefixes.includes(currentPrefix) && currentPrefix > basePrefix) {

        prefixes.push(currentPrefix);

        prefixes.sort((a, b) => a - b);

      }

      

      // Calcular número de sub-redes e IPs para cada prefixo

      const subnetsData = prefixes.map(p => Math.log10(Math.pow(2, p - basePrefix)));

      const ipsData = prefixes.map(p => (128 - p) * 0.301); // log10(2^n) = n * log10(2) ≈ n * 0.301

      

      // Preparar labels mostrando o número real

      const labels = prefixes.map(p => `/${p}`);

      

      // Armazenar no cache

      cache.prefixComparisonData = {

        basePrefix,

        prefixes,

        labels,

        subnetsData,

        ipsData

      };

    } catch (error) {

      console.error("Erro ao preparar dados de comparação de prefixos:", error);

      createDemoData();

    }

  }

  

  /**

   * Cria dados de demonstração para comparação de prefixos

   */

  function createDemoData() {

    const basePrefix = 48;

    const prefixes = [52, 56, 60, 64, 68, 72, 80];

    

    // Calcular dados de exemplo

    const subnetsData = prefixes.map(p => Math.log10(Math.pow(2, p - basePrefix)));

    const ipsData = prefixes.map(p => (128 - p) * 0.301);

    

    // Preparar labels

    const labels = prefixes.map(p => `/${p}`);

    

    // Armazenar no cache

    cache.prefixComparisonData = {

      basePrefix,

      prefixes,

      labels,

      subnetsData,

      ipsData

    };

  }

  

  // API pública

  return {

    initialize,

    preparePrefixComparisonData

  };

})();



// Exportar globalmente

window.PrefixComparisonChart = PrefixComparisonChart;