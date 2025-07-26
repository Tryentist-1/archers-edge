import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

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

async function archiveUserProfiles() {
  try {
    console.log('📦 Archiving current user-specific profiles...');
    
    // Get all profiles from the 'profiles' collection
    const profilesRef = collection(db, 'profiles');
    const querySnapshot = await getDocs(profilesRef);
    
    console.log(`📊 Found ${querySnapshot.size} profiles to archive`);
    
    let archivedCount = 0;
    let errorCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      try {
        const profileData = docSnapshot.data();
        const originalId = docSnapshot.id;
        
        // Create archive entry with timestamp and original user info
        const archiveData = {
          ...profileData,
          archivedAt: new Date().toISOString(),
          originalId: originalId,
          originalUserId: profileData.userId,
          archiveReason: 'User-specific profiles migration to shared system'
        };
        
        // Save to archive collection
        const archiveId = `archive_${originalId}_${Date.now()}`;
        await setDoc(doc(db, 'archivedProfiles', archiveId), archiveData);
        
        console.log(`✅ Archived: ${profileData.firstName} ${profileData.lastName} (${profileData.userId})`);
        archivedCount++;
        
      } catch (error) {
        console.error(`❌ Error archiving profile ${docSnapshot.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📦 Archive Summary:`);
    console.log(`✅ Successfully archived: ${archivedCount} profiles`);
    console.log(`❌ Failed archives: ${errorCount} profiles`);
    console.log(`📁 Total processed: ${querySnapshot.size} profiles`);
    console.log(`🗄️ Archive location: 'archivedProfiles' collection`);
    
    return { archivedCount, errorCount, total: querySnapshot.size };
    
  } catch (error) {
    console.error('❌ Archive process failed:', error);
    throw error;
  }
}

// Run the archive
console.log('🚀 Starting user profile archive process...');

archiveUserProfiles()
  .then((result) => {
    console.log('✅ Archive completed successfully!');
    console.log('💡 Next step: Implement shared archer profiles');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Archive failed:', error);
    process.exit(1);
  }); 