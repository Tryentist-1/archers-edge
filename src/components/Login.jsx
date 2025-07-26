import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { loadTeamFromFirebase } from '../services/firebaseService.js';

function Login() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showProfileSelection, setShowProfileSelection] = useState(false);
  const { 
    signInWithPhone, 
    signInWithGoogle, 
    currentUser, 
    userRole,
    login,
    logout,
    getMyProfileId,
    getFavoriteProfileIds,
    toggleFavorite,
    isSetup 
  } = useAuth();

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signInWithPhone(phoneNumber);
      setConfirmationResult(result);
      setLoading(false);
    } catch (error) {
      setError('Failed to send verification code: ' + error.message);
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmationResult.confirm(verificationCode);
      setLoading(false);
    } catch (error) {
      setError('Failed to verify code: ' + error.message);
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      setLoading(false);
    } catch (error) {
      setError('Failed to sign in with Google: ' + error.message);
      setLoading(false);
    }
  };

  const handleProfileSelection = () => {
    setShowProfileSelection(true);
  };

  const handleProfileSelect = (profileId) => {
    setLoading(true);
    setError('');

    try {
      login(profileId);
      setLoading(false);
    } catch (error) {
      setError('Failed to set profile: ' + error.message);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setLoading(true);
    setError('');

    try {
      logout();
      setLoading(false);
    } catch (error) {
      setError('Failed to logout: ' + error.message);
      setLoading(false);
    }
  };

  // If user is authenticated, show role-based welcome
  if (currentUser && !currentUser.isAnonymous) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome to Archer's Edge
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {userRole ? `Signed in as ${userRole.replace('_', ' ')}` : 'Signed in'}
            </p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-4">
                <p><strong>Email:</strong> {currentUser.email}</p>
                <p><strong>Role:</strong> {userRole || 'Archer'}</p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={handleProfileSelection}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Select Profile'}
                </button>
                
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show profile selection if user wants to use profile-based auth
  if (showProfileSelection) {
    return <ProfileSelectionView onBack={() => setShowProfileSelection(false)} />;
  }

  // Show authentication options
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Archer's Edge
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Choose your preferred sign-in method
          </p>
        </div>

        {/* Google Sign In */}
        <div className="mt-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-100 text-gray-500">Or continue with phone</span>
          </div>
        </div>

        {/* Phone Number Sign In */}
        {!confirmationResult ? (
          <form className="mt-6 space-y-4" onSubmit={handlePhoneSubmit}>
            <div>
              <label htmlFor="phone" className="sr-only">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Phone number (e.g., +1234567890)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleCodeSubmit}>
            <div>
              <label htmlFor="code" className="sr-only">
                Verification Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
          </form>
        )}

        {/* Profile-based authentication option */}
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-100 text-gray-500">Or use profile selection</span>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleProfileSelection}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Select from Existing Profiles
          </button>
        </div>

        {error && (
          <div className="mt-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* reCAPTCHA container */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}

// Profile Selection Component
function ProfileSelectionView({ onBack }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showTeamCodeInput, setShowTeamCodeInput] = useState(false);
  const { login, getMyProfileId, getFavoriteProfileIds, toggleFavorite } = useAuth();

  // Load profiles from localStorage
  React.useEffect(() => {
    const loadProfiles = () => {
      try {
        const storedProfiles = localStorage.getItem('archerProfiles');
        if (storedProfiles) {
          const parsedProfiles = JSON.parse(storedProfiles);
          setProfiles(parsedProfiles);
        } else {
          // For development/testing - create sample profiles if none exist
          if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname.includes('172.16')) {
            const sampleProfiles = [
              {
                id: 'sample-1',
                firstName: 'John',
                lastName: 'Smith',
                school: 'Central High',
                email: 'john.smith@email.com',
                phone: '+1234567890',
                team: 'Varsity',
                level: 'Advanced',
                createdAt: new Date().toISOString()
              },
              {
                id: 'sample-2',
                firstName: 'Sarah',
                lastName: 'Johnson',
                school: 'Central High',
                email: 'sarah.johnson@email.com',
                phone: '+1234567891',
                team: 'JV',
                level: 'Intermediate',
                createdAt: new Date().toISOString()
              },
              {
                id: 'sample-3',
                firstName: 'Mike',
                lastName: 'Davis',
                school: 'Central High',
                email: 'mike.davis@email.com',
                phone: '+1234567892',
                team: 'Varsity',
                level: 'Beginner',
                createdAt: new Date().toISOString()
              }
            ];
            
            // Only create samples if user explicitly wants them
            if (window.location.search.includes('samples=true')) {
              localStorage.setItem('archerProfiles', JSON.stringify(sampleProfiles));
              setProfiles(sampleProfiles);
            }
          }
        }
      } catch (error) {
        console.error('Error loading profiles:', error);
      }
    };

    loadProfiles();
  }, []);

  // Handle team data loading from URL parameters
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const teamCode = urlParams.get('team');
    const teamData = urlParams.get('data');
    
    if (teamCode || teamData) {
      handleLoadTeamData(teamCode, teamData);
    }
  }, []);

  const handleLoadTeamData = async (teamCode, teamData) => {
    setLoading(true);
    setError('');

    try {
      let profiles = [];
      
      if (teamData) {
        // Decode team data from URL parameter
        const decodedData = decodeURIComponent(teamData);
        profiles = JSON.parse(decodedData);
      } else if (teamCode) {
        // Load from server using team code
        profiles = await loadTeamFromFirebase(teamCode);
      }

      if (profiles && profiles.length > 0) {
        localStorage.setItem('archerProfiles', JSON.stringify(profiles));
        setProfiles(profiles);
        setError('');
      } else {
        setError('No team data found for the provided code');
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      setError('Failed to load team data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = (profileId) => {
    setLoading(true);
    setError('');

    try {
      login(profileId);
      setLoading(false);
    } catch (error) {
      setError('Failed to set profile: ' + error.message);
      setLoading(false);
    }
  };

  const myProfileId = getMyProfileId();
  const favoriteProfileIds = getFavoriteProfileIds();

  // Filter profiles
  const myProfile = profiles.find(p => p.id === myProfileId);
  const favoriteProfiles = profiles.filter(p => favoriteProfileIds.includes(p.id));
  const otherProfiles = profiles.filter(p => p.id !== myProfileId && !favoriteProfileIds.includes(p.id));

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Archer's Edge
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select your profile to get started
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* My Profile Section */}
        {myProfile && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">My Profile</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-800">
                  {myProfile.firstName} {myProfile.lastName}
                </p>
                <p className="text-sm text-blue-600">{myProfile.school || 'No school'}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Me
                </span>
                <button
                  onClick={onBack}
                  disabled={loading}
                  className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Favorite Profiles */}
        {favoriteProfiles.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Favorites</h3>
            <div className="space-y-2">
              {favoriteProfiles.map(profile => (
                <div key={profile.id} className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-yellow-800">
                        {profile.firstName} {profile.lastName}
                      </p>
                      <p className="text-sm text-yellow-600">{profile.school || 'No school'}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⭐
                      </span>
                      <button
                        onClick={() => toggleFavorite(profile.id)}
                        disabled={loading}
                        className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Profiles */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {myProfile ? 'Other Profiles' : 'Select Your Profile'}
          </h3>
          <div className="space-y-2">
            {otherProfiles.map(profile => (
              <div key={profile.id} className="bg-white border border-gray-200 rounded-md p-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{profile.school || 'No school'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!myProfile && (
                      <button
                        onClick={() => handleProfileSelect(profile.id)}
                        disabled={loading}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Select
                      </button>
                    )}
                    <button
                      onClick={() => toggleFavorite(profile.id)}
                      disabled={loading}
                      className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    >
                      {favoriteProfileIds.includes(profile.id) ? 'Remove' : '⭐'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* No Profiles Message */}
        {profiles.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
            <p className="text-gray-600 mb-2">No profiles found</p>
            <p className="text-sm text-gray-500 mb-4">
              Create your first profile to get started with scoring
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-400">
                💡 <strong>Tip:</strong> Use Google Sign-in or Phone authentication above to create your first profile
              </p>
              {process.env.NODE_ENV === 'development' && (
                <p className="text-xs text-blue-500">
                  🧪 <strong>Dev:</strong> Add <code>?samples=true</code> to URL for test profiles
                </p>
              )}
            </div>
          </div>
        )}

        {/* Load Team Data Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Load Team Data</h3>
          <p className="text-sm text-blue-700 mb-3">
            Scan a QR code or enter a team code to load archer profiles from the server
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setShowQRScanner(true)}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              📱 Scan QR Code
            </button>
            <button
              onClick={() => setShowTeamCodeInput(true)}
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              🔢 Enter Team Code
            </button>
          </div>
        </div>

        {/* Back to Authentication */}
        <div className="text-center">
          <button
            onClick={onBack}
            disabled={loading}
            className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScannerModal 
          onScan={(data) => {
            setShowQRScanner(false);
            handleLoadTeamData(null, data);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Team Code Input Modal */}
      {showTeamCodeInput && (
        <TeamCodeModal 
          onSubmit={(teamCode) => {
            setShowTeamCodeInput(false);
            handleLoadTeamData(teamCode, null);
          }}
          onClose={() => setShowTeamCodeInput(false)}
        />
      )}
    </div>
  );
}

// QR Scanner Modal Component
function QRScannerModal({ onScan, onClose }) {
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState('');

  const handleScan = (data) => {
    if (data) {
      setScanning(false);
      onScan(data);
    }
  };

  const handleError = (err) => {
    console.error('QR Scan error:', err);
    setError('Failed to scan QR code. Please try again.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Scan QR Code</h3>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-gray-100 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm text-gray-600">
            {scanning ? 'Point camera at QR code...' : 'Processing...'}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => setScanning(!scanning)}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            {scanning ? 'Stop' : 'Start'} Scanning
          </button>
        </div>
      </div>
    </div>
  );
}

// Team Code Input Modal Component
function TeamCodeModal({ onSubmit, onClose }) {
  const [teamCode, setTeamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);

  // Load available teams
  React.useEffect(() => {
    const loadTeams = async () => {
      try {
        const { getAvailableTeamsFromFirebase } = await import('../services/firebaseService.js');
        const teams = await getAvailableTeamsFromFirebase();
        setAvailableTeams(teams);
      } catch (error) {
        console.error('Error loading teams:', error);
        // Fallback to hardcoded teams
        const { getAvailableTeamCodes } = await import('../utils/teamQRGenerator.js');
        const teamCodes = getAvailableTeamCodes();
        setAvailableTeams(teamCodes.map(code => ({ teamCode: code, name: code.replace('-', ' ') })));
      }
    };

    loadTeams();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (teamCode.trim()) {
      setLoading(true);
      onSubmit(teamCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Team Code</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="teamCode" className="block text-sm font-medium text-gray-700 mb-2">
              Team Code
            </label>
            <input
              id="teamCode"
              type="text"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
              placeholder="e.g., CENTRAL-VARSITY"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="text-sm text-gray-500">
            <p>💡 <strong>Available teams:</strong></p>
            <ul className="mt-1 space-y-1">
              {availableTeams.map(team => (
                <li key={team.teamCode}>• <code>{team.teamCode}</code> - {team.name}</li>
              ))}
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !teamCode.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login; 