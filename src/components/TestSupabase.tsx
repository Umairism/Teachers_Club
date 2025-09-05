import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function TestSupabase() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      // First check environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('Environment check:');
      console.log('VITE_SUPABASE_URL:', supabaseUrl);
      console.log('VITE_SUPABASE_ANON_KEY length:', supabaseKey?.length);
      
      if (!supabaseUrl || !supabaseKey) {
        setResult(`❌ Environment Variables Missing!\nVITE_SUPABASE_URL: ${supabaseUrl || 'MISSING'}\nVITE_SUPABASE_ANON_KEY: ${supabaseKey ? 'Present' : 'MISSING'}`);
        return;
      }
      
      setResult(`🔍 Environment Check:\nURL: ${supabaseUrl}\nKey Length: ${supabaseKey.length} characters\n\nTesting connection...`);
      
      // Test basic connection
      console.log('Testing Supabase connection...');
      const { data, error } = await supabase.from('users').select('*').limit(1);
      
      if (error) {
        setResult(prev => prev + `\n\n❌ Connection Error: ${error.message}\nCode: ${error.code}\nDetails: ${error.details}`);
        console.error('Supabase error:', error);
        
        // Try ping test
        console.log('Trying direct fetch to Supabase...');
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            }
          });
          setResult(prev => prev + `\n\n🌐 Direct fetch status: ${response.status} ${response.statusText}`);
        } catch (fetchError) {
          setResult(prev => prev + `\n\n🌐 Direct fetch failed: ${fetchError}`);
        }
        return;
      }
      
      setResult(prev => prev + `\n\n✅ Connection successful!\nFound ${data.length} users\nSample data: ${JSON.stringify(data, null, 2)}`);
      
      // Test table structure
      console.log('Testing user creation...');
      const testUser = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
        bio: 'Test bio'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('users')
        .insert(testUser)
        .select()
        .single();
        
      if (insertError) {
        setResult(prev => prev + `\n\n❌ Insert Error: ${insertError.message}\nCode: ${insertError.code}\nDetails: ${insertError.details}\nHint: ${insertError.hint}`);
        console.error('Insert error:', insertError);
      } else {
        setResult(prev => prev + `\n\n✅ User creation successful!\nCreated user: ${JSON.stringify(insertData, null, 2)}`);
        
        // Clean up
        await supabase.from('users').delete().eq('id', insertData.id);
        setResult(prev => prev + '\n\n🧹 Test user cleaned up');
      }
      
    } catch (error) {
      setResult(prev => prev + `\n\n❌ Unexpected error: ${error}`);
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Supabase Connection Test</h2>
      
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Test Results:</h3>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
}
