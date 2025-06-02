/**
 * Responsive Handler for IPv6 Calculator
 * Melhora a experiência em dispositivos móveis e gerencia a responsividade da aplicação
 */

const ResponsiveHandler = (function() {
  'use strict';
  
  // Pontos de quebra
  const breakpoints = {
    xs: 480,
    sm: 768,
    md: 992,
    lg: 1200
  };
  
  /**
   * Verifica o tamanho atual da tela
   * @returns {Object} Objeto com informações sobre o tamanho da tela
   */
  function getScreenSize() {
    const width = window.innerWidth;
    
    return {
      width,
      isXs: width < breakpoints.xs,
      isSm: width >= breakpoints.xs && width < breakpoints.sm,
      isMd: width >= breakpoints.sm && width < breakpoints.md,
      isLg: width >= breakpoints.md && width < breakpoints.lg,
      isXl: width >= breakpoints.lg,
      isMobile: width < breakpoints.md
    };
  }
  
  /**
   * Ajusta o layout com base no tamanho da tela
   */
  function adjustLayout() {
    const size = getScreenSize();
    document.body.classList.toggle('mobile-view', size.isMobile);
    
    // Adicionar indicador de scroll horizontal para tabelas em mobile
    if (size.isMobile) {
      addTableScrollIndicators();
      optimizeMobileLayout();
    } else {
      restoreDesktopLayout();
    }
  }
  
  /**
   * Adiciona indicadores de scroll para tabelas
   */
  function addTableScrollIndicators() {
    document.querySelectorAll('.table-container').forEach(container => {
      // Verificar se já existe um indicador
      if (!container.querySelector('.table-scroll-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'table-scroll-indicator';
        indicator.innerHTML = '<i class="fas fa-arrows-alt-h"></i> Deslize para visualizar todos os dados';
        
        // Estilizar indicador
        indicator.style.position = 'absolute';
        indicator.style.bottom = '0';
        indicator.style.left = '0';
        indicator.style.right = '0';
        indicator.style.backgroundColor = 'rgba(0, 112, 209, 0.1)';
        indicator.style.color = 'var(--primary-color)';
        indicator.style.padding = '8px';
        indicator.style.fontSize = '12px';
        indicator.style.textAlign = 'center';
        indicator.style.borderBottomLeftRadius = '4px';
        indicator.style.borderBottomRightRadius = '4px';
        indicator.style.transition = 'opacity 0.3s ease';
        
        // Comportamento dark mode
        if (document.body.classList.contains('dark-mode')) {
          indicator.style.backgroundColor = 'rgba(38, 137, 219, 0.2)';
          indicator.style.color = 'var(--primary-light)';
        }
        
        container.style.position = 'relative';
        container.appendChild(indicator);
        
        // Monitorar scroll horizontal para esconder indicador
        container.addEventListener('scroll', function() {
          const maxScroll = this.scrollWidth - this.clientWidth;
          const scrollPosition = this.scrollLeft;
          
          // Ocultar indicador quando chegar ao final
          if (scrollPosition > maxScroll * 0.7) {
            indicator.style.opacity = '0';
            
            // Remover após fade out
            setTimeout(() => {
              if (indicator.parentNode === container) {
                container.removeChild(indicator);
              }
            }, 300);
          }
        });
      }
    });
  }
  
  /**
   * Otimiza o layout para dispositivos móveis
   */
  function optimizeMobileLayout() {
    // Re-arranjar layout principal
    const mainLayout = document.querySelector('.main-layout');
    if (mainLayout && !mainLayout.classList.contains('mobile-optimized')) {
      mainLayout.classList.add('mobile-optimized');
      
      // Mover sidebar para antes do conteúdo principal
      const sidebar = document.getElementById('infoSidebar');
      const content = document.querySelector('.content');
      
      if (sidebar && content && mainLayout.contains(sidebar) && mainLayout.contains(content)) {
        mainLayout.insertBefore(sidebar, content);
      }
      
      // Mover sidebar agregada para depois do resultado
      const aggregatedSidebar = document.getElementById('aggregatedSidebar');
      const resultado = document.getElementById('resultado');
      
      if (aggregatedSidebar && resultado && mainLayout.contains(aggregatedSidebar)) {
        if (resultado.nextSibling) {
          mainLayout.insertBefore(aggregatedSidebar, resultado.nextSibling);
        } else {
          mainLayout.appendChild(aggregatedSidebar);
        }
      }
    }
    
    // Botões responsivos
    document.querySelectorAll('.action-buttons').forEach(container => {
      if (!container.classList.contains('mobile-optimized')) {
        container.classList.add('mobile-optimized');
        container.style.flexDirection = 'column';
        
        // Ajustar botões para ocupar a largura total
        container.querySelectorAll('button').forEach(btn => {
          btn.style.width = '100%';
        });
      }
    });
    
    // Otimizar entrada de formulário
    const ipv6Input = document.getElementById('ipv6');
    if (ipv6Input) {
      ipv6Input.style.fontSize = '16px';  // Evitar zoom em iOS
    }
    
    // Ajustar tabs para dispositivos móveis
    document.querySelectorAll('.tabs').forEach(tabContainer => {
      if (!tabContainer.classList.contains('mobile-optimized')) {
        tabContainer.classList.add('mobile-optimized');
        tabContainer.style.overflowX = 'auto';
        tabContainer.style.whiteSpace = 'nowrap';
        tabContainer.style.webkitOverflowScrolling = 'touch';
        tabContainer.style.msOverflowStyle = 'none';  // IE/Edge
        tabContainer.style.scrollbarWidth = 'none';   // Firefox
        
        // Esconder scrollbar para Chrome/Safari
        tabContainer.style.borderBottom = '2px solid var(--border-light)';
      }
    });
  }
  
  /**
   * Restaura o layout para desktop
   */
  function restoreDesktopLayout() {
    // Restaurar layout principal
    const mainLayout = document.querySelector('.main-layout');
    if (mainLayout && mainLayout.classList.contains('mobile-optimized')) {
      mainLayout.classList.remove('mobile-optimized');
      
      // Restaurar posição original da sidebar
      const sidebar = document.getElementById('infoSidebar');
      const content = document.querySelector('.content');
      
      if (sidebar && content && mainLayout.contains(sidebar) && mainLayout.contains(content)) {
        mainLayout.appendChild(sidebar);
      }
      
      // Restaurar posição da sidebar agregada
      const aggregatedSidebar = document.getElementById('aggregatedSidebar');
      
      if (aggregatedSidebar && mainLayout.contains(aggregatedSidebar)) {
        mainLayout.appendChild(aggregatedSidebar);
      }
    }
    
    // Restaurar botões
    document.querySelectorAll('.action-buttons.mobile-optimized').forEach(container => {
      container.classList.remove('mobile-optimized');
      container.style.flexDirection = '';
      
      // Restaurar botões
      container.querySelectorAll('button').forEach(btn => {
        btn.style.width = '';
      });
    });
    
    // Restaurar tabs
    document.querySelectorAll('.tabs.mobile-optimized').forEach(tabContainer => {
      tabContainer.classList.remove('mobile-optimized');
      tabContainer.style.overflowX = '';
      tabContainer.style.whiteSpace = '';
      tabContainer.style.webkitOverflowScrolling = '';
      tabContainer.style.msOverflowStyle = '';
      tabContainer.style.scrollbarWidth = '';
      tabContainer.style.borderBottom = '';
    });
  }
  
  /**
   * Adiciona gestos de toque para interfaces móveis
   */
  function setupTouchGestures() {
    // Permitir scroll horizontal em tabelas com gestos
    document.querySelectorAll('.table-container').forEach(container => {
      let startX, startScrollLeft, isDown = false;
      
      container.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        startScrollLeft = container.scrollLeft;
      });
      
      container.addEventListener('touchend', () => {
        isDown = false;
      });
      
      container.addEventListener('touchcancel', () => {
        isDown = false;
      });
      
      container.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 2; // Velocidade do scroll
        container.scrollLeft = startScrollLeft - walk;
      });
    });
    
    // Permitir gesto de deslizar entre abas
    setupSwipeableTabs();
  }
  
  /**
   * Adiciona suporte a deslizar entre abas
   */
  function setupSwipeableTabs() {
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabContents.length === 0) return;
    
    let startX, startY, dist, threshold = 100, allowedTime = 300, elapsedTime, startTime;
    
    tabContents.forEach(content => {
      content.addEventListener('touchstart', function(e) {
        const touchObj = e.changedTouches[0];
        startX = touchObj.pageX;
        startY = touchObj.pageY;
        startTime = new Date().getTime(); // Tempo de início
      }, false);
      
      content.addEventListener('touchend', function(e) {
        const touchObj = e.changedTouches[0];
        dist = touchObj.pageX - startX; // Distância percorrida
        elapsedTime = new Date().getTime() - startTime; // Tempo decorrido
        
        // Verificar se foi um deslize horizontal (e não vertical)
        const verticalDist = Math.abs(touchObj.pageY - startY);
        
        // Verifica se foi um deslize válido (rápido o suficiente e longo o suficiente)
        if (elapsedTime <= allowedTime && Math.abs(dist) >= threshold && verticalDist < threshold/2) {
          const tabs = document.querySelectorAll('.tab');
          const activeTab = document.querySelector('.tab.tab-active');
          
          if (!activeTab) return;
          
          let activeIndex = Array.from(tabs).indexOf(activeTab);
          
          if (dist > 0) {
            // Deslize para a direita (aba anterior)
            activeIndex = Math.max(0, activeIndex - 1);
          } else {
            // Deslize para a esquerda (próxima aba)
            activeIndex = Math.min(tabs.length - 1, activeIndex + 1);
          }
          
          // Simular clique na nova aba
          tabs[activeIndex].click();
        }
      }, false);
    });
  }
  
  /**
   * Melhora a navegação por teclado
   */
  function enhanceKeyboardNavigation() {
    // Lista de elementos que podem receber foco
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    // Adicionar atributo tabindex para elementos interativos que não o têm por padrão
    document.querySelectorAll('.prefix-item, .dns-btn').forEach(el => {
      if (!el.getAttribute('tabindex')) {
        el.setAttribute('tabindex', '0');
      }
    });
    
    // Eventos de teclado para elementos interativos com tabindex
    document.querySelectorAll('[tabindex="0"]').forEach(el => {
      el.addEventListener('keydown', function(e) {
        // Simular clique ao pressionar Enter ou Espaço
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
  }
  
  /**
   * Inicializa o módulo
   */
  function initialize() {
    // Aplicar ajustes iniciais
    adjustLayout();
    
    // Eventos de redimensionamento
    window.addEventListener('resize', debounce(adjustLayout, 200));
    window.addEventListener('orientationchange', adjustLayout);
    
    // Configurar gestos de toque
    setupTouchGestures();
    
    // Melhorar navegação por teclado
    enhanceKeyboardNavigation();
    
    // Adicionar classe para identificar tipo de dispositivo
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      document.body.classList.add('touch-device');
    } else {
      document.body.classList.add('no-touch-device');
    }
    
    console.log("ResponsiveHandler inicializado com sucesso");
  }
  
  /**
   * Função auxiliar para limitar a frequência de execução
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  // Inicializar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // API pública
  return {
    adjustLayout,
    getScreenSize,
    breakpoints
  };
})();

// Exportar globalmente
window.ResponsiveHandler = ResponsiveHandler;