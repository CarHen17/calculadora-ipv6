/**
 * Arquivo de diagnóstico para identificar problemas na calculadora IPv6
 * Adicione este arquivo como último script no HTML
 */

(function() {
  console.log("Iniciando diagnóstico da calculadora IPv6...");
  
  // Verificar se todos os objetos globais foram inicializados corretamente
  function verificarGlobais() {
    console.log("=== VERIFICAÇÃO DE OBJETOS GLOBAIS ===");
    console.log("window.utils disponível:", typeof window.utils !== 'undefined');
    console.log("window.ui disponível:", typeof window.ui !== 'undefined');
    console.log("window.appState disponível:", typeof window.appState !== 'undefined');
    
    if (typeof window.utils === 'undefined') {
      console.error("ERRO: O objeto utils não foi inicializado!");
    }
    if (typeof window.ui === 'undefined') {
      console.error("ERRO: O objeto ui não foi inicializado!");
    }
    if (typeof window.appState === 'undefined') {
      console.error("ERRO: O objeto appState não foi inicializado!");
    }
  }
  
  // Verificar elementos do DOM
  function verificarElementosDOM() {
    console.log("=== VERIFICAÇÃO DE ELEMENTOS DO DOM ===");
    const elementosChave = [
      'ipv6', 'calcularBtn', 'resetBtn', 'toggleThemeButton', 'errorMessage',
      'mainBlockSection', 'suggestions', 'resultado'
    ];
    
    elementosChave.forEach(id => {
      const elemento = document.getElementById(id);
      console.log(`Elemento #${id} existe:`, elemento !== null);
      if (elemento === null) {
        console.error(`ERRO: Elemento #${id} não encontrado!`);
      }
    });
  }
  
  // Verificar event listeners
  function verificarEventListeners() {
    console.log("=== VERIFICAÇÃO DE EVENT LISTENERS ===");
    const botoes = [
      { id: 'calcularBtn', funcao: 'calcularSubRedes' },
      { id: 'resetBtn', funcao: 'resetarCalculadora' },
      { id: 'toggleThemeButton', funcao: 'ui.toggleTheme' }
    ];
    
    botoes.forEach(botao => {
      const elemento = document.getElementById(botao.id);
      if (elemento) {
        console.log(`Botão #${botao.id} encontrado, associado a ${botao.funcao}`);
        // Adicionar listener de diagnóstico
        elemento.addEventListener('click', function() {
          console.log(`Botão #${botao.id} clicado - função ${botao.funcao} deve ser chamada`);
        });
      } else {
        console.warn(`Botão #${botao.id} não encontrado!`);
      }
    });
  }
  
  // Adicionar diagnóstico nos inputs
  function monitorarInputs() {
    const input = document.getElementById('ipv6');
    if (input) {
      input.addEventListener('input', function() {
        console.log('Input IPv6 alterado:', this.value);
      });
    }
  }
  
  // Adicionar botão de diagnóstico
  function adicionarBotaoDiagnostico() {
    const container = document.querySelector('.header-buttons');
    if (container) {
      const botaoDiagnostico = document.createElement('button');
      botaoDiagnostico.innerHTML = '🔍 Diagnóstico';
      botaoDiagnostico.classList.add('btn-secondary', 'mobile-friendly-btn');
      botaoDiagnostico.addEventListener('click', executarDiagnosticoCompleto);
      container.appendChild(botaoDiagnostico);
      
      console.log("Botão de diagnóstico adicionado");
    }
  }
  
  // Testar funcionalidades
  function testarFuncoes() {
    console.log("=== TESTE DE FUNÇÕES PRINCIPAIS ===");
    
    try {
      console.log("Testando formatação IPv6...");
      const ipTeste = "2001:0db8::1";
      const expandido = window.utils.expandIPv6Address(ipTeste + "/64");
      console.log("IPv6 expandido:", expandido);
      
      console.log("Testando formatação de BigInt...");
      const bigIntTeste = BigInt("0x20010db8000000000000000000000001");
      const formatado = window.utils.formatIPv6Address(bigIntTeste);
      console.log("BigInt formatado como IPv6:", formatado);
    } catch (error) {
      console.error("ERRO ao testar funções:", error);
    }
  }
  
  // Executar todos os diagnósticos
  function executarDiagnosticoCompleto() {
    console.clear();
    console.log("======================================");
    console.log("DIAGNÓSTICO COMPLETO DA CALCULADORA IPV6");
    console.log("======================================");
    
    verificarGlobais();
    verificarElementosDOM();
    verificarEventListeners();
    testarFuncoes();
    
    console.log("======================================");
    console.log("DIAGNÓSTICO CONCLUÍDO");
    
    // Adicionar alertas visuais para os problemas
    const problemas = [];
    
    if (typeof window.utils === 'undefined') problemas.push("Objeto utils não inicializado");
    if (typeof window.ui === 'undefined') problemas.push("Objeto ui não inicializado");
    if (typeof window.appState === 'undefined') problemas.push("Objeto appState não inicializado");
    
    if (problemas.length > 0) {
      alert(`Problemas detectados:\n${problemas.join('\n')}\n\nVerifique o console para mais detalhes.`);
    } else {
      alert("Nenhum problema crítico detectado. Verifique o console para detalhes.");
    }
  }
  
  // Iniciar diagnóstico quando o DOM estiver pronto
  window.addEventListener('DOMContentLoaded', function() {
    console.log("DOM carregado - iniciando diagnóstico...");
    setTimeout(function() {
      verificarGlobais();
      verificarElementosDOM();
      verificarEventListeners();
      monitorarInputs();
      adicionarBotaoDiagnostico();
    }, 500); // Pequeno atraso para garantir que tudo esteja carregado
  });
})();