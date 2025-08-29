import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://apovxgssuxjlraqauczl.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwb3Z4Z3NzdXhqbHJhcWF1Y3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODM2NDIsImV4cCI6MjA3MDQ1OTY0Mn0.4dzu3IzURYQ6XQEJM9rEsVbdeeiox7MHyrjwmenx6bY'
);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.error('Supabase error:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
    } else {
      console.log('✅ Connection successful!');
      console.log('Sample data:', data);
      console.log('Number of users found:', data.length);
    }
    
    // Test table structure
    console.log('\nTesting table structure...');
      
    // Try to insert a test user to see what happens
    console.log('\nTesting user creation...');
    const testUserData = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'student',
      bio: 'Test bio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUserData)
      .select()
      .single();
      
    if (insertError) {
      console.error('Insert error:', insertError);
    } else {
      console.log('✅ Test user created:', insertData);
      
      // Clean up test user
      await supabase.from('users').delete().eq('id', insertData.id);
      console.log('Test user cleaned up');
    }
    
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testConnection();
