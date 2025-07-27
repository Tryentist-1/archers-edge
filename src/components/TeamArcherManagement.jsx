import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  loadProfilesFromFirebase,
  saveProfileToFirebase,
  deleteProfileFromFirebase,
  loadArcherProfileWithScores,
  shouldUseFirebase,
  isOnline
} from '../services/firebaseService';

const TeamArcherManagement = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [allArchers, setAllArchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedArchers, setSelectedArchers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingArcher, setEditingArcher] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [userRole, setUserRole] = useState('Archer');
  const [newArcherData, setNewArcherData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'M',
    school: '',
    grade: '',
    division: 'V',
    dominantHand: 'Right',
    dominantEye: 'Right',
    drawLength: '',
    bowType: 'Recurve ILF',
    bowLength: '66',
    bowWeight: '',
    varsityPR: '',
    jvPR: '',
    avgArrow: '',
    role: 'Archer',
    usArcheryNumber: '',
    nfaaNumber: '',
    sponsorships: '',
    isActive: true
  });

  // OAS Divisions for filtering - simplified format
  const oasDivisions = [
    'V',     // Varsity
    'JV',    // Junior Varsity
    'MS'     // Middle School
  ];

  // Ensure allArchers is always an array
  const safeArchers = Array.isArray(allArchers) ? allArchers : [];

  useEffect(() => {
    loadAllArchers();
    loadMyProfile();
  }, [currentUser]);

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
          setUserRole(meProfile.role || 'Archer');
        }
      }
    } catch (error) {
      console.error('Error loading my profile:', error);
    }
  };

  const showMessage = (msg, type = 'info') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 5000);
  };

  const loadAllArchers = async () => {
    try {
      setLoading(true);
      console.log('Loading all archers...');
      console.log('Current user:', currentUser);
      console.log('Should use Firebase:', shouldUseFirebase(currentUser?.uid));
      
      let loadedProfiles = [];
      
      // Use same loading logic as ProfileManagement
      if (shouldUseFirebase(currentUser?.uid)) {
        try {
          console.log('Attempting to load from Firebase...');
          const firebaseProfiles = await loadProfilesFromFirebase(currentUser.uid);
          console.log('Profiles loaded from Firebase:', firebaseProfiles);
          if (firebaseProfiles && firebaseProfiles.length > 0) {
            loadedProfiles = firebaseProfiles;
            localStorage.setItem('archerProfiles', JSON.stringify(firebaseProfiles));
          }
        } catch (error) {
          console.error('Error loading from Firebase, falling back to local:', error);
        }
      } else {
        console.log('Skipping Firebase load - offline, no user, or mock user');
      }
      
      // Fallback to local storage if no Firebase data (same as ProfileManagement)
      if (loadedProfiles.length === 0) {
        const savedProfiles = localStorage.getItem('archerProfiles');
        console.log('Raw localStorage data:', savedProfiles);
        if (savedProfiles) {
          const parsedProfiles = JSON.parse(savedProfiles);
          console.log('Profiles loaded from localStorage:', parsedProfiles);
          loadedProfiles = parsedProfiles;
        } else {
          console.log('No profiles found in localStorage');
        }
      }
      
      console.log('Final loaded profiles for team management:', loadedProfiles);
      
      // Sort profiles by firstName, then lastName (same as ProfileManagement)
      const sortedProfiles = loadedProfiles.sort((a, b) => {
        const firstNameA = (a.firstName || '').toLowerCase();
        const firstNameB = (b.firstName || '').toLowerCase();
        const lastNameA = (a.lastName || '').toLowerCase();
        const lastNameB = (b.lastName || '').toLowerCase();
        
        // First sort by firstName
        if (firstNameA !== firstNameB) {
          return firstNameA.localeCompare(firstNameB);
        }
        
        // If firstName is the same, sort by lastName
        return lastNameA.localeCompare(lastNameB);
      });
      
      console.log('Sorted profiles for team management:', sortedProfiles);
      
      // Load stats for each archer
      const archersWithStats = await Promise.all(
        sortedProfiles.map(async (archer) => {
          try {
            if (shouldUseFirebase(currentUser?.uid)) {
              const detailedProfile = await loadArcherProfileWithScores(archer.id);
              if (detailedProfile && detailedProfile.performanceStats) {
                return {
                  ...archer,
                  performanceStats: detailedProfile.performanceStats
                };
              }
            }
            return archer;
          } catch (error) {
            console.error(`Error loading stats for archer ${archer.id}:`, error);
            return archer;
          }
        })
      );
      
      setAllArchers(archersWithStats);
      
      if (loadedProfiles.length === 0) {
        showMessage('No archer profiles found. Create profiles in Profile Management first.', 'info');
      }
    } catch (error) {
      console.error('Error loading archers:', error);
      showMessage(`Error loading archers: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'division') {
      setFilterDivision(value);
    } else if (filterType === 'school') {
      setFilterSchool(value);
    }
  };

  const handleArcherSelection = (archerId) => {
    setSelectedArchers(prev => {
      if (prev.includes(archerId)) {
        return prev.filter(id => id !== archerId);
      } else {
        return [...prev, archerId];
      }
    });
  };

  const handleSelectAll = () => {
    const filtered = getFilteredArchers();
    setSelectedArchers(filtered.map(archer => archer.id));
  };

  const handleDeselectAll = () => {
    setSelectedArchers([]);
  };

  const getFilteredArchers = () => {
    return safeArchers.filter(archer => {
      const matchesSearch = !searchTerm || 
        (archer.firstName && archer.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (archer.lastName && archer.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (archer.school && archer.school.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDivision = !filterDivision || archer.division === filterDivision;
      const matchesSchool = !filterSchool || 
        (archer.school && archer.school.toLowerCase().includes(filterSchool.toLowerCase()));
      
      // Filter by active status (default to showing only active profiles)
      const isActive = archer.isActive !== undefined ? archer.isActive : true;
      const matchesActive = showInactive || isActive;
      
      return matchesSearch && matchesDivision && matchesSchool && matchesActive;
    });
  };

  const handleCreateArcher = () => {
    // Check if user has permission to create archers
    if (userRole !== 'Coach' && userRole !== 'Team Captain' && userRole !== 'Event Manager' && userRole !== 'System Admin') {
      showMessage('Only coaches and team captains can create new archer profiles.', 'error');
      return;
    }
    
    setIsCreating(true);
    setEditingArcher(null);
    setNewArcherData({
      firstName: '',
      lastName: '',
      gender: 'M',
      school: '',
      grade: '',
      division: 'V',
      dominantHand: 'Right',
      dominantEye: 'Right',
      drawLength: '',
      bowType: 'Recurve ILF',
      bowLength: '66',
      bowWeight: '',
      role: 'Archer',
      usArcheryNumber: '',
      nfaaNumber: '',
      sponsorships: ''
    });
  };

  const handleSaveArcher = async () => {
    // Validate required fields
    if (!newArcherData.firstName.trim() || !newArcherData.lastName.trim()) {
      showMessage('First name and last name are required.', 'error');
      return;
    }

    setSaving(true);
    showMessage('Saving archer...', 'info');

    try {
      console.log('Saving archer data:', newArcherData);
      
      const archerData = {
        ...newArcherData,
        id: editingArcher?.id || `archer_${Date.now()}`,
        createdAt: editingArcher?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentUser.uid
      };

      console.log('Final archer data to save:', archerData);

      // Save to Firebase if possible
      if (shouldUseFirebase(currentUser?.uid)) {
        await saveProfileToFirebase(archerData, currentUser.uid);
        console.log('Saved to Firebase successfully');
      }

      // Always update local storage (same as ProfileManagement)
      const currentProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
      let updatedProfiles;
      
      if (editingArcher) {
        // Update existing
        updatedProfiles = currentProfiles.map(profile => 
          profile.id === editingArcher.id ? archerData : profile
        );
      } else {
        // Add new
        updatedProfiles = [...currentProfiles, archerData];
      }
      
      localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
      console.log('Updated localStorage with:', updatedProfiles);
      
      // Reload archers
      await loadAllArchers();
      
      // Reset form
      setIsCreating(false);
      setEditingArcher(null);
      setNewArcherData({
        firstName: '',
        lastName: '',
        gender: 'M',
        school: '',
        grade: '',
        division: 'V',
        dominantHand: 'Right',
        dominantEye: 'Right',
        drawLength: '',
        bowType: 'Recurve ILF',
        bowLength: '66',
        bowWeight: '',
        role: 'Archer',
        usArcheryNumber: '',
        nfaaNumber: '',
        sponsorships: ''
      });

      showMessage(
        editingArcher 
          ? 'Archer updated successfully!' 
          : 'Archer added successfully!', 
        'success'
      );
    } catch (error) {
      console.error('Error saving archer:', error);
      showMessage(`Error saving archer: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditArcher = (archer) => {
    // Check if user has permission to edit this archer
    const canEdit = userRole === 'Coach' || 
                   userRole === 'Team Captain' || 
                   userRole === 'Event Manager' || 
                   userRole === 'System Admin' ||
                   (myProfile && archer.id === myProfile.id); // Can edit own profile
    
    if (!canEdit) {
      showMessage('You can only edit your own profile. Contact a coach to edit other profiles.', 'error');
      return;
    }
    
    setEditingArcher(archer);
    setIsCreating(true);
    setNewArcherData({
      firstName: archer.firstName || '',
      lastName: archer.lastName || '',
      gender: archer.gender || 'M',
      school: archer.school || '',
      grade: archer.grade || '',
      division: archer.division || archer.classification || 'V',
      dominantHand: archer.dominantHand || 'Right',
      dominantEye: archer.dominantEye || 'Right',
      drawLength: archer.drawLength || archer.equipment?.drawLength || '',
      bowType: archer.bowType || archer.equipment?.bowType || 'Recurve ILF',
      bowLength: archer.bowLength || '66',
      bowWeight: archer.bowWeight || archer.equipment?.drawWeight || '',
      role: archer.role || 'Archer',
      usArcheryNumber: archer.usArcheryNumber || archer.membership?.usArchery || '',
      nfaaNumber: archer.nfaaNumber || archer.membership?.nfaa || '',
      sponsorships: archer.sponsorships || archer.sponsors || ''
    });
  };

  const handleInputChange = (field, value) => {
    setNewArcherData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Profile management functions moved from ProfileManagement
  const toggleTag = async (profileId, tagType) => {
    try {
      const profile = allArchers.find(p => p.id === profileId);
      if (!profile) return;

      // Toggle the tag
      const updatedProfile = {
        ...profile,
        [tagType]: !profile[tagType],
        updatedAt: new Date().toISOString()
      };

      // If setting "isMe" to true, unset it for all other profiles
      if (tagType === 'isMe' && !profile[tagType]) {
        const updatedProfiles = allArchers.map(p => ({
          ...p,
          isMe: p.id === profileId ? true : false,
          updatedAt: new Date().toISOString()
        }));
        setAllArchers(updatedProfiles);
        localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
        
        // Save to Firebase
        if (shouldUseFirebase(currentUser?.uid)) {
          for (const prof of updatedProfiles) {
            try {
              await saveProfileToFirebase(prof, currentUser.uid);
            } catch (error) {
              console.error('Error saving profile to Firebase:', error);
            }
          }
        }
      } else {
        // Update single profile
        const updatedProfiles = allArchers.map(p => 
          p.id === profileId ? updatedProfile : p
        );
        setAllArchers(updatedProfiles);
        localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
        
        // Save to Firebase
        if (shouldUseFirebase(currentUser?.uid)) {
          try {
            await saveProfileToFirebase(updatedProfile, currentUser.uid);
          } catch (error) {
            console.error('Error saving profile to Firebase:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error toggling tag:', error);
    }
  };

  const deleteProfile = async (profileId) => {
    console.log('=== TEAM ARCHER DELETE PROFILE DEBUG ===');
    console.log('Deleting profile ID:', profileId);
    console.log('Current archers count:', allArchers.length);
    
    if (!window.confirm('Are you sure you want to delete this profile? This will also remove any associated score records.')) {
      console.log('Delete cancelled by user');
      return;
    }
    
    try {
      const updatedProfiles = allArchers.filter(p => p.id !== profileId);
      console.log('Archers after filtering:', updatedProfiles.length);
      
      localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
      setAllArchers(updatedProfiles);
      
      // Delete from Firebase if online and not mock user
      if (shouldUseFirebase(currentUser?.uid)) {
        try {
          await deleteProfileFromFirebase(profileId, currentUser.uid);
          console.log('Profile deleted from Firebase successfully');
        } catch (error) {
          console.error('Error deleting from Firebase:', error);
        }
      } else {
        console.log('Skipping Firebase delete - offline or mock user');
      }
      
      console.log('Team Archer profile deletion completed successfully');
      
      // Reload data to ensure sync with other components
      setTimeout(() => {
        loadAllArchers();
      }, 100);
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleViewStats = (profileId) => {
    // Navigate to archer stats view
    if (onNavigate) {
      onNavigate('archer-stats', { archerId: profileId });
    }
  };

  const filteredArchers = getFilteredArchers();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading team archers...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Archers</h1>
              <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
                📋 Team Archer Management (Same data as Profile Management)
              </div>
              <p className="text-gray-600 mt-1">
                {userRole === 'Coach' || userRole === 'Team Captain' || userRole === 'Event Manager' || userRole === 'System Admin' 
                  ? 'Manage all team archers and profiles for OAS qualification rounds'
                  : 'View team archers (you can only edit your own profile)'
                }
              </p>
              {myProfile && (
                <p className="text-sm text-blue-600 mt-1">
                  Your Role: {userRole} • Your Profile: {myProfile.firstName} {myProfile.lastName}
                </p>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (window.confirm('Refresh archer data? This will reload all profiles from Firebase/localStorage.')) {
                    loadAllArchers();
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                title="Refresh archer data"
              >
                🔄 Refresh
              </button>
              {(userRole === 'Coach' || userRole === 'Team Captain' || userRole === 'Event Manager' || userRole === 'System Admin') && (
                <button
                  onClick={handleCreateArcher}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  + New Archer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}



        {/* Filters and Search - Compact One Line */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search archers..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-32">
              <select
                value={filterDivision}
                onChange={(e) => handleFilterChange('division', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Div</option>
                {oasDivisions.map(division => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <input
                type="text"
                value={filterSchool}
                onChange={(e) => handleFilterChange('school', e.target.value)}
                placeholder="School..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="mr-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Show Inactive
              </label>
            </div>
          </div>
        </div>

        {/* Archer List - Mobile-Friendly Cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Team Archers ({filteredArchers.length})
              </h2>
              {selectedArchers.length > 0 && (
                <span className="text-sm text-blue-600 font-medium">
                  {selectedArchers.length} selected
                </span>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredArchers.map((archer) => (
              <div key={archer.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditArcher(archer)}
                          className="text-left hover:text-blue-600 transition-colors"
                        >
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {`${archer.firstName || ''} ${archer.lastName || ''}`.trim() || 'Unnamed Archer'}
                          </h3>
                        </button>
                        {/* Tags */}
                        <div className="flex items-center space-x-1">
                          {archer.isMe && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Me
                            </span>
                          )}
                          {myProfile && archer.id === myProfile.id && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Me
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {archer.division || 'No Division'}
                        </span>
                        {/* Favorite Toggle */}
                        <button
                          onClick={() => toggleTag(archer.id, 'isFavorite')}
                          className="text-lg hover:scale-110 transition-transform"
                        >
                          {archer.isFavorite ? '⭐' : '☆'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Info Row */}
                    <div className="text-xs text-gray-500 mb-2">
                      <span>{archer.school || 'No School'}</span>
                      {archer.grade && <span> • Grade {archer.grade}</span>}
                      {archer.role && <span> • {archer.role}</span>}
                    </div>
                    
                    {/* Equipment & Stats Row */}
                    <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                      <div>
                        <span className="font-medium text-gray-700">Equipment:</span>
                        <div className="text-gray-600">
                          {archer.equipment?.bowType || 'No Bow'}
                          {(archer.equipment?.drawWeight || archer.equipment?.drawLength) && (
                            <div className="text-gray-500">
                              {archer.equipment?.drawWeight || '0'}# • {archer.equipment?.drawLength || '0'}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <button
                          onClick={() => onNavigate('scores', { archerId: archer.id })}
                          className="text-left hover:text-blue-600 transition-colors"
                        >
                          <span className="font-medium text-gray-700">Stats:</span>
                          <div className="text-gray-600">
                            <div>Avg: {archer.performanceStats?.averageScore || archer.stats?.averageScore || 'N/A'}</div>
                            <div>Rounds: {archer.performanceStats?.totalRounds || archer.stats?.roundsCompleted || '0'}</div>
                            <div>Best: {archer.performanceStats?.bestScore || archer.stats?.bestScore || 'N/A'}</div>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => onNavigate('multi-scoring', { selectedArchers: [archer.id] })}
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        >
                          Score
                        </button>
                        <button
                          onClick={() => handleViewStats(archer.id)}
                          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                        >
                          Stats
                        </button>
                        {/* Coach Actions */}
                        {(userRole === 'Coach' || userRole === 'Team Captain' || userRole === 'Event Manager' || userRole === 'System Admin') && (
                          <>
                            <button
                              onClick={() => toggleTag(archer.id, 'isMe')}
                              className={`px-2 py-1 text-xs rounded ${
                                archer.isMe 
                                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                              }`}
                            >
                              {archer.isMe ? 'Me' : 'Tag Me'}
                            </button>
                            <button
                              onClick={() => deleteProfile(archer.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredArchers.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-gray-500">No archers found matching your criteria.</p>
              <button
                onClick={handleCreateArcher}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Your First Archer
              </button>
            </div>
          )}
        </div>

        {/* Create/Edit Archer Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingArcher ? 'Edit Archer' : 'Add New Archer'}
                </h3>
                
                <div className="space-y-6">
                  {/* Row 1: Name Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={newArcherData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={newArcherData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  {/* Row 2: School Information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={newArcherData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                      <input
                        type="text"
                        value={newArcherData.school}
                        onChange={(e) => handleInputChange('school', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="School name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                      <input
                        type="text"
                        value={newArcherData.grade}
                        onChange={(e) => handleInputChange('grade', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="9, 10, 11, 12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                      <select
                        value={newArcherData.division}
                        onChange={(e) => handleInputChange('division', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="V">Varsity</option>
                        <option value="JV">Junior Varsity</option>
                        <option value="MS">Middle School</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 3: Physical Characteristics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dominant Hand</label>
                      <select
                        value={newArcherData.dominantHand}
                        onChange={(e) => handleInputChange('dominantHand', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Right">Right</option>
                        <option value="Left">Left</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dominant Eye</label>
                      <select
                        value={newArcherData.dominantEye}
                        onChange={(e) => handleInputChange('dominantEye', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Right">Right</option>
                        <option value="Left">Left</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Draw Length (inches)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={newArcherData.drawLength}
                        onChange={(e) => handleInputChange('drawLength', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="28.5"
                      />
                    </div>
                  </div>

                  {/* Row 4: Equipment Information */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bow Type</label>
                      <select
                        value={newArcherData.bowType}
                        onChange={(e) => handleInputChange('bowType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Recurve ILF">Recurve ILF</option>
                        <option value="Compound">Compound</option>
                        <option value="Barebow">Barebow</option>
                        <option value="Traditional">Traditional</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bow Length (inches)</label>
                      <select
                        value={newArcherData.bowLength}
                        onChange={(e) => handleInputChange('bowLength', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="62">62"</option>
                        <option value="64">64"</option>
                        <option value="66">66"</option>
                        <option value="68">68"</option>
                        <option value="70">70"</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bow Weight (lbs)</label>
                      <input
                        type="number"
                        value={newArcherData.bowWeight}
                        onChange={(e) => handleInputChange('bowWeight', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="45"
                      />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={newArcherData.role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Archer">Archer</option>
                        <option value="Team Captain">Team Captain</option>
                        <option value="Coach">Coach</option>
                        <option value="Referee">Referee</option>
                        <option value="Event Manager">Event Manager</option>
                        <option value="System Admin">System Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">US Archery Number</label>
                      <input
                        type="text"
                        value={newArcherData.usArcheryNumber}
                        onChange={(e) => handleInputChange('usArcheryNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">NFAA Number</label>
                      <input
                        type="text"
                        value={newArcherData.nfaaNumber}
                        onChange={(e) => handleInputChange('nfaaNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* Sponsorships */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sponsorships</label>
                    <input
                      type="text"
                      value={newArcherData.sponsorships}
                      onChange={(e) => handleInputChange('sponsorships', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional sponsorships"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveArcher}
                    disabled={saving}
                    className={`px-4 py-2 text-white rounded-md transition-colors ${
                      saving 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      editingArcher ? 'Update Archer' : 'Add Archer'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamArcherManagement; 