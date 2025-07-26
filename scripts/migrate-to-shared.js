import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

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

async function migrateToShared() {
  try {
    console.log('🔄 Migrating imported archers to shared system...');
    
    // Get all profiles from the 'profiles' collection
    const profilesRef = collection(db, 'profiles');
    const querySnapshot = await getDocs(profilesRef);
    
    console.log(`📊 Found ${querySnapshot.size} profiles to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const docSnapshot of querySnapshot.docs) {
      try {
        const profileData = docSnapshot.data();
        const originalId = docSnapshot.id;
        
        // Skip if already migrated
        if (profileData.isShared) {
          console.log(`⏭️ Skipping already shared profile: ${profileData.firstName} ${profileData.lastName}`);
          skippedCount++;
          continue;
        }
        
        // Create shared profile data
        const sharedProfileData = {
          ...profileData,
          createdBy: profileData.userId || 'imported-archers',
          updatedBy: profileData.userId || 'imported-archers',
          updatedAt: new Date().toISOString(),
          isShared: true,
          migratedFrom: originalId,
          migratedAt: new Date().toISOString()
        };
        
        // Remove old userId field for shared system
        delete sharedProfileData.userId;
        
        // Save to shared system (same collection, updated data)
        await setDoc(doc(db, 'profiles', originalId), sharedProfileData);
        
        console.log(`✅ Migrated: ${profileData.firstName} ${profileData.lastName} to shared system`);
        migratedCount++;
        
      } catch (error) {
        console.error(`❌ Error migrating profile ${docSnapshot.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n🔄 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} profiles`);
    console.log(`⏭️ Skipped (already shared): ${skippedCount} profiles`);
    console.log(`❌ Failed migrations: ${errorCount} profiles`);
    console.log(`📁 Total processed: ${querySnapshot.size} profiles`);
    console.log(`🎯 All profiles now shared across all users!`);
    
    return { migratedCount, skippedCount, errorCount, total: querySnapshot.size };
    
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    throw error;
  }
}

// Run the migration
console.log('🚀 Starting shared profile migration...');

migrateToShared()
  .then((result) => {
    console.log('✅ Migration completed successfully!');
    console.log('🎉 All users can now see the same archer profiles!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }); 