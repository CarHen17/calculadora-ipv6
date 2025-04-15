/**
 * Script de diagnóstico aprimorado para a Calculadora IPv6
 * Adicione este script ao final do index.html para diagnosticar problemas
 */
(function() {
  'use strict';
  
  // Lista de módulos necessários
  const requiredModules = [
    'IPv6Utils',
    'UIController',
    'IPv6Calculator',
    'VisualizationModule',
    'UIComponents',
    'ResponsiveHandler'
  ];
  
  // Verificar imediatamente e após o carregamento da página
  checkModulesImmediate();
  
  // Verificar periódicamente
  let checkInterval = setInterval(checkModulesImmediate, 15000);
  
  // Verificação imediata do estado dos módulos
  function checkModulesImmediate() {
    console.group('Diagnóstico de Módulos (Verificação Imediata)');
    console.log('Timestamp: ' + new Date().toISOString());
    
    let allLoaded = true;
    
    // Verificar cada módulo
    requiredModules.forEach(module => {
      const moduleObj = window[module];
      const isLoaded = typeof moduleObj !== 'undefined';
      console.log(`${module}: ${isLoaded ? '✅ Carregado' : '❌ Não carregado'}`);
      
      if (isLoaded) {
        console.log(`  - Tipo: ${typeof moduleObj}`);
        if (typeof moduleObj === 'object') {
          console.log(`  - Métodos disponíveis: ${Object.keys(moduleObj).length}`);
          console.log(`  - Métodos: ${Object.keys(moduleObj).join(', ')}`);
        }
      }
      
      if (!isLoaded) {
        allLoaded = false;
      }
    });
    
    console.log(`Status geral: ${allLoaded ? '✅ Todos os módulos carregados' : '❌ Alguns módulos não foram carregados'}`);
    console.groupEnd();
    
    if (allLoaded) {
      clearInterval(checkInterval);
      console.log("✅ Todos os módulos carregados - Verificação periódica encerrada");
    }
    
    return allLoaded;
  }
  
  // Verificar quando a página estiver completamente carregada
  window.addEventListener('load', function() {
    console.group('Diagnóstico Completo de Aplicação');
    
    // Verificar módulos
    const modulesLoaded = checkModulesImmediate();
    
    // Verificar estilos carregados
    console.group('Diagnóstico de Estilos');
    const styles = [
      'main.css',
      'dark-mode.css', 
      'visualization.css',
      'enhanced-ui.css'
    ];
    
    styles.forEach(style => {
      // Verificar cada folha de estilo carregada
      const isLoaded = Array.from(document.styleSheets).some(sheet => 
        sheet.href && sheet.href.includes(style)
      );
      
      console.log(`${style}: ${isLoaded ? '✅ Carregado' : '❌ Não carregado'}`);
    });
    console.groupEnd();
    
    // Verificar ordem de carregamento dos scripts
    console.group('Ordem de Carregamento de Scripts');
    const scripts = Array.from(document.querySelectorAll('script'))
      .filter(script => script.src)
      .map(script => {
        const src = script.src;
        const fileName = src.substring(src.lastIndexOf('/') + 1);
        return fileName;
      });
    
    console.log('Scripts em ordem de carregamento:');
    scripts.forEach((script, index) => {
      console.log(`${index + 1}. ${script}`);
    });
    console.groupEnd();
    
    // Verificar se há algum script faltando
    const requiredScripts = [
      'ipv6-utils.js',
      'ui-controller.js',
      'ipv6-calculator.js',
      'charts-core.js',
      'utilization.js',
      'heatmap.js',
      'prefix-comparison.js',
      'ui-components.js',
      'responsive-handler.js',
      'enhanced-app.js'
    ];
    
    console.group('Verificação de Scripts Necessários');
    let allScriptsFound = true;
    
    requiredScripts.forEach(requiredScript => {
      const isFound = scripts.some(script => script.includes(requiredScript));
      console.log(`${requiredScript}: ${isFound ? '✅ Encontrado' : '❌ Não encontrado'}`);
      
      if (!isFound) allScriptsFound = false;
    });
    
    console.log(`Status geral de scripts: ${allScriptsFound ? '✅ Todos os scripts encontrados' : '❌ Alguns scripts não foram encontrados'}`);
    console.groupEnd();
    
    // Verificar a ordem correta dos scripts
    const idealOrder = [
      'ipv6-utils.js',
      'ui-controller.js',
      'charts-core.js',
      'utilization.js',
      'heatmap.js',
      'prefix-comparison.js',
      'ui-components.js',
      'responsive-handler.js',
      'ipv6-calculator.js',
      'enhanced-app.js'
    ];
    
    console.group('Verificação da Ordem de Carregamento');
    let orderCorrect = true;
    let lastFoundIndex = -1;
    
    for (const script of idealOrder) {
      const foundIndex = scripts.findIndex(s => s.includes(script));
      
      if (foundIndex === -1) {
        console.log(`${script}: ❌ Não encontrado na página`);
        orderCorrect = false;
        continue;
      }
      
      if (foundIndex < lastFoundIndex) {
        console.log(`${script}: ❌ Carregado na ordem incorreta`);
        orderCorrect = false;
      } else {
        console.log(`${script}: ✅ Carregado na ordem correta`);
        lastFoundIndex = foundIndex;
      }
    }
    
    console.log(`Ordem de carregamento: ${orderCorrect ? '✅ Correta' : '❌ Incorreta'}`);
    console.groupEnd();
    
    // Tentar registrar explicitamente IPv6Utils no objeto window se não estiver disponível
    if (typeof window.IPv6Utils === 'undefined') {
      console.warn("⚠️ Tentando registrar IPv6Utils no escopo global...");
      
      // Tentar encontrar outras referências
      const possibleReferences = Object.keys(window).filter(key => 
        key.includes('IPv6') || 
        (typeof window[key] === 'object' && window[key] && typeof window[key].validateIPv6 === 'function')
      );
      
      if (possibleReferences.length > 0) {
        console.log("Possíveis referências encontradas:", possibleReferences);
      } else {
        console.log("Nenhuma referência alternativa encontrada");
      }
    }
    
    console.groupEnd(); // Fechar grupo de diagnóstico completo
  });
})();