import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  loadProfilesFromFirebase,
  saveProfileToFirebase,
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
      setAllArchers(sortedProfiles);
      
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
              <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
              <p className="text-gray-600 mt-1">
                {userRole === 'Coach' || userRole === 'Team Captain' || userRole === 'Event Manager' || userRole === 'System Admin' 
                  ? 'Manage all team archers for OAS qualification rounds'
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

        {/* Bulk Actions Bar */}
        {selectedArchers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-800">
                  {selectedArchers.length} archer{selectedArchers.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleDeselectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Deselect All
                </button>
              </div>
              <div className="flex space-x-2">
                {(userRole === 'Coach' || userRole === 'Team Captain' || userRole === 'Event Manager' || userRole === 'System Admin') && (
                  <>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                      Bulk Edit Division
                    </button>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                      Bulk Edit School
                    </button>
                    <button className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors">
                      Bulk Delete
                    </button>
                  </>
                )}
                <button 
                  onClick={() => onNavigate('multi-scoring', { selectedArchers: selectedArchers })}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Score Selected ({selectedArchers.length})
                </button>
              </div>
            </div>
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
              <div className="flex space-x-1">
                <button
                  onClick={handleSelectAll}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Archer List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Team Archers ({filteredArchers.length})
            </h2>
            {selectedArchers.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedArchers.length} archer(s) selected
              </p>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedArchers.length === filteredArchers.length && filteredArchers.length > 0}
                      onChange={() => selectedArchers.length === filteredArchers.length ? handleDeselectAll() : handleSelectAll()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Archer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    School
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredArchers.map((archer) => (
                  <tr key={archer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedArchers.includes(archer.id)}
                        onChange={() => handleArcherSelection(archer.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {`${archer.firstName || ''} ${archer.lastName || ''}`.trim() || 'Unnamed Archer'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {archer.school || 'No School'} • {archer.grade || 'No Grade'} • {archer.role || 'Archer'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {archer.division || 'No Division'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {archer.school || 'No School'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{archer.equipment?.bowType || 'No Bow'}</div>
                        <div className="text-xs text-gray-500">
                          {archer.equipment?.drawWeight || '0'}# • {archer.equipment?.drawLength || '0'}"
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="font-medium">Avg:</span> {archer.stats?.averageScore || 'N/A'}
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">Rounds:</span> {archer.stats?.roundsCompleted || '0'}
                        </div>
                        <div className="text-xs">
                          <span className="font-medium">Best:</span> {archer.stats?.bestScore || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {/* Show Edit button only if user can edit this archer */}
                        {(userRole === 'Coach' || userRole === 'Team Captain' || userRole === 'Event Manager' || userRole === 'System Admin' || (myProfile && archer.id === myProfile.id)) && (
                          <button
                            onClick={() => handleEditArcher(archer)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('profile', { archerId: archer.id })}
                          className="text-green-600 hover:text-green-900"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => onNavigate('multi-scoring', { selectedArchers: [archer.id] })}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Score
                        </button>
                        {/* Show "Me" indicator for own profile */}
                        {myProfile && archer.id === myProfile.id && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Me
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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