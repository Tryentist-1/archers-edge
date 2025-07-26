import fs from 'fs';
import csv from 'csv-parser';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

// CSV file path
const csvFilePath = './reference-app/app-imports/listimport-01.csv';

// Function to map CSV data to our profile format
function mapCsvToProfile(row) {
  return {
    firstName: row.First,
    lastName: row.Last,
    school: row.School,
    grade: parseInt(row.Grade),
    gender: row.Gender.toUpperCase() === 'F' ? 'Female' : 'Male',
    division: row.LVL === 'VAR' ? 'Varsity' : 'JV',
    bowType: 'Recurve ILF', // Default value
    bowLength: '66', // Default value
    bowWeight: row.VARPR || '0',
    dominantHand: 'Right', // Default value
    dominantEye: 'Right', // Default value
    drawLength: '28', // Default value
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Function to import archers
async function importArchers() {
  const archers = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        archers.push(mapCsvToProfile(row));
      })
      .on('end', async () => {
        console.log(`Parsed ${archers.length} archers from CSV`);
        
        try {
          let successCount = 0;
          let errorCount = 0;
          
          // Use a default userId for imported archers
          const defaultUserId = 'imported-archers';
          
          for (const archer of archers) {
            try {
              // Create a unique ID for each archer
              const archerId = `${archer.firstName.toLowerCase()}-${archer.lastName.toLowerCase()}-${Date.now()}`;
              
              // Save to Firebase in the 'profiles' collection with userId
              const profileData = {
                ...archer,
                id: archerId,
                userId: defaultUserId,
                updatedAt: new Date().toISOString()
              };
              
              await setDoc(doc(db, 'profiles', archerId), profileData);
              
              console.log(`✅ Imported: ${archer.firstName} ${archer.lastName} (${archer.school})`);
              successCount++;
            } catch (error) {
              console.error(`❌ Error importing ${archer.firstName} ${archer.lastName}:`, error.message);
              errorCount++;
            }
          }
          
          console.log(`\n📊 Import Summary:`);
          console.log(`✅ Successfully imported: ${successCount} archers`);
          console.log(`❌ Failed imports: ${errorCount} archers`);
          console.log(`📁 Total processed: ${archers.length} archers`);
          console.log(`🔑 User ID used: ${defaultUserId}`);
          
          resolve();
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
}

// Run the import
console.log('🚀 Starting CSV import to Firebase...');
console.log(`📂 Reading from: ${csvFilePath}`);

importArchers()
  .then(() => {
    console.log('✅ Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }); 