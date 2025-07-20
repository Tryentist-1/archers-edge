import React from 'react';
import { getScoreColorClass, parseScoreValue } from '../utils/scoring';

const ArcherScorecard = ({ baleData, archerId, onBackToScoring }) => {
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
        
        // Handle both array format ['', '', ''] and object format { arrow1: '', arrow2: '', arrow3: '' }
        let scores;
        if (Array.isArray(endScores)) {
            scores = endScores;
        } else {
            scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
        }
        
        return scores.reduce((total, score) => total + parseScoreValue(score), 0);
    };

    const calculateRunningTotal = (archer) => {
        let total = 0;
        for (let end = 1; end <= 12; end++) {
            const endKey = `end${end}`;
            if (archer.scores[endKey]) {
                total += calculateEndTotal(archer.scores[endKey]);
            }
        }
        return total;
    };

    const calculateEndAverage = (endScores) => {
        if (!endScores) return 0;
        
        // Handle both array format ['', '', ''] and object format { arrow1: '', arrow2: '', arrow3: '' }
        let scores;
        if (Array.isArray(endScores)) {
            scores = endScores;
        } else {
            scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
        }
        
        const validScores = scores.filter(score => score !== '' && score !== null);
        if (validScores.length === 0) return 0;
        const total = validScores.reduce((sum, score) => sum + parseScoreValue(score), 0);
        return (total / validScores.length).toFixed(1);
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
        if (avg >= 9) return 'bg-yellow-400 text-black';
        if (avg >= 7) return 'bg-red-600 text-white';
        if (avg >= 5) return 'bg-cyan-400 text-black';
        if (avg >= 3) return 'bg-gray-800 text-white';
        return 'bg-white text-black border border-gray-300';
    };

    const calculateTotals = () => {
        let totalTens = 0;
        let totalXs = 0;
        let totalScore = 0;
        let totalArrows = 0;

        for (let end = 1; end <= 12; end++) {
            const endKey = `end${end}`;
            const endScores = archer.scores[endKey];
            if (endScores) {
                // Handle both array format ['', '', ''] and object format { arrow1: '', arrow2: '', arrow3: '' }
                let scores;
                if (Array.isArray(endScores)) {
                    scores = endScores;
                } else {
                    scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
                }
                
                scores.forEach(score => {
                    if (score) {
                        totalArrows++;
                        if (score === '10') totalTens++;
                        if (score === 'X') totalXs++;
                        totalScore += parseScoreValue(score);
                    }
                });
            }
        }

        return {
            totalTens,
            totalXs,
            totalScore,
            totalArrows,
            average: totalArrows > 0 ? (totalScore / totalArrows).toFixed(1) : '0.0'
        };
    };

    const totals = calculateTotals();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {archer.firstName} {archer.lastName}
                            </h2>
                            <p className="text-sm text-gray-600">
                                {archer.class} - {archer.target}
                            </p>
                        </div>
                        <button
                            onClick={onBackToScoring}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Scorecard Content */}
                <div className="p-4">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{totals.totalScore}</div>
                            <div className="text-xs text-gray-600">Total Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{totals.totalArrows}</div>
                            <div className="text-xs text-gray-600">Arrows Shot</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{totals.totalTens + totals.totalXs}</div>
                            <div className="text-xs text-gray-600">10s + Xs</div>
                        </div>
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${getAverageClass(totals.average)}`}>
                                {totals.average}
                            </div>
                            <div className="text-xs text-gray-600">Average</div>
                        </div>
                    </div>

                    {/* Detailed Scorecard */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-300 text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-2 py-2 text-center text-xs text-gray-900">End</th>
                                    <th className="border border-gray-300 px-2 py-2 text-center text-xs text-gray-900">A1</th>
                                    <th className="border border-gray-300 px-2 py-2 text-center text-xs text-gray-900">A2</th>
                                    <th className="border border-gray-300 px-2 py-2 text-center text-xs text-gray-900">A3</th>
                                    <th className="border border-gray-300 px-2 py-2 text-center text-xs text-gray-900">End Total</th>
                                    <th className="border border-gray-300 px-2 py-2 text-center text-xs text-gray-900">Running Total</th>
                                    <th className="border border-gray-300 px-2 py-2 text-center text-xs text-gray-900">End Avg</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.from({ length: totalEnds }, (_, index) => {
                                    const endNumber = index + 1;
                                    const endKey = `end${endNumber}`;
                                    const endScores = archer.scores[endKey] || { arrow1: '', arrow2: '', arrow3: '' };
                                    const endTotal = calculateEndTotal(endScores);
                                    const runningTotal = calculateRunningTotal(archer);
                                    const endAverage = calculateEndAverage(endScores);

                                    // Handle both array format ['', '', ''] and object format { arrow1: '', arrow2: '', arrow3: '' }
                                    let scores;
                                    if (Array.isArray(endScores)) {
                                        scores = endScores;
                                    } else {
                                        scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
                                    }

                                    return (
                                        <tr key={endNumber} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-2 py-2 text-center font-medium text-xs">
                                                {endNumber}
                                            </td>
                                            {scores.map((score, arrowIndex) => (
                                                <td key={arrowIndex} className={`border border-gray-300 px-2 py-2 text-center font-medium text-xs ${getScoreClass(score)}`}>
                                                    {score}
                                                </td>
                                            ))}
                                            <td className="border border-gray-300 px-2 py-2 text-center font-medium text-xs">
                                                {endTotal}
                                            </td>
                                            <td className="border border-gray-300 px-2 py-2 text-center font-medium text-xs">
                                                {runningTotal}
                                            </td>
                                            <td className={`border border-gray-300 px-2 py-2 text-center font-medium text-xs ${getAverageClass(endAverage)}`}>
                                                {endAverage}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Stats */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                        <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{totals.totalXs}</div>
                            <div className="text-xs text-gray-600">X Count</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{totals.totalTens}</div>
                            <div className="text-xs text-gray-600">10 Count</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                                {totals.totalArrows > 0 ? ((totals.totalXs / totals.totalArrows) * 100).toFixed(1) : '0'}%
                            </div>
                            <div className="text-xs text-gray-600">X Percentage</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">
                                {totals.totalArrows > 0 ? (((totals.totalTens + totals.totalXs) / totals.totalArrows) * 100).toFixed(1) : '0'}%
                            </div>
                            <div className="text-xs text-gray-600">10+X Percentage</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArcherScorecard; 