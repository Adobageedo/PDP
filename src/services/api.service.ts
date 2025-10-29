/**
 * API Service - Handles all backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ExtractionResponse {
  success: boolean;
  data: {
    company: {
      name: string | null;
      address: string | null;
      phone: string | null;
      email: string | null;
      legal_representative: string | null;
      hse_responsible: string | null;
    };
    workers: Array<{
      first_name: string;
      last_name: string;
      phone: string | null;
      email: string | null;
      certifications: Array<{
        certification_type: string;
        certification_name: string;
        issue_date: string | null;
        expiry_date: string | null;
      }>;
    }>;
  };
  metadata: {
    filename: string;
    processedAt: string;
    attachmentsProcessed: number;
    textLength: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
}

export interface ProgressUpdate {
  step: string;
  message: string;
  filename?: string;
  current?: number;
  total?: number;
  attachmentCount?: number;
}

class ApiService {
  /**
   * Process an EML file with real-time progress updates
   */
  async processEMLFileWithProgress(
    file: File,
    onProgress: (update: ProgressUpdate) => void
  ): Promise<ExtractionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/extraction/process-eml?stream=true`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to start processing');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';
    let finalResult: ExtractionResponse | null = null;

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process all complete messages in buffer
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete message in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          
          if (data.step === 'complete') {
            finalResult = data;
          } else if (data.step === 'error') {
            throw new Error(data.error);
          } else {
            onProgress(data);
          }
        }
      }
    }

    if (!finalResult) {
      throw new Error('No final result received');
    }

    return finalResult;
  }

  /**
   * Process an EML file (legacy, without progress)
   */
  async processEMLFile(file: File): Promise<ExtractionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/extraction/process-eml`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    return response.json();
  }

  /**
   * Check backend health
   */
  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }
}

export default new ApiService();
