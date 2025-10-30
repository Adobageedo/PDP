import { useState } from 'react';
import { FileText, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { PDP, ExtractedData } from '../types';
import { generatePDPDocument, downloadPDPDocument } from '../services/wordTemplateService';

interface PDPDocumentGeneratorProps {
  pdp: PDP;
  extractedData: ExtractedData;
}

export function PDPDocumentGenerator({ pdp, extractedData }: PDPDocumentGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.docx')) {
      setSelectedTemplate(file);
      setStatus('idle');
      setMessage('');
    } else {
      alert('Veuillez sélectionner un fichier .docx');
    }
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) {
      alert('Veuillez d\'abord sélectionner un template');
      return;
    }

    setIsGenerating(true);
    setStatus('idle');
    setMessage('Génération du document en cours...');

    try {
      const blob = await generatePDPDocument(pdp.id, selectedTemplate, extractedData);
      
      // Download the generated document
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PDP_${pdp.windfarm_name}_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('success');
      setMessage('Document généré et téléchargé avec succès !');
    } catch (error) {
      console.error('Error generating document:', error);
      setStatus('error');
      setMessage(`Erreur lors de la génération: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadExisting = async () => {
    try {
      await downloadPDPDocument(pdp.id, pdp.windfarm_name);
      setStatus('success');
      setMessage('Document téléchargé avec succès !');
    } catch (error) {
      console.error('Error downloading document:', error);
      setStatus('error');
      setMessage('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Génération du PDP
        </h3>
      </div>

      <div className="space-y-4">
        {/* Document Status */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">
              Documents requis
            </p>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                {pdp.risk_analysis ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs text-gray-600">Analyse de Risques</span>
              </div>
              <div className="flex items-center gap-2">
                {pdp.operational_mode ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-xs text-gray-600">Mode Opératoire</span>
              </div>
            </div>
          </div>
        </div>

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sélectionner le template Word (.docx)
          </label>
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {selectedTemplate ? selectedTemplate.name : 'Choisir un fichier...'}
              </span>
              <input
                type="file"
                accept=".docx"
                onChange={handleTemplateSelect}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Le template doit contenir des placeholders comme {'{company_name}'}, {'{technician1_name}'}, etc.
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateDocument}
          disabled={!selectedTemplate || isGenerating}
          className={`w-full px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors ${
            !selectedTemplate || isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          {isGenerating ? 'Génération en cours...' : 'Générer le PDP'}
        </button>

        {/* Existing Document Download */}
        {pdp.generated_document_path && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              Document généré disponible
            </p>
            <button
              onClick={handleDownloadExisting}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger le document existant
            </button>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-lg flex items-start gap-2 ${
              status === 'success'
                ? 'bg-green-50 border border-green-200'
                : status === 'error'
                ? 'bg-red-50 border border-red-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
            {status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
            <p
              className={`text-sm ${
                status === 'success'
                  ? 'text-green-800'
                  : status === 'error'
                  ? 'text-red-800'
                  : 'text-blue-800'
              }`}
            >
              {message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
