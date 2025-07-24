import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveCompetitionScore, saveArcherRoundToProfile } from '../services/firebaseService';
import { parseScoreValue } from '../utils/scoring';
import { hideKeypad } from './ScoreInputWithKeypad.jsx';

const ScorecardVerificationFlow = ({ baleData, onVerificationComplete, onNavigate }) => {
    const { currentUser } = useAuth();
    const [currentArcherIndex, setCurrentArcherIndex] = useState(0);
    const [verifiedArchers, setVerifiedArchers] = useState(new Set());
    const [isVerifying, setIsVerifying] = useState(false);
    const [completedArchers, setCompletedArchers] = useState([]);

    const archers = baleData?.archers || [];
    const currentArcher = archers[currentArcherIndex];
    const totalArchers = archers.length;
    const isLastArcher = currentArcherIndex === totalArchers - 1;

    // Hide keypad when verification flow opens
    useEffect(() => {
        hideKeypad();
    }, []);

    const calculateEndTotal = (endScores) => {
        if (!endScores) return 0;
        const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
        return scores.reduce((total, score) => total + parseScoreValue(score), 0);
    };

    const calculateRunningTotal = (archer, endNumber) => {
        let total = 0;
        for (let end = 1; end <= endNumber; end++) {
            const endKey = `end${end}`;
            if (archer.scores[endKey]) {
                total += calculateEndTotal(archer.scores[endKey]);
            }
        }
        return total;
    };

    const calculateTotals = (archer) => {
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

    const isArcherComplete = (archer) => {
        for (let end = 1; end <= 12; end++) {
            const endKey = `end${end}`;
            const endScores = archer.scores[endKey];
            if (!endScores || !endScores.arrow1 || !endScores.arrow2 || !endScores.arrow3) {
                return false;
            }
        }
        return true;
    };

    const handleConfirmWithPaper = async () => {
        if (!currentUser || !currentArcher) return;
        
        setIsVerifying(true);
        try {
            const totals = calculateTotals(currentArcher);
            
            // Create professional scorecard record
            const scorecardData = {
                archerName: `${currentArcher.firstName} ${currentArcher.lastName}`,
                archerId: currentArcher.id,
                baleNumber: baleData.baleNumber,
                targetAssignment: currentArcher.targetAssignment,
                division: currentArcher.division || currentArcher.defaultClassification || 'V',
                gender: currentArcher.gender || 'M',
                competitionId: baleData.competitionId,
                competitionName: baleData.competitionName,
                roundType: 'OAS Qualification Round',
                totalEnds: 12,
                arrowsPerEnd: 3,
                ends: {},
                totals: totals,
                verifiedAt: new Date().toISOString(),
                verifiedBy: currentUser.uid,
                paperConfirmed: true // Mark as paper-confirmed
            };

            // Add all end data
            for (let end = 1; end <= 12; end++) {
                const endKey = `end${end}`;
                const endScores = currentArcher.scores[endKey];
                if (endScores) {
                    const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
                    const endTotal = calculateEndTotal(endScores);
                    const runningTotal = calculateRunningTotal(currentArcher, end);
                    const endAverage = runningTotal > 0 ? (runningTotal / (end * 3)).toFixed(1) : '0.0';
                    
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

            // Save to Firebase as competition score (tied to archer profile and event)
            await saveCompetitionScore(scorecardData, currentUser.uid);

            // Mark this archer as verified
            setVerifiedArchers(prev => new Set([...prev, currentArcher.id]));
            setCompletedArchers(prev => [...prev, scorecardData]);

            // Move to next archer or complete verification
            if (isLastArcher) {
                // All archers verified - redirect to Scores page
                setTimeout(() => {
                    onVerificationComplete?.(completedArchers);
                    onNavigate('scores'); // Navigate to Scores page
                }, 1000);
            } else {
                // Move to next archer
                setTimeout(() => {
                    setCurrentArcherIndex(prev => prev + 1);
                }, 1000);
            }

        } catch (error) {
            console.error('Error confirming scorecard with paper:', error);
            alert('Error saving scorecard. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handlePreviousArcher = () => {
        if (currentArcherIndex > 0) {
            setCurrentArcherIndex(currentArcherIndex - 1);
        }
    };

    const handleNextArcher = () => {
        if (currentArcherIndex < totalArchers - 1) {
            setCurrentArcherIndex(currentArcherIndex + 1);
        }
    };

    const getScoreClass = (score) => {
        if (score === 'X') return 'bg-yellow-400 text-black font-bold';
        if (score === '10') return 'bg-yellow-400 text-black';
        if (score === '9') return 'bg-red-600 text-white';
        if (score === '8') return 'bg-red-600 text-white';
        if (score === '7') return 'bg-red-600 text-white';
        if (score === '6') return 'bg-cyan-400 text-black';
        if (score === '5') return 'bg-cyan-400 text-black';
        if (score === '4') return 'bg-cyan-400 text-black';
        if (score === '3') return 'bg-gray-800 text-white';
        if (score === '2') return 'bg-gray-800 text-white';
        if (score === '1') return 'bg-gray-800 text-white';
        return 'bg-white text-black border border-gray-300';
    };

    const getAverageClass = (average) => {
        const avg = parseFloat(average);
        if (isNaN(avg) || avg === 0) return 'bg-gray-300 text-black';
        if (avg >= 9.0) return 'bg-yellow-400 text-black';
        if (avg >= 8.0) return 'bg-yellow-400 text-black';
        if (avg >= 7.0) return 'bg-red-600 text-white';
        if (avg >= 6.0) return 'bg-red-600 text-white';
        if (avg >= 5.0) return 'bg-blue-500 text-white';
        return 'bg-gray-300 text-black';
    };

    if (!currentArcher) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">No Archers Found</h2>
                        <p className="text-gray-600 mb-4">No archers available for verification.</p>
                    </div>
                </div>
            </div>
        );
    }

    const totals = calculateTotals(currentArcher);
    const isComplete = isArcherComplete(currentArcher);
    const isVerified = verifiedArchers.has(currentArcher.id);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
            onClick={() => hideKeypad()}
        >
            <div 
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-lg">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                Scorecard Verification
                            </h2>
                            <p className="text-gray-600">
                                Archer {currentArcherIndex + 1} of {totalArchers}: {currentArcher.firstName} {currentArcher.lastName}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-500">Bale {baleData.baleNumber}</div>
                            <div className="text-sm text-gray-500">Target {currentArcher.targetAssignment}</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentArcherIndex + (isVerified ? 1 : 0)) / totalArchers) * 100}%` }}
                        ></div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handlePreviousArcher}
                            disabled={currentArcherIndex === 0}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Previous
                        </button>
                        
                        <div className="text-sm text-gray-600">
                            {verifiedArchers.size} of {totalArchers} verified
                        </div>
                        
                        <button
                            onClick={handleNextArcher}
                            disabled={currentArcherIndex === totalArchers - 1}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next →
                        </button>
                    </div>
                </div>

                {/* Scorecard Content */}
                <div className="p-6">
                    <div className="bg-white border border-gray-300 p-4">
                        {/* Archer Info Header */}
                        <div className="text-center border-b-2 border-black pb-2 mb-4">
                            <h3 className="text-xl font-bold">OAS QUALIFICATION ROUND</h3>
                            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                                <div><strong>Archer:</strong> {currentArcher.firstName} {currentArcher.lastName}</div>
                                <div><strong>Bale:</strong> {baleData.baleNumber}</div>
                                <div><strong>Target:</strong> {currentArcher.targetAssignment}</div>
                            </div>
                        </div>

                        {/* Scorecard Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-black text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-black p-1 w-12">E</th>
                                        <th className="border border-black p-1 w-12">A1</th>
                                        <th className="border border-black p-1 w-12">A2</th>
                                        <th className="border border-black p-1 w-12">A3</th>
                                        <th className="border border-black p-1 w-12">10s</th>
                                        <th className="border border-black p-1 w-12">Xs</th>
                                        <th className="border border-black p-1 w-16">END</th>
                                        <th className="border border-black p-1 w-16">RUN</th>
                                        <th className="border border-black p-1 w-16">AVG</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const endNumber = i + 1;
                                        const endKey = `end${endNumber}`;
                                        const endScores = currentArcher.scores[endKey];
                                        const scores = endScores ? [endScores.arrow1, endScores.arrow2, endScores.arrow3] : ['', '', ''];
                                        const endTotal = calculateEndTotal(endScores);
                                        const runningTotal = calculateRunningTotal(currentArcher, endNumber);
                                        
                                        // Calculate 10s and Xs for this end
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

                                        // Calculate average up to this end
                                        const arrowsUpToThisEnd = endNumber * 3;
                                        const averageUpToThisEnd = runningTotal > 0 && arrowsUpToThisEnd > 0 
                                            ? (runningTotal / arrowsUpToThisEnd).toFixed(1) 
                                            : '0.0';

                                        return (
                                            <tr key={endNumber}>
                                                <td className="border border-black p-1 text-center font-medium text-xs">
                                                    {endNumber}
                                                </td>
                                                {scores.map((score, scoreIndex) => (
                                                    <td key={scoreIndex} className="border border-black p-1 text-center">
                                                        <span className={`inline-block w-6 h-6 leading-6 rounded text-center text-xs ${getScoreClass(score)}`}>
                                                            {score || ''}
                                                        </span>
                                                    </td>
                                                ))}
                                                <td className="border border-black p-1 text-center font-medium text-xs">
                                                    {endTens || ''}
                                                </td>
                                                <td className="border border-black p-1 text-center font-medium text-xs">
                                                    {endXs || ''}
                                                </td>
                                                <td className="border border-black p-1 text-center font-medium text-xs">
                                                    {endTotal || ''}
                                                </td>
                                                <td className="border border-black p-1 text-center font-medium text-xs">
                                                    {runningTotal || ''}
                                                </td>
                                                <td className="border border-black p-1 text-center text-xs">
                                                    <span className={`inline-block w-full h-6 leading-6 text-center font-medium ${getAverageClass(averageUpToThisEnd)}`}>
                                                        {averageUpToThisEnd}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="mt-4 grid grid-cols-4 gap-4 p-4 bg-gray-50 border border-gray-300">
                            <div className="text-center">
                                <div className="text-lg font-bold">{totals.totalScore}</div>
                                <div className="text-sm text-gray-600">Total Score</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold">{totals.totalTens}</div>
                                <div className="text-sm text-gray-600">10s</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold">{totals.totalXs}</div>
                                <div className="text-sm text-gray-600">Xs</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold">{totals.average}</div>
                                <div className="text-sm text-gray-600">Average</div>
                            </div>
                        </div>
                    </div>

                    {/* Verification Status */}
                    {isVerified && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-center">
                                <div className="text-green-800 font-medium">
                                    ✅ Scorecard Confirmed with Paper Scoring
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-center">
                        {!isComplete && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-yellow-800 text-sm">
                                    ⚠️ Complete all 12 ends (36 arrows) to verify this scorecard.
                                </p>
                            </div>
                        )}

                        {isComplete && !isVerified && (
                            <button
                                onClick={handleConfirmWithPaper}
                                disabled={isVerifying}
                                className={`px-8 py-3 rounded-md font-medium text-white text-lg ${
                                    isVerifying 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-green-600 hover:bg-green-700'
                                }`}
                            >
                                {isVerifying ? (
                                    <span className="flex items-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Confirming...
                                    </span>
                                ) : (
                                    '📋 Confirm with Paper Scoring'
                                )}
                            </button>
                        )}

                        {isVerified && isLastArcher && (
                            <div className="text-center">
                                <div className="px-8 py-3 bg-blue-50 text-blue-800 rounded-md border border-blue-200 text-lg font-medium">
                                    🎉 All Scorecards Verified! Redirecting to Scores...
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScorecardVerificationFlow; 