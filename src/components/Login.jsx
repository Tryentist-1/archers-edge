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

  // Show unified profile selection for all users (new and returning)
  return <UnifiedProfileSelection />;
}

// Unified Profile Selection - handles both new users and returning users
function UnifiedProfileSelection() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProfileForm, setShowNewProfileForm] = useState(false);
  const [showTeamLoading, setShowTeamLoading] = useState(false);
  const { login, logout } = useAuth();

  React.useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = () => {
    try {
      setLoading(true);
      const savedProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
      setProfiles(savedProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = (profileId) => {
    try {
      login(profileId);
      // Mark first login as completed
      localStorage.setItem('firstLoginCompleted', 'true');
    } catch (error) {
      setError('Failed to select profile: ' + error.message);
    }
  };

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
        try {
          const { loadTeamFromFirebase } = await import('../services/firebaseService.js');
          profiles = await loadTeamFromFirebase(teamCode);
        } catch (firebaseError) {
          console.warn('⚠️ Firebase team load failed, trying fallback:', firebaseError.message);
          
          // Fallback to hardcoded team data
          try {
            const { getTeamInfo } = await import('../utils/teamQRGenerator.js');
            const teamInfo = getTeamInfo(teamCode);
            if (teamInfo) {
              profiles = teamInfo.archers;
              console.log('✅ Team loaded from fallback:', teamCode);
            } else {
              throw new Error(`Team code '${teamCode}' not found in fallback data`);
            }
          } catch (fallbackError) {
            console.error('❌ Fallback team load failed:', fallbackError.message);
            throw new Error(`No team data found for code: ${teamCode}`);
          }
        }
      }

      if (profiles && profiles.length > 0) {
        localStorage.setItem('archerProfiles', JSON.stringify(profiles));
        setProfiles(profiles);
        setError('');
        console.log('✅ Team data loaded successfully:', profiles.length, 'profiles');
      } else {
        setError('No team data found for the provided code');
      }
    } catch (error) {
      console.error('❌ Error loading team data:', error);
      setError('Failed to load team data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.toLowerCase();
    const school = (profile.school || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || school.includes(search);
  });

  if (showNewProfileForm) {
    return <NewProfileForm onComplete={loadProfiles} onBack={() => setShowNewProfileForm(false)} />;
  }

  if (showTeamLoading) {
    return <TeamLoadingModal onLoad={handleLoadTeamData} onClose={() => setShowTeamLoading(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Welcome to Archer's Edge
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Select your profile or load team data
          </p>
        </div>

        {/* Team Loading Options */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Load Team Data</h3>
          <div className="space-y-3">
            <button
              onClick={() => setShowTeamLoading(true)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              📱 Scan QR Code or Enter Team Code
            </button>
          </div>
        </div>

        {/* Profile Selection */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Your Profile</h3>
          
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by name or school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Profile List */}
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading profiles...</p>
            </div>
          ) : filteredProfiles.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleProfileSelect(profile.id)}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {profile.firstName} {profile.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {profile.school} • {profile.role || 'Archer'}
                    </p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700">
                    Select
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">
                {searchTerm ? 'No profiles found matching your search.' : 'No profiles available.'}
              </p>
            </div>
          )}

          {/* New Profile Button */}
          <div className="mt-4">
            <button
              onClick={() => setShowNewProfileForm(true)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              + Create New Profile
            </button>
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

// New Profile Form Component
function NewProfileForm({ onComplete, onBack }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [school, setSchool] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Archer'); // 'Archer', 'Coach', 'System Admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const newProfile = {
        id: `new-${Date.now()}`, // Simple unique ID
        firstName,
        lastName,
        school,
        email,
        phone,
        role,
        createdAt: new Date().toISOString()
      };
      const updatedProfiles = [...JSON.parse(localStorage.getItem('archerProfiles') || '[]'), newProfile];
      localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
      login(newProfile.id);
      onComplete();
    } catch (error) {
      setError('Failed to create new profile: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create New Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Add a new archer to your team
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="school" className="block text-sm font-medium text-gray-700">
                School
              </label>
              <input
                type="text"
                id="school"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email (optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone (optional)
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="Archer">Archer</option>
                <option value="Coach">Coach</option>
                <option value="System Admin">System Admin</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={onBack}
            disabled={loading}
            className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            ← Back to Welcome
          </button>
        </div>
      </div>
    </div>
  );
}

// Team Loading Modal Component
function TeamLoadingModal({ onLoad, onClose }) {
  const [teamCode, setTeamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (teamCode.trim()) {
      setLoading(true);
      onLoad(teamCode.trim(), null); // Pass null for teamData as it's not from URL
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Enter Team Code</h3>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="teamCode" className="block text-sm font-medium text-gray-700 mb-2">
              Team Code
            </label>
            <input
              type="text"
              id="teamCode"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
              placeholder="e.g., CENTRAL-VARSITY"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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