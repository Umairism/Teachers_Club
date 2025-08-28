// Configuration for switching between localStorage and Supabase
export const USE_SUPABASE = true; // Set to true to use Supabase, false for localStorage

// Database service factory
import { DatabaseService } from './database';
import { SupabaseDatabaseService } from './supabase-db';

export const db = USE_SUPABASE ? new SupabaseDatabaseService() : new DatabaseService();
