// Configuration for switching between localStorage and Supabase
export const USE_SUPABASE = false; // Set to false to use localStorage for now

// Database service factory
import { DatabaseService } from './database';

export const db = new DatabaseService();
