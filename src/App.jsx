import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ScoringInterface from './components/ScoringInterface';
import ArcherSetup from './components/ArcherSetup';
import MultiArcherScoring from './components/MultiArcherScoring';
import ArcherScorecard from './components/ArcherScorecard';
import OASScorecard from './components/OASScorecard';
import HomePage from './components/HomePage';
import ProfileManagement from './components/ProfileManagement';
import CompetitionManagement from './components/CompetitionManagement';
import TeamArcherManagement from './components/TeamArcherManagement';
import ProfileRoundSetup from './components/ProfileRoundSetup';
import ScoreHistory from './components/ScoreHistory';
import DataSyncPanel from './components/DataSyncPanel';
import ArcherProfileWithStats from './components/ArcherProfileWithStats';
import FirstLoginPrompt from './components/FirstLoginPrompt';
import { LocalStorage } from './utils/localStorage';
import { 
    syncLocalDataToFirebase, 
    syncFirebaseDataToLocal, 
    isOnline, 
    setupNetworkListeners,
    loadAppStateFromFirebase,
    shouldUseFirebase
} from './services/firebaseService';

function AppContent() {
  const { currentUser, loading, logout, isSetup } = useAuth();
  const [currentView, setCurrentView] = useState('home'); // 'home', 'new-round', 'setup', 'scoring', 'card', 'profile', 'scores', 'data-sync', 'archer-stats', 'first-login-prompt'
  const [baleData, setBaleData] = useState(null);
  const [selectedArcherId, setSelectedArcherId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [archerStatsData, setArcherStatsData] = useState(null);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'
  const [hasCompletedFirstLogin, setHasCompletedFirstLogin] = useState(false);
  const [myProfile, setMyProfile] = useState(null);

  // Load existing bale data and app state from local storage and Firebase
  useEffect(() => {
    try {
      if (!loading) {
        // Set up network listeners
        const cleanup = setupNetworkListeners(
          () => setIsOnline(true),
          () => setIsOnline(false)
        );

        // Load app state from local storage first
        const savedAppState = LocalStorage.loadAppState();
        const savedBaleData = LocalStorage.loadBaleData();
        
        // Check if user has completed first login setup
        const firstLoginCompleted = localStorage.getItem('firstLoginCompleted');
        setHasCompletedFirstLogin(!!firstLoginCompleted);
        
        // Load user's "Me" profile
        loadMyProfile();
        
        if (savedAppState) {
          setCurrentView(savedAppState.currentView || 'home');
          setBaleData(savedAppState.baleData || savedBaleData || null);
          setSelectedArcherId(savedAppState.selectedArcherId || null);
        } else if (savedBaleData) {
          setBaleData(savedBaleData);
          setCurrentView('scoring');
        } else {
          // If no saved state and first login not completed, show first login prompt
          if (!firstLoginCompleted) {
            setCurrentView('first-login-prompt');
          } else {
            setCurrentView('home');
          }
        }

        // Sync with Firebase if online and user has set up their profile
        if (shouldUseFirebase(currentUser?.uid) && isSetup()) {
          syncWithFirebase();
          // Also try to load app state from Firebase
          loadAppStateFromFirebase(currentUser.uid).then(firebaseAppState => {
            if (firebaseAppState && firebaseAppState.baleData && !baleData) {
              setBaleData(firebaseAppState.baleData);
              setCurrentView(firebaseAppState.currentView || 'scoring');
            }
          }).catch(error => {
            console.error('Error loading app state from Firebase:', error);
          });
        } else {
          console.log('Skipping Firebase sync - offline, mock user, or no profile setup');
        }

        return cleanup;
      }
    } catch (error) {
      console.error('Error in AppContent useEffect:', error);
      setError(error.message);
    }
  }, [loading, currentUser, isOnline, isSetup]);

  // Handle navigation events from Login component
  useEffect(() => {
    const handleNavigate = (event) => {
      const { destination } = event.detail;
      setCurrentView(destination);
    };

    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  // Save app state to local storage whenever it changes
  useEffect(() => {
    if (!loading) {
      const appState = {
        currentView,
        baleData,
        selectedArcherId,
        selectedProfile,
        timestamp: new Date().toISOString()
      };
      LocalStorage.saveAppState(appState);
    }
  }, [currentView, baleData, selectedArcherId, selectedProfile, loading]);

  const handleSetupComplete = (newBaleData) => {
    setBaleData(newBaleData);
    setCurrentView('scoring');
    // Save bale data to local storage
    LocalStorage.saveBaleData(newBaleData);
  };

  const handleBaleDataUpdate = (updatedBaleData) => {
    setBaleData(updatedBaleData);
    // Save updated bale data to local storage
    LocalStorage.saveBaleData(updatedBaleData);
  };

  const handleViewCard = (archerId) => {
    setSelectedArcherId(archerId);
    setCurrentView('card');
  };

  const handleBackToScoring = () => {
    setCurrentView('scoring');
    setSelectedArcherId(null);
  };

  const handleRoundCompleted = (roundData) => {
    console.log('Round completed:', roundData);
    // Clear current bale data and return to home
    setBaleData(null);
    setSelectedArcherId(null);
    setCurrentView('home');
    
    // Clear local storage for completed round
    LocalStorage.clearBaleData();
  };

  const handleNewBale = () => {
    setBaleData(null);
    setCurrentView('setup');
    setSelectedArcherId(null);
    // Clear local storage for new bale
    LocalStorage.clearAll();
  };

  const handleNavigation = (destination, data = null) => {
    switch (destination) {
      case 'home':
        setCurrentView('home');
        break;
      case 'profile':
        setCurrentView('profile');
        break;
      case 'competitions':
        setCurrentView('competitions');
        break;
      case 'team-archers':
        setCurrentView('team-archers');
        break;
      case 'scores':
        setCurrentView('scores');
        break;
      case 'data-sync':
        setCurrentView('data-sync');
        break;
      case 'new-round':
        setCurrentView('new-round');
        break;
      case 'scoring':
        console.log('Navigating to scoring, data:', data);
        if (data && data.competitionId) {
          // Create baleData from competition for scoring
          const baleData = {
            baleNumber: 1,
            competitionId: data.competitionId,
            competitionName: data.competitionName || 'Competition',
            competitionType: data.competitionType || 'qualification',
            isPracticeRound: false,
            archers: data.archers || [],
            currentEnd: 1,
            totalEnds: 12,
            createdBy: currentUser?.uid,
            createdAt: new Date(),
            status: 'active'
          };
          setBaleData(baleData);
          console.log('Created baleData for scoring:', baleData);
        }
        setCurrentView('scoring');
        break;
      case 'archer-stats':
        setCurrentView('archer-stats');
        if (data && data.archerId) {
          setArcherStatsData({ archerId: data.archerId });
        }
        break;
      default:
        setCurrentView('home');
    }
  };

  const handleFirstLoginComplete = (updatedProfiles) => {
    // Mark first login as completed
    localStorage.setItem('firstLoginCompleted', 'true');
    setHasCompletedFirstLogin(true);
    
    // Navigate to home
    setCurrentView('home');
    
    // Show success message
    console.log('First login setup completed successfully!');
  };

  const loadMyProfile = async () => {
    try {
      // Load profiles from localStorage
      const savedProfiles = localStorage.getItem('archerProfiles');
      if (savedProfiles) {
        const profiles = JSON.parse(savedProfiles);
        // Find the profile tagged as "Me"
        const meProfile = profiles.find(profile => profile.isMe === true);
        if (meProfile) {
          setMyProfile(meProfile);
        }
      }
    } catch (error) {
      console.error('Error loading my profile:', error);
    }
  };

  const handleFirstLoginSkip = () => {
    // Mark first login as completed (even if skipped)
    localStorage.setItem('firstLoginCompleted', 'true');
    setHasCompletedFirstLogin(true);
    
    // Navigate to home
    setCurrentView('home');
  };

  const handleLogout = async () => {
    try {
      // Clear local storage
      LocalStorage.clearAll();
      
      // Clear app state
      setBaleData(null);
      setSelectedArcherId(null);
      setCurrentView('home');
      setHasCompletedFirstLogin(false);
      
      // Sign out from Firebase
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload if logout fails
      window.location.reload();
    }
  };

  const syncWithFirebase = async () => {
    if (!shouldUseFirebase(currentUser?.uid)) {
      console.log('Skipping Firebase sync - offline or mock user');
      return;
    }
    
    try {
      setSyncStatus('syncing');
      await syncLocalDataToFirebase(currentUser.uid);
      setSyncStatus('success');
      
      // Clear success status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      console.error('Error syncing with Firebase:', error);
      setSyncStatus('error');
      
      // Clear error status after 5 seconds
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setCurrentView('home')}
                className="text-xl font-bold text-blue-600 hover:text-blue-700"
              >
                Archer's Edge
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {currentUser && !currentUser.isAnonymous && (
                <>
                  <span className="text-sm text-gray-600">
                    {currentUser.displayName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Login Screen */}
        {!loading && (!currentUser || currentUser.isAnonymous) && (
          <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <Login />
          </div>
        )}

        {/* First Login Prompt */}
        {!loading && currentUser && !currentUser.isAnonymous && !hasCompletedFirstLogin && currentView === 'first-login-prompt' && (
          <FirstLoginPrompt 
            onComplete={handleFirstLoginComplete}
            onSkip={handleFirstLoginSkip}
          />
        )}
        
        {currentView === 'home' && (
          <HomePage 
            currentUser={currentUser}
            onNavigate={handleNavigation}
            baleData={baleData}
          />
        )}
        
        {currentView === 'new-round' && (
          <ProfileRoundSetup 
            onSetupComplete={handleSetupComplete}
            onNavigate={handleNavigation}
          />
        )}
        
        {currentView === 'setup' && (
          <ArcherSetup onSetupComplete={handleSetupComplete} />
        )}
        
        {currentView === 'scoring' && baleData && (
          <MultiArcherScoring 
            baleData={baleData} 
            onViewCard={handleViewCard}
            onBaleDataUpdate={handleBaleDataUpdate}
            onNavigate={handleNavigation}
          />
        )}
        
        {currentView === 'scoring' && !baleData && (
          <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">No Round Data Available</h2>
                  <p className="text-gray-600 mb-4">Please set up a new round to begin scoring.</p>
                  <button
                    onClick={() => setCurrentView('new-round')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Start New Round
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {currentView === 'card' && baleData && selectedArcherId && (
          <OASScorecard 
            baleData={baleData} 
            archerId={selectedArcherId}
            onBackToScoring={handleBackToScoring}
            onRoundCompleted={handleRoundCompleted}
          />
        )}
        
        {currentView === 'profile' && (
          <ProfileManagement 
            onNavigate={handleNavigation}
            onProfileSelect={setSelectedProfile}
            selectedProfile={selectedProfile}
          />
        )}
        
        {currentView === 'competitions' && (
          <CompetitionManagement onNavigate={handleNavigation} />
        )}
        {currentView === 'team-archers' && (
          <TeamArcherManagement onNavigate={handleNavigation} />
        )}
        
        {currentView === 'scores' && (
          <ScoreHistory onNavigate={handleNavigation} />
        )}
        
        {currentView === 'data-sync' && (
          <DataSyncPanel onNavigate={handleNavigation} />
        )}
        
        {currentView === 'archer-stats' && archerStatsData && (
          <ArcherProfileWithStats 
            archerId={archerStatsData.archerId}
            onNavigate={handleNavigation}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 