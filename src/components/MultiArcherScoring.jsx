import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getScoreColorClass, parseScoreValue } from '../utils/scoring';
import ScoreInput from './ScoreInput.jsx';
import ScoreInputWithKeypad from './ScoreInputWithKeypad.jsx';

const MultiArcherScoring = ({ baleData, onViewCard }) => {
    const { currentUser } = useAuth();
    const [archers, setArchers] = useState(baleData.archers || []);
    const [currentEnd, setCurrentEnd] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    // Detect mobile and default to keypad
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const [useKeypad, setUseKeypad] = useState(isMobile);
    
    const totalEnds = 12;

    const handleScoreChange = (archerId, arrowIndex, value) => {
        setArchers(prevArchers => 
            prevArchers.map(archer => {
                if (archer.id === archerId) {
                    const newScores = { ...archer.scores };
                    const endKey = `end${currentEnd}`;
                    const arrowKey = `arrow${arrowIndex + 1}`;
                    
                    if (!newScores[endKey]) {
                        newScores[endKey] = { arrow1: '', arrow2: '', arrow3: '' };
                    }
                    
                    newScores[endKey] = {
                        ...newScores[endKey],
                        [arrowKey]: value
                    };
                    
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
        if (!endScores) return 0;
        const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
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
        const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
        const validScores = scores.filter(score => score !== '' && score !== null);
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
            const endKey = `end${currentEnd}`;
            const hasScores = archers.some(archer => {
                const endScores = archer.scores[endKey];
                return endScores && (endScores.arrow1 || endScores.arrow2 || endScores.arrow3);
            });
            
            if (hasScores) {
                saveScores();
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [archers, currentEnd]);

    return (
        <div className="max-w-full mx-auto p-2">
            <div className="bg-white rounded-lg shadow-lg p-3">
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold text-gray-800">
                        Bale {baleData.baleNumber} - End {currentEnd}
                    </h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => changeEnd(-1)}
                            disabled={currentEnd <= 1}
                            className="px-2 py-1 bg-gray-500 text-white rounded text-sm disabled:opacity-50"
                        >
                            ←
                        </button>
                        <span className="text-sm font-medium">
                            {currentEnd}/{totalEnds}
                        </span>
                        <button
                            onClick={() => changeEnd(1)}
                            disabled={currentEnd >= totalEnds}
                            className="px-2 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
                        >
                            →
                        </button>
                    </div>
                </div>

                {/* Input Mode Toggle */}
                <div className="mb-3 flex justify-center">
                    <div className="bg-gray-100 rounded-lg p-1 flex">
                        <button
                            onClick={() => setUseKeypad(false)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                !useKeypad 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Keyboard
                        </button>
                        <button
                            onClick={() => setUseKeypad(true)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                useKeypad 
                                    ? 'bg-white text-gray-900 shadow-sm' 
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Keypad
                        </button>
                    </div>
                </div>

                {/* Save Status - Fixed position */}
                {loading && (
                    <div className="fixed top-4 right-4 p-2 bg-blue-50 border border-blue-200 rounded-md shadow-lg z-40">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                            <span className="text-xs text-blue-700">Saving...</span>
                        </div>
                    </div>
                )}

                {saveSuccess && (
                    <div className="fixed top-4 right-4 p-2 bg-green-50 border border-green-200 rounded-md shadow-lg z-40">
                        <div className="flex items-center justify-center space-x-2">
                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs text-green-700">Saved!</span>
                        </div>
                    </div>
                )}

                {/* Scoring Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-1 py-1 text-left text-xs text-gray-900">Archer</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900">A1</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900">A2</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900">A3</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900">10s</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900">X</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900">End</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900">Run</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900">Avg</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900">Card</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archers.map(archer => {
                                const endKey = `end${currentEnd}`;
                                const endScores = archer.scores[endKey] || { arrow1: '', arrow2: '', arrow3: '' };
                                const endTotal = calculateEndTotal(endScores);
                                const runningTotal = calculateRunningTotal(archer);
                                const endAverage = calculateEndAverage(endScores);
                                const tens = [endScores.arrow1, endScores.arrow2, endScores.arrow3].filter(score => score === '10').length;
                                const xs = [endScores.arrow1, endScores.arrow2, endScores.arrow3].filter(score => score === 'X').length;

                                // Shortened archer name: First Name + Last Initial
                                const shortName = `${archer.firstName} ${archer.lastName.charAt(0)}.`;

                                return (
                                    <tr key={archer.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-1 py-1">
                                            <div className="font-medium text-xs text-gray-900 text-left">
                                                {shortName}
                                            </div>
                                        </td>
                                        
                                        {/* Arrow inputs */}
                                        {[0, 1, 2].map(arrowIndex => (
                                            <td key={arrowIndex} className="border border-gray-300 p-0">
                                                {useKeypad ? (
                                                    <ScoreInputWithKeypad
                                                        value={endScores[`arrow${arrowIndex + 1}`] || ''}
                                                        onChange={(value) => handleScoreChange(archer.id, arrowIndex, value)}
                                                    />
                                                ) : (
                                                    <ScoreInput
                                                        value={endScores[`arrow${arrowIndex + 1}`] || ''}
                                                        onChange={(value) => handleScoreChange(archer.id, arrowIndex, value)}
                                                    />
                                                )}
                                            </td>
                                        ))}
                                        
                                        {/* Calculated columns */}
                                        <td className="border border-gray-300 px-1 py-1 text-center font-medium text-xs">
                                            {tens + xs}
                                        </td>
                                        <td className="border border-gray-300 px-1 py-1 text-center font-medium text-xs">
                                            {xs}
                                        </td>
                                        <td className="border border-gray-300 px-1 py-1 text-center font-medium text-xs">
                                            {endTotal}
                                        </td>
                                        <td className="border border-gray-300 px-1 py-1 text-center font-medium text-xs">
                                            {runningTotal}
                                        </td>
                                        <td className={`border border-gray-300 px-1 py-1 text-center font-medium text-xs ${getAverageClass(endAverage)}`}>
                                            {endAverage}
                                        </td>
                                        <td className="border border-gray-300 px-1 py-1 text-center">
                                            <button
                                                onClick={() => onViewCard(archer.id)}
                                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
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
                <div className="mt-3 p-2 bg-gray-50 rounded-md">
                    <h3 className="font-semibold text-gray-800 mb-1 text-sm">Bale Totals:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                            <span className="font-medium">Archers:</span> {archers.length}
                        </div>
                        <div>
                            <span className="font-medium">End:</span> {currentEnd}
                        </div>
                        <div>
                            <span className="font-medium">Total:</span> {totalEnds}
                        </div>
                        <div>
                            <span className="font-medium">Bale:</span> {baleData.baleNumber}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiArcherScoring; 