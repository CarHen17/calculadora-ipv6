/**
 * Utilitários de Exportação para Calculadora IPv6
 * Implementa exportação para diferentes formatos de arquivo
 */

const ExportUtils = (function() {
  'use strict';
  
  /**
   * Exporta dados para arquivo CSV
   */
  function exportToCSV(data, filename = 'ips_ipv6') {
    try {
      if (!data || data.length === 0) {
        alert('Não há dados para exportar.');
        return;
      }
      
      const headers = ['Número', 'Endereço IPv6'];
      const csvContent = [
        headers.join(','),
        ...data.map(item => [
          item.number || '',
          `"${item.ip || ''}"`
        ].join(','))
      ].join('\n');
      
      downloadFile(csvContent, `${filename}_${getCurrentDateString()}.csv`, 'text/csv');
      console.log(`Exportados ${data.length} IPs para CSV`);
      
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      alert('Erro ao exportar arquivo CSV');
    }
  }
  
  /**
   * Exporta dados para arquivo TXT
   */
  function exportToTXT(data, filename = 'ips_ipv6') {
    try {
      if (!data || data.length === 0) {
        alert('Não há dados para exportar.');
        return;
      }
      
      const txtContent = [
        '# Lista de Endereços IPv6',
        `# Gerado em: ${new Date().toLocaleString('pt-BR')}`,
        `# Total de IPs: ${data.length}`,
        '',
        ...data.map(item => item.ip || '')
      ].join('\n');
      
      downloadFile(txtContent, `${filename}_${getCurrentDateString()}.txt`, 'text/plain');
      console.log(`Exportados ${data.length} IPs para TXT`);
      
    } catch (error) {
      console.error('Erro ao exportar TXT:', error);
      alert('Erro ao exportar arquivo TXT');
    }
  }
  
  /**
   * Exporta dados para arquivo JSON
   */
  function exportToJSON(data, filename = 'ips_ipv6', metadata = {}) {
    try {
      if (!data || data.length === 0) {
        alert('Não há dados para exportar.');
        return;
      }
      
      const jsonData = {
        metadata: {
          generated_at: new Date().toISOString(),
          generated_by: 'Calculadora IPv6',
          total_ips: data.length,
          ...metadata
        },
        ips: data
      };
      
      const jsonContent = JSON.stringify(jsonData, null, 2);
      downloadFile(jsonContent, `${filename}_${getCurrentDateString()}.json`, 'application/json');
      console.log(`Exportados ${data.length} IPs para JSON`);
      
    } catch (error) {
      console.error('Erro ao exportar JSON:', error);
      alert('Erro ao exportar arquivo JSON');
    }
  }
  
  /**
   * Exporta dados para arquivo Excel
   */
  function exportToExcel(data, filename = 'ips_ipv6') {
    try {
      if (!window.XLSX) {
        alert('Funcionalidade de exportação Excel não está disponível.');
        return;
      }
      
      if (!data || data.length === 0) {
        alert('Não há dados para exportar.');
        return;
      }
      
      const excelData = data.map(item => ({
        'Número': item.number || '',
        'Endereço IPv6': item.ip || ''
      }));
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      ws['!cols'] = [
        { width: 10 },  // Número
        { width: 40 }   // Endereço IPv6
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'IPs IPv6');
      
      const finalFilename = `${filename}_${getCurrentDateString()}.xlsx`;
      XLSX.writeFile(wb, finalFilename);
      
      console.log(`Exportados ${data.length} IPs para Excel`);
      
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao exportar arquivo Excel');
    }
  }
  
  /**
   * Função auxiliar para baixar arquivo
   */
  function downloadFile(content, filename, mimeType) {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
    } catch (error) {
      console.error('Erro ao fazer download do arquivo:', error);
      throw error;
    }
  }
  
  /**
   * Obtém string da data atual formatada
   */
  function getCurrentDateString() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
  
  /**
   * Converte lista de IPs HTML para dados exportáveis
   */
  function extractIPsFromList(listId) {
    try {
      const ipsList = document.getElementById(listId);
      if (!ipsList) {
        console.error(`Lista com ID "${listId}" não encontrada`);
        return [];
      }
      
      const ipItems = ipsList.querySelectorAll('.ip-item');
      const data = [];
      
      ipItems.forEach((item, index) => {
        const numberSpan = item.querySelector('.ip-number');
        const textSpan = item.querySelector('.ip-text');
        
        if (textSpan) {
          const ip = textSpan.textContent.trim();
          const number = numberSpan ? numberSpan.textContent.replace('.', '') : (index + 1);
          
          data.push({
            number: parseInt(number) || (index + 1),
            ip: ip
          });
        }
      });
      
      return data;
      
    } catch (error) {
      console.error('Erro ao extrair IPs da lista:', error);
      return [];
    }
  }
  
  /**
   * Mostra modal de exportação
   */
  function showExportModal(listId, subnetInfo = '') {
    try {
      // Verificar se já existe modal
      let modal = document.getElementById('exportModal');
      if (modal) {
        modal.remove();
      }
      
      // Extrair dados da lista
      const data = extractIPsFromList(listId);
      if (data.length === 0) {
        alert('Não há IPs para exportar. Gere alguns IPs primeiro.');
        return;
      }
      
      // Criar modal
      modal = document.createElement('div');
      modal.id = 'exportModal';
      modal.className = 'modal-overlay';
      
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <h3><i class="fas fa-download"></i> Exportar Lista de IPs</h3>
            <button class="modal-close-btn" type="button">&times;</button>
          </div>
          <div class="modal-body">
            <p>Encontrados <strong>${data.length} endereços IPv6</strong> para exportação.</p>
            ${subnetInfo ? `<p><strong>Sub-rede:</strong> <code>${subnetInfo}</code></p>` : ''}
            
            <div class="export-options">
              <h4>Escolha o formato de exportação:</h4>
              
              <div class="export-format-grid">
                <button class="export-format-btn" data-format="csv">
                  <i class="fas fa-file-csv"></i>
                  <span>CSV</span>
                  <small>Planilha separada por vírgulas</small>
                </button>
                
                <button class="export-format-btn" data-format="excel">
                  <i class="fas fa-file-excel"></i>
                  <span>Excel</span>
                  <small>Planilha Microsoft Excel</small>
                </button>
                
                <button class="export-format-btn" data-format="txt">
                  <i class="fas fa-file-alt"></i>
                  <span>TXT</span>
                  <small>Lista simples de texto</small>
                </button>
                
                <button class="export-format-btn" data-format="json">
                  <i class="fas fa-file-code"></i>
                  <span>JSON</span>
                  <small>Dados estruturados</small>
                </button>
              </div>
              
              <div class="filename-container">
                <label for="exportFilename">Nome do arquivo:</label>
                <input type="text" id="exportFilename" value="ips_ipv6" placeholder="Nome do arquivo">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="cancelExport">Cancelar</button>
          </div>
        </div>
      `;
      
      // Adicionar modal ao DOM
      document.body.appendChild(modal);
      
      // Configurar eventos
      setupModalEvents(modal, data, subnetInfo);
      
      // Mostrar modal
      setTimeout(() => modal.classList.add('visible'), 10);
      
    } catch (error) {
      console.error('Erro ao mostrar modal de exportação:', error);
      alert('Erro ao abrir modal de exportação');
    }
  }
  
  /**
   * Configura eventos do modal de exportação
   */
  function setupModalEvents(modal, data, subnetInfo) {
    try {
      // Botão fechar
      const closeBtn = modal.querySelector('.modal-close-btn');
      const cancelBtn = modal.querySelector('#cancelExport');
      
      const closeModal = () => {
        modal.classList.remove('visible');
        setTimeout(() => {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        }, 300);
      };
      
      closeBtn.addEventListener('click', closeModal);
      cancelBtn.addEventListener('click', closeModal);
      
      // Fechar modal clicando fora
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
      
      // Botões de formato
      const formatBtns = modal.querySelectorAll('.export-format-btn');
      formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const format = btn.dataset.format;
          const filenameInput = modal.querySelector('#exportFilename');
          const filename = filenameInput.value.trim() || 'ips_ipv6';
          
          // Metadados para JSON
          const metadata = subnetInfo ? { subnet: subnetInfo } : {};
          
          // Executar exportação baseado no formato
          switch (format) {
            case 'csv':
              exportToCSV(data, filename);
              break;
            case 'excel':
              exportToExcel(data, filename);
              break;
            case 'txt':
              exportToTXT(data, filename);
              break;
            case 'json':
              exportToJSON(data, filename, metadata);
              break;
            default:
              console.error('Formato de exportação desconhecido:', format);
              return;
          }
          
          // Fechar modal após exportação
          closeModal();
          
          // Mostrar notificação de sucesso
          if (window.showNotification) {
            window.showNotification(`Arquivo ${format.toUpperCase()} exportado com sucesso!`, 'success');
          }
        });
      });
      
      // Focar no campo de nome do arquivo
      const filenameInput = modal.querySelector('#exportFilename');
      if (filenameInput) {
        filenameInput.focus();
        filenameInput.select();
      }
      
    } catch (error) {
      console.error('Erro ao configurar eventos do modal:', error);
    }
  }
  
  /**
   * Inicialização do módulo
   */
  function initialize() {
    console.log('[ExportUtils] Módulo de exportação inicializado');
    addExportStyles();
  }
  
  /**
   * Adiciona estilos CSS para o modal de exportação
   */
  function addExportStyles() {
    try {
      if (document.getElementById('exportStyles')) {
        return;
      }
      
      const style = document.createElement('style');
      style.id = 'exportStyles';
      style.textContent = `
        .export-options h4 {
          margin: 20px 0 16px 0;
          color: var(--text-light);
          font-size: 16px;
          font-weight: 600;
        }
        
        body.dark-mode .export-options h4 {
          color: var(--text-dark);
        }
        
        .export-format-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .export-format-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 12px;
          border: 2px solid var(--border-light);
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          gap: 8px;
        }
        
        .export-format-btn:hover {
          border-color: var(--primary-color);
          background-color: rgba(0, 112, 209, 0.05);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .export-format-btn i {
          font-size: 24px;
          color: var(--primary-color);
        }
        
        .export-format-btn span {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-light);
        }
        
        .export-format-btn small {
          font-size: 12px;
          color: var(--text-light-secondary);
          line-height: 1.2;
        }
        
        .filename-container {
          margin-top: 20px;
        }
        
        .filename-container label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text-light);
        }
        
        .filename-container input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-light);
          border-radius: 4px;
          font-size: 14px;
        }
        
        /* Modo escuro */
        body.dark-mode .export-format-btn {
          background: var(--bg-dark-accent);
          border-color: var(--border-dark);
        }
        
        body.dark-mode .export-format-btn:hover {
          border-color: var(--primary-light);
          background-color: rgba(38, 137, 219, 0.1);
        }
        
        body.dark-mode .export-format-btn i {
          color: var(--primary-light);
        }
        
        body.dark-mode .export-format-btn span {
          color: var(--text-dark);
        }
        
        body.dark-mode .export-format-btn small {
          color: var(--text-dark-secondary);
        }
        
        body.dark-mode .filename-container label {
          color: var(--text-dark);
        }
        
        body.dark-mode .filename-container input {
          background: var(--bg-dark-accent);
          border-color: var(--border-dark);
          color: var(--text-dark);
        }
        
        /* Responsividade */
        @media (max-width: 768px) {
          .export-format-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .export-format-btn {
            padding: 12px 8px;
          }
          
          .export-format-btn i {
            font-size: 20px;
          }
          
          .export-format-btn span {
            font-size: 13px;
          }
          
          .export-format-btn small {
            font-size: 11px;
          }
        }
      `;
      
      document.head.appendChild(style);
      
    } catch (error) {
      console.error('Erro ao adicionar estilos de exportação:', error);
    }
  }
  
  // API pública
  const publicAPI = {
    showExportModal,
    extractIPsFromList
  };
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  return publicAPI;
})();

// Exportar globalmente
window.ExportUtils = ExportUtils;