/**
 * FlowDesk AI — Pure Node.js PDF Document Generator
 * Generates valid standard PDF 1.4 documents with branding, headers, tables,
 * multi-page text handling, headers/footers, and page counts with ZERO external dependencies.
 */

export interface PdfTableColumn {
  header: string;
  width: number; // width in points (total printable width ~512 pt for Letter portrait)
  align?: 'left' | 'center' | 'right';
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  workspaceName?: string;
  generatedBy?: string;
  summaryMetrics?: Array<{ label: string; value: string }>;
  columns: PdfTableColumn[];
  rows: string[][];
}

export class SimplePdfDocument {
  private objects: string[] = [];
  private pages: number[] = []; // object indices of pages
  private currentPageStreams: string[] = [];
  private fontRegularObj = 0;
  private fontBoldObj = 0;

  constructor() {
    // 1: Catalog, 2: Pages tree will be wired at finalize
  }

  static escapeText(text: string): string {
    if (!text) return '';
    // Replace characters that can break PDF literal strings
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[^\x20-\x7E]/g, '?'); // ASCII range
  }

  static generateReport(options: PdfReportOptions): Buffer {
    const pdf = new SimplePdfDocument();
    return pdf.build(options);
  }

  private build(options: PdfReportOptions): Buffer {
    // Dimensions for standard Letter size (8.5 x 11 in => 612 x 792 points)
    const pageWidth = 612;
    const pageHeight = 792;
    const marginLeft = 50;
    const marginRight = 50;
    const printableWidth = pageWidth - marginLeft - marginRight; // 512 pt

    const totalPagesEstimated = Math.max(1, Math.ceil(options.rows.length / 24));
    let currentPageNum = 1;
    let currentY = pageHeight - 50;

    let stream = '';

    const startNewPage = () => {
      if (stream.length > 0) {
        this.addPageStream(stream, pageWidth, pageHeight);
        stream = '';
        currentPageNum++;
      }
      currentY = pageHeight - 50;

      // Draw Top Brand Header on every page
      // Indigo brand bar at top: (x, y, w, h)
      stream += `0.145 0.388 0.921 rg\n`; // #2563EB (blue-600)
      stream += `${marginLeft} ${pageHeight - 40} ${printableWidth} 3 re f\n`;

      // FlowDesk AI Logo & Title
      stream += `BT\n`;
      stream += `/F2 14 Tf\n`;
      stream += `0.09 0.12 0.18 rg\n`; // Slate 900
      stream += `${marginLeft} ${pageHeight - 60} Td (FlowDesk AI) Tj\n`;

      stream += `/F1 9 Tf\n`;
      stream += `0.45 0.50 0.58 rg\n`; // Slate 500
      stream += `${marginLeft + 95} ${pageHeight - 60} Td (|  ${SimplePdfDocument.escapeText(options.workspaceName || 'Workspace')} - Business Report) Tj\n`;

      // Date / Timestamp on right
      const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      stream += `${pageWidth - marginRight - 120} ${pageHeight - 60} Td (Generated: ${dateStr}) Tj\n`;
      stream += `ET\n`;

      // Footer: Page numbers
      stream += `BT\n`;
      stream += `/F1 8 Tf\n`;
      stream += `0.55 0.60 0.68 rg\n`;
      stream += `${marginLeft} 35 Td (Confidential - Generated for ${SimplePdfDocument.escapeText(options.workspaceName || 'Workspace')}) Tj\n`;
      stream += `${pageWidth - marginRight - 60} 35 Td (Page ${currentPageNum}) Tj\n`;
      stream += `ET\n`;

      currentY = pageHeight - 85;
    };

    // Initialize Page 1
    startNewPage();

    // Report Title & Subtitle Banner (Only on Page 1)
    stream += `BT\n`;
    stream += `/F2 16 Tf\n`;
    stream += `0.07 0.09 0.15 rg\n`;
    stream += `${marginLeft} ${currentY} Td (${SimplePdfDocument.escapeText(options.title)}) Tj\n`;
    stream += `ET\n`;
    currentY -= 18;

    if (options.subtitle) {
      stream += `BT\n`;
      stream += `/F1 9 Tf\n`;
      stream += `0.40 0.45 0.55 rg\n`;
      stream += `${marginLeft} ${currentY} Td (${SimplePdfDocument.escapeText(options.subtitle)}) Tj\n`;
      stream += `ET\n`;
      currentY -= 20;
    }

    // Summary Metrics Cards (if provided)
    if (options.summaryMetrics && options.summaryMetrics.length > 0) {
      const cardCount = options.summaryMetrics.length;
      const cardGap = 8;
      const cardWidth = (printableWidth - cardGap * (cardCount - 1)) / cardCount;
      const cardHeight = 44;

      options.summaryMetrics.forEach((metric, idx) => {
        const cardX = marginLeft + idx * (cardWidth + cardGap);
        const cardY = currentY - cardHeight;

        // Card background
        stream += `0.96 0.97 0.99 rg\n`; // Slate-50
        stream += `${cardX} ${cardY} ${cardWidth} ${cardHeight} re f\n`;

        // Card border
        stream += `0.88 0.90 0.94 RG\n`; // Slate-200
        stream += `0.75 w\n`;
        stream += `${cardX} ${cardY} ${cardWidth} ${cardHeight} re S\n`;

        // Card Label
        stream += `BT\n`;
        stream += `/F1 7.5 Tf\n`;
        stream += `0.45 0.50 0.58 rg\n`;
        stream += `${cardX + 8} ${cardY + 28} Td (${SimplePdfDocument.escapeText(metric.label.toUpperCase())}) Tj\n`;

        // Card Value
        stream += `/F2 12 Tf\n`;
        stream += `0.09 0.12 0.18 rg\n`;
        stream += `${cardX + 8} ${cardY + 12} Td (${SimplePdfDocument.escapeText(metric.value)}) Tj\n`;
        stream += `ET\n`;
      });

      currentY -= cardHeight + 20;
    }

    // Table Dimensions
    const totalColWidth = options.columns.reduce((sum, c) => sum + c.width, 0);
    // Normalize column widths to fit exactly inside printableWidth
    const colWidths = options.columns.map((c) => (c.width / totalColWidth) * printableWidth);

    // Draw Table Header
    const drawTableHeader = () => {
      // Header background
      stream += `0.93 0.95 0.98 rg\n`; // Light indigo/slate
      stream += `${marginLeft} ${currentY - 18} ${printableWidth} 22 re f\n`;

      // Header bottom border
      stream += `0.80 0.84 0.90 RG\n`;
      stream += `1 w\n`;
      stream += `${marginLeft} ${currentY - 18} m ${marginLeft + printableWidth} ${currentY - 18} l S\n`;

      let curX = marginLeft;
      options.columns.forEach((col, idx) => {
        const w = colWidths[idx];
        stream += `BT\n`;
        stream += `/F2 8 Tf\n`;
        stream += `0.20 0.25 0.35 rg\n`;
        stream += `${curX + 6} ${currentY - 12} Td (${SimplePdfDocument.escapeText(col.header.toUpperCase())}) Tj\n`;
        stream += `ET\n`;
        curX += w;
      });

      currentY -= 22;
    };

    drawTableHeader();

    // Draw Table Rows
    const rowHeight = 20;
    if (options.rows.length === 0) {
      // Empty Table Callout
      currentY -= 30;
      stream += `BT\n`;
      stream += `/F1 9 Tf\n`;
      stream += `0.55 0.60 0.68 rg\n`;
      stream += `${marginLeft + 180} ${currentY} Td (No records found in this workspace report.) Tj\n`;
      stream += `ET\n`;
    } else {
      options.rows.forEach((row, rowIdx) => {
        // Page break if bottom margin reached
        if (currentY - rowHeight < 60) {
          startNewPage();
          drawTableHeader();
        }

        // Alternating row background
        if (rowIdx % 2 === 1) {
          stream += `0.98 0.99 1.0 rg\n`;
          stream += `${marginLeft} ${currentY - rowHeight} ${printableWidth} ${rowHeight} re f\n`;
        }

        // Row dividing line
        stream += `0.92 0.94 0.96 RG\n`;
        stream += `0.5 w\n`;
        stream += `${marginLeft} ${currentY - rowHeight} m ${marginLeft + printableWidth} ${currentY - rowHeight} l S\n`;

        let curX = marginLeft;
        row.forEach((cellVal, colIdx) => {
          const w = colWidths[colIdx] || 60;
          const text = SimplePdfDocument.escapeText(String(cellVal ?? ''));
          // Max truncate characters based on width
          const maxChars = Math.max(6, Math.floor(w / 5.5));
          const truncated = text.length > maxChars ? text.slice(0, maxChars - 2) + '..' : text;

          stream += `BT\n`;
          stream += `/F1 8 Tf\n`;
          stream += `0.15 0.18 0.25 rg\n`;
          stream += `${curX + 6} ${currentY - 14} Td (${truncated}) Tj\n`;
          stream += `ET\n`;
          curX += w;
        });

        currentY -= rowHeight;
      });
    }

    // Save final page stream
    if (stream.length > 0) {
      this.addPageStream(stream, pageWidth, pageHeight);
    }

    return this.assemble();
  }

  private addPageStream(content: string, width: number, height: number) {
    const streamObjIdx = this.objects.length + 1;
    const streamContent = Buffer.from(content, 'utf-8');
    const streamObj = `<< /Length ${streamContent.length} >>\nstream\n${content}\nendstream`;
    this.objects.push(streamObj);

    const pageObjIdx = this.objects.length + 1;
    this.pages.push(pageObjIdx);
    // Reference Page object: parent Pages object will be object 2
    const pageObj = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents ${streamObjIdx} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>`;
    this.objects.push(pageObj);
  }

  private assemble(): Buffer {
    // Standard Fonts (Helvetica and Helvetica-Bold)
    const fontRegularObj = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
    const fontBoldObj = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;

    // Object list structure:
    // 1: Catalog
    // 2: Pages Tree
    // 3: Font F1
    // 4: Font F2
    // 5...: Streams and Page objects

    const finalObjects: string[] = [];

    // Placeholder indices
    // 1 0 obj: Catalog
    finalObjects.push(`<< /Type /Catalog /Pages 2 0 R >>`);

    // 2 0 obj: Pages
    const kidsStr = this.pages.map((p) => `${p + 2} 0 R`).join(' '); // shifted by 2 because 3 and 4 are fonts
    finalObjects.push(`<< /Type /Pages /Kids [${kidsStr}] /Count ${this.pages.length} >>`);

    // 3 0 obj: Font Regular
    finalObjects.push(fontRegularObj);
    // 4 0 obj: Font Bold
    finalObjects.push(fontBoldObj);

    // Append all page streams and page objects
    this.objects.forEach((obj) => {
      // Re-map references inside Page objects if needed
      // Our streams were odd indices (5, 7, 9...), page objects were even (6, 8, 10...)
      // Simple offset: add 2 to stream refs in page objects
      const updatedObj = obj.replace(/\/Contents (\d+) 0 R/, (_, p1) => {
        return `/Contents ${parseInt(p1, 10) + 2} 0 R`;
      });
      finalObjects.push(updatedObj);
    });

    // Write PDF Binary Output
    let pdfStr = `%PDF-1.4\n%âãÏÓ\n`;
    const xrefOffsets: number[] = [0];

    finalObjects.forEach((objContent, idx) => {
      const objId = idx + 1;
      const offset = Buffer.byteLength(pdfStr, 'utf-8');
      xrefOffsets.push(offset);
      pdfStr += `${objId} 0 obj\n${objContent}\nendobj\n`;
    });

    const startXref = Buffer.byteLength(pdfStr, 'utf-8');
    pdfStr += `xref\n0 ${finalObjects.length + 1}\n`;
    pdfStr += `0000000000 65535 f \n`;

    for (let i = 1; i <= finalObjects.length; i++) {
      const offset = xrefOffsets[i];
      const offsetStr = String(offset).padStart(10, '0');
      pdfStr += `${offsetStr} 00000 n \n`;
    }

    pdfStr += `trailer\n<< /Size ${finalObjects.length + 1} /Root 1 0 R >>\n`;
    pdfStr += `startxref\n${startXref}\n%%EOF\n`;

    return Buffer.from(pdfStr, 'utf-8');
  }
}

