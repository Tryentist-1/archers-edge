import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadProfilesFromFirebase, loadCompetitionsFromFirebase, shouldUseFirebase } from '../services/firebaseService';

const ProfileRoundSetup = ({ onSetupComplete, onNavigate }) => {
    const { currentUser } = useAuth();
    const [myProfile, setMyProfile] = useState(null);
    const [availableProfiles, setAvailableProfiles] = useState([]);
    const [selectedTeammates, setSelectedTeammates] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [selectedCompetition, setSelectedCompetition] = useState('');
    const [baleNumber, setBaleNumber] = useState(1);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Select my profile, 2: Select teammates, 3: Competition & bale
    const [isPracticeRound, setIsPracticeRound] = useState(false);

    useEffect(() => {
        loadProfilesAndCompetitions();
    }, [currentUser]);

    const loadProfilesAndCompetitions = async () => {
        try {
            setLoading(true);
            
            // Load profiles - use same logic as ProfileManagement
            let profiles = [];
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    console.log('Loading profiles from Firebase...');
                    profiles = await loadProfilesFromFirebase(currentUser.uid);
                    if (profiles && profiles.length > 0) {
                        localStorage.setItem('archerProfiles', JSON.stringify(profiles));
                    }
                } catch (error) {
                    console.error('Error loading profiles from Firebase:', error);
                }
            }
            
            // Fallback to localStorage if no Firebase profiles
            if (profiles.length === 0) {
                const savedProfiles = localStorage.getItem('archerProfiles');
                if (savedProfiles) {
                    profiles = JSON.parse(savedProfiles);
                    console.log('Profiles loaded from localStorage:', profiles);
                }
            }

            setAvailableProfiles(profiles);

            // Try to auto-select user's profile with improved logic
            let userProfile = null;
            
            // First priority: find profile tagged as "Me"
            userProfile = profiles.find(profile => profile.isMe === true);
            
            // Second priority: try to match by email
            if (!userProfile && currentUser?.email) {
                userProfile = profiles.find(profile => 
                    profile.email && profile.email.toLowerCase() === currentUser.email.toLowerCase()
                );
            }
            
            // Third priority: use the first profile (most common case)
            if (!userProfile && profiles.length > 0) {
                userProfile = profiles[0];
            }
            
            if (userProfile) {
                setMyProfile(userProfile);
                setStep(2); // Skip to teammate selection
            }

            // Load competitions - use same logic as CompetitionManagement
            let competitions = [];
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    console.log('Loading competitions from Firebase...');
                    const firebaseCompetitions = await loadCompetitionsFromFirebase(currentUser.uid);
                    console.log('Competitions loaded from Firebase:', firebaseCompetitions);
                    if (firebaseCompetitions && firebaseCompetitions.length > 0) {
                        competitions = firebaseCompetitions;
                        localStorage.setItem('oasCompetitions', JSON.stringify(firebaseCompetitions));
                    }
                } catch (error) {
                    console.error('Error loading competitions from Firebase:', error);
                }
            }
            
            // Fallback to localStorage if no Firebase competitions
            if (competitions.length === 0) {
                const savedCompetitions = localStorage.getItem('oasCompetitions');
                console.log('Raw competition localStorage data:', savedCompetitions);
                if (savedCompetitions) {
                    const parsedCompetitions = JSON.parse(savedCompetitions);
                    console.log('Competitions loaded from localStorage:', parsedCompetitions);
                    competitions = parsedCompetitions;
                } else {
                    console.log('No competitions found in localStorage');
                }
            }
            
            console.log('Final loaded competitions for round setup:', competitions);
            setCompetitions(competitions);

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSelect = (profile) => {
        setMyProfile(profile);
        setStep(2);
    };

    const handleTeammateToggle = (profile) => {
        if (profile.id === myProfile?.id) return; // Can't select yourself as teammate
        
        setSelectedTeammates(prev => {
            const isSelected = prev.find(p => p.id === profile.id);
            if (isSelected) {
                return prev.filter(p => p.id !== profile.id);
            } else {
                if (prev.length >= 7) { // Max 8 total (you + 7 teammates)
                    alert('Maximum 8 archers per bale (including yourself)');
                    return prev;
                }
                return [...prev, profile];
            }
        });
    };

    const handleStartRound = () => {
        if (!myProfile) {
            alert('Please select your profile first');
            return;
        }
        if (!isPracticeRound && !selectedCompetition) {
            alert('Please select a competition or choose Practice Round');
            return;
        }

        // Prepare team for bale setup
        const allArchers = [myProfile, ...selectedTeammates];
        const selectedComp = competitions.find(c => c.id === selectedCompetition);

        // Create proper archer objects with target assignments
        const archersWithTargets = allArchers.map((archer, index) => {
            const targets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
            const scoresObject = {};
            for (let end = 1; end <= 12; end++) {
                scoresObject[`end${end}`] = {
                    arrow1: '',
                    arrow2: '',
                    arrow3: ''
                };
            }

            return {
                ...archer,
                targetAssignment: targets[index],
                scores: scoresObject
            };
        });

        const baleData = {
            baleNumber,
            competitionId: isPracticeRound ? null : selectedCompetition,
            competitionName: isPracticeRound ? 'Practice Round' : (selectedComp?.name || 'Unknown Competition'),
            competitionType: isPracticeRound ? 'practice' : (selectedComp?.type || 'qualification'),
            isPracticeRound: isPracticeRound,
            archers: archersWithTargets,
            currentEnd: 1,
            totalEnds: 12,
            createdBy: currentUser.uid,
            createdAt: new Date(),
            status: 'active',
            myProfileId: myProfile.id // Track which profile is "mine"
        };

        console.log('Starting round with bale data:', baleData);
        onSetupComplete(baleData);
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading profiles...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">New OAS Ranking Round</h2>
                        <div className="flex items-center mt-2">
                            <div className={`w-3 h-3 rounded-full mr-2 ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <span className={`text-sm mr-4 ${step >= 1 ? 'text-blue-600' : 'text-gray-500'}`}>Select Profile</span>
                            <div className={`w-3 h-3 rounded-full mr-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <span className={`text-sm mr-4 ${step >= 2 ? 'text-blue-600' : 'text-gray-500'}`}>Choose Teammates</span>
                            <div className={`w-3 h-3 rounded-full mr-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                            <span className={`text-sm ${step >= 3 ? 'text-blue-600' : 'text-gray-500'}`}>Setup Round</span>
                        </div>
                    </div>

                </div>

                {/* Step 1: Select My Profile */}
                {step === 1 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 1: Select Your Profile</h3>
                        {availableProfiles.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600 mb-4">No profiles found. Create a profile first.</p>
                                <button
                                    onClick={() => onNavigate('profile')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                                >
                                    Create Profile
                                </button>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {availableProfiles.map(profile => (
                                    <div
                                        key={profile.id}
                                        className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => handleProfileSelect(profile)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium text-gray-900">
                                                    {profile.firstName} {profile.lastName}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {profile.role} • {profile.profileType} • {profile.defaultClassification}
                                                </p>
                                            </div>
                                            <div className="text-blue-600">
                                                →
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Select Teammates */}
                {step === 2 && myProfile && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 2: Choose Teammates (Optional)</h3>
                        
                        {/* My Profile Display */}
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                                <div>
                                    <h4 className="font-medium text-blue-900">
                                        {myProfile.firstName} {myProfile.lastName} (You)
                                    </h4>
                                    <p className="text-sm text-blue-700">
                                        {myProfile.role} • {myProfile.profileType} • {myProfile.defaultClassification}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Teammate Selection */}
                        <div className="mb-6">
                            <h4 className="font-medium text-gray-700 mb-3">
                                Available Teammates ({selectedTeammates.length}/7 selected)
                            </h4>
                            <div className="grid gap-3">
                                {availableProfiles
                                    .filter(profile => profile.id !== myProfile.id)
                                    .map(profile => {
                                        const isSelected = selectedTeammates.find(p => p.id === profile.id);
                                        return (
                                            <div
                                                key={profile.id}
                                                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                                    isSelected 
                                                        ? 'border-green-500 bg-green-50' 
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                                onClick={() => handleTeammateToggle(profile)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className={`font-medium ${isSelected ? 'text-green-900' : 'text-gray-900'}`}>
                                                            {profile.firstName} {profile.lastName}
                                                        </h4>
                                                        <p className={`text-sm ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                                                            {profile.role} • {profile.profileType} • {profile.defaultClassification}
                                                        </p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                                        isSelected 
                                                            ? 'border-green-500 bg-green-500 text-white' 
                                                            : 'border-gray-300'
                                                    }`}>
                                                        {isSelected && '✓'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setStep(1)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                Continue →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Competition & Bale Setup */}
                {step === 3 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 3: Competition & Bale Setup</h3>

                        {/* Team Summary */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-700 mb-3">
                                Team Summary ({selectedTeammates.length + 1} archers)
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <div className="p-2 bg-blue-100 rounded text-sm text-center">
                                    <div className="font-medium">{myProfile.firstName} {myProfile.lastName}</div>
                                    <div className="text-xs text-gray-600">Target A (You)</div>
                                </div>
                                {selectedTeammates.map((teammate, index) => (
                                    <div key={teammate.id} className="p-2 bg-green-100 rounded text-sm text-center">
                                        <div className="font-medium">{teammate.firstName} {teammate.lastName}</div>
                                        <div className="text-xs text-gray-600">Target {String.fromCharCode(66 + index)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Practice Round Option */}
                        <div className="mb-6">
                            <div className="flex items-center mb-3">
                                <input
                                    type="checkbox"
                                    id="practiceRound"
                                    checked={isPracticeRound}
                                    onChange={(e) => {
                                        setIsPracticeRound(e.target.checked);
                                        if (e.target.checked) {
                                            setSelectedCompetition(''); // Clear competition selection
                                        }
                                    }}
                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="practiceRound" className="ml-2 text-sm font-medium text-gray-700">
                                    This is a Practice Round (no competition)
                                </label>
                            </div>
                        </div>

                        {/* Competition Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Competition {!isPracticeRound && '*'}
                            </label>
                            <select
                                value={selectedCompetition}
                                onChange={(e) => setSelectedCompetition(e.target.value)}
                                disabled={isPracticeRound}
                                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    isPracticeRound ? 'bg-gray-100 cursor-not-allowed' : ''
                                }`}
                                required={!isPracticeRound}
                            >
                                <option value="">Choose a competition...</option>
                                {competitions.map(comp => (
                                    <option key={comp.id} value={comp.id}>
                                        {comp.name} - {comp.date} ({comp.location})
                                    </option>
                                ))}
                            </select>
                            {competitions.length === 0 && !isPracticeRound && (
                                <p className="text-sm text-gray-500 mt-1">
                                    No competitions available. 
                                    <button
                                        onClick={() => onNavigate('competitions')}
                                        className="text-blue-600 hover:underline ml-1"
                                    >
                                        Create one first
                                    </button>
                                </p>
                            )}
                            {isPracticeRound && (
                                <p className="text-sm text-green-600 mt-1">
                                    ✓ Practice rounds are stored separately from competition scores
                                </p>
                            )}
                        </div>

                        {/* Bale Number */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bale Number
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="99"
                                value={baleNumber}
                                onChange={(e) => setBaleNumber(parseInt(e.target.value) || 1)}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setStep(2)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleStartRound}
                                disabled={!isPracticeRound && !selectedCompetition}
                                className={`px-6 py-2 rounded-md font-medium text-white ${
                                    (isPracticeRound || selectedCompetition)
                                        ? 'bg-green-600 hover:bg-green-700'
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {isPracticeRound ? 'Start Practice Round →' : 'Start OAS Round →'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileRoundSetup; 