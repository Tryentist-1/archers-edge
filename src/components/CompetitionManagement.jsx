import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  saveCompetitionToFirebase, 
  loadCompetitionsFromFirebase,
  deleteCompetitionFromFirebase,
  loadCompetitionScores,
  shouldUseFirebase,
  isOnline 
} from '../services/firebaseService';

const CompetitionManagement = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [competitionStats, setCompetitionStats] = useState({});
  const [competitionResults, setCompetitionResults] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [selectedCompetitionForResults, setSelectedCompetitionForResults] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: '',
    type: 'qualification',
    divisions: [],
    rounds: [],
    maxArchersPerBale: 8,
    distance: '18m',
    maxTeamSize: 4,
    teamScoringMethod: 'sum',
    status: 'draft'
  });

  // OAS Division options for high school archery (M/F for Male/Female, V/JV for Varsity/JV)
  const oasDivisions = [
    'MV',    // Male Varsity
    'MJV',   // Male Junior Varsity
    'FV',    // Female Varsity
    'FJV',   // Female Junior Varsity
    'MMS',   // Middle School Male
    'FMS'    // Middle School Female
  ];

  // OAS Round types
  const roundTypes = [
    { name: 'OAS Qualification Round', ends: 12, arrowsPerEnd: 3, totalArrows: 36, maxScore: 360, timeLimit: '2 minutes per end' },
    { name: 'OAS Olympic Round', ends: 12, arrowsPerEnd: 3, totalArrows: 36, maxScore: 360, timeLimit: '2 minutes per end' },
    { name: 'OAS Team Round', ends: 12, arrowsPerEnd: 3, totalArrows: 36, maxScore: 360, timeLimit: '2 minutes per end' },
    { name: 'Custom Round', ends: 0, arrowsPerEnd: 0, totalArrows: 0, maxScore: 0, timeLimit: '' }
  ];

  useEffect(() => {
    loadCompetitions();
  }, [currentUser]);

  const showMessage = (msg, type = 'info') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(''), 5000);
  };

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      console.log('Loading competitions...');
      console.log('Current user:', currentUser);
      console.log('Should use Firebase:', shouldUseFirebase(currentUser?.uid));

      let loadedCompetitions = [];
      
      // Use same loading logic as ProfileManagement
      if (shouldUseFirebase(currentUser?.uid)) {
        try {
          console.log('Attempting to load from Firebase...');
          const firebaseCompetitions = await loadCompetitionsFromFirebase(currentUser?.uid);
          console.log('Competitions loaded from Firebase:', firebaseCompetitions);
          if (firebaseCompetitions && firebaseCompetitions.length > 0) {
            loadedCompetitions = firebaseCompetitions;
            localStorage.setItem('oasCompetitions', JSON.stringify(firebaseCompetitions));
          }
        } catch (error) {
          console.error('Error loading from Firebase, falling back to local:', error);
        }
      } else {
        console.log('Skipping Firebase load - offline, no user, or mock user');
      }
      
      // Fallback to local storage if no Firebase data (same as ProfileManagement)
      if (loadedCompetitions.length === 0) {
        const savedCompetitions = localStorage.getItem('oasCompetitions');
        console.log('Raw localStorage data:', savedCompetitions);
        if (savedCompetitions) {
          const parsedCompetitions = JSON.parse(savedCompetitions);
          console.log('Competitions loaded from localStorage:', parsedCompetitions);
          loadedCompetitions = parsedCompetitions;
        } else {
          console.log('No competitions found in localStorage');
        }
      }
      
      console.log('Final loaded competitions:', loadedCompetitions);
      
      // Sort competitions by date (newest first)
      const sortedCompetitions = loadedCompetitions.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
      });
      
      console.log('Sorted competitions:', sortedCompetitions);
      setCompetitions(sortedCompetitions);
      
      // Load stats for all competitions
      await loadCompetitionStats(sortedCompetitions);
      
    } catch (error) {
      console.error('Error loading competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompetitionStats = async (competitionsList) => {
    try {
      console.log('Loading competition stats...');
      const stats = {};
      
      for (const competition of competitionsList) {
        try {
          const scores = await loadCompetitionScores(competition.id);
          stats[competition.id] = calculateCompetitionStats(scores);
        } catch (error) {
          console.error(`Error loading stats for competition ${competition.id}:`, error);
          stats[competition.id] = getDefaultStats();
        }
      }
      
      setCompetitionStats(stats);
      console.log('Competition stats loaded:', stats);
    } catch (error) {
      console.error('Error loading competition stats:', error);
    }
  };

  const calculateCompetitionStats = (scores) => {
    if (!scores || scores.length === 0) {
      return getDefaultStats();
    }

    const totalArchers = scores.length;
    const totalScore = scores.reduce((sum, score) => sum + (score.totalScore || 0), 0);
    const averageScore = totalScore / totalArchers;
    const maxScore = Math.max(...scores.map(s => s.totalScore || 0));
    const minScore = Math.min(...scores.map(s => s.totalScore || 0));

    return {
      totalArchers,
      totalScore,
      averageScore: Math.round(averageScore * 100) / 100,
      maxScore,
      minScore,
      hasScores: true
    };
  };

  const calculateCompetitionResults = (scores) => {
    if (!scores || scores.length === 0) {
      return { rankings: [], divisions: {} };
    }

    // Group by division
    const divisionGroups = {};
    scores.forEach(score => {
      const division = score.division || 'Unknown';
      if (!divisionGroups[division]) {
        divisionGroups[division] = [];
      }
      divisionGroups[division].push(score);
    });

    // Sort each division by score
    Object.keys(divisionGroups).forEach(division => {
      divisionGroups[division].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    });

    // Create overall rankings
    const allScores = [...scores].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

    return {
      rankings: allScores,
      divisions: divisionGroups
    };
  };

  const getDefaultStats = () => ({
    totalArchers: 0,
    totalScore: 0,
    averageScore: 0,
    maxScore: 0,
    minScore: 0,
    hasScores: false
  });

  const handleViewResults = (competition) => {
    setSelectedCompetitionForResults(competition);
    setShowResults(true);
  };

  const handleCloseResults = () => {
    setShowResults(false);
    setSelectedCompetitionForResults(null);
  };

  const getScoreColor = (score) => {
    if (score >= 300) return 'text-green-600';
    if (score >= 250) return 'text-blue-600';
    if (score >= 200) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      location: '',
      description: '',
      type: 'qualification',
      divisions: [],
      rounds: [],
      maxArchersPerBale: 8,
      distance: '18m',
      maxTeamSize: 4,
      teamScoringMethod: 'sum',
      status: 'draft'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDivisionChange = (division) => {
    setFormData(prev => ({
      ...prev,
      divisions: prev.divisions.includes(division)
        ? prev.divisions.filter(d => d !== division)
        : [...prev.divisions, division]
    }));
  };

  const handleRoundChange = (roundType) => {
    setFormData(prev => ({
      ...prev,
      rounds: prev.rounds.includes(roundType)
        ? prev.rounds.filter(r => r !== roundType)
        : [...prev.rounds, roundType]
    }));
  };

  const handleCustomRoundChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      customRound: {
        ...prev.customRound,
        [field]: value
      }
    }));
  };

  const saveCompetition = async () => {
    try {
      setSaving(true);
      setMessage('');

      console.log('=== SAVE COMPETITION DEBUG ===');
      console.log('Saving competition data:', formData);
      console.log('Current user:', currentUser);

      // Validate required fields
      if (!formData.name?.trim()) {
        setMessage('Error: Competition name is required.');
        return;
      }

      if (!formData.date) {
        setMessage('Error: Competition date is required.');
        return;
      }

      // Create competition object
      const competitionToSave = {
        id: isEditing ? selectedCompetition.id : `competition_${Date.now()}`,
        ...formData,
        createdAt: isEditing ? selectedCompetition.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.uid || 'profile-user',
        isActive: true
      };

      console.log('Competition to save:', competitionToSave);

      // Save to localStorage
      const existingCompetitions = JSON.parse(localStorage.getItem('oasCompetitions') || '[]');
      let updatedCompetitions;

      if (isCreating) {
        updatedCompetitions = [...existingCompetitions, competitionToSave];
      } else {
        updatedCompetitions = existingCompetitions.map(c => 
          c.id === selectedCompetition.id ? competitionToSave : c
        );
      }

      localStorage.setItem('oasCompetitions', JSON.stringify(updatedCompetitions));
      setCompetitions(updatedCompetitions);

      // Save to Firebase if possible
      if (shouldUseFirebase(currentUser?.uid)) {
        try {
          await saveCompetitionToFirebase(competitionToSave, currentUser.uid);
          console.log('Competition saved to Firebase successfully');
        } catch (error) {
          console.error('Error saving to Firebase:', error);
          setMessage('Saved locally, but failed to sync to cloud');
        }
      }

      setMessage('Competition saved successfully!');
      setIsEditing(false);
      setIsCreating(false);
      setSelectedCompetition(competitionToSave);

      console.log('=== END SAVE COMPETITION DEBUG ===');

    } catch (error) {
      console.error('Error saving competition:', error);
      setMessage('Error saving competition: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCompetition = async (competitionId) => {
    if (!window.confirm('Are you sure you want to delete this competition? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('=== DELETE COMPETITION DEBUG ===');
      console.log('Deleting competition ID:', competitionId);

      // Remove from localStorage
      const existingCompetitions = JSON.parse(localStorage.getItem('oasCompetitions') || '[]');
      const updatedCompetitions = existingCompetitions.filter(c => c.id !== competitionId);
      localStorage.setItem('oasCompetitions', JSON.stringify(updatedCompetitions));
      setCompetitions(updatedCompetitions);

      console.log('Competitions after filtering:', updatedCompetitions);

      // Remove from Firebase if possible
      if (shouldUseFirebase(currentUser?.uid)) {
        try {
          await deleteCompetitionFromFirebase(competitionId, currentUser.uid);
          console.log('Competition deleted from Firebase successfully');
        } catch (error) {
          console.error('Error deleting from Firebase:', error);
        }
      }

      console.log('=== END DELETE COMPETITION DEBUG ===');

    } catch (error) {
      console.error('Error deleting competition:', error);
    }
  };

  const editCompetition = (competition) => {
    console.log('Editing competition:', competition);
    setSelectedCompetition(competition);
    setIsEditing(true);
    setIsCreating(false);
    setFormData({
      name: competition.name || '',
      date: competition.date || '',
      location: competition.location || '',
      description: competition.description || '',
      type: competition.type || 'qualification',
      divisions: competition.divisions || [],
      rounds: competition.rounds || [],
      maxArchersPerBale: competition.maxArchersPerBale || 8,
      distance: competition.distance || '18m',
      maxTeamSize: competition.maxTeamSize || 4,
      teamScoringMethod: competition.teamScoringMethod || 'sum',
      status: competition.status || 'draft'
    });
  };

  const createNewCompetition = () => {
    setSelectedCompetition(null);
    setIsEditing(false);
    setIsCreating(true);
    resetForm();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading competitions...</p>
        </div>
      </div>
    );
  }

  // Competition List View
  if (!isCreating && !isEditing) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Competition Management</h1>
            <button
              onClick={() => onNavigate('home')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        {/* Action Buttons - Always at Top */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex space-x-3">
            <button
              onClick={createNewCompetition}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              + New Competition
            </button>
            <button
              onClick={() => onNavigate('profile-round-setup')}
              className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Round
            </button>
          </div>
        </div>

        {/* Competition List */}
        <div className="p-4 space-y-3">
          {competitions.map((competition) => (
            <div
              key={competition.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-medium text-lg">
                        🏆
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {competition.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(competition.date)} • {competition.location || 'No location'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          competition.status === 'active' ? 'bg-green-100 text-green-800' :
                          competition.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          competition.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {competition.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {competition.divisions?.length || 0} divisions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewResults(competition)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Results
                  </button>
                  <button
                    onClick={() => editCompetition(competition)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCompetition(competition.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Stats Row */}
              {competitionStats[competition.id] && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Archers:</span>
                      <span className="ml-1 font-medium">{competitionStats[competition.id].totalArchers}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg Score:</span>
                      <span className={`ml-1 font-medium ${getScoreColor(competitionStats[competition.id].averageScore)}`}>
                        {competitionStats[competition.id].averageScore}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">High Score:</span>
                      <span className={`ml-1 font-medium ${getScoreColor(competitionStats[competition.id].maxScore)}`}>
                        {competitionStats[competition.id].maxScore}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <span className="ml-1 font-medium capitalize">{competition.type}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {competitions.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600 mb-4">No competitions found</p>
              <button
                onClick={createNewCompetition}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Create Your First Competition
              </button>
            </div>
          )}
        </div>

        {/* Results Modal */}
        {showResults && selectedCompetitionForResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Results: {selectedCompetitionForResults.name}
                  </h2>
                  <button
                    onClick={handleCloseResults}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedCompetitionForResults.date)} • {selectedCompetitionForResults.location}
                  </p>
                  
                  {competitionStats[selectedCompetitionForResults.id]?.hasScores ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {competitionStats[selectedCompetitionForResults.id].totalArchers}
                        </div>
                        <div className="text-xs text-blue-600">Archers</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {competitionStats[selectedCompetitionForResults.id].averageScore}
                        </div>
                        <div className="text-xs text-green-600">Avg Score</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {competitionStats[selectedCompetitionForResults.id].maxScore}
                        </div>
                        <div className="text-xs text-purple-600">High Score</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {competitionStats[selectedCompetitionForResults.id].minScore}
                        </div>
                        <div className="text-xs text-orange-600">Low Score</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No scores recorded yet for this competition.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Competition Edit/Create View
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Competitions
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {isCreating ? 'Create Competition' : 'Edit Competition'}
            </h1>
          </div>
        </div>
      </div>

      {/* Action Buttons - Always at Top */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex space-x-3">
          <button
            onClick={saveCompetition}
            disabled={saving}
            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Competition'}
          </button>
          <button
            onClick={() => {
              setIsCreating(false);
              setIsEditing(false);
            }}
            className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
        {message && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); saveCompetition(); }}>
          {/* Basic Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 text-sm">🏆</span>
              </span>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competition Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Competition Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="qualification">Qualification</option>
                  <option value="olympic">Olympic</option>
                  <option value="team">Team</option>
                  <option value="practice">Practice</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Divisions Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-green-600 text-sm">👥</span>
              </span>
              Divisions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {oasDivisions.map((division) => (
                <label key={division} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.divisions.includes(division)}
                    onChange={() => handleDivisionChange(division)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{division}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Configuration Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-purple-600 text-sm">⚙️</span>
              </span>
              Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance
                </label>
                <select
                  name="distance"
                  value={formData.distance}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="18m">18m</option>
                  <option value="30m">30m</option>
                  <option value="50m">50m</option>
                  <option value="70m">70m</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Archers Per Bale
                </label>
                <input
                  type="number"
                  name="maxArchersPerBale"
                  value={formData.maxArchersPerBale}
                  onChange={handleInputChange}
                  min="1"
                  max="12"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Team Size
                </label>
                <input
                  type="number"
                  name="maxTeamSize"
                  value={formData.maxTeamSize}
                  onChange={handleInputChange}
                  min="1"
                  max="8"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Scoring Method
                </label>
                <select
                  name="teamScoringMethod"
                  value={formData.teamScoringMethod}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="sum">Sum of Scores</option>
                  <option value="average">Average Score</option>
                  <option value="best">Best Score</option>
                </select>
              </div>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-orange-600 text-sm">📊</span>
              </span>
              Status
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competition Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompetitionManagement; 