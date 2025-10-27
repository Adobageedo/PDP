import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          legal_representative: string | null;
          hse_responsible: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };
      workers: {
        Row: {
          id: string;
          company_id: string | null;
          first_name: string;
          last_name: string;
          phone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workers']['Insert']>;
      };
      certifications: {
        Row: {
          id: string;
          worker_id: string | null;
          certification_type: string;
          certification_name: string;
          issue_date: string | null;
          expiry_date: string;
          document_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['certifications']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['certifications']['Insert']>;
      };
      work_orders: {
        Row: {
          id: string;
          company_id: string | null;
          title: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          work_hours: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['work_orders']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['work_orders']['Insert']>;
      };
      uploaded_files: {
        Row: {
          id: string;
          file_name: string;
          file_type: string;
          file_url: string;
          processing_status: string;
          extracted_data: any;
          created_at: string;
          processed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['uploaded_files']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['uploaded_files']['Insert']>;
      };
    };
  };
};
