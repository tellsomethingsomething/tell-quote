import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://deitlnfumugxcbxqqivk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaXRsbmZ1bXVneGNieHFxaXZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NDgxMzMsImV4cCI6MjA4MTEyNDEzM30.unFRnnjTCuxoaAyjfWK1UNjgubq9MYjElXbTN77mjEc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
