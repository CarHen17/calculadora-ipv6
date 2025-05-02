// /home/ubuntu/calculadora-ipv6/js/ui/export-controller.js

/**
 * Export Controller Module for IPv6 Calculator
 *
 * Este módulo gerencia a funcionalidade de exportação para Excel.
 */

const ExportController = (function() {
    'use strict';

    /**
     * Inicializa os listeners dos botões de exportação.
     */
    function initializeExportButtons() {
        const exportMainBlockIpsBtn = document.getElementById('exportMainBlockIpsBtn');
        const exportSubnetsTableBtn = document.getElementById('exportSubnetsTableBtn');
        const exportSubnetIpsBtn = document.getElementById('exportSubnetIpsBtn');

        if (exportMainBlockIpsBtn) {
            exportMainBlockIpsBtn.addEventListener('click', handleExportMainBlockIps);
        }
        if (exportSubnetsTableBtn) {
            exportSubnetsTableBtn.addEventListener('click', handleExportSubnetsTable);
        }
        if (exportSubnetIpsBtn) {
            exportSubnetIpsBtn.addEventListener('click', handleExportSubnetIps);
        }

        // Inicialmente, os botões de exportação de tabela e IPs de sub-rede ficam ocultos
        // Eles serão exibidos quando os dados estiverem disponíveis
        toggleExportButtonVisibility('exportSubnetsTableBtn', false);
        toggleExportButtonVisibility('exportSubnetIpsBtn', false);
        toggleExportButtonVisibility('exportMainBlockIpsBtn', false); // Ocultar também o botão de IPs do bloco principal inicialmente
    }

    /**
     * Manipula a exportação dos IPs do bloco principal.
     */
    function handleExportMainBlockIps() {
        console.log("Tentando exportar IPs do bloco principal...");
        const ipListItems = document.querySelectorAll('#mainBlockIpsList li.ip-item');
        if (!ipListItems || ipListItems.length === 0) {
            UIController.showNotification("Não há IPs do bloco principal para exportar.", 'warning');
            return;
        }

        const dataToExport = Array.from(ipListItems).map(item => {
            const ipText = item.querySelector('.ip-text')?.textContent || '';
            return { 'Endereço IP': ipText }; // Usar 'Endereço IP' como cabeçalho
        });

        const mainBlockCidrElement = document.getElementById('mainBlockCidr');
        const blockCidr = mainBlockCidrElement ? mainBlockCidrElement.innerText.replace(/\//g, '_') : 'bloco_principal'; // Substitui '/' por '_' para nome de arquivo válido
        const fileName = `ips_${blockCidr}`;

        exportToExcel(dataToExport, 'IPs Bloco Principal', fileName);
        UIController.showNotification("IPs do bloco principal exportados com sucesso!", 'success');
    }

    /**
     * Manipula a exportação da tabela de sub-redes.
     */
    function handleExportSubnetsTable() {
        console.log("Tentando exportar tabela de sub-redes...");
        const tableRows = document.querySelectorAll('#subnetsTable tbody tr');
        if (!tableRows || tableRows.length === 0) {
            UIController.showNotification("Não há sub-redes na tabela para exportar.", 'warning');
            return;
        }

        const dataToExport = [];
        // Adiciona cabeçalhos manualmente para garantir a ordem e nomes corretos
        const headers = ['Sub-rede', 'Inicial', 'Final', 'Rede'];

        tableRows.forEach(row => {
            const cells = row.querySelectorAll('td');
            // Ignora a primeira célula (checkbox)
            if (cells.length > 4) { // Verifica se há células suficientes
                const rowData = {
                    'Sub-rede': cells[1]?.innerText || '',
                    'Inicial': cells[2]?.innerText || '',
                    'Final': cells[3]?.innerText || '',
                    'Rede': cells[4]?.innerText || ''
                };
                dataToExport.push(rowData);
            }
        });

        if (dataToExport.length === 0) {
             UIController.showNotification("Nenhuma linha válida encontrada na tabela para exportar.", 'warning');
             return;
        }

        const mainBlockCidrElement = document.getElementById('mainBlockCidr');
        const blockCidr = mainBlockCidrElement ? mainBlockCidrElement.innerText.replace(/\//g, '_') : 'bloco_principal';
        const fileName = `subredes_${blockCidr}`;

        exportToExcel(dataToExport, 'Sub-redes Geradas', fileName);
        UIController.showNotification("Tabela de sub-redes exportada com sucesso!", 'success');
    }

    /**
     * Manipula a exportação dos IPs da sub-rede selecionada.
     */
    function handleExportSubnetIps() {
        console.log("Tentando exportar IPs da sub-rede selecionada...");
        const ipListItems = document.querySelectorAll('#ipsList li.ip-item');
        if (!ipListItems || ipListItems.length === 0) {
            UIController.showNotification("Não há IPs da sub-rede selecionada para exportar.", 'warning');
            return;
        }

        const dataToExport = Array.from(ipListItems).map(item => {
            const ipText = item.querySelector('.ip-text')?.textContent || '';
            return { 'Endereço IP': ipText }; // Usar 'Endereço IP' como cabeçalho
        });

        // Tenta obter o CIDR da sub-rede selecionada (pode ser da sidebar ou da tabela)
        let subnetCidr = 'subrede_selecionada';
        const sidebarCidrElement = document.getElementById('sidebarBlockCidr');
        if (sidebarCidrElement && sidebarCidrElement.innerText !== '-') {
             subnetCidr = sidebarCidrElement.innerText.replace(/\//g, '_');
        } else {
            // Fallback: Tenta pegar da primeira linha selecionada na tabela, se houver
            const firstSelectedRow = document.querySelector('#subnetsTable tbody tr.selected');
            if (firstSelectedRow) {
                const subnetCell = firstSelectedRow.querySelectorAll('td')[1];
                if (subnetCell) {
                    subnetCidr = subnetCell.innerText.replace(/\//g, '_');
                }
            }
        }

        const fileName = `ips_${subnetCidr}`;

        exportToExcel(dataToExport, 'IPs Sub-rede', fileName);
        UIController.showNotification("IPs da sub-rede exportados com sucesso!", 'success');
    }

    /**
     * Alterna a visibilidade de um botão de exportação.
     * @param {string} buttonId O ID do botão.
     * @param {boolean} show True para mostrar, false para ocultar.
     */
    function toggleExportButtonVisibility(buttonId, show) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.style.display = show ? 'inline-block' : 'none';
        }
    }

    // Inicializa os botões quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeExportButtons);
    } else {
        initializeExportButtons();
    }

    // API pública
    return {
        initialize: initializeExportButtons,
        toggleExportButtonVisibility // Manter esta função exposta para uso interno ou externo se necessário
    };

})();

// Exportar globalmente para fácil acesso
window.ExportController = ExportController;

