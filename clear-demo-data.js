// Clear localStorage data and reset the application
// Run this in your browser's console (F12 -> Console tab)

console.log('🧹 Clearing Teachers Club demo data...');

if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('teachers_club_data');
  localStorage.setItem('teachers_club_data_cleared', 'true');
  console.log('✅ Local storage cleared - all demo data removed');
  console.log('🔄 Please refresh the page to start with a clean state');
} else {
  console.log('⚠️  This script must be run in a browser console, not Node.js');
  console.log('📋 To clear data:');
  console.log('   1. Open your Teachers Club website');
  console.log('   2. Press F12 to open Developer Tools');
  console.log('   3. Go to Console tab');
  console.log('   4. Run: localStorage.removeItem("teachers_club_data")');
  console.log('   5. Refresh the page');
}
