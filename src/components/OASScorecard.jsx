import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveCompletedRoundToFirebase, saveArcherRoundToProfile } from '../services/firebaseService';
import { parseScoreValue } from '../utils/scoring';

const OASScorecard = ({ baleData, archerId, onBackToScoring, onRoundCompleted }) => {
    const { currentUser } = useAuth();
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const totalEnds = 12;

    // Find the archer by ID
    const archer = baleData?.archers?.find(a => a.id === archerId);
    
    if (!archer) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Archer Not Found</h2>
                        <p className="text-gray-600 mb-4">The selected archer could not be found.</p>
                        <button
                            onClick={onBackToScoring}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            ← Back to Scoring
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const calculateEndTotal = (endScores) => {
        if (!endScores) return 0;
        const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
        return scores.reduce((total, score) => total + parseScoreValue(score), 0);
    };

    const calculateRunningTotal = (endNumber) => {
        let total = 0;
        for (let end = 1; end <= endNumber; end++) {
            const endKey = `end${end}`;
            if (archer.scores[endKey]) {
                total += calculateEndTotal(archer.scores[endKey]);
            }
        }
        return total;
    };

    const calculateTotals = () => {
        let totalScore = 0;
        let totalTens = 0;
        let totalXs = 0;
        let totalArrows = 0;

        for (let end = 1; end <= 12; end++) {
            const endKey = `end${end}`;
            const endScores = archer.scores[endKey];
            if (endScores) {
                const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
                scores.forEach(score => {
                    if (score && score !== '') {
                        totalArrows++;
                        totalScore += parseScoreValue(score);
                        if (score === 'X') {
                            totalTens++;
                            totalXs++;
                        } else if (score === '10') {
                            totalTens++;
                        }
                    }
                });
            }
        }

        return {
            totalScore,
            totalTens,
            totalXs,
            totalArrows,
            average: totalArrows > 0 ? (totalScore / totalArrows).toFixed(1) : '0.0'
        };
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

    const getAverageClass = (average) => {
        const avg = parseFloat(average);
        if (avg >= 9.0) return 'bg-yellow-400 text-black';
        if (avg >= 8.0) return 'bg-yellow-400 text-black';
        if (avg >= 7.0) return 'bg-red-600 text-white';
        if (avg >= 6.0) return 'bg-red-600 text-white';
        if (avg >= 5.0) return 'bg-blue-500 text-white';
        return 'bg-gray-300 text-black';
    };

    const totals = calculateTotals();

    const handleVerifyAndSend = async () => {
        if (!currentUser) return;
        
        setIsVerifying(true);
        try {
            // Create professional scorecard record
            const scorecardData = {
                archerName: `${archer.firstName} ${archer.lastName}`,
                archerId: archer.id,
                baleNumber: baleData.baleNumber,
                targetAssignment: archer.targetAssignment,
                division: archer.defaultClassification || 'V', // V/JV etc
                gender: archer.gender || 'M', // M/F
                competitionId: baleData.competitionId,
                competitionName: baleData.competitionName,
                roundType: 'OAS Qualification Round',
                totalEnds: 12,
                arrowsPerEnd: 3,
                ends: {},
                totals: totals,
                verifiedAt: new Date().toISOString(),
                verifiedBy: currentUser.uid
            };

            // Add all end data
            for (let end = 1; end <= 12; end++) {
                const endKey = `end${end}`;
                const endScores = archer.scores[endKey];
                if (endScores) {
                    const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
                    const endTotal = calculateEndTotal(endScores);
                    const runningTotal = calculateRunningTotal(end);
                    const endAverage = endTotal > 0 ? (runningTotal / (end * 3)).toFixed(1) : '0.0';
                    
                    let endTens = 0;
                    let endXs = 0;
                    scores.forEach(score => {
                        if (score === 'X') {
                            endTens++;
                            endXs++;
                        } else if (score === '10') {
                            endTens++;
                        }
                    });

                    scorecardData.ends[endKey] = {
                        endNumber: end,
                        arrow1: scores[0] || '',
                        arrow2: scores[1] || '',
                        arrow3: scores[2] || '',
                        tens: endTens,
                        xs: endXs,
                        endTotal: endTotal,
                        runningTotal: runningTotal,
                        average: endAverage
                    };
                }
            }

            // Save to Firebase as completed round
            await saveCompletedRoundToFirebase(scorecardData, currentUser.uid);
            
            // Save to archer's profile history
            await saveArcherRoundToProfile(archer.id, scorecardData, currentUser.uid);

            setIsVerified(true);
            
            // Notify parent component
            if (onRoundCompleted) {
                onRoundCompleted(scorecardData);
            }

            // Show success message
            alert(`Scorecard verified and saved!\n\nFinal Score: ${totals.totalScore}\n10s: ${totals.totalTens}\nXs: ${totals.totalXs}\nAverage: ${totals.average}`);

        } catch (error) {
            console.error('Error verifying scorecard:', error);
            alert('Error saving scorecard. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const isComplete = () => {
        for (let end = 1; end <= 12; end++) {
            const endKey = `end${end}`;
            const endScores = archer.scores[endKey];
            if (!endScores || !endScores.arrow1 || !endScores.arrow2 || !endScores.arrow3) {
                return false;
            }
        }
        return true;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
                {/* Header */}
                <div className="bg-blue-600 text-white p-4 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold">OAS Ranking Round</h2>
                            <p className="text-blue-100">{archer.firstName} {archer.lastName}</p>
                        </div>
                        <div className="text-right text-sm">
                            <div>Bale {baleData.baleNumber} - Target {archer.targetAssignment}</div>
                            <div>{archer.defaultClassification || 'V'} {archer.gender || 'M'}</div>
                        </div>
                    </div>
                </div>

                {/* Scorecard Table */}
                <div className="p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border-2 border-gray-400 text-sm">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-400 p-2 w-12">E</th>
                                    <th className="border border-gray-400 p-2 w-16">A1</th>
                                    <th className="border border-gray-400 p-2 w-16">A2</th>
                                    <th className="border border-gray-400 p-2 w-16">A3</th>
                                    <th className="border border-gray-400 p-2 w-16">10s</th>
                                    <th className="border border-gray-400 p-2 w-16">Xs</th>
                                    <th className="border border-gray-400 p-2 w-16">END</th>
                                    <th className="border border-gray-400 p-2 w-16">RUN</th>
                                    <th className="border border-gray-400 p-2 w-16">AVG</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: totalEnds }, (_, index) => {
                                    const endNumber = index + 1;
                                    const endKey = `end${endNumber}`;
                                    const endScores = archer.scores[endKey] || { arrow1: '', arrow2: '', arrow3: '' };
                                    const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
                                    const endTotal = calculateEndTotal(endScores);
                                    const runningTotal = calculateRunningTotal(endNumber);
                                    const average = runningTotal > 0 ? (runningTotal / (endNumber * 3)).toFixed(1) : '0.0';

                                    let endTens = 0;
                                    let endXs = 0;
                                    scores.forEach(score => {
                                        if (score === 'X') {
                                            endTens++;
                                            endXs++;
                                        } else if (score === '10') {
                                            endTens++;
                                        }
                                    });

                                    return (
                                        <tr key={endNumber}>
                                            <td className="border border-gray-400 p-2 text-center font-bold bg-gray-100">
                                                {endNumber}
                                            </td>
                                            <td className={`border border-gray-400 p-2 text-center ${getScoreClass(scores[0])}`}>
                                                {scores[0] || ''}
                                            </td>
                                            <td className={`border border-gray-400 p-2 text-center ${getScoreClass(scores[1])}`}>
                                                {scores[1] || ''}
                                            </td>
                                            <td className={`border border-gray-400 p-2 text-center ${getScoreClass(scores[2])}`}>
                                                {scores[2] || ''}
                                            </td>
                                            <td className="border border-gray-400 p-2 text-center bg-gray-50">
                                                {endTens > 0 ? endTens : '0'}
                                            </td>
                                            <td className="border border-gray-400 p-2 text-center bg-gray-50">
                                                {endXs > 0 ? endXs : '0'}
                                            </td>
                                            <td className="border border-gray-400 p-2 text-center font-bold bg-gray-100">
                                                {endTotal > 0 ? endTotal : ''}
                                            </td>
                                            <td className="border border-gray-400 p-2 text-center font-bold bg-gray-100">
                                                {runningTotal > 0 ? runningTotal : ''}
                                            </td>
                                            <td className={`border border-gray-400 p-2 text-center font-bold ${getAverageClass(average)}`}>
                                                {parseFloat(average) > 0 ? average : ''}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Round Totals */}
                    <div className="mt-4 p-4 bg-gray-100 border-2 border-gray-400 rounded">
                        <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{totals.totalScore}</div>
                                <div className="text-sm text-gray-600">Total Score</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-600">{totals.totalTens}</div>
                                <div className="text-sm text-gray-600">10s</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-800">{totals.totalXs}</div>
                                <div className="text-sm text-gray-600">Xs</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">{totals.average}</div>
                                <div className="text-sm text-gray-600">Average</div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-between items-center">
                        <button
                            onClick={onBackToScoring}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                            ← Back to Scoring
                        </button>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                            >
                                📸 Screenshot
                            </button>
                            
                            <button
                                onClick={() => {
                                    const data = JSON.stringify({
                                        archer: `${archer.firstName} ${archer.lastName}`,
                                        scores: totals,
                                        ends: archer.scores
                                    }, null, 2);
                                    const blob = new Blob([data], { type: 'application/json' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${archer.firstName}_${archer.lastName}_OAS_Round.json`;
                                    a.click();
                                }}
                                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                            >
                                📄 Export JSON
                            </button>

                            {isComplete() && !isVerified && (
                                <button
                                    onClick={handleVerifyAndSend}
                                    disabled={isVerifying}
                                    className={`px-6 py-2 rounded-md font-medium text-white ${
                                        isVerifying 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {isVerifying ? (
                                        <span className="flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Verifying...
                                        </span>
                                    ) : (
                                        'Verify & Send'
                                    )}
                                </button>
                            )}

                            {isVerified && (
                                <div className="px-6 py-2 bg-green-100 text-green-800 rounded-md border border-green-300">
                                    ✅ Verified & Saved
                                </div>
                            )}
                        </div>
                    </div>

                    {!isComplete() && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-yellow-800 text-sm">
                                ⚠️ Complete all 12 ends (36 arrows) to verify this scorecard.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OASScorecard; 