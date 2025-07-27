import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  saveCompetitionToFirebase, 
  loadCompetitionsFromFirebase,
  deleteCompetitionFromFirebase,
  loadCompetitionScores,
  shouldUseFirebase,
  isOnline,
  loadProfilesFromFirebase
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
  const [showArcherScorecard, setShowArcherScorecard] = useState(false);
  const [selectedArcherForScorecard, setSelectedArcherForScorecard] = useState(null);
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

  // Gender-based division mapping
  const genderDivisions = {
    'MV': { gender: 'M', level: 'Varsity', display: 'Boys Varsity' },
    'MJV': { gender: 'M', level: 'JV', display: 'Boys JV' },
    'FV': { gender: 'F', level: 'Varsity', display: 'Girls Varsity' },
    'FJV': { gender: 'F', level: 'JV', display: 'Girls JV' },
    'MMS': { gender: 'M', level: 'Middle School', display: 'Boys Middle School' },
    'FMS': { gender: 'F', level: 'Middle School', display: 'Girls Middle School' }
  };

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
      const results = {};
      
      for (const competition of competitionsList) {
        try {
          const scores = await loadCompetitionScores(competition.id);
          stats[competition.id] = calculateCompetitionStats(scores);
          results[competition.id] = await calculateCompetitionResults(scores);
        } catch (error) {
          console.error(`Error loading stats for competition ${competition.id}:`, error);
          stats[competition.id] = getDefaultStats();
          results[competition.id] = { rankings: [], divisions: {} };
        }
      }
      
      setCompetitionStats(stats);
      setCompetitionResults(results);
      console.log('Competition stats loaded:', stats);
      console.log('Competition results loaded:', results);
    } catch (error) {
      console.error('Error loading competition stats:', error);
    }
  };

  const calculateCompetitionStats = (scores) => {
    if (!scores || scores.length === 0) {
      return getDefaultStats();
    }

    const totalArchers = scores.length;
    const totalScore = scores.reduce((sum, score) => sum + (score.totals?.totalScore || 0), 0);
    const averageScore = totalScore / totalArchers;
    const maxScore = Math.max(...scores.map(s => s.totals?.totalScore || 0));
    const minScore = Math.min(...scores.map(s => s.totals?.totalScore || 0));

    return {
      totalArchers,
      totalScore,
      averageScore: Math.round(averageScore * 100) / 100,
      maxScore,
      minScore,
      hasScores: true
    };
  };

  const calculateCompetitionResults = async (scores) => {
    if (!scores || scores.length === 0) {
      return { rankings: [], divisions: {} };
    }

    // Load all profiles to link with scores
    let allProfiles = [];
    try {
      allProfiles = await loadProfilesFromFirebase();
    } catch (error) {
      console.warn('Could not load profiles for linking, using score data only');
      // Fallback to localStorage
      const savedProfiles = localStorage.getItem('archerProfiles');
      if (savedProfiles) {
        allProfiles = JSON.parse(savedProfiles);
      }
    }

    // Group by division
    const divisionGroups = {};
    scores.forEach(score => {
      const division = score.division || 'Unknown';
      if (!divisionGroups[division]) {
        divisionGroups[division] = [];
      }
      
      // Find archer profile to get full details
      let archerProfile = null;
      if (score.archerId) {
        archerProfile = allProfiles.find(p => p.id === score.archerId);
      }
      
      // Calculate completion status
      let status = 'not_started';
      if (score.status === 'verified') {
        status = 'verified';
      } else if (score.totals && score.totals.totalScore > 0) {
        status = 'in_progress';
      }
      
      // Extract archer name from score or profile
      let firstName = '';
      let lastName = '';
      let school = '';
      
      if (archerProfile) {
        firstName = archerProfile.firstName || '';
        lastName = archerProfile.lastName || '';
        school = archerProfile.school || '';
      } else if (score.archerName) {
        // Parse archerName if it's in "FirstName LastName" format
        const nameParts = score.archerName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
        school = score.school || '';
      }
      
      // Add archer data to the score
      const archerData = {
        ...score,
        firstName,
        lastName,
        school,
        status,
        completedEnds: score.totals ? Math.floor((score.totals.totalScore || 0) / 30) : 0, // Rough estimate
        totalScore: score.totals?.totalScore || 0,
        totalTens: score.totals?.totalTens || 0,
        totalXs: score.totals?.totalXs || 0,
        average: score.totals?.totalScore ? (score.totals.totalScore / 36).toFixed(1) : '0.0'
      };
      
      divisionGroups[division].push(archerData);
    });

    // Sort each division by score
    Object.keys(divisionGroups).forEach(division => {
      divisionGroups[division].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));
    });

    // Create overall rankings
    const allScores = [...scores].sort((a, b) => (b.totals?.totalScore || 0) - (a.totals?.totalScore || 0));

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

  const handleViewArcherScorecard = (archer) => {
    setSelectedArcherForScorecard(archer);
    setShowArcherScorecard(true);
  };

  const handleCloseArcherScorecard = () => {
    setShowArcherScorecard(false);
    setSelectedArcherForScorecard(null);
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
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                    <>
                      {/* Summary Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-xl md:text-2xl font-bold text-blue-600">
                            {competitionStats[selectedCompetitionForResults.id].totalArchers}
                          </div>
                          <div className="text-xs md:text-sm text-blue-600">Archers</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-xl md:text-2xl font-bold text-green-600">
                            {competitionStats[selectedCompetitionForResults.id].averageScore}
                          </div>
                          <div className="text-xs md:text-sm text-green-600">Avg Score</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-xl md:text-2xl font-bold text-purple-600">
                            {competitionStats[selectedCompetitionForResults.id].maxScore}
                          </div>
                          <div className="text-xs md:text-sm text-purple-600">High Score</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="text-xl md:text-2xl font-bold text-orange-600">
                            {competitionStats[selectedCompetitionForResults.id].minScore}
                          </div>
                          <div className="text-xs md:text-sm text-orange-600">Low Score</div>
                        </div>
                      </div>

                      {/* Archer Results by Division */}
                      <div className="space-y-6">
                        {Object.entries(competitionResults[selectedCompetitionForResults.id]?.divisions || {}).map(([division, archers]) => {
                          const divisionInfo = genderDivisions[division];
                          return (
                            <div key={division} className="bg-gray-50 rounded-lg p-4">
                              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                {divisionInfo?.display || division} Division
                              </h3>
                              
                              {/* Compact Table View - Mobile Optimized */}
                              <div className="space-y-2">
                                {archers.map((archer, index) => (
                                  <div 
                                    key={archer.id} 
                                    className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleViewArcherScorecard(archer)}
                                  >
                                    {/* Mobile Layout */}
                                    <div className="md:hidden">
                                      {/* Rank and Name Row */}
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                                            index === 0 ? 'bg-yellow-500' : 
                                            index === 1 ? 'bg-gray-400' : 
                                            index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                                          }`}>
                                            {index + 1}
                                          </div>
                                          <div>
                                            <div className="font-semibold text-gray-800 text-sm">
                                              {archer.firstName} {archer.lastName}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                              {archer.gender || 'M'} • {archer.division || division}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-gray-800">
                                            {archer.totalScore || 0}
                                          </div>
                                          <div className="text-xs text-gray-600">
                                            {archer.average || '0.0'} avg
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Score Details Row */}
                                      <div className="flex justify-between text-xs text-gray-600 border-t border-gray-100 pt-2">
                                        <span>10s: {archer.totalTens || 0}</span>
                                        <span>Xs: {archer.totalXs || 0}</span>
                                        <span className={`px-2 py-1 rounded ${
                                          archer.status === 'verified' ? 'bg-green-100 text-green-800' : 
                                          archer.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {archer.status === 'verified' ? '✓ Verified' : 
                                           archer.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Desktop Layout */}
                                    <div className="hidden md:block">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                            index === 0 ? 'bg-yellow-500' : 
                                            index === 1 ? 'bg-gray-400' : 
                                            index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                                          }`}>
                                            {index + 1}
                                          </div>
                                          <div>
                                            <div className="font-semibold text-gray-800">
                                              {archer.firstName} {archer.lastName}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                              {archer.school || 'Unknown School'} • {archer.division || division}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-2xl font-bold text-gray-800">
                                            {archer.totalScore || 0}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            {archer.completedEnds || 0}/12 ends
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Score Details */}
                                      <div className="mt-2 pt-2 border-t border-gray-100">
                                        <div className="flex justify-between text-xs text-gray-600">
                                          <span>10s: {archer.totalTens || 0}</span>
                                          <span>Xs: {archer.totalXs || 0}</span>
                                          <span>Avg: {archer.average || '0.0'}</span>
                                          <span className={`px-2 py-1 rounded ${
                                            archer.status === 'verified' ? 'bg-green-100 text-green-800' : 
                                            archer.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {archer.status === 'verified' ? '✓ Verified' : 
                                             archer.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              {/* Legacy Card View (hidden by default) */}
                              <div className="hidden space-y-2">
                                {archers.slice(0, 5).map((archer, index) => (
                                  <div 
                                    key={archer.id} 
                                    className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleViewArcherScorecard(archer)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                          index === 0 ? 'bg-yellow-500' : 
                                          index === 1 ? 'bg-gray-400' : 
                                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                                        }`}>
                                          {index + 1}
                                        </div>
                                        <div>
                                          <div className="font-semibold text-gray-800">
                                            {archer.firstName} {archer.lastName}
                                          </div>
                                          <div className="text-sm text-gray-600">
                                            {archer.school || 'Unknown School'} • {archer.division || division}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-2xl font-bold text-gray-800">
                                          {archer.totalScore || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          {archer.completedEnds || 0}/12 ends
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Score Details */}
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                      <div className="flex justify-between text-xs text-gray-600">
                                        <span>10s: {archer.totalTens || 0}</span>
                                        <span>Xs: {archer.totalXs || 0}</span>
                                        <span>Avg: {archer.average || '0.0'}</span>
                                        <span className={`px-2 py-1 rounded ${
                                          archer.status === 'verified' ? 'bg-green-100 text-green-800' : 
                                          archer.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {archer.status === 'verified' ? '✓ Verified' : 
                                           archer.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Show more archers if available */}
                                {archers.length > 5 && (
                                  <div className="text-center py-2">
                                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                                      View all {archers.length} archers in {division}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
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
        
        {/* Archer Scorecard Modal */}
        {showArcherScorecard && selectedArcherForScorecard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 md:p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto relative">
              {/* Fixed Close Button - Always Visible */}
              <button
                onClick={handleCloseArcherScorecard}
                className="absolute top-2 right-2 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                style={{ position: 'sticky', top: '8px', right: '8px' }}
              >
                ✕
              </button>
              
              <div className="p-4 md:p-6 pt-12 md:pt-6">
                <div className="mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 pr-8">
                    Scorecard: {selectedArcherForScorecard.firstName} {selectedArcherForScorecard.lastName}
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {/* Archer Info - Mobile Optimized */}
                  <div className="bg-gray-50 rounded-lg p-3 md:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                      <div>
                        <span className="text-gray-500 text-xs md:text-sm">Competition:</span>
                        <div className="font-medium text-sm md:text-base">{selectedArcherForScorecard.competitionName}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs md:text-sm">Division:</span>
                        <div className="font-medium text-sm md:text-base">{selectedArcherForScorecard.division}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs md:text-sm">Gender:</span>
                        <div className="font-medium text-sm md:text-base">{selectedArcherForScorecard.gender || 'M'}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs md:text-sm">Bale:</span>
                        <div className="font-medium text-sm md:text-base">{selectedArcherForScorecard.baleNumber} - Target {selectedArcherForScorecard.targetAssignment}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs md:text-sm">Status:</span>
                        <div className={`font-medium text-sm md:text-base ${
                          selectedArcherForScorecard.status === 'verified' ? 'text-green-600' : 
                          selectedArcherForScorecard.status === 'in_progress' ? 'text-yellow-600' : 
                          'text-gray-600'
                        }`}>
                          {selectedArcherForScorecard.status === 'verified' ? '✓ Verified' : 
                           selectedArcherForScorecard.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Scorecard Table - Mobile Optimized */}
                  {selectedArcherForScorecard.ends && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 text-xs md:text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-medium">E</th>
                            <th className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-medium">A1</th>
                            <th className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-medium">A2</th>
                            <th className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-medium">A3</th>
                            <th className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-medium">10s</th>
                            <th className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-medium">Xs</th>
                            <th className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-medium">END</th>
                            <th className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-medium">RUN</th>
                            <th className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-medium">AVG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 12 }, (_, index) => {
                            const endNumber = index + 1;
                            const endKey = `end${endNumber}`;
                            const endData = selectedArcherForScorecard.ends[endKey];
                            
                            if (!endData) {
                              return (
                                <tr key={endNumber}>
                                  <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">{endNumber}</td>
                                  <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">-</td>
                                  <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">-</td>
                                  <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">-</td>
                                  <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">0</td>
                                  <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">0</td>
                                  <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">0</td>
                                  <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">0</td>
                                  <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">0.0</td>
                                </tr>
                              );
                            }
                            
                            const scores = [endData.arrow1, endData.arrow2, endData.arrow3];
                            const endTotal = scores.reduce((sum, score) => {
                              if (score === 'X' || score === '10') return sum + 10;
                              if (score === 'M') return sum;
                              return sum + (parseInt(score) || 0);
                            }, 0);
                            
                            let tens = 0;
                            let xs = 0;
                            scores.forEach(score => {
                              if (score === 'X') {
                                tens++;
                                xs++;
                              } else if (score === '10') {
                                tens++;
                              }
                            });
                            
                            // Calculate running total and average
                            let runningTotal = 0;
                            for (let i = 1; i <= endNumber; i++) {
                              const prevEndKey = `end${i}`;
                              const prevEndData = selectedArcherForScorecard.ends[prevEndKey];
                              if (prevEndData) {
                                const prevScores = [prevEndData.arrow1, prevEndData.arrow2, prevEndData.arrow3];
                                runningTotal += prevScores.reduce((sum, score) => {
                                  if (score === 'X' || score === '10') return sum + 10;
                                  if (score === 'M') return sum;
                                  return sum + (parseInt(score) || 0);
                                }, 0);
                              }
                            }
                            
                            const average = runningTotal > 0 ? (runningTotal / (endNumber * 3)).toFixed(1) : '0.0';
                            
                            return (
                              <tr key={endNumber}>
                                <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-medium">{endNumber}</td>
                                <td className={`border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-bold ${
                                  scores[0] === 'X' || scores[0] === '10' ? 'bg-yellow-200' :
                                  scores[0] === '7' || scores[0] === '8' ? 'bg-red-200' :
                                  scores[0] === '6' ? 'bg-blue-200' : 'bg-white'
                                }`}>
                                  {scores[0] || '-'}
                                </td>
                                <td className={`border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-bold ${
                                  scores[1] === 'X' || scores[1] === '10' ? 'bg-yellow-200' :
                                  scores[1] === '7' || scores[1] === '8' ? 'bg-red-200' :
                                  scores[1] === '6' ? 'bg-blue-200' : 'bg-white'
                                }`}>
                                  {scores[1] || '-'}
                                </td>
                                <td className={`border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-bold ${
                                  scores[2] === 'X' || scores[2] === '10' ? 'bg-yellow-200' :
                                  scores[2] === '7' || scores[2] === '8' ? 'bg-red-200' :
                                  scores[2] === '6' ? 'bg-blue-200' : 'bg-white'
                                }`}>
                                  {scores[2] || '-'}
                                </td>
                                <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">{tens}</td>
                                <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">{xs}</td>
                                <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-bold">{endTotal}</td>
                                <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center font-bold">{runningTotal}</td>
                                <td className="border border-gray-300 px-1 md:px-2 py-1 md:py-2 text-center">{average}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  {/* Final Totals - Positioned Close to Table */}
                  {selectedArcherForScorecard.totals && (
                    <div className="bg-gray-50 rounded-lg p-3 md:p-4 mt-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Final Totals</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        <div className="text-center">
                          <div className="text-2xl md:text-3xl font-bold text-blue-600">{selectedArcherForScorecard.totals.totalScore}</div>
                          <div className="text-xs md:text-sm text-gray-600">Total Score</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl md:text-3xl font-bold text-orange-600">{selectedArcherForScorecard.totals.totalTens}</div>
                          <div className="text-xs md:text-sm text-gray-600">10s</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl md:text-3xl font-bold text-purple-600">{selectedArcherForScorecard.totals.totalXs}</div>
                          <div className="text-xs md:text-sm text-gray-600">Xs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl md:text-3xl font-bold text-green-600">{selectedArcherForScorecard.totals.average}</div>
                          <div className="text-xs md:text-sm text-gray-600">Average</div>
                        </div>
                      </div>
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
              {oasDivisions.map((division) => {
                const divisionInfo = genderDivisions[division];
                return (
                  <label key={division} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.divisions.includes(division)}
                      onChange={() => handleDivisionChange(division)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{divisionInfo?.display || division}</span>
                  </label>
                );
              })}
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