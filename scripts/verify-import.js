import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjCqHqMT-3LkKWGFlRx2Mls37vJTN0d7k",
  authDomain: "archers-edge.firebaseapp.com",
  projectId: "archers-edge",
  storageBucket: "archers-edge.appspot.com",
  messagingSenderId: "1056447684075",
  appId: "1:1056447684075:web:9fdd213f321c50f4758dae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifyImport() {
  try {
    console.log('🔍 Checking Firebase for imported archer profiles...');
    
    const querySnapshot = await getDocs(collection(db, 'profiles'));
    
    console.log(`📊 Found ${querySnapshot.size} archer profiles in Firebase`);
    
    if (querySnapshot.size === 0) {
      console.log('❌ No archer profiles found in Firebase');
      console.log('💡 This could mean:');
      console.log('   - The import failed silently');
      console.log('   - Authentication issues');
      console.log('   - Wrong collection name');
      console.log('   - Firestore rules blocking access');
    } else {
      console.log('\n📋 Imported Archers:');
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   ✅ ${data.firstName} ${data.lastName} (${data.school}) - ${data.grade}th grade`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking Firebase:', error.message);
    console.error('Full error:', error);
  }
}

verifyImport(); 