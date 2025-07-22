import { 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    collection, 
    query, 
    where, 
    deleteDoc,
    updateDoc,
    serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Profile Management
export const saveProfileToFirebase = async (profile, userId) => {
    try {
        console.log('Saving profile to Firebase:', { profile, userId });
        const profileRef = doc(db, 'profiles', profile.id);
        const profileData = {
            ...profile,
            userId,
            updatedAt: serverTimestamp()
        };
        console.log('Profile data to save:', profileData);
        await setDoc(profileRef, profileData);
        console.log('Profile saved to Firebase successfully');
        return true;
    } catch (error) {
        console.error('Error saving profile to Firebase:', error);
        throw error;
    }
};

export const loadProfilesFromFirebase = async (userId) => {
    try {
        console.log('Loading profiles from Firebase for user:', userId);
        const profilesRef = collection(db, 'profiles');
        const q = query(profilesRef, where('userId', '==', userId));
        console.log('Executing query:', q);
        const querySnapshot = await getDocs(q);
        
        const profiles = [];
        querySnapshot.forEach((doc) => {
            profiles.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Profiles loaded from Firebase:', profiles);
        return profiles;
    } catch (error) {
        console.error('Error loading profiles from Firebase:', error);
        throw error;
    }
};

export const deleteProfileFromFirebase = async (profileId) => {
    try {
        const profileRef = doc(db, 'profiles', profileId);
        await deleteDoc(profileRef);
        return true;
    } catch (error) {
        console.error('Error deleting profile from Firebase:', error);
        throw error;
    }
};

// Competition Management
export const saveCompetitionToFirebase = async (competition, userId) => {
    try {
        console.log('Saving competition to Firebase:', { competition, userId });
        const competitionRef = doc(db, 'competitions', competition.id);
        const competitionData = {
            ...competition,
            userId,
            updatedAt: serverTimestamp()
        };
        console.log('Competition data to save:', competitionData);
        await setDoc(competitionRef, competitionData);
        console.log('Competition saved to Firebase successfully');
        return true;
    } catch (error) {
        console.error('Error saving competition to Firebase:', error);
        throw error;
    }
};

export const loadCompetitionsFromFirebase = async (userId) => {
    try {
        console.log('Loading competitions from Firebase for user:', userId);
        const competitionsRef = collection(db, 'competitions');
        const q = query(competitionsRef, where('userId', '==', userId));
        console.log('Executing query:', q);
        const querySnapshot = await getDocs(q);
        
        const competitions = [];
        querySnapshot.forEach((doc) => {
            competitions.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Competitions loaded from Firebase:', competitions);
        return competitions;
    } catch (error) {
        console.error('Error loading competitions from Firebase:', error);
        throw error;
    }
};

export const deleteCompetitionFromFirebase = async (competitionId, userId) => {
    try {
        console.log('Deleting competition from Firebase:', { competitionId, userId });
        const competitionRef = doc(db, 'competitions', competitionId);
        await deleteDoc(competitionRef);
        console.log('Competition deleted from Firebase successfully');
        return true;
    } catch (error) {
        console.error('Error deleting competition from Firebase:', error);
        throw error;
    }
};

// Score Management
export const saveBaleDataToFirebase = async (baleData, userId) => {
    try {
        const baleRef = doc(db, 'bales', baleData.id || `bale_${Date.now()}`);
        await setDoc(baleRef, {
            ...baleData,
            userId,
            updatedAt: serverTimestamp()
        });
        return baleRef.id;
    } catch (error) {
        console.error('Error saving bale data to Firebase:', error);
        throw error;
    }
};

export const loadBaleDataFromFirebase = async (baleId, userId) => {
    try {
        const baleRef = doc(db, 'bales', baleId);
        const baleDoc = await getDoc(baleRef);
        
        if (baleDoc.exists() && baleDoc.data().userId === userId) {
            return { id: baleDoc.id, ...baleDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error loading bale data from Firebase:', error);
        throw error;
    }
};

export const loadUserBalesFromFirebase = async (userId) => {
    try {
        const balesRef = collection(db, 'bales');
        const q = query(balesRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        
        const bales = [];
        querySnapshot.forEach((doc) => {
            bales.push({ id: doc.id, ...doc.data() });
        });
        
        return bales;
    } catch (error) {
        console.error('Error loading user bales from Firebase:', error);
        throw error;
    }
};

// App State Management
export const saveAppStateToFirebase = async (appState, userId) => {
    try {
        const stateRef = doc(db, 'appStates', userId);
        await setDoc(stateRef, {
            ...appState,
            userId,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error saving app state to Firebase:', error);
        throw error;
    }
};

export const loadAppStateFromFirebase = async (userId) => {
    try {
        const stateRef = doc(db, 'appStates', userId);
        const stateDoc = await getDoc(stateRef);
        
        if (stateDoc.exists()) {
            return stateDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error loading app state from Firebase:', error);
        throw error;
    }
};

// Offline/Online Sync Management
export const syncLocalDataToFirebase = async (userId) => {
    try {
        // Load local data
        const localProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
        const localBaleData = JSON.parse(localStorage.getItem('baleData') || 'null');
        const localAppState = JSON.parse(localStorage.getItem('appState') || 'null');

        // Sync profiles
        for (const profile of localProfiles) {
            if (profile.userId === userId) {
                await saveProfileToFirebase(profile, userId);
            }
        }

        // Sync bale data
        if (localBaleData && localBaleData.userId === userId) {
            await saveBaleDataToFirebase(localBaleData, userId);
        }

        // Sync app state
        if (localAppState && localAppState.userId === userId) {
            await saveAppStateToFirebase(localAppState, userId);
        }

        return true;
    } catch (error) {
        console.error('Error syncing local data to Firebase:', error);
        throw error;
    }
};

export const syncFirebaseDataToLocal = async (userId) => {
    try {
        // Load Firebase data
        const firebaseProfiles = await loadProfilesFromFirebase(userId);
        const firebaseBales = await loadUserBalesFromFirebase(userId);
        const firebaseAppState = await loadAppStateFromFirebase(userId);

        // Update local storage
        localStorage.setItem('archerProfiles', JSON.stringify(firebaseProfiles));
        
        if (firebaseBales.length > 0) {
            // Use the most recent bale
            const mostRecentBale = firebaseBales.sort((a, b) => 
                new Date(b.updatedAt?.toDate() || 0) - new Date(a.updatedAt?.toDate() || 0)
            )[0];
            localStorage.setItem('baleData', JSON.stringify(mostRecentBale));
        }

        if (firebaseAppState) {
            localStorage.setItem('appState', JSON.stringify(firebaseAppState));
        }

        return {
            profiles: firebaseProfiles,
            baleData: firebaseBales.length > 0 ? firebaseBales[0] : null,
            appState: firebaseAppState
        };
    } catch (error) {
        console.error('Error syncing Firebase data to local:', error);
        throw error;
    }
};

// Network status detection
export const isOnline = () => {
    return navigator.onLine;
};

// Check if user is a mock user (mobile test login)
export const isMockUser = (userId) => {
    return userId === 'mobile-test-user' || userId === 'mobile@test.com';
};

// Enhanced online check that considers mock users
export const shouldUseFirebase = (userId) => {
    return isOnline() && !isMockUser(userId);
};

export const setupNetworkListeners = (onOnline, onOffline) => {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    
    return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
    };
}; 