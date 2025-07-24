import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    loadCompletedRoundsFromFirebase,
    loadAllUserScores,
    shouldUseFirebase,
    findMyArcherProfile,
    loadMyScores
} from '../services/firebaseService';

const ScoreHistory = ({ onNavigate }) => {
    const { currentUser } = useAuth();
    const [completedRounds, setCompletedRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRound, setSelectedRound] = useState(null);
    const [showDetail, setShowDetail] = useState(false);
    const [myProfile, setMyProfile] = useState(null);
    const [showMyScoresOnly, setShowMyScoresOnly] = useState(false);

    useEffect(() => {
        loadCompletedRounds();
        loadMyProfile();
    }, [currentUser]);

    const loadMyProfile = async () => {
        try {
            const profile = await findMyArcherProfile(currentUser?.uid, currentUser?.email);
            setMyProfile(profile);
        } catch (error) {
            console.error('Error loading my profile:', error);
        }
    };

    const loadCompletedRounds = async () => {
        try {
            setLoading(true);
            console.log('Loading completed rounds...');
            console.log('Current user:', currentUser);
            console.log('Should use Firebase:', shouldUseFirebase(currentUser?.uid));

            let loadedRounds = [];
            
            // Use same loading logic as other components
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    console.log('Attempting to load from Firebase...');
                    const firebaseRounds = await loadAllUserScores(currentUser.uid);
                    console.log('All scores loaded from Firebase:', firebaseRounds);
                    if (firebaseRounds && firebaseRounds.length > 0) {
                        loadedRounds = firebaseRounds;
                        localStorage.setItem('completedRounds', JSON.stringify(firebaseRounds));
                    }
                } catch (error) {
                    console.error('Error loading from Firebase, falling back to local:', error);
                }
            } else {
                console.log('Skipping Firebase load - offline, no user, or mock user');
            }
            
            // Fallback to local storage if no Firebase data
            if (loadedRounds.length === 0) {
                const savedRounds = localStorage.getItem('completedRounds');
                console.log('Raw localStorage data:', savedRounds);
                if (savedRounds) {
                    const parsedRounds = JSON.parse(savedRounds);
                    console.log('Rounds loaded from localStorage:', parsedRounds);
                    loadedRounds = parsedRounds;
                } else {
                    console.log('No completed rounds found in localStorage');
                }
            }
            
            console.log('Final loaded rounds for score history:', loadedRounds);
            setCompletedRounds(loadedRounds);
        } catch (error) {
            console.error('Error loading completed rounds:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            return 'Unknown date';
        }
    };

    const getScoreClass = (score) => {
        if (!score || score === '') return 'bg-white border border-gray-300';
        if (score === 'X') return 'bg-yellow-400 text-black font-bold';
        if (score === '10') return 'bg-yellow-400 text-black font-bold';
        if (score === '9') return 'bg-yellow-400 text-black';
        if (score === '8') return 'bg-red-600 text-white';
        if (score === '7') return 'bg-red-600 text-white';
        if (score === '6') return 'bg-blue-500 text-white';
        if (score === '5') return 'bg-blue-500 text-white';
        if (score === 'M' || score === '0') return 'bg-white border border-gray-300 text-gray-500';
        return 'bg-white border border-gray-300';
    };

    // Filter rounds based on "My Scores" toggle
    const filteredRounds = showMyScoresOnly && myProfile 
        ? completedRounds.filter(round => round.archerId === myProfile.id)
        : completedRounds;

    if (showDetail && selectedRound) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Scorecard Detail</h1>
                            <p className="text-sm text-gray-600">Detailed view of completed round</p>
                        </div>
                        <button
                            onClick={() => setShowDetail(false)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            ← Back to History
                        </button>
                    </div>
                </div>

                {/* Scorecard Detail */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {/* Round Info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <div className="text-sm text-gray-600">Competition</div>
                                <div className="font-medium">
                                    {selectedRound.isPracticeRound ? (
                                        <span className="text-green-600 font-medium">Practice Round</span>
                                    ) : (
                                        selectedRound.competitionName
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Bale</div>
                                <div className="font-medium">Bale {selectedRound.baleNumber} - Target {selectedRound.targetAssignment}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Division</div>
                                <div className="font-medium">{selectedRound.division} {selectedRound.gender}</div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-600">Round Type</div>
                                <div className="font-medium">
                                    {selectedRound.isPracticeRound ? 'Practice' : (selectedRound.roundType || 'OAS')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scorecard Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-400">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-400 p-2 text-center font-bold">End</th>
                                    <th className="border border-gray-400 p-2 text-center font-bold">Arrow 1</th>
                                    <th className="border border-gray-400 p-2 text-center font-bold">Arrow 2</th>
                                    <th className="border border-gray-400 p-2 text-center font-bold">Arrow 3</th>
                                    <th className="border border-gray-400 p-2 text-center font-bold">10s</th>
                                    <th className="border border-gray-400 p-2 text-center font-bold">Xs</th>
                                    <th className="border border-gray-400 p-2 text-center font-bold">End Total</th>
                                    <th className="border border-gray-400 p-2 text-center font-bold">Running Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(selectedRound.ends || {}).sort().map(endKey => {
                                    const endData = selectedRound.ends[endKey];
                                    return (
                                        <tr key={endKey}>
                                            <td className="border border-gray-400 p-2 text-center font-bold bg-gray-100">
                                                {endData.endNumber}
                                            </td>
                                            <td className={`border border-gray-400 p-2 text-center ${getScoreClass(endData.arrow1)}`}>
                                                {endData.arrow1}
                                            </td>
                                            <td className={`border border-gray-400 p-2 text-center ${getScoreClass(endData.arrow2)}`}>
                                                {endData.arrow2}
                                            </td>
                                            <td className={`border border-gray-400 p-2 text-center ${getScoreClass(endData.arrow3)}`}>
                                                {endData.arrow3}
                                            </td>
                                            <td className="border border-gray-400 p-2 text-center bg-gray-50">
                                                {endData.tens}
                                            </td>
                                            <td className="border border-gray-400 p-2 text-center bg-gray-50">
                                                {endData.xs}
                                            </td>
                                            <td className="border border-gray-400 p-2 text-center font-bold bg-gray-100">
                                                {endData.endTotal}
                                            </td>
                                            <td className="border border-gray-400 p-2 text-center font-bold bg-gray-100">
                                                {endData.runningTotal}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{selectedRound.totals?.totalScore || 0}</div>
                                <div className="text-sm text-gray-600">Total Score</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-600">{selectedRound.totals?.totalTens || 0}</div>
                                <div className="text-sm text-gray-600">10s</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-800">{selectedRound.totals?.totalXs || 0}</div>
                                <div className="text-sm text-gray-600">Xs</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">{selectedRound.totals?.average || '0.0'}</div>
                                <div className="text-sm text-gray-600">Average</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // History list view
    return (
        <div className="min-h-screen bg-gray-50 p-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Score History</h1>
                        <p className="text-sm text-gray-600">View all completed rounds and statistics</p>
                    </div>
                    <button
                        onClick={() => onNavigate('home')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        ← Home
                    </button>
                </div>
            </div>

            {/* My Scores Filter */}
            {myProfile && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">My Profile: {myProfile.firstName} {myProfile.lastName}</h2>
                            <p className="text-sm text-gray-600">{myProfile.division} • {myProfile.bowType}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={showMyScoresOnly}
                                    onChange={(e) => setShowMyScoresOnly(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Show My Scores Only</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Rounds List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading score history...</p>
                        </div>
                    </div>
                ) : filteredRounds.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <div className="text-center">
                            <p className="text-gray-500 text-lg mb-2">No completed rounds found</p>
                            <p className="text-gray-400 text-sm">
                                {showMyScoresOnly ? "You haven't completed any rounds yet." : "No rounds have been completed yet."}
                            </p>
                        </div>
                    </div>
                ) : (
                    filteredRounds.map((round, index) => (
                        <div
                            key={round.id || index}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => {
                                setSelectedRound(round);
                                setShowDetail(true);
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            {round.archerName || 'Unknown Archer'}
                                        </h3>
                                        {myProfile && round.archerId === myProfile.id && (
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                                Me
                                            </span>
                                        )}
                                        {round.isPracticeRound && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                                Practice
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                        <div>
                                            <span className="font-medium">Competition:</span> 
                                            {round.isPracticeRound ? (
                                                <span className="text-green-600 font-medium">Practice Round</span>
                                            ) : (
                                                round.competitionName
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-medium">Date:</span> {formatDate(round.completedAt)}
                                        </div>
                                        <div>
                                            <span className="font-medium">Bale:</span> {round.baleNumber} - Target {round.targetAssignment}
                                        </div>
                                        <div>
                                            <span className="font-medium">Division:</span> {round.division} {round.gender}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 text-right">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {round.totals?.totalScore || 0}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {round.totals?.totalTens || 0} 10s • {round.totals?.totalXs || 0} Xs
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Avg: {round.totals?.average || '0.0'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ScoreHistory; 