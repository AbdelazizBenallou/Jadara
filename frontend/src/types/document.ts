export interface DocumentRecord {
  id: number;
  name: string;
  type: string;
  status: string;
  file_url?: string | null;
  download_url?: string | null;
  mime_type?: string | null;
  created_at?: string;
}
