// /home/ubuntu/calculadora-ipv6/js/utils/excel-exporter.js

/**
 * Exports data to an Excel (.xlsx) file.
 * Requires the SheetJS library (xlsx.full.min.js) to be included in the HTML.
 *
 * @param {Array<Object>} data An array of objects representing the rows. Keys will be headers.
 * @param {string} sheetName The name of the worksheet.
 * @param {string} fileName The desired name for the downloaded Excel file (without .xlsx extension).
 */
function exportToExcel(data, sheetName = 'Dados Exportados', fileName = 'export_ipv6') {
    if (!window.XLSX) {
        console.error("A biblioteca SheetJS (XLSX) não está carregada. Verifique se o script foi incluído no HTML.");
        alert("Erro: A funcionalidade de exportação não está disponível. A biblioteca necessária não foi carregada.");
        return;
    }

    if (!data || data.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    try {
        // Cria uma nova workbook
        const wb = XLSX.utils.book_new();

        // Converte os dados (array de objetos) para uma worksheet
        const ws = XLSX.utils.json_to_sheet(data);

        // Adiciona a worksheet ao workbook
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        // Gera o arquivo Excel e dispara o download
        const finalFileName = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, finalFileName);

        console.log(`Dados exportados com sucesso para ${finalFileName}`);

    } catch (error) {
        console.error("Erro ao exportar para Excel:", error);
        alert("Ocorreu um erro ao tentar exportar os dados para Excel.");
    }
}

// Exemplo de como poderia ser chamado (será integrado depois):
// const dadosExemploPlanilha = [
//   { 'Coluna A': 'Valor 1A', 'Coluna B': 'Valor 1B' },
//   { 'Coluna A': 'Valor 2A', 'Coluna B': 'Valor 2B' },
// ];
// exportToExcel(dadosExemploPlanilha, 'PlanilhaCalculo', 'calculo_ipv6');

// const dadosExemploIPs = [
//   { 'Endereço IP': '2001:db8::1' },
//   { 'Endereço IP': '2001:db8::2' },
//   { 'Endereço IP': '2001:db8::3' },
// ];
// exportToExcel(dadosExemploIPs, 'IPs Gerados', 'ips_gerados_bloco');

