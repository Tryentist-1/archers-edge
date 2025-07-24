import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getScoreColorClass, parseScoreValue } from '../utils/scoring';
import { LocalStorage } from '../utils/localStorage';
import { saveCompletedRoundToFirebase, saveArcherRoundToProfile } from '../services/firebaseService';
import ScoreInput from './ScoreInput.jsx';
import ScoreInputWithKeypad from './ScoreInputWithKeypad.jsx';
import ScorecardVerificationFlow from './ScorecardVerificationFlow.jsx';

const MultiArcherScoring = ({ baleData, onViewCard, onBaleDataUpdate, onNavigate }) => {
    const { currentUser } = useAuth();
    const [archers, setArchers] = useState(baleData.archers || []);
    const [currentEnd, setCurrentEnd] = useState(baleData.currentEnd || 1);
    const [loading, setLoading] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showVerificationFlow, setShowVerificationFlow] = useState(false);
    
    // Default to keypad only
    const [useKeypad, setUseKeypad] = useState(true);
    
    const totalEnds = 12;

    // Debug logging
    console.log('MultiArcherScoring received baleData:', baleData);
    console.log('MultiArcherScoring currentEnd:', currentEnd);
    console.log('MultiArcherScoring baleData.currentEnd:', baleData.currentEnd);

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

    const handleNextEndWithSave = async () => {
        if (hasUnsavedChanges) {
            await saveScores();
            setHasUnsavedChanges(false);
        }
        changeEnd(1);
    };

    const saveScores = async () => {
        if (!currentUser || loading) return;
        
        setLoading(true);
        try {
            const updatedBaleData = {
                ...baleData,
                archers,
                currentEnd, // Always save current end
                lastUpdated: new Date()
            };

            // Save to Firebase
            const userDoc = doc(db, 'users', currentUser.uid);
            await setDoc(userDoc, {
                currentBale: updatedBaleData,
                lastUpdated: new Date()
            }, { merge: true });

            // Also save to local storage as backup
            LocalStorage.saveBaleData(updatedBaleData);

            setSaveSuccess(true);
            
            // Update the parent component with the new bale data
            if (onBaleDataUpdate) {
                onBaleDataUpdate(updatedBaleData);
            }
            
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving scores:', error);
            // If Firebase fails, still save to local storage
            const updatedBaleData = {
                ...baleData,
                archers,
                currentEnd, // Always save current end
                lastUpdated: new Date()
            };
            LocalStorage.saveBaleData(updatedBaleData);
            console.log('Saved to local storage as backup');
        } finally {
            setLoading(false);
        }
    };

    const changeEnd = (direction) => {
        const newEnd = currentEnd + direction;
        if (newEnd >= 1 && newEnd <= totalEnds) {
            // Dispatch event to hide keypad before changing end
            window.dispatchEvent(new CustomEvent('endChange'));
            
            setCurrentEnd(newEnd);
            
            // Auto-focus the first arrow of the first archer with improved timing
            setTimeout(() => {
                // Find all score inputs and focus the first one
                const allInputs = document.querySelectorAll('.score-input-keypad');
                
                if (allInputs.length > 0) {
                    const firstInput = allInputs[0];
                    
                    // Use improved focus management
                    const ensureFocus = (element) => {
                        if (!element) return;
                        
                        requestAnimationFrame(() => {
                            element.focus();
                            element.click();
                            
                            // Double-check focus after a short delay
                            setTimeout(() => {
                                if (document.activeElement !== element) {
                                    element.focus();
                                    element.click();
                                }
                            }, 10);
                        });
                    };
                    
                    ensureFocus(firstInput);
                }
            }, 200); // Further reduced delay for faster response
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

    const calculateBaleTotals = () => {
        const endKey = `end${currentEnd}`;
        let totalScore = 0;
        let totalTens = 0;
        let totalXs = 0;
        let totalArrows = 0;

        archers.forEach(archer => {
            const endScores = archer.scores[endKey];
            
            if (endScores) {
                const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
                
                // Check if all arrows are completed (not empty)
                const isComplete = scores.every(score => score && score !== '' && score !== '--');
                
                if (isComplete) {
                    scores.forEach(score => {
                        if (score && score !== '') {
                            totalArrows++;
                            totalScore += parseScoreValue(score);
                            
                            // X counts as both a 10 AND an X
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
        });

        const result = {
            totalScore,
            totalTens,
            totalXs,
            totalArrows,
            average: totalArrows > 0 ? (totalScore / totalArrows).toFixed(1) : '0.0'
        };

        return result;
    };

    const baleTotals = calculateBaleTotals();

    // Calculate final scores for all archers
    const calculateFinalScores = () => {
        const finalScores = archers.map(archer => {
            let totalScore = 0;
            let totalTens = 0;
            let totalXs = 0;
            let completedEnds = 0;
            
            for (let end = 1; end <= 12; end++) {
                const endKey = `end${end}`;
                const endScores = archer.scores[endKey];
                
                if (endScores && endScores.arrow1 && endScores.arrow2 && endScores.arrow3) {
                    const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
                    const endTotal = calculateEndTotal(endScores);
                    totalScore += endTotal;
                    completedEnds++;
                    
                    scores.forEach(score => {
                        if (score === 'X') {
                            totalTens++;
                            totalXs++;
                        } else if (score === '10') {
                            totalTens++;
                        }
                    });
                }
            }
            
            return {
                archerId: archer.id,
                firstName: archer.firstName,
                lastName: archer.lastName,
                totalScore,
                totalTens,
                totalXs,
                completedEnds,
                average: completedEnds > 0 ? (totalScore / (completedEnds * 3)).toFixed(1) : '0.0'
            };
        });
        
        return finalScores.sort((a, b) => b.totalScore - a.totalScore);
    };

    // Check if all ends are completed
    const isAllEndsCompleted = () => {
        return archers.every(archer => {
            for (let end = 1; end <= 12; end++) {
                const endKey = `end${end}`;
                const endScores = archer.scores[endKey];
                if (!endScores || !endScores.arrow1 || !endScores.arrow2 || !endScores.arrow3) {
                    return false;
                }
            }
            return true;
        });
    };

    // Handle opening verification flow
    const handleStartVerification = () => {
        setShowVerificationFlow(true);
    };

    // Handle verification completion
    const handleVerificationComplete = (completedArchers) => {
        console.log('Verification complete for:', completedArchers);
        setShowVerificationFlow(false);
        // Clear current bale data
        onBaleDataUpdate(null);
    };

    // Load current end from saved data when component mounts
    useEffect(() => {
        if (baleData.currentEnd && baleData.currentEnd !== currentEnd) {
            setCurrentEnd(baleData.currentEnd);
        }
    }, [baleData.currentEnd]);

    // Track if current end has unsaved changes
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Update unsaved changes flag when scores change
    useEffect(() => {
        const endKey = `end${currentEnd}`;
        const hasScores = archers.some(archer => {
            const endScores = archer.scores[endKey];
            return endScores && (endScores.arrow1 || endScores.arrow2 || endScores.arrow3);
        });
        
        setHasUnsavedChanges(hasScores);
    }, [archers, currentEnd]);

    return (
        <div className="w-full">
            <div className="bg-white">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-base font-bold text-gray-800">
                            Bale {baleData.baleNumber} - End {currentEnd}
                        </h2>
                        {hasUnsavedChanges && (
                            <div className="flex items-center space-x-2 mt-1">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                <span className="text-xs text-orange-600 font-medium">Unsaved changes</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => changeEnd(-1)}
                            disabled={currentEnd <= 1}
                            className="px-2 py-1 bg-gray-500 text-white rounded text-xs disabled:opacity-50 hover:bg-gray-600 transition-colors"
                        >
                            Previous End
                        </button>
                        <span className="text-xs font-medium px-2">
                            {currentEnd}/{totalEnds}
                        </span>
                        <button
                            onClick={handleNextEndWithSave}
                            disabled={currentEnd >= totalEnds}
                            className={`px-4 py-2 text-white rounded text-sm font-medium disabled:opacity-50 transition-colors ${
                                hasUnsavedChanges ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {hasUnsavedChanges ? 'Save & Next' : 'Next End'}
                        </button>
                    </div>
                </div>

                {/* Verify Scorecard Button - Show when all ends are completed */}
                {isAllEndsCompleted() && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-green-800">All Ends Completed!</h3>
                                <p className="text-sm text-green-600">Ready to verify each scorecard with paper scoring</p>
                            </div>
                            <button
                                onClick={handleStartVerification}
                                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
                            >
                                📋 Start Verification
                            </button>
                        </div>
                    </div>
                )}

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
                <div className="w-full">
                    <table className="score-table w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-300 px-1 py-1 text-left text-xs text-gray-900">Archer</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900 arrow-col">A1</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900 arrow-col">A2</th>
                                <th className="border border-gray-300 px-1 py-1 text-center text-xs text-gray-900 arrow-col">A3</th>
                                <th className="border border-gray-300 px-0 py-1 text-center text-xs text-gray-900 total-col">10s</th>
                                <th className="border border-gray-300 px-0 py-1 text-center text-xs text-gray-900 total-col">X</th>
                                <th className="border border-gray-300 px-0 py-1 text-center text-xs text-gray-900 total-col">End</th>
                                <th className="border border-gray-300 px-0 py-1 text-center text-xs text-gray-900 running-col">Run</th>
                                <th className="border border-gray-300 px-0 py-1 text-center text-xs text-gray-900 avg-col">Avg</th>
                                <th className="border border-gray-300 px-0 py-1 text-center text-xs text-gray-900 card-col">&gt;</th>
                            </tr>
                        </thead>
                        <tbody>
                            {archers.map(archer => {
                                const endKey = `end${currentEnd}`;
                                const endScores = archer.scores[endKey] || { arrow1: '', arrow2: '', arrow3: '' };
                                const endTotal = calculateEndTotal(endScores);
                                const runningTotal = calculateRunningTotal(archer);
                                const endAverage = calculateEndAverage(endScores);
                                
                                // Calculate tens and Xs correctly (X counts as both)
                                const scores = [endScores.arrow1, endScores.arrow2, endScores.arrow3];
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

                                // Shortened archer name: First Name + Last Initial
                                const shortName = `${archer.firstName || ''} ${(archer.lastName || '').charAt(0) || ''}.`;

                                return (
                                    <tr key={archer.id} className="hover:bg-gray-50">
                                        <td className="border border-gray-300 px-1 py-1 text-left">
                                            <span className="font-medium text-xs text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis block">
                                                {shortName}
                                            </span>
                                        </td>
                                        
                                        {/* Arrow inputs */}
                                        {[0, 1, 2].map(arrowIndex => (
                                            <td key={arrowIndex} className="border border-gray-300 p-1 min-h-[2rem] relative arrow-col">
                                                <div className="w-full h-full min-h-[2rem] relative">
                                                    <ScoreInputWithKeypad
                                                        value={endScores[`arrow${arrowIndex + 1}`] || ''}
                                                        onChange={(value) => handleScoreChange(archer.id, arrowIndex, value)}
                                                        data-archer-id={archer.id}
                                                        data-arrow-index={arrowIndex}
                                                    />
                                                </div>
                                            </td>
                                        ))}
                                        
                                        {/* Calculated columns */}
                                        <td className="border border-gray-300 px-0 py-1 text-center font-bold text-xs total-col">
                                            {tens}
                                        </td>
                                        <td className="border border-gray-300 px-0 py-1 text-center font-bold text-xs total-col">
                                            {xs}
                                        </td>
                                        <td className="border border-gray-300 px-0 py-1 text-center font-bold text-xs total-col">
                                            {endTotal}
                                        </td>
                                        <td className="border border-gray-300 px-0 py-1 text-center font-bold text-xs running-col">
                                            {runningTotal}
                                        </td>
                                        <td className={`border border-gray-300 px-0 py-1 text-center font-bold text-xs avg-col ${getAverageClass(endAverage)}`}>
                                            {endAverage}
                                        </td>
                                        <td className="border border-gray-300 px-0 py-1 text-center card-col">
                                            <button
                                                onClick={() => onViewCard(archer.id)}
                                                className="w-full h-full bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold"
                                            >
                                                &gt;
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Scorecard Verification Flow */}
            {showVerificationFlow && (
                <ScorecardVerificationFlow
                    baleData={{ ...baleData, archers }}
                    onVerificationComplete={handleVerificationComplete}
                    onNavigate={onNavigate}
                />
            )}
        </div>
    );
};

export default MultiArcherScoring; 