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
  const { currentUser, loading, logout } = useAuth();
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
      if (!loading && currentUser) {
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

        // Sync with Firebase if online and not mock user
        if (shouldUseFirebase(currentUser?.uid)) {
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
          console.log('Skipping Firebase sync - offline or mock user');
        }

        return cleanup;
      }
    } catch (error) {
      console.error('Error in AppContent useEffect:', error);
      setError(error.message);
    }
  }, [loading, currentUser, isOnline]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="w-full px-4">
          <div className="flex justify-between items-center h-14">
            {/* Left side - App title and Home button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleNavigation('home')}
                className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Archer's Edge
              </button>
              {baleData && currentView === 'scoring' && (
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Bale {baleData.baleNumber}
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {baleData.archers?.length || 0} archers
                  </span>
                </div>
              )}
            </div>

            {/* Right side - Navigation and user info */}
            <div className="flex items-center space-x-3">

              {/* Sync Status */}
              {syncStatus !== 'idle' && (
                <div className={`text-xs px-2 py-1 rounded-full ${
                  syncStatus === 'syncing' ? 'bg-yellow-100 text-yellow-800' :
                  syncStatus === 'success' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {syncStatus === 'syncing' ? '🔄 Syncing' :
                   syncStatus === 'success' ? '✅ Synced' :
                   '❌ Error'}
                </div>
              )}

              {/* User info and logout */}
              <div className="flex items-center space-x-3">
                {myProfile && (
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                    <button
                      onClick={() => handleNavigation('profile')}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      {myProfile.firstName} {myProfile.lastName}
                    </button>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {myProfile.role}
                    </span>
                  </div>
                )}
                <div className="hidden sm:block text-sm text-gray-600 truncate max-w-32">
                  {currentUser.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {currentView === 'first-login-prompt' && (
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