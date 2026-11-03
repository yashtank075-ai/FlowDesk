import { apiClient } from './api';

export type ReportType = 'leads' | 'customers' | 'enquiries' | 'follow-ups' | 'analytics';
export type ExportFormat = 'csv' | 'pdf';

export const exportService = {
  /**
   * Triggers download of an authenticated workspace report in CSV or PDF format
   */
  async downloadReport(type: ReportType, format: ExportFormat): Promise<void> {
    const response = await apiClient.get(`/export/${type}`, {
      params: { format },
      responseType: 'blob', // Receive binary data
    });

    // Extract filename from Content-Disposition header if available
    let filename = `FlowDesk_${type}_${new Date().toISOString().split('T')[0]}.${format}`;
    const disposition = response.headers['content-disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    // Create a temporary Blob URL and trigger browser download
    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 200);
  },
};

