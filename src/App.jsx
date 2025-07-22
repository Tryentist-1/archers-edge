import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ScoringInterface from './components/ScoringInterface';
import ArcherSetup from './components/ArcherSetup';
import MultiArcherScoring from './components/MultiArcherScoring';
import ArcherScorecard from './components/ArcherScorecard';
import { LocalStorage } from './utils/localStorage';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [currentView, setCurrentView] = useState('setup'); // 'setup', 'scoring', 'card'
  const [baleData, setBaleData] = useState(null);
  const [selectedArcherId, setSelectedArcherId] = useState(null);
  const [error, setError] = useState(null);

  // Load existing bale data and app state from local storage
  useEffect(() => {
    try {
      if (!loading) {
        // Load app state from local storage
        const savedAppState = LocalStorage.loadAppState();
        
        if (savedAppState) {
          setCurrentView(savedAppState.currentView || 'setup');
          setBaleData(savedAppState.baleData || null);
          setSelectedArcherId(savedAppState.selectedArcherId || null);
        } else {
          // Check if user has existing bale data
          const savedBaleData = LocalStorage.loadBaleData();
          
          if (savedBaleData) {
            setBaleData(savedBaleData);
            setCurrentView('scoring');
          } else {
            setCurrentView('setup');
          }
        }
      }
    } catch (error) {
      console.error('Error in AppContent useEffect:', error);
      setError(error.message);
    }
  }, [loading]);

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
        <div className="w-full px-1">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">Archer's Edge</h1>
              {baleData && (
                <span className="ml-2 text-xs text-gray-600">
                  Bale {baleData.baleNumber} • {baleData.archers?.length || 0} archers
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {currentView !== 'setup' && (
                <button
                  onClick={handleNewBale}
                  className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                >
                  New Bale
                </button>
              )}
              <div className="text-xs text-gray-600">
                {currentUser.email}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
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