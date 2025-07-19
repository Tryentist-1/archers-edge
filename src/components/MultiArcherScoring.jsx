import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getScoreColorClass, parseScoreValue } from '../utils/scoring';
import ScoreInput from './ScoreInput';

const MultiArcherScoring = ({ baleData, onViewCard }) => {
    const { currentUser } = useAuth();
    const [currentEnd, setCurrentEnd] = useState(baleData.currentEnd || 1);
    const [archers, setArchers] = useState(baleData.archers || []);
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const totalEnds = baleData.totalEnds || 12;

    const handleScoreChange = (archerId, arrowIndex, value) => {
        setArchers(prevArchers => 
            prevArchers.map(archer => {
                if (archer.id === archerId) {
                    const newScores = [...archer.scores];
                    newScores[currentEnd - 1] = [...newScores[currentEnd - 1]];
                    newScores[currentEnd - 1][arrowIndex] = value;
                    return { ...archer, scores: newScores };
                }
                return archer;
            })
        );
    };

    const saveScores = async () => {
        if (!currentUser) return;
        
        try {
            setLoading(true);
            setSaveSuccess(false);
            
            const updatedBaleData = {
                ...baleData,
                archers,
                currentEnd,
                lastUpdated: new Date()
            };

            const userDoc = doc(db, 'users', currentUser.uid);
            await setDoc(userDoc, {
                currentBale: updatedBaleData,
                lastUpdated: new Date()
            }, { merge: true });

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving scores:', error);
        } finally {
            setLoading(false);
        }
    };

    const changeEnd = (direction) => {
        const newEnd = currentEnd + direction;
        if (newEnd >= 1 && newEnd <= totalEnds) {
            setCurrentEnd(newEnd);
        }
    };

    const calculateEndTotal = (endScores) => {
        return endScores.reduce((total, score) => total + parseScoreValue(score), 0);
    };

    const calculateRunningTotal = (archer) => {
        return archer.scores.reduce((total, end) => {
            return total + end.reduce((endTotal, score) => endTotal + parseScoreValue(score), 0);
        }, 0);
    };

    const calculateEndAverage = (endScores) => {
        const validScores = endScores.filter(score => score !== '' && score !== null);
        if (validScores.length === 0) return 0;
        const total = validScores.reduce((sum, score) => sum + parseScoreValue(score), 0);
        return (total / validScores.length).toFixed(1);
    };

    const getAverageClass = (average) => {
        const avg = parseFloat(average);
        if (avg >= 9) return 'bg-yellow-400 text-black';
        if (avg >= 7) return 'bg-red-600 text-white';
        if (avg >= 5) return 'bg-cyan-400 text-black';
        if (avg >= 3) return 'bg-gray-800 text-white';
        return 'bg-white text-black border border-gray-300';
    };

    // Auto-save when scores change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (archers.some(archer => archer.scores[currentEnd - 1].some(score => score !== ''))) {
                saveScores();
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [archers, currentEnd]);

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Bale {baleData.baleNumber} - End {currentEnd}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => changeEnd(-1)}
                            disabled={currentEnd <= 1}
                            className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
                        >
                            ← Previous End
                        </button>
                        <span className="text-lg font-medium">
                            {currentEnd} of {totalEnds}
                        </span>
                        <button
                            onClick={() => changeEnd(1)}
                            disabled={currentEnd >= totalEnds}
                            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                        >
                            Next End →
                        </button>
                    </div>
                </div>

                {/* Save Status */}
                {loading && (
                    <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-blue-700">Saving scores...</span>
                        </div>
                    </div>
                )}

                {saveSuccess && (
                    <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-green-700">Scores saved!</span>
                        </div>
                    </div>
                )}

                {/* Scoring Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-4 py-2 text-left">Archer</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">A1</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">A2</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">A3</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">10s</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">X</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">End</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">Run</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">Avg</th>
                                <th className="border border-gray-300 px-4 py-2 text-center">Card</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archers.map(archer => {
                                const endScores = archer.scores[currentEnd - 1] || ['', '', ''];
                                const endTotal = calculateEndTotal(endScores);
                                const runningTotal = calculateRunningTotal(archer);
                                const endAverage = calculateEndAverage(endScores);
                                const tens = endScores.filter(score => score === '10').length;
                                const xs = endScores.filter(score => score === 'X').length;

                                return (
                                    <tr key={archer.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-4 py-2">
                                            <div className="font-medium">
                                                {archer.firstName} {archer.lastName}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Target {archer.targetAssignment} • {archer.school}
                                            </div>
                                        </td>
                                        
                                        {/* Arrow inputs */}
                                        {[0, 1, 2].map(arrowIndex => (
                                            <td key={arrowIndex} className="border border-gray-300 px-2 py-2">
                                                <ScoreInput
                                                    value={endScores[arrowIndex] || ''}
                                                    onChange={(value) => handleScoreChange(archer.id, arrowIndex, value)}
                                                    className="w-full text-center"
                                                />
                                            </td>
                                        ))}
                                        
                                        {/* Calculated columns */}
                                        <td className="border border-gray-300 px-4 py-2 text-center font-medium">
                                            {tens + xs}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-medium">
                                            {xs}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-medium">
                                            {endTotal}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-center font-medium">
                                            {runningTotal}
                                        </td>
                                        <td className={`border border-gray-300 px-4 py-2 text-center font-medium ${getAverageClass(endAverage)}`}>
                                            {endAverage}
                                        </td>
                                        <td className="border border-gray-300 px-4 py-2 text-center">
                                            <button
                                                onClick={() => onViewCard(archer.id)}
                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Bale Totals */}
                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-semibold text-gray-800 mb-2">Bale Totals:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="font-medium">Total Archers:</span> {archers.length}
                        </div>
                        <div>
                            <span className="font-medium">Current End:</span> {currentEnd}
                        </div>
                        <div>
                            <span className="font-medium">Total Ends:</span> {totalEnds}
                        </div>
                        <div>
                            <span className="font-medium">Bale Number:</span> {baleData.baleNumber}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiArcherScoring; 