/**
 * FlowDesk AI — Pure Node.js CSV Document Generator
 * Generates spreadsheet-compatible CSV files with UTF-8 BOM, standard escaping,
 * and security mitigation against CSV Formula Injection (DDE injection).
 */

export class SimpleCsvGenerator {
  /**
   * Escape and sanitize cell values to prevent CSV formula injection
   * Characters like =, +, -, @, \t, \r when at the start of a cell can trigger formulas in Excel/Google Sheets.
   */
  static sanitizeCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '""';
    }

    let str = String(value).trim();

    // Prevent CSV Formula Injection
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str; // Prefix with single quote so spreadsheet treat it as text
    }

    // Escape double quotes by doubling them (" -> "")
    const escaped = str.replace(/"/g, '""');

    return `"${escaped}"`;
  }

  /**
   * Generates a complete UTF-8 CSV buffer with Byte Order Mark (\uFEFF)
   * for Excel compatibility.
   */
  static generateCsv(headers: string[], rows: (string | number | null | undefined)[][]): Buffer {
    const lines: string[] = [];

    // Header line
    lines.push(headers.map(SimpleCsvGenerator.sanitizeCellValue).join(','));

    // Data rows
    for (const row of rows) {
      lines.push(row.map(SimpleCsvGenerator.sanitizeCellValue).join(','));
    }

    // UTF-8 BOM (\uFEFF) ensures Excel opens special characters seamlessly
    const csvContent = '\uFEFF' + lines.join('\r\n');
    return Buffer.from(csvContent, 'utf-8');
  }
}

