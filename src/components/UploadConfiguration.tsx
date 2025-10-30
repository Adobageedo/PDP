import { useState, useEffect } from 'react';
import { Upload, X, FileText, File, Play } from 'lucide-react';
import { getAllPDPs } from '../services/dataService';
import { PDP } from '../types';

interface UploadedFile {
  file: File;
  id: string;
}

interface UploadConfigurationProps {
  onStartProcessing: (config: ProcessingConfig) => void;
  onCancel: () => void;
}

export interface ProcessingConfig {
  files: File[];
  isNewPDP: boolean;
  windfarmName: string;
  existingPDPId?: string;
}

const WINDFARM_LIST = [
  'Parc Éolien de Fécamp',
  'Parc Éolien de Saint-Nazaire',
  'Parc Éolien de Courseulles-sur-Mer',
  'Parc Éolien de Dieppe-Le Tréport',
  'Parc Éolien de Dunkerque',
  'Parc Éolien des Îles d\'Yeu et de Noirmoutier',
  'Parc Éolien de la Baie de Saint-Brieuc',
  'Autre (à spécifier)',
];

export function UploadConfiguration({ onStartProcessing, onCancel }: UploadConfigurationProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isNewPDP, setIsNewPDP] = useState<boolean>(true);
  const [selectedWindfarm, setSelectedWindfarm] = useState<string>('');
  const [customWindfarm, setCustomWindfarm] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [existingPDPs, setExistingPDPs] = useState<PDP[]>([]);
  const [selectedPDP, setSelectedPDP] = useState<string>('');
  
  useEffect(() => {
    loadPDPs();
  }, []);

  const loadPDPs = async () => {
    const pdps = await getAllPDPs();
    setExistingPDPs(pdps.filter(p => p.is_active));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleStartProcessing = () => {
    if (uploadedFiles.length === 0) {
      alert('Veuillez télécharger au moins un fichier');
      return;
    }

    if (!isNewPDP && !selectedPDP) {
      alert('Veuillez sélectionner un PDP existant');
      return;
    }

    const windfarmName = isNewPDP
      ? (selectedWindfarm === 'Autre (à spécifier)' ? customWindfarm : selectedWindfarm)
      : '';

    if (isNewPDP && !windfarmName) {
      alert('Veuillez sélectionner un parc éolien');
      return;
    }

    onStartProcessing({
      files: uploadedFiles.map(f => f.file),
      isNewPDP,
      windfarmName,
      existingPDPId: isNewPDP ? undefined : selectedPDP
    });
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'eml') return <FileText className="w-5 h-5 text-blue-600" />;
    if (ext === 'pdf') return <File className="w-5 h-5 text-red-600" />;
    return <File className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Configuration du PDP
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* File Upload Area */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Fichiers à traiter
        </label>
        
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-2">
            Glissez-déposez vos fichiers ici ou
          </p>
          <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
            Parcourir
            <input
              type="file"
              multiple
              accept=".eml,.pdf,.txt"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Formats acceptés: .eml, .pdf, .txt
          </p>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Fichiers téléchargés ({uploadedFiles.length})
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadedFiles.map(({ file, id }) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(id)}
                    className="ml-2 p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PDP Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Type de PDP
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={isNewPDP}
              onChange={() => setIsNewPDP(true)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">Nouveau PDP</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!isNewPDP}
              onChange={() => setIsNewPDP(false)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm text-gray-700">PDP Existant</span>
          </label>
        </div>
      </div>

      {/* Windfarm or PDP Selection */}
      {isNewPDP ? (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Parc Éolien
          </label>
          <select
            value={selectedWindfarm}
            onChange={(e) => setSelectedWindfarm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sélectionnez un parc éolien...</option>
            {WINDFARM_LIST.map((farm) => (
              <option key={farm} value={farm}>
                {farm}
              </option>
            ))}
          </select>

          {selectedWindfarm === 'Autre (à spécifier)' && (
            <input
              type="text"
              value={customWindfarm}
              onChange={(e) => setCustomWindfarm(e.target.value)}
              placeholder="Nom du parc éolien"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Sélectionnez un PDP existant
          </label>
          <select
            value={selectedPDP}
            onChange={(e) => setSelectedPDP(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choisir un PDP...</option>
            {existingPDPs.map((pdp) => (
              <option key={pdp.id} value={pdp.id}>
                {pdp.windfarm_name} - Créé le {new Date(pdp.created_at).toLocaleDateString('fr-FR')}
              </option>
            ))}
          </select>
          {existingPDPs.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              Aucun PDP existant. Veuillez créer un nouveau PDP.
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleStartProcessing}
          disabled={
            uploadedFiles.length === 0 || 
            (isNewPDP && !selectedWindfarm) ||
            (!isNewPDP && !selectedPDP)
          }
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          Démarrer le traitement
        </button>
      </div>
    </div>
  );
}
