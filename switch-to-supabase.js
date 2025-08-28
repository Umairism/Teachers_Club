const fs = require('fs');
const path = require('path');

console.log('🔄 Switching from localStorage to Supabase database...');

// Files to update
const filesToUpdate = [
  'src/hooks/useAuth.tsx',
  'src/hooks/useStats.tsx',
  'src/pages/Articles.tsx',
  'src/pages/Confessions.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/AdminPanel.tsx',
  'src/components/Comments.tsx',
  'src/components/LikeButton.tsx',
  'src/components/AdminPanel.tsx'
];

// Update each file
filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace database imports
    content = content.replace(
      /import \{ db \} from ['"]\.\.\/lib\/database['"];?/g,
      "import { supabaseDb as db } from '../lib/supabaseDatabase';"
    );
    
    content = content.replace(
      /import \{ getAllUsers, getAllArticles, getAllConfessions, deleteUser \} from ['"]\.\.\/lib\/database['"];?/g,
      "import { supabaseDb } from '../lib/supabaseDatabase';\nconst getAllUsers = () => supabaseDb.getUsers();\nconst getAllArticles = () => supabaseDb.getArticles();\nconst getAllConfessions = () => supabaseDb.getConfessions();\nconst deleteUser = (userId: string, adminId: string) => supabaseDb.deleteUser(userId, adminId);"
    );
    
    fs.writeFileSync(filePath, content);
    console.log('✅ Updated:', filePath);
  } else {
    console.log('⚠️  File not found:', filePath);
  }
});

console.log('');
console.log('🎉 Database migration complete!');
console.log('');
console.log('Next steps:');
console.log('1. Make sure you have run the SQL migration in Supabase dashboard');
console.log('2. Restart your development server: npm run dev');
console.log('3. Your app will now use Supabase instead of localStorage');
console.log('');
