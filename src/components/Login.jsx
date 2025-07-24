import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

function Login() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, logout, getMyProfileId, getFavoriteProfileIds, toggleFavorite, isSetup } = useAuth();

  // Load profiles from localStorage
  useEffect(() => {
    const loadProfiles = () => {
      try {
        const storedProfiles = localStorage.getItem('archerProfiles');
        if (storedProfiles) {
          const parsedProfiles = JSON.parse(storedProfiles);
          setProfiles(parsedProfiles);
        }
      } catch (error) {
        console.error('Error loading profiles:', error);
      }
    };

    loadProfiles();
  }, []);

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
                  onClick={handleLogout}
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
              <button
                onClick={() => {
                  // Set current view to profile management
                  window.dispatchEvent(new CustomEvent('navigate', { 
                    detail: { destination: 'profile' } 
                  }));
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Profile
              </button>
              <div>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                >
                  Continue as Anonymous
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Continue as Anonymous */}
        {profiles.length > 0 && (
          <div className="text-center">
            <button
              onClick={handleLogout}
              disabled={loading}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
            >
              Continue as Anonymous
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login; 