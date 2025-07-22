import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  saveCompetitionToFirebase, 
  loadCompetitionsFromFirebase,
  deleteCompetitionFromFirebase,
  isOnline 
} from '../services/firebaseService';

const CompetitionManagement = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    description: '',
    type: 'qualification', // 'qualification', 'olympic', 'team', 'practice'
    divisions: [],
    rounds: [],
    maxArchersPerBale: 8,
    distance: '18m',
    maxTeamSize: 4,
    teamScoringMethod: 'sum',
    status: 'draft' // 'draft', 'active', 'completed', 'cancelled'
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

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      console.log('Loading competitions...');

      if (isOnline() && currentUser) {
        try {
          console.log('Attempting to load from Firebase...');
          const firebaseCompetitions = await loadCompetitionsFromFirebase(currentUser.uid);
          console.log('Competitions loaded from Firebase:', firebaseCompetitions);
          setCompetitions(firebaseCompetitions);
        } catch (error) {
          console.error('Error loading from Firebase:', error);
        }
      } else {
        console.log('Skipping Firebase load - offline or no user');
      }
    } catch (error) {
      console.error('Error loading competitions:', error);
    } finally {
      setLoading(false);
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
    setIsCreating(false);
    setIsEditing(false);
    setSelectedCompetition(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      rounds: [roundType]
    }));
  };

  const handleCustomRoundChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      rounds: [{
        ...prev.rounds[0],
        [field]: parseInt(value) || 0
      }]
    }));
  };

  const saveCompetition = async () => {
    try {
      console.log('Saving competition:', formData);
      console.log('Current user:', currentUser);
      console.log('Is online:', isOnline());

      let updatedCompetitions;
      let competitionToSave;

      if (isEditing && selectedCompetition) {
        // Update existing competition
        competitionToSave = { 
          ...selectedCompetition, 
          ...formData,
          updatedAt: new Date().toISOString()
        };
        updatedCompetitions = competitions.map(c =>
          c.id === selectedCompetition.id ? competitionToSave : c
        );
        console.log('Updating existing competition:', competitionToSave);
      } else {
        // Create new competition
        competitionToSave = {
          id: Date.now().toString(),
          userId: currentUser.uid,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedCompetitions = [...competitions, competitionToSave];
        console.log('Creating new competition:', competitionToSave);
      }

      setCompetitions(updatedCompetitions);

      // Sync to Firebase if online
      if (isOnline() && currentUser) {
        try {
          console.log('Attempting to sync to Firebase...');
          await saveCompetitionToFirebase(competitionToSave, currentUser.uid);
          console.log('Competition synced to Firebase successfully');
        } catch (error) {
          console.error('Error syncing to Firebase:', error);
        }
      } else {
        console.log('Skipping Firebase sync - offline or no user');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving competition:', error);
    }
  };

  const deleteCompetition = async (competitionId) => {
    if (window.confirm('Are you sure you want to delete this competition?')) {
      try {
        const updatedCompetitions = competitions.filter(c => c.id !== competitionId);
        setCompetitions(updatedCompetitions);

        if (isOnline() && currentUser) {
          try {
            await deleteCompetitionFromFirebase(competitionId, currentUser.uid);
            console.log('Competition deleted from Firebase');
          } catch (error) {
            console.error('Error deleting from Firebase:', error);
          }
        }
      } catch (error) {
        console.error('Error deleting competition:', error);
      }
    }
  };

  const editCompetition = (competition) => {
    setSelectedCompetition(competition);
    setFormData({
      name: competition.name,
      date: competition.date,
      location: competition.location,
      description: competition.description,
      type: competition.type,
      divisions: competition.divisions || [],
      rounds: competition.rounds || [],
      maxArchersPerBale: competition.maxArchersPerBale || 8,
      distance: competition.distance || '18m',
      maxTeamSize: competition.maxTeamSize || 4,
      teamScoringMethod: competition.teamScoringMethod || 'sum',
      status: competition.status
    });
    setIsEditing(true);
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading competitions...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="w-full px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">OAS Competition Management</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onNavigate('home')}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">
        {/* Competition List */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Your OAS Competitions ({competitions.length})</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                + New Competition
              </button>
              <button
                onClick={() => onNavigate('team-archers')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Manage Team
              </button>
            </div>
          </div>

          {competitions.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center">
              <p className="text-gray-600 mb-4">No OAS competitions created yet.</p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                + New Competition
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Competition
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type & Divisions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                    {competitions.map((competition) => (
                      <tr key={competition.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {competition.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {competition.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>{competition.date}</div>
                            <div className="text-gray-500">{competition.location}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900">
                              {competition.type === 'qualification' ? 'OAS Qualification' : 
                               competition.type === 'olympic' ? 'OAS Olympic' :
                               competition.type === 'team' ? 'OAS Team' : 'Custom'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {competition.divisions?.length || 0} divisions • {competition.rounds?.length || 0} rounds
                            </div>
                            {competition.type === 'qualification' && (
                              <div className="text-xs text-gray-500">
                                {competition.distance || '18m'} • {competition.maxArchersPerBale || 8} archers/bale
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            competition.status === 'active' ? 'bg-green-100 text-green-800' :
                            competition.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            competition.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {competition.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div className="text-xs">
                              <span className="font-medium">Archers:</span> {competition.stats?.totalArchers || '0'}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">Bales:</span> {competition.stats?.totalBales || '0'}
                            </div>
                            <div className="text-xs">
                              <span className="font-medium">Completed:</span> {competition.stats?.completedRounds || '0'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editCompetition(competition)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onNavigate('scoring', { competitionId: competition.id })}
                              className="text-green-600 hover:text-green-900"
                            >
                              Score
                            </button>
                            <button
                              onClick={() => deleteCompetition(competition.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Form */}
        {(isCreating || isEditing) && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {isEditing ? 'Edit OAS Competition' : 'Create New OAS Competition'}
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Competition Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Spring OAS Qualification Round"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Archery Club"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional details about the competition..."
                  />
                </div>
              </div>

              {/* Competition Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Competition Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="qualification">OAS Qualification Round</option>
                    <option value="olympic">OAS Olympic Round</option>
                    <option value="team">OAS Team Round</option>
                    <option value="practice">Practice Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Archers Per Bale
                  </label>
                  <input
                    type="number"
                    name="maxArchersPerBale"
                    value={formData.maxArchersPerBale}
                    onChange={handleInputChange}
                    min="1"
                    max="8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* OAS Divisions */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OAS Divisions *
              </label>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {oasDivisions.map((division) => (
                  <label key={division} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.divisions.includes(division)}
                      onChange={() => handleDivisionChange(division)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">{division}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Round Configuration */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Round Configuration *
              </label>
              <div className="space-y-3">
                {roundTypes.map((round) => (
                  <label key={round.name} className="flex items-center">
                    <input
                      type="radio"
                      name="roundType"
                      checked={formData.rounds[0]?.name === round.name}
                      onChange={() => handleRoundChange(round)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">
                      {round.name} ({round.ends} ends, {round.arrowsPerEnd} arrows/end, max {round.maxScore}, {round.timeLimit})
                    </span>
                  </label>
                ))}
              </div>

              {/* Custom Round Configuration */}
              {formData.rounds[0]?.name === 'Custom Round' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Ends
                      </label>
                      <input
                        type="number"
                        value={formData.rounds[0]?.ends || 0}
                        onChange={(e) => handleCustomRoundChange('ends', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Arrows Per End
                      </label>
                      <input
                        type="number"
                        value={formData.rounds[0]?.arrowsPerEnd || 0}
                        onChange={(e) => handleCustomRoundChange('arrowsPerEnd', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Arrows
                      </label>
                      <input
                        type="number"
                        value={formData.rounds[0]?.totalArrows || 0}
                        onChange={(e) => handleCustomRoundChange('totalArrows', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Qualification Round Configuration */}
              {formData.type === 'qualification' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualification Round Settings
                  </label>
                  <div className="p-4 bg-green-50 rounded-md">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Archers Per Bale
                        </label>
                        <input
                          type="number"
                          name="maxArchersPerBale"
                          value={formData.maxArchersPerBale || 8}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="8"
                        />
                        <p className="text-xs text-gray-600 mt-1">OAS standard: up to 8 archers per bale</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Distance
                        </label>
                        <select
                          name="distance"
                          value={formData.distance || '18m'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="18m">18 meters</option>
                          <option value="9m">9 meters</option>
                        </select>
                        <p className="text-xs text-gray-600 mt-1">OAS Qualification Round distance</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Qualification Round Format:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>• 36 arrows total (12 ends × 3 arrows)</li>
                        <li>• 2 minutes per end</li>
                        <li>• Maximum score: 360 points</li>
                        <li>• Archers ranked by total score, then number of 10s</li>
                        <li>• Tie-breaker: single arrow shoot-off (40 seconds)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* School Team Configuration */}
              {formData.type === 'team' && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    School Team Settings
                  </label>
                  <div className="p-4 bg-blue-50 rounded-md">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Team Size
                        </label>
                        <input
                          type="number"
                          name="maxTeamSize"
                          value={formData.maxTeamSize || 4}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="8"
                        />
                        <p className="text-xs text-gray-600 mt-1">OAS teams typically have 4 archers</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Scoring Method
                        </label>
                        <select
                          name="teamScoringMethod"
                          value={formData.teamScoringMethod || 'sum'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="sum">Sum of Top 3 Scores</option>
                          <option value="average">Average of All Scores</option>
                          <option value="best3">Best 3 Individual Scores</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCompetition}
                disabled={!formData.name || !formData.date || !formData.location || formData.divisions.length === 0 || formData.rounds.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditing ? 'Update Competition' : 'Create Competition'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionManagement; 