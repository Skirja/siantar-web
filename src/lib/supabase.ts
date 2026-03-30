import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = "https://fstkhagjevbmobliuevo.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdGtoYWdqZXZibW9ibGl1ZXZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjM4NzQsImV4cCI6MjA5MDE5OTg3NH0.xSOIdmgCriIxZBZizkEe3ABZHwsYYSUHMMytpTpm4hQ";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Storage helpers
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });
  if (error) throw error;
  return getPublicUrl(bucket, path);
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
