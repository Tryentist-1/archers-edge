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
    serverTimestamp,
    orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Profile Management
export const saveProfileToFirebase = async (profile, userId) => {
    try {
        console.log('Saving shared profile to Firebase:', { profile, userId });
        const profileRef = doc(db, 'profiles', profile.id);
        const profileData = {
            ...profile,
            createdBy: userId, // Track who created it
            updatedBy: userId, // Track who last updated it
            updatedAt: serverTimestamp(),
            isShared: true // Mark as shared profile
        };
        console.log('Shared profile data to save:', profileData);
        await setDoc(profileRef, profileData);
        console.log('Shared profile saved to Firebase successfully');
        return true;
    } catch (error) {
        console.error('Error saving shared profile to Firebase:', error);
        throw error;
    }
};

export const loadProfilesFromFirebase = async (userId) => {
    try {
        console.log('Loading shared profiles from Firebase for user:', userId);
        const profilesRef = collection(db, 'profiles');
        
        // Load ALL profiles (shared system) - no user filtering
        const querySnapshot = await getDocs(profilesRef);
        
        const profiles = [];
        querySnapshot.forEach((doc) => {
            profiles.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Shared profiles loaded from Firebase: ${profiles.length} profiles`);
        return profiles;
    } catch (error) {
        console.error('Error loading shared profiles from Firebase:', error);
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

// Round Management - Professional OAS Format
export const saveCompletedRoundToFirebase = async (roundData, userId) => {
    try {
        const roundRef = doc(db, 'completedRounds', `${userId}_${Date.now()}`);
        const roundRecord = {
            ...roundData,
            id: roundRef.id,
            userId,
            completedAt: new Date().toISOString(), // Use ISO string for localStorage compatibility
            roundType: 'OAS Qualification Round',
            status: 'verified'
        };
        
        // Save to Firebase
        await setDoc(roundRef, {
            ...roundRecord,
            completedAt: serverTimestamp() // Use serverTimestamp for Firebase
        });
        console.log('Completed round saved to Firebase:', roundRecord);
        
        // Also save to localStorage as backup
        try {
            const existingRounds = JSON.parse(localStorage.getItem('completedRounds') || '[]');
            const updatedRounds = [roundRecord, ...existingRounds];
            localStorage.setItem('completedRounds', JSON.stringify(updatedRounds));
            console.log('Completed round also saved to localStorage');
        } catch (localError) {
            console.error('Error saving to localStorage:', localError);
        }
        
        return roundRef.id;
    } catch (error) {
        console.error('Error saving completed round to Firebase:', error);
        
        // If Firebase fails, still try to save to localStorage
        try {
            const roundRecord = {
                ...roundData,
                id: `local_${Date.now()}`,
                userId,
                completedAt: new Date().toISOString(),
                roundType: 'OAS Qualification Round',
                status: 'verified'
            };
            
            const existingRounds = JSON.parse(localStorage.getItem('completedRounds') || '[]');
            const updatedRounds = [roundRecord, ...existingRounds];
            localStorage.setItem('completedRounds', JSON.stringify(updatedRounds));
            console.log('Completed round saved to localStorage as backup');
            return roundRecord.id;
        } catch (localError) {
            console.error('Error saving to localStorage backup:', localError);
        }
        
        throw error;
    }
};

export const loadCompletedRoundsFromFirebase = async (userId) => {
    try {
        const roundsQuery = query(
            collection(db, 'completedRounds'),
            where('userId', '==', userId),
            orderBy('completedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(roundsQuery);
        const rounds = [];
        
        querySnapshot.forEach((doc) => {
            rounds.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('Completed rounds loaded from Firebase:', rounds);
        return rounds;
    } catch (error) {
        console.error('Error loading completed rounds from Firebase:', error);
        return [];
    }
};

export const saveArcherRoundToProfile = async (archerId, roundData, userId) => {
    try {
        // Save round data tied to specific archer profile
        const profileRoundRef = doc(db, 'archerRounds', `${archerId}_${Date.now()}`);
        const archerRoundRecord = {
            archerId,
            userId,
            ...roundData,
            completedAt: serverTimestamp(),
            roundType: 'OAS Qualification Round'
        };
        
        await setDoc(profileRoundRef, archerRoundRecord);
        console.log('Archer round saved to profile:', archerRoundRecord);
        return profileRoundRef.id;
    } catch (error) {
        console.error('Error saving archer round to profile:', error);
        throw error;
    }
};

export const loadArcherRoundsFromFirebase = async (archerId) => {
    try {
        const roundsQuery = query(
            collection(db, 'archerRounds'),
            where('archerId', '==', archerId),
            orderBy('completedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(roundsQuery);
        const rounds = [];
        
        querySnapshot.forEach((doc) => {
            rounds.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('Archer rounds loaded from Firebase:', rounds);
        return rounds;
    } catch (error) {
        console.error('Error loading archer rounds from Firebase:', error);
        return [];
    }
};

// ===== ENHANCED SCORING SYSTEM =====
// Proper scoring data model with archer profile and event relationships

export const saveCompetitionScore = async (scoreData, userId) => {
    try {
        const {
            archerId,
            archerName,
            competitionId,
            competitionName,
            baleNumber,
            targetAssignment,
            division,
            gender,
            roundType,
            totalEnds,
            arrowsPerEnd,
            ends,
            totals,
            verifiedBy,
            paperConfirmed = false
        } = scoreData;

        // Create comprehensive score record
        const scoreRef = doc(db, 'competitionScores', `${archerId}_${competitionId}_${Date.now()}`);
        const scoreRecord = {
            id: scoreRef.id,
            archerId,
            archerName,
            competitionId,
            competitionName,
            baleNumber,
            targetAssignment,
            division,
            gender,
            roundType,
            totalEnds,
            arrowsPerEnd,
            ends,
            totals,
            verifiedBy,
            paperConfirmed,
            scoredBy: userId,
            completedAt: serverTimestamp(),
            status: 'verified',
            isShared: true // All competition scores are shared
        };

        await setDoc(scoreRef, scoreRecord);
        console.log('Competition score saved to Firebase:', scoreRecord);

        // Also save to archer's profile history
        await saveArcherRoundToProfile(archerId, scoreRecord, userId);

        // Update archer's profile with latest performance stats
        await updateArcherPerformanceStats(archerId, scoreRecord);

        return scoreRef.id;
    } catch (error) {
        console.error('Error saving competition score:', error);
        throw error;
    }
};

export const loadCompetitionScores = async (competitionId) => {
    try {
        const scoresQuery = query(
            collection(db, 'competitionScores'),
            where('competitionId', '==', competitionId),
            orderBy('completedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(scoresQuery);
        const scores = [];
        
        querySnapshot.forEach((doc) => {
            scores.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`Competition scores loaded for ${competitionId}:`, scores.length);
        return scores;
    } catch (error) {
        console.error('Error loading competition scores:', error);
        return [];
    }
};

export const loadArcherCompetitionScores = async (archerId, competitionId = null) => {
    try {
        let scoresQuery;
        
        if (competitionId) {
            // Load scores for specific competition
            scoresQuery = query(
                collection(db, 'competitionScores'),
                where('archerId', '==', archerId),
                where('competitionId', '==', competitionId),
                orderBy('completedAt', 'desc')
            );
        } else {
            // Load all scores for archer
            scoresQuery = query(
                collection(db, 'competitionScores'),
                where('archerId', '==', archerId),
                orderBy('completedAt', 'desc')
            );
        }
        
        const querySnapshot = await getDocs(scoresQuery);
        const scores = [];
        
        querySnapshot.forEach((doc) => {
            scores.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`Archer scores loaded for ${archerId}:`, scores.length);
        return scores;
    } catch (error) {
        console.error('Error loading archer competition scores:', error);
        return [];
    }
};

export const updateArcherPerformanceStats = async (archerId, scoreRecord) => {
    try {
        // Load archer profile
        const profileRef = doc(db, 'profiles', archerId);
        const profileDoc = await getDoc(profileRef);
        
        if (!profileDoc.exists()) {
            console.warn('Archer profile not found for stats update:', archerId);
            return;
        }

        const profile = profileDoc.data();
        
        // Load all scores for this archer
        const allScores = await loadArcherCompetitionScores(archerId);
        
        // Calculate performance statistics
        const stats = calculateArcherStats(allScores);
        
        // Update profile with new stats
        await setDoc(profileRef, {
            ...profile,
            performanceStats: stats,
            lastScoreUpdate: serverTimestamp()
        }, { merge: true });
        
        console.log('Archer performance stats updated:', archerId, stats);
    } catch (error) {
        console.error('Error updating archer performance stats:', error);
    }
};

export const calculateArcherStats = (scores) => {
    if (!scores || scores.length === 0) {
        return {
            totalRounds: 0,
            averageScore: 0,
            bestScore: 0,
            totalTens: 0,
            totalXs: 0,
            consistency: 0,
            lastRoundDate: null
        };
    }

    let totalScore = 0;
    let totalArrows = 0;
    let totalTens = 0;
    let totalXs = 0;
    let bestScore = 0;
    let roundScores = [];

    scores.forEach(score => {
        if (score.totals && score.totals.totalScore) {
            const roundScore = score.totals.totalScore;
            totalScore += roundScore;
            roundScores.push(roundScore);
            
            if (roundScore > bestScore) {
                bestScore = roundScore;
            }
        }

        if (score.totals) {
            totalTens += score.totals.totalTens || 0;
            totalXs += score.totals.totalXs || 0;
        }

        // Count total arrows
        if (score.totalEnds && score.arrowsPerEnd) {
            totalArrows += score.totalEnds * score.arrowsPerEnd;
        }
    });

    // Calculate consistency (standard deviation of scores)
    const averageScore = roundScores.length > 0 ? totalScore / roundScores.length : 0;
    const variance = roundScores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / roundScores.length;
    const consistency = Math.sqrt(variance);

    return {
        totalRounds: scores.length,
        averageScore: Math.round(averageScore * 10) / 10,
        bestScore,
        totalTens,
        totalXs,
        consistency: Math.round(consistency * 10) / 10,
        lastRoundDate: scores[0]?.completedAt || null,
        totalArrows
    };
};

export const loadArcherProfileWithScores = async (archerId) => {
    try {
        // Load profile
        const profileRef = doc(db, 'profiles', archerId);
        const profileDoc = await getDoc(profileRef);
        
        if (!profileDoc.exists()) {
            console.warn('Archer profile not found:', archerId);
            return null;
        }

        const profile = { id: profileDoc.id, ...profileDoc.data() };
        
        // Load recent scores
        const recentScores = await loadArcherCompetitionScores(archerId);
        
        // Calculate current stats
        const stats = calculateArcherStats(recentScores);
        
        return {
            ...profile,
            recentScores: recentScores.slice(0, 10), // Last 10 scores
            performanceStats: stats
        };
    } catch (error) {
        console.error('Error loading archer profile with scores:', error);
        return null;
    }
}; 

export const findMyArcherProfile = async (userId, userEmail = null) => {
    try {
        // Load all profiles for the current user
        let profiles = [];
        if (userId) {
            try {
                profiles = await loadProfilesFromFirebase(userId);
            } catch (error) {
                console.error('Error loading profiles:', error);
            }
        }
        
        // Fallback to localStorage
        if (profiles.length === 0) {
            const savedProfiles = localStorage.getItem('archerProfiles');
            if (savedProfiles) {
                profiles = JSON.parse(savedProfiles);
            }
        }

        // Find "my" profile by matching email or auto-selecting first profile
        let myProfile = null;
        
        // First try to match by email
        if (userEmail) {
            myProfile = profiles.find(profile => 
                profile.email && profile.email.toLowerCase() === userEmail.toLowerCase()
            );
        }
        
        // If no email match, use the first profile (most common case)
        if (!myProfile && profiles.length > 0) {
            myProfile = profiles[0];
        }

        return myProfile;
    } catch (error) {
        console.error('Error finding my archer profile:', error);
        return null;
    }
};

export const loadMyScores = async (userId, userEmail = null) => {
    try {
        console.log('Loading my scores from Firebase for user:', userId);
        
        // First, find my profile
        const myProfile = await findMyArcherProfile(userId, userEmail);
        if (!myProfile) {
            console.log('No profile found for user');
            return [];
        }
        
        // Load all scores for this profile
        const scores = await loadArcherRoundsFromFirebase(myProfile.id);
        console.log(`Loaded ${scores.length} scores for profile ${myProfile.id}`);
        return scores;
    } catch (error) {
        console.error('Error loading my scores from Firebase:', error);
        throw error;
    }
};

// Team Management Functions
export const loadTeamFromFirebase = async (teamCode) => {
    try {
        console.log('Loading team from Firebase for team code:', teamCode);
        
        // Team code is just the school/team name (e.g., "CAMP", "WDV", "BHS", "ORANCO")
        const schoolTeamName = teamCode.toUpperCase();
        
        // Query profiles by school/team name only
        const profilesRef = collection(db, 'profiles');
        let teamProfiles = [];
        
        // Try exact match first
        const exactQuery = query(
            profilesRef, 
            where('school', '==', schoolTeamName)
        );
        
        let querySnapshot = await getDocs(exactQuery);
        querySnapshot.forEach((doc) => {
            teamProfiles.push({ id: doc.id, ...doc.data() });
        });
        
        // If no results, try case-insensitive search
        if (teamProfiles.length === 0) {
            console.log('No exact matches, trying case-insensitive search');
            const allProfilesQuery = query(profilesRef);
            querySnapshot = await getDocs(allProfilesQuery);
            
            querySnapshot.forEach((doc) => {
                const profile = doc.data();
                const profileSchool = (profile.school || '').toUpperCase();
                const searchSchool = schoolTeamName;
                
                if (profileSchool.includes(searchSchool) || searchSchool.includes(profileSchool)) {
                    teamProfiles.push({ id: doc.id, ...profile });
                }
            });
        }
        
        console.log(`Found ${teamProfiles.length} profiles for team ${teamCode}`);
        
        if (teamProfiles.length === 0) {
            // Fallback to hardcoded data if no Firebase data found
            console.log('No Firebase data found, using fallback data');
            return loadTeamFromFallback(teamCode);
        }
        
        return teamProfiles;
    } catch (error) {
        console.error('Error loading team from Firebase:', error);
        // Fallback to hardcoded data
        return loadTeamFromFallback(teamCode);
    }
};

export const loadTeamFromFallback = (teamCode) => {
    // Import the fallback data from teamQRGenerator
    const { getTeamInfo } = require('../utils/teamQRGenerator.js');
    const teamInfo = getTeamInfo(teamCode);
    
    if (!teamInfo) {
        throw new Error(`Team code '${teamCode}' not found in fallback data`);
    }
    
    return teamInfo.archers;
};

export const getAvailableTeamsFromFirebase = async () => {
    try {
        console.log('Loading available teams from Firebase');
        
        const profilesRef = collection(db, 'profiles');
        const querySnapshot = await getDocs(profilesRef);
        
        const teams = new Map();
        
        querySnapshot.forEach((doc) => {
            const profile = doc.data();
            if (profile.school) {
                const teamCode = profile.school.toUpperCase();
                
                if (!teams.has(teamCode)) {
                    teams.set(teamCode, {
                        teamCode,
                        name: `${profile.school} Team`,
                        school: profile.school,
                        archerCount: 0,
                        archers: []
                    });
                }
                
                const team = teams.get(teamCode);
                team.archerCount++;
                team.archers.push({ id: doc.id, ...profile });
            }
        });
        
        console.log(`Found ${teams.size} teams in Firebase`);
        return Array.from(teams.values());
    } catch (error) {
        console.error('Error loading teams from Firebase:', error);
        // Return fallback teams
        const { getAvailableTeamCodes, getTeamInfo } = require('../utils/teamQRGenerator.js');
        const teamCodes = getAvailableTeamCodes();
        
        return teamCodes.map(teamCode => {
            const teamInfo = getTeamInfo(teamCode);
            return {
                teamCode,
                name: teamInfo.name,
                school: teamInfo.school,
                archerCount: teamInfo.archers.length,
                archers: teamInfo.archers
            };
        });
    }
};

export const saveTeamToFirebase = async (teamData, userId) => {
    try {
        console.log('Saving team data to Firebase:', teamData);
        
        // Save each archer profile to Firebase
        const savedProfiles = [];
        
        for (const archer of teamData.archers) {
            // Check if profile already exists in Firebase
            const profileRef = doc(db, 'profiles', archer.id);
            const profileDoc = await getDoc(profileRef);
            
            if (profileDoc.exists()) {
                console.log(`Profile ${archer.id} already exists in Firebase, skipping`);
                continue;
            }
            
            const profileData = {
                ...archer,
                createdBy: userId,
                updatedBy: userId,
                updatedAt: serverTimestamp(),
                isShared: true,
                school: teamData.school,
                team: teamData.team
            };
            
            await setDoc(profileRef, profileData);
            savedProfiles.push({ id: archer.id, ...profileData });
        }
        
        console.log(`Saved ${savedProfiles.length} new profiles for team ${teamData.teamCode}`);
        return savedProfiles;
    } catch (error) {
        console.error('Error saving team to Firebase:', error);
        throw error;
    }
};

// Coach Assignment Management
export const assignCoachToSchool = async (coachId, school, team, role = 'head_coach', assignedBy) => {
    try {
        console.log('Assigning coach to school:', { coachId, school, team, role });
        
        const assignmentRef = doc(db, 'coachAssignments', `${coachId}_${school}_${team}`);
        const assignmentData = {
            coachId,
            school: school.toUpperCase(),
            team: team.toUpperCase(),
            role,
            assignedAt: serverTimestamp(),
            assignedBy,
            isActive: true
        };
        
        await setDoc(assignmentRef, assignmentData);
        console.log('Coach assignment saved successfully');
        return true;
    } catch (error) {
        console.error('Error assigning coach to school:', error);
        throw error;
    }
};

export const removeCoachFromSchool = async (coachId, school, team) => {
    try {
        console.log('Removing coach from school:', { coachId, school, team });
        
        const assignmentRef = doc(db, 'coachAssignments', `${coachId}_${school}_${team}`);
        await deleteDoc(assignmentRef);
        console.log('Coach assignment removed successfully');
        return true;
    } catch (error) {
        console.error('Error removing coach from school:', error);
        throw error;
    }
};

export const getCoachAssignments = async (coachId = null) => {
    try {
        console.log('Loading coach assignments:', coachId);
        
        const assignmentsRef = collection(db, 'coachAssignments');
        let q;
        
        if (coachId) {
            q = query(assignmentsRef, where('coachId', '==', coachId), where('isActive', '==', true));
        } else {
            q = query(assignmentsRef, where('isActive', '==', true));
        }
        
        const querySnapshot = await getDocs(q);
        const assignments = [];
        
        querySnapshot.forEach((doc) => {
            assignments.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Found ${assignments.length} coach assignments`);
        return assignments;
    } catch (error) {
        console.error('Error loading coach assignments:', error);
        throw error;
    }
};

export const getSchoolCoaches = async (school, team = null) => {
    try {
        console.log('Loading coaches for school:', { school, team });
        
        const assignmentsRef = collection(db, 'coachAssignments');
        let q;
        
        if (team) {
            q = query(
                assignmentsRef, 
                where('school', '==', school.toUpperCase()),
                where('team', '==', team.toUpperCase()),
                where('isActive', '==', true)
            );
        } else {
            q = query(
                assignmentsRef, 
                where('school', '==', school.toUpperCase()),
                where('isActive', '==', true)
            );
        }
        
        const querySnapshot = await getDocs(q);
        const coaches = [];
        
        querySnapshot.forEach((doc) => {
            coaches.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Found ${coaches.length} coaches for school ${school}`);
        return coaches;
    } catch (error) {
        console.error('Error loading school coaches:', error);
        throw error;
    }
};

export const isCoachForSchool = async (coachId, school, team = null) => {
    try {
        const assignments = await getCoachAssignments(coachId);
        
        if (team) {
            return assignments.some(assignment => 
                assignment.school === school.toUpperCase() && 
                assignment.team === team.toUpperCase()
            );
        } else {
            return assignments.some(assignment => 
                assignment.school === school.toUpperCase()
            );
        }
    } catch (error) {
        console.error('Error checking coach assignment:', error);
        return false;
    }
};

// Coach Event Management
export const createCoachEvent = async (eventData, coachId) => {
    try {
        console.log('Creating coach event:', { eventData, coachId });
        
        const eventRef = doc(db, 'coachEvents', eventData.id);
        const eventDoc = {
            ...eventData,
            coachId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'active'
        };
        
        await setDoc(eventRef, eventDoc);
        console.log('Coach event created successfully');
        return true;
    } catch (error) {
        console.error('Error creating coach event:', error);
        throw error;
    }
};

export const updateCoachEvent = async (eventId, updates) => {
    try {
        console.log('Updating coach event:', { eventId, updates });
        
        const eventRef = doc(db, 'coachEvents', eventId);
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp()
        };
        
        await updateDoc(eventRef, updateData);
        console.log('Coach event updated successfully');
        return true;
    } catch (error) {
        console.error('Error updating coach event:', error);
        throw error;
    }
};

export const getCoachEvents = async (coachId = null, status = 'active') => {
    try {
        console.log('Loading coach events:', { coachId, status });
        
        const eventsRef = collection(db, 'coachEvents');
        let q;
        
        if (coachId) {
            q = query(
                eventsRef, 
                where('coachId', '==', coachId),
                where('status', '==', status),
                orderBy('createdAt', 'desc')
            );
        } else {
            q = query(
                eventsRef, 
                where('status', '==', status),
                orderBy('createdAt', 'desc')
            );
        }
        
        const querySnapshot = await getDocs(q);
        const events = [];
        
        querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Found ${events.length} coach events`);
        return events;
    } catch (error) {
        console.error('Error loading coach events:', error);
        throw error;
    }
};

export const deleteCoachEvent = async (eventId) => {
    try {
        console.log('Deleting coach event:', eventId);
        
        const eventRef = doc(db, 'coachEvents', eventId);
        await deleteDoc(eventRef);
        console.log('Coach event deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting coach event:', error);
        throw error;
    }
};

export const assignArchersToEvent = async (eventId, archerIds) => {
    try {
        console.log('Assigning archers to event:', { eventId, archerIds });
        
        const eventRef = doc(db, 'coachEvents', eventId);
        await updateDoc(eventRef, {
            assignedArchers: archerIds,
            updatedAt: serverTimestamp()
        });
        
        console.log('Archers assigned to event successfully');
        return true;
    } catch (error) {
        console.error('Error assigning archers to event:', error);
        throw error;
    }
}; 