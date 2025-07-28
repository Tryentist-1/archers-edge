import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    loadProfilesFromFirebase,
    loadCompetitionsFromFirebase,
    createEventAssignment,
    getEventAssignments,
    updateEventAssignment,
    deleteEventAssignment,
    convertEventAssignmentToScoringRounds,
    shouldUseFirebase
} from '../services/firebaseService';

const EventAssignment = ({ onNavigate }) => {
    const { currentUser, userRole } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Data state
    const [profiles, setProfiles] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [assignments, setAssignments] = useState([]);
    
    // Form state
    const [activeTab, setActiveTab] = useState('create');
    const [selectedCompetition, setSelectedCompetition] = useState('');
    const [assignmentType, setAssignmentType] = useState('school'); // 'school', 'mixed', 'school-vs-school'
    const [selectedSchool, setSelectedSchool] = useState('');
    const [selectedArchers, setSelectedArchers] = useState([]);
    const [numberOfBales, setNumberOfBales] = useState(8);
    const [maxArchersPerBale, setMaxArchersPerBale] = useState(4);
    
    // OAS Assignment Types
    const assignmentTypes = {
        'school': {
            name: 'School Round',
            description: 'All archers from one school',
            priority: 1
        },
        'mixed': {
            name: 'Mixed Division',
            description: 'Random grouping, no division separation',
            priority: 2
        },
        'school-vs-school': {
            name: 'School vs School',
            description: 'Multiple schools, broken by gender/division',
            priority: 3
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            console.log('=== EVENT ASSIGNMENT DATA LOAD DEBUG ===');
            console.log('Current user:', currentUser);
            console.log('User role:', userRole);

            // Load profiles - try to sync Firebase data to localStorage first
            let profilesData = [];
            
            // Always try to load team data from Firebase and sync to localStorage
            try {
                console.log('Attempting to load team data from Firebase...');
                const { loadTeamFromFirebase } = await import('../services/firebaseService.js');
                
                // Try to load all available teams (CAMP, WDV, etc.)
                const teamsToLoad = ['CAMP', 'WDV', 'BHS', 'ORANCO'];
                let allProfiles = [];
                
                for (const teamCode of teamsToLoad) {
                    try {
                        const teamProfiles = await loadTeamFromFirebase(teamCode);
                        console.log(`Loaded ${teamProfiles.length} profiles for team ${teamCode}`);
                        allProfiles = [...allProfiles, ...teamProfiles];
                    } catch (teamError) {
                        console.log(`Failed to load team ${teamCode}:`, teamError.message);
                    }
                }
                
                // Remove duplicates by ID
                const uniqueProfiles = allProfiles.filter((profile, index, self) => 
                    index === self.findIndex(p => p.id === profile.id)
                );
                
                console.log(`Total unique profiles loaded from Firebase: ${uniqueProfiles.length}`);
                
                // Save to localStorage for soft login access
                if (uniqueProfiles.length > 0) {
                    localStorage.setItem('archerProfiles', JSON.stringify(uniqueProfiles));
                    console.log('Saved Firebase profiles to localStorage');
                    profilesData = uniqueProfiles;
                }
                
            } catch (error) {
                console.error('Error loading team data from Firebase:', error);
            }

            // Load competitions and assignments (only if we should use Firebase)
            let competitionsData = [];
            let assignmentsData = [];
            
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    [competitionsData, assignmentsData] = await Promise.all([
                        loadCompetitionsFromFirebase(currentUser?.uid),
                        getEventAssignments()
                    ]);
                } catch (error) {
                    console.error('Error loading competitions/assignments from Firebase:', error);
                }
            } else {
                console.log('Skipping Firebase competitions/assignments load');
            }

            console.log('Profiles loaded:', profilesData?.length || 0);
            console.log('Competitions loaded:', competitionsData?.length || 0);
            console.log('Assignments loaded:', assignmentsData?.length || 0);

            // Debug: Show all archer profiles and their schools
            const archerProfiles = profilesData?.filter(p => p.role === 'Archer') || [];
            console.log('Archer profiles found:', archerProfiles.length);
            console.log('Schools in archer profiles:', [...new Set(archerProfiles.map(p => p.school))]);

            // Use Firebase data if available, otherwise fall back to localStorage
            let finalProfiles = [];
            
            if (profilesData && profilesData.length > 0) {
                console.log('Using Firebase profiles (freshly loaded):', profilesData.length);
                finalProfiles = profilesData;
            } else {
                // Fall back to localStorage if Firebase load failed
                const localProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
                console.log('Using localStorage profiles (fallback):', localProfiles.length);
                finalProfiles = localProfiles;
            }

            setProfiles(finalProfiles);
            setCompetitions(competitionsData);
            setAssignments(assignmentsData);

        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Get unique schools from profiles
    const getSchools = () => {
        const archerProfiles = profiles.filter(p => p.role === 'Archer');
        console.log('All archer profiles:', archerProfiles);
        console.log('School values found:', archerProfiles.map(p => p.school));
        
        const schools = [...new Set(archerProfiles.map(p => p.school))];
        console.log('Unique schools:', schools);
        return schools.sort();
    };

    // Get archers by school
    const getArchersBySchool = (school) => {
        console.log('Looking for archers in school:', school);
        const archers = profiles.filter(p => p.role === 'Archer' && p.school === school);
        console.log('Found archers:', archers);
        return archers;
    };

    // Get archer division
    const getArcherDivision = (archer) => {
        const gender = archer.gender || 'M';
        const classification = archer.defaultClassification || 'V';
        
        if (gender === 'F' && classification === 'V') return 'GV'; // Girls Varsity
        if (gender === 'F' && classification === 'JV') return 'GJV'; // Girls JV
        if (gender === 'M' && classification === 'V') return 'BV'; // Boys Varsity
        if (gender === 'M' && classification === 'JV') return 'BJV'; // Boys JV
        
        return 'Unknown';
    };

    const handleSchoolChange = (school) => {
        setSelectedSchool(school);
        setSelectedArchers([]); // Reset selected archers when school changes
    };

    const handleSelectAllSchool = (school) => {
        const schoolArchers = getArchersBySchool(school);
        setSelectedArchers(schoolArchers.map(a => a.id));
    };

    const handleArcherToggle = (archerId) => {
        setSelectedArchers(prev => {
            const isSelected = prev.includes(archerId);
            if (isSelected) {
                return prev.filter(id => id !== archerId);
            } else {
                return [...prev, archerId];
            }
        });
    };

    const handleAssignmentTypeChange = (type) => {
        setAssignmentType(type);
        setSelectedArchers([]); // Reset selections when type changes
    };

    const handleNumberOfBalesChange = (bales) => {
        setNumberOfBales(bales);
        // Calculate if we need to expand to 6 archers per bale
        const totalArchers = selectedArchers.length;
        const maxArchersWith4 = bales * 4;
        
        if (totalArchers > maxArchersWith4) {
            setMaxArchersPerBale(6);
        } else {
            setMaxArchersPerBale(4);
        }
    };

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        
        if (!selectedCompetition) {
            setError('Please select a competition');
            return;
        }
        
        if (selectedArchers.length === 0) {
            setError('Please select at least one archer');
            return;
        }

        if (selectedArchers.length > numberOfBales * maxArchersPerBale) {
            setError(`Too many archers selected. Maximum ${numberOfBales * maxArchersPerBale} archers allowed with ${numberOfBales} bales.`);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const assignmentData = {
                competitionId: selectedCompetition,
                assignmentType: assignmentType,
                selectedSchool: selectedSchool,
                archerIds: selectedArchers,
                numberOfBales: numberOfBales,
                maxArchersPerBale: maxArchersPerBale,
                createdBy: currentUser?.uid,
                createdAt: new Date().toISOString(),
                status: 'draft'
            };

            await createEventAssignment(assignmentData);
            
            setSuccess('Event assignment created successfully!');
            setSelectedArchers([]);
            setSelectedCompetition('');
            setSelectedSchool('');
            loadData();
            
        } catch (error) {
            console.error('Error creating assignment:', error);
            setError('Failed to create assignment: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAssignBales = async (assignmentId) => {
        try {
            setLoading(true);
            setError('');

            const assignment = assignments.find(a => a.id === assignmentId);
            if (!assignment) {
                setError('Assignment not found');
                return;
            }

            // Auto-assign bales based on assignment type
            const bales = generateBaleAssignments(assignment.archerIds, assignment.assignmentType, assignment.numberOfBales, assignment.maxArchersPerBale);
            
            await updateEventAssignment(assignmentId, { bales, status: 'assigned' });
            
            setSuccess('Bales auto-assigned successfully!');
            loadData();
            
        } catch (error) {
            console.error('Error auto-assigning bales:', error);
            setError('Failed to auto-assign bales: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const generateBaleAssignments = (archerIds, assignmentType, numberOfBales, maxArchersPerBale) => {
        const selectedProfiles = profiles.filter(p => archerIds.includes(p.id));
        const targets = maxArchersPerBale === 6 ? ['A', 'B', 'C', 'D', 'E', 'F'] : ['A', 'B', 'C', 'D'];
        
        let groupedArchers = [];

        if (assignmentType === 'school') {
            // School round: all archers from one school, group by division
            groupedArchers = groupArchersByDivision(selectedProfiles);
        } else if (assignmentType === 'mixed') {
            // Mixed division: random grouping, ignore divisions
            groupedArchers = [{ division: 'Mixed', archers: selectedProfiles }];
        } else if (assignmentType === 'school-vs-school') {
            // School vs school: group by division, prioritize by level
            groupedArchers = groupArchersByDivision(selectedProfiles);
        }

        // Combine small divisions if needed
        const combinedGroups = combineSmallDivisions(groupedArchers);

        // Assign bales
        const bales = [];
        let baleNumber = 1;

        combinedGroups.forEach(group => {
            const archers = group.archers;
            const archersPerBale = Math.ceil(archers.length / Math.ceil(archers.length / maxArchersPerBale));
            
            for (let i = 0; i < archers.length; i += archersPerBale) {
                const baleArchers = archers.slice(i, i + archersPerBale);
                
                if (baleArchers.length >= 2) { // Minimum 2 archers per bale
                    const bale = {
                        baleNumber: baleNumber,
                        division: group.division,
                        archers: baleArchers.map((archer, index) => ({
                            ...archer,
                            targetAssignment: targets[index % targets.length]
                        }))
                    };
                    bales.push(bale);
                    baleNumber++;
                }
            }
        });

        return bales;
    };

    const groupArchersByDivision = (archers) => {
        const divisions = {};
        
        archers.forEach(archer => {
            const division = getArcherDivision(archer);
            if (!divisions[division]) {
                divisions[division] = [];
            }
            divisions[division].push(archer);
        });

        return Object.keys(divisions).map(division => ({
            division,
            archers: divisions[division]
        }));
    };

    const combineSmallDivisions = (groups) => {
        const result = [];
        const smallGroups = [];
        const largeGroups = [];

        // Separate small and large groups
        groups.forEach(group => {
            if (group.archers.length < 2) {
                smallGroups.push(group);
            } else {
                largeGroups.push(group);
            }
        });

        // Add large groups to result
        result.push(...largeGroups);

        // Combine small groups by level
        const jvGroups = smallGroups.filter(g => g.division.includes('JV'));
        const vGroups = smallGroups.filter(g => g.division.includes('V'));

        if (jvGroups.length > 0) {
            const combinedJV = {
                division: 'Combined JV',
                archers: jvGroups.flatMap(g => g.archers)
            };
            if (combinedJV.archers.length >= 2) {
                result.push(combinedJV);
            }
        }

        if (vGroups.length > 0) {
            const combinedV = {
                division: 'Combined Varsity',
                archers: vGroups.flatMap(g => g.archers)
            };
            if (combinedV.archers.length >= 2) {
                result.push(combinedV);
            }
        }

        return result;
    };

    const handleDeleteAssignment = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to delete this assignment?')) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            await deleteEventAssignment(assignmentId);
            setSuccess('Assignment deleted successfully!');
            loadData();
            
        } catch (error) {
            console.error('Error deleting assignment:', error);
            setError('Failed to delete assignment: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateScoringRounds = async (assignmentId) => {
        if (!window.confirm('This will create scoring rounds for all archers. Archers will be able to access their assigned bales. Continue?')) {
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            console.log('Creating scoring rounds for assignment:', assignmentId);
            
            // Convert assignment to scoring rounds
            const scoringRounds = await convertEventAssignmentToScoringRounds(assignmentId);
            
            // Reload assignments to get updated status
            await loadData();
            
            setSuccess(`Successfully created ${scoringRounds.length} scoring rounds! Archers can now access their assigned bales.`);
        } catch (error) {
            console.error('Error creating scoring rounds:', error);
            setError('Failed to create scoring rounds: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getArcherName = (archerId) => {
        const profile = profiles.find(p => p.id === archerId);
        return profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown Archer';
    };

    const getCompetitionName = (competitionId) => {
        const competition = competitions.find(c => c.id === competitionId);
        return competition ? competition.name : 'Unknown Competition';
    };

    const getAssignmentTypeName = (type) => {
        return assignmentTypes[type]?.name || type;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading event assignments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => onNavigate('home')}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                ← Home
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">OAS Event Assignment</h1>
                        </div>
                        <div className="text-sm text-gray-500">
                            {userRole === 'Coach' ? 'Coach View' : 'Coordinator View'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Messages */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="text-red-600">{error}</div>
                            <button
                                onClick={() => setError('')}
                                className="ml-auto text-red-400 hover:text-red-600"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="text-green-600">{success}</div>
                            <button
                                onClick={() => setSuccess('')}
                                className="ml-auto text-green-400 hover:text-green-600"
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('create')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'create'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Create Assignment
                            </button>
                            <button
                                onClick={() => setActiveTab('manage')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'manage'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Manage Assignments
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Create Assignment Tab */}
                {activeTab === 'create' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900">Create OAS Event Assignment</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Assign archers to bales based on OAS (Olympic Archery in Schools) requirements
                            </p>
                        </div>

                        <form onSubmit={handleCreateAssignment} className="p-6 space-y-6">
                            {/* Competition Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Competition *
                                </label>
                                <select
                                    value={selectedCompetition}
                                    onChange={(e) => setSelectedCompetition(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="">Select a competition</option>
                                    {competitions.map(competition => (
                                        <option key={competition.id} value={competition.id}>
                                            {competition.name} - {new Date(competition.date).toLocaleDateString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Assignment Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assignment Type *
                                </label>
                                <select
                                    value={assignmentType}
                                    onChange={(e) => handleAssignmentTypeChange(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    {Object.keys(assignmentTypes).map(type => (
                                        <option key={type} value={type}>
                                            {assignmentTypes[type].name} - {assignmentTypes[type].description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Number of Bales */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Bales Available *
                                </label>
                                <input
                                    type="number"
                                    value={numberOfBales}
                                    onChange={(e) => handleNumberOfBalesChange(parseInt(e.target.value))}
                                    min="1"
                                    max="24"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                <p className="text-sm text-gray-600 mt-1">
                                    Max archers per bale: {maxArchersPerBale} (targets A-{maxArchersPerBale === 6 ? 'F' : 'D'})
                                </p>
                            </div>

                            {/* School Selection (for school and school-vs-school types) */}
                            {(assignmentType === 'school' || assignmentType === 'school-vs-school') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Filter by School
                                    </label>
                                    <select
                                        value={selectedSchool}
                                        onChange={(e) => handleSchoolChange(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">All Schools</option>
                                        {getSchools().map(school => (
                                            <option key={school} value={school}>
                                                {school}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Archer Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Archers ({selectedArchers.length} selected)
                                </label>
                                
                                {/* School Filter and Select All */}
                                {(assignmentType === 'school' || assignmentType === 'school-vs-school') && selectedSchool && (
                                    <div className="mb-4">
                                        <button
                                            type="button"
                                            onClick={() => handleSelectAllSchool(selectedSchool)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Select All from {selectedSchool}
                                        </button>
                                    </div>
                                )}

                                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {profiles
                                            .filter(p => p.role === 'Archer')
                                            .filter(p => !selectedSchool || p.school === selectedSchool)
                                            .map(profile => (
                                            <label key={profile.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedArchers.includes(profile.id)}
                                                    onChange={() => handleArcherToggle(profile.id)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {profile.firstName} {profile.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {profile.school} • {getArcherDivision(profile)}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                                >
                                    Create Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Manage Assignments Tab */}
                {activeTab === 'manage' && (
                    <div className="space-y-6">
                        {assignments.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                                <div className="text-gray-500">
                                    <p className="text-lg font-medium mb-2">No assignments found</p>
                                    <p className="text-sm">Create your first event assignment to get started</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {assignments.map(assignment => (
                                    <div key={assignment.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {getCompetitionName(assignment.competitionId)}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {getAssignmentTypeName(assignment.assignmentType)} • {assignment.archerIds.length} archers
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    assignment.status === 'assigned' ? 'bg-green-100 text-green-800' :
                                                    assignment.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {assignment.status}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteAssignment(assignment.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>

                                        {/* Assignment Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div>
                                                <div className="text-sm text-gray-500">Archers</div>
                                                <div className="text-sm font-medium">
                                                    {assignment.archerIds.map(id => getArcherName(id)).join(', ')}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500">Bales</div>
                                                <div className="text-sm font-medium">{assignment.numberOfBales}</div>
                                            </div>
                                            <div>
                                                <div className="text-sm text-gray-500">Max per Bale</div>
                                                <div className="text-sm font-medium">{assignment.maxArchersPerBale}</div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {assignment.status === 'draft' && (
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={() => handleAutoAssignBales(assignment.id)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                                >
                                                    Auto-Assign Bales
                                                </button>
                                            </div>
                                        )}

                                        {/* Create Scoring Rounds Button - Show when bales are assigned but scoring rounds not created */}
                                        {assignment.bales && assignment.bales.length > 0 && assignment.status !== 'scoring_rounds_created' && (
                                            <div className="flex justify-end space-x-3 mt-4">
                                                <button
                                                    onClick={() => handleCreateScoringRounds(assignment.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                                                >
                                                    Create Scoring Rounds
                                                </button>
                                            </div>
                                        )}

                                        {/* Scoring Rounds Created Status */}
                                        {assignment.status === 'scoring_rounds_created' && (
                                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <div className="flex items-center">
                                                    <div className="text-green-600 text-sm font-medium">
                                                        ✅ Scoring rounds created - Archers can now access their assigned bales
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Bales Display */}
                                        {assignment.bales && assignment.bales.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">Bale Assignments</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {assignment.bales.map(bale => (
                                                        <div key={bale.baleNumber} className="bg-gray-50 rounded-lg p-3">
                                                            <div className="text-sm font-medium text-gray-900 mb-1">
                                                                Bale {bale.baleNumber} - {bale.division}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                {bale.archers.map(archer => 
                                                                    `${archer.firstName} ${archer.lastName} (Target ${archer.targetAssignment})`
                                                                ).join(', ')}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventAssignment; 