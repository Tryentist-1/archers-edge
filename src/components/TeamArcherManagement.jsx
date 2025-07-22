import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  loadProfilesFromFirebase,
  saveProfileToFirebase,
  isOnline
} from '../services/firebaseService';

const TeamArcherManagement = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [allArchers, setAllArchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDivision, setFilterDivision] = useState('');
  const [filterSchool, setFilterSchool] = useState('');
  const [selectedArchers, setSelectedArchers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingArcher, setEditingArcher] = useState(null);
  const [newArcherData, setNewArcherData] = useState({
    name: '',
    school: '',
    division: '',
    grade: '',
    dominantHand: 'right',
    dominantEye: 'right',
    equipment: {
      bowType: 'compound',
      drawWeight: '',
      drawLength: ''
    },
    membership: {
      usArchery: '',
      nfaa: ''
    },
    classification: 'Junior Varsity',
    sponsors: '',
    notes: ''
  });

  // OAS Divisions for filtering
  const oasDivisions = [
    'Boys Varsity',
    'Boys Junior Varsity', 
    'Girls Varsity',
    'Girls Junior Varsity',
    'Middle School Boys',
    'Middle School Girls'
  ];

  useEffect(() => {
    loadAllArchers();
  }, [currentUser]);

  const loadAllArchers = async () => {
    try {
      setLoading(true);
      console.log('Loading all archers from Firebase...');
      
      // Load all profiles from Firebase (we'll need to modify the service to get all profiles)
      const profiles = await loadProfilesFromFirebase(currentUser.uid);
      
      // For now, we'll use the current user's profiles as a starting point
      // In a real implementation, we'd load all archers from the school/team
      setAllArchers(profiles || []);
      
      console.log('Loaded archers:', profiles);
    } catch (error) {
      console.error('Error loading archers:', error);
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
    const filteredArchers = getFilteredArchers();
    const allIds = filteredArchers.map(archer => archer.id);
    setSelectedArchers(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedArchers([]);
  };

  const getFilteredArchers = () => {
    return safeArchers.filter(archer => {
      const archerName = archer.name || '';
      const archerSchool = archer.school || '';
      
      const matchesSearch = archerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          archerSchool.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDivision = !filterDivision || archer.division === filterDivision;
      const matchesSchool = !filterSchool || archer.school === filterSchool;
      
      return matchesSearch && matchesDivision && matchesSchool;
    });
  };

  const handleCreateArcher = () => {
    setIsCreating(true);
    setEditingArcher(null);
    setNewArcherData({
      name: '',
      school: '',
      division: '',
      grade: '',
      dominantHand: 'right',
      dominantEye: 'right',
      equipment: {
        bowType: 'compound',
        drawWeight: '',
        drawLength: ''
      },
      membership: {
        usArchery: '',
        nfaa: ''
      },
      classification: 'Junior Varsity',
      sponsors: '',
      notes: ''
    });
  };

  const handleSaveArcher = async () => {
    try {
      const archerData = {
        ...newArcherData,
        id: editingArcher?.id || `archer_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.uid
      };

      await saveProfileToFirebase(archerData, currentUser.uid);
      
      // Reload archers
      await loadAllArchers();
      
      // Reset form
      setIsCreating(false);
      setEditingArcher(null);
      setNewArcherData({
        name: '',
        school: '',
        division: '',
        grade: '',
        dominantHand: 'right',
        dominantEye: 'right',
        equipment: {
          bowType: 'compound',
          drawWeight: '',
          drawLength: ''
        },
        membership: {
          usArchery: '',
          nfaa: ''
        },
        classification: 'Junior Varsity',
        sponsors: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error saving archer:', error);
    }
  };

  const handleEditArcher = (archer) => {
    setEditingArcher(archer);
    setIsCreating(true);
    setNewArcherData({
      name: archer.name || '',
      school: archer.school || '',
      division: archer.division || '',
      grade: archer.grade || '',
      dominantHand: archer.dominantHand || 'right',
      dominantEye: archer.dominantEye || 'right',
      equipment: archer.equipment || {
        bowType: 'compound',
        drawWeight: '',
        drawLength: ''
      },
      membership: archer.membership || {
        usArchery: '',
        nfaa: ''
      },
      classification: archer.classification || 'Junior Varsity',
      sponsors: archer.sponsors || '',
      notes: archer.notes || ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNewArcherData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewArcherData(prev => ({
        ...prev,
        [name]: value
      }));
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

  // Ensure allArchers is always an array
  const safeArchers = Array.isArray(allArchers) ? allArchers : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Archer Management</h1>
              <p className="text-gray-600 mt-1">Manage archers for OAS qualification rounds</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => onNavigate('home')}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Back to Home
              </button>
              <button
                onClick={handleCreateArcher}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Add New Archer
              </button>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Archers
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name or school..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Division
              </label>
              <select
                value={filterDivision}
                onChange={(e) => handleFilterChange('division', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Divisions</option>
                {oasDivisions.map(division => (
                  <option key={division} value={division}>{division}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by School
              </label>
              <input
                type="text"
                value={filterSchool}
                onChange={(e) => handleFilterChange('school', e.target.value)}
                placeholder="Enter school name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
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
                    School
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Division
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
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
                        <div className="text-sm font-medium text-gray-900">{archer.name || 'Unnamed Archer'}</div>
                        <div className="text-sm text-gray-500">{archer.classification || 'No Classification'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {archer.school || 'No School'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {archer.division || 'No Division'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {archer.grade || 'No Grade'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {archer.equipment?.bowType || 'No Bow'} • {archer.equipment?.drawWeight || '0'}# 
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditArcher(archer)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onNavigate('profile', { archerId: archer.id })}
                        className="text-green-600 hover:text-green-900"
                      >
                        View
                      </button>
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
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newArcherData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      School *
                    </label>
                    <input
                      type="text"
                      name="school"
                      value={newArcherData.school}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Division *
                    </label>
                    <select
                      name="division"
                      value={newArcherData.division}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Division</option>
                      {oasDivisions.map(division => (
                        <option key={division} value={division}>{division}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grade
                    </label>
                    <input
                      type="text"
                      name="grade"
                      value={newArcherData.grade}
                      onChange={handleInputChange}
                      placeholder="e.g., 10th, 11th, 12th"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Classification
                    </label>
                    <select
                      name="classification"
                      value={newArcherData.classification}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Varsity">Varsity</option>
                      <option value="Junior Varsity">Junior Varsity</option>
                      <option value="Middle School">Middle School</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dominant Hand
                    </label>
                    <select
                      name="dominantHand"
                      value={newArcherData.dominantHand}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bow Type
                    </label>
                    <select
                      name="equipment.bowType"
                      value={newArcherData.equipment.bowType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="compound">Compound</option>
                      <option value="recurve">Recurve</option>
                      <option value="traditional">Traditional</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Draw Weight
                    </label>
                    <input
                      type="text"
                      name="equipment.drawWeight"
                      value={newArcherData.equipment.drawWeight}
                      onChange={handleInputChange}
                      placeholder="e.g., 45"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Draw Length
                    </label>
                    <input
                      type="text"
                      name="equipment.drawLength"
                      value={newArcherData.equipment.drawLength}
                      onChange={handleInputChange}
                      placeholder="e.g., 28.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingArcher ? 'Update Archer' : 'Add Archer'}
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