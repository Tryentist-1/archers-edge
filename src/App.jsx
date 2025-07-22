import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ScoringInterface from './components/ScoringInterface';
import ArcherSetup from './components/ArcherSetup';
import MultiArcherScoring from './components/MultiArcherScoring';
import ArcherScorecard from './components/ArcherScorecard';
import HomePage from './components/HomePage';
import ProfileManagement from './components/ProfileManagement';
import CompetitionManagement from './components/CompetitionManagement';
import TeamArcherManagement from './components/TeamArcherManagement';
import { LocalStorage } from './utils/localStorage';
import { 
    syncLocalDataToFirebase, 
    syncFirebaseDataToLocal, 
    isOnline, 
    setupNetworkListeners 
} from './services/firebaseService';

function AppContent() {
  const { currentUser, loading, logout } = useAuth();
  const [currentView, setCurrentView] = useState('home'); // 'home', 'setup', 'scoring', 'card', 'profile', 'scores'
  const [baleData, setBaleData] = useState(null);
  const [selectedArcherId, setSelectedArcherId] = useState(null);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'syncing', 'success', 'error'

  // Load existing bale data and app state from local storage
  useEffect(() => {
    try {
      if (!loading && currentUser) {
        // Set up network listeners
        const cleanup = setupNetworkListeners(
          () => setIsOnline(true),
          () => setIsOnline(false)
        );

        // Load app state from local storage
        const savedAppState = LocalStorage.loadAppState();
        
        if (savedAppState) {
          setCurrentView(savedAppState.currentView || 'home');
          setBaleData(savedAppState.baleData || null);
          setSelectedArcherId(savedAppState.selectedArcherId || null);
        } else {
          // Check if user has existing bale data
          const savedBaleData = LocalStorage.loadBaleData();
          
          if (savedBaleData) {
            setBaleData(savedBaleData);
            setCurrentView('scoring');
          } else {
            setCurrentView('home');
          }
        }

        // Sync with Firebase if online
        if (isOnline) {
          syncWithFirebase();
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
        timestamp: new Date().toISOString()
      };
      LocalStorage.saveAppState(appState);
    }
  }, [currentView, baleData, selectedArcherId, loading]);

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

  const handleNewBale = () => {
    setBaleData(null);
    setCurrentView('setup');
    setSelectedArcherId(null);
    // Clear local storage for new bale
    LocalStorage.clearAll();
  };

  const handleNavigation = (destination) => {
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
      case 'new-round':
        setCurrentView('setup');
        break;
      default:
        setCurrentView('home');
    }
  };

  const handleLogout = async () => {
    try {
      // Clear local storage
      LocalStorage.clearAll();
      
      // Clear app state
      setBaleData(null);
      setSelectedArcherId(null);
      setCurrentView('home');
      
      // Sign out from Firebase
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload if logout fails
      window.location.reload();
    }
  };

  const syncWithFirebase = async () => {
    if (!currentUser || !isOnline) return;
    
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
              {/* Navigation buttons */}
              <div className="flex items-center space-x-2">
                {currentView === 'scoring' && (
                  <button
                    onClick={handleNewBale}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    New Bale
                  </button>
                )}
              </div>

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
                <div className="hidden sm:block text-sm text-gray-600 truncate max-w-32">
                  {currentUser.email}
                </div>
                {currentView === 'home' && (
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        {currentView === 'home' && (
          <HomePage 
            currentUser={currentUser}
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
          />
        )}
        
        {currentView === 'card' && baleData && selectedArcherId && (
          <ArcherScorecard 
            baleData={baleData} 
            archerId={selectedArcherId}
            onBackToScoring={handleBackToScoring}
          />
        )}
        
        {currentView === 'profile' && (
          <ProfileManagement onNavigate={handleNavigation} />
        )}
        
        {currentView === 'competitions' && (
          <CompetitionManagement onNavigate={handleNavigation} />
        )}
        {currentView === 'team-archers' && (
          <TeamArcherManagement onNavigate={handleNavigation} />
        )}
        
        {currentView === 'scores' && (
          <div className="p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your Scores</h2>
            <p className="text-gray-600">Score history coming soon...</p>
          </div>
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