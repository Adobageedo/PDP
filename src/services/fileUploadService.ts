import { supabase } from '../lib/supabase';
import { getFileType } from '../utils/fileParser';

export async function uploadFile(file: File): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(filePath, file);

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from('documents')
    .getPublicUrl(filePath);

  return publicUrl;
}

export async function saveUploadedFileRecord(
  fileName: string,
  fileUrl: string
): Promise<string> {
  const fileType = getFileType(fileName);

  const { data, error } = await supabase
    .from('uploaded_files')
    .insert({
      file_name: fileName,
      file_type: fileType,
      file_url: fileUrl,
      processing_status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save file record: ${error.message}`);
  }

  return data.id;
}

export async function updateFileProcessingStatus(
  fileId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  extractedData?: any
): Promise<void> {
  const updateData: any = {
    processing_status: status,
  };

  if (status === 'completed' || status === 'failed') {
    updateData.processed_at = new Date().toISOString();
  }

  if (extractedData) {
    updateData.extracted_data = extractedData;
  }

  const { error } = await supabase
    .from('uploaded_files')
    .update(updateData)
    .eq('id', fileId);

  if (error) {
    throw new Error(`Failed to update file status: ${error.message}`);
  }
}
