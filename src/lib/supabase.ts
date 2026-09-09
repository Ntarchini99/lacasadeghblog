import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'Falta VITE_SUPABASE_URL. Configurala en las variables de entorno de Netlify y volvé a hacer el deploy.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Falta VITE_SUPABASE_ANON_KEY. Configurala en las variables de entorno de Netlify y volvé a hacer el deploy.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  image_url: string;
  featured: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
};

export type PostDraft = Omit<
  Post,
  'id' | 'created_at' | 'updated_at'
>;