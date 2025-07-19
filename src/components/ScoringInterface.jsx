import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { db } from '../config/firebase.js';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import ScoreInput from './ScoreInput.jsx';
import { calculateTotalScore, calculateAverageScore } from '../utils/scoring.js';

/**
 * ScoringInterface Component
 * 
 * A scoring interface with Firestore persistence for competition scoring.
 */
function ScoringInterface() {
    const { currentUser } = useAuth();
    const [scores, setScores] = useState(['', '', '']); // 3 arrows per end
    const [currentEnd, setCurrentEnd] = useState(1);
    const [allEnds, setAllEnds] = useState({}); // Store all ends data
    const [loading, setLoading] = useState(false);
    const [competitionId, setCompetitionId] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Load existing scores when component mounts or user changes
    useEffect(() => {
        if (currentUser) {
            loadScores();
        }
    }, [currentUser, currentEnd]);

    const loadScores = async () => {
        if (!currentUser) return;
        
        try {
            setLoading(true);
            const userDoc = doc(db, 'users', currentUser.uid);
            const userData = await getDoc(userDoc);
            
            if (userData.exists()) {
                const data = userData.data();
                if (data.currentCompetition) {
                    setCompetitionId(data.currentCompetition);
                    
                    // Load scores for current end
                    const endKey = `end_${currentEnd}`;
                    if (data.scores && data.scores[endKey]) {
                        setScores(data.scores[endKey]);
                    } else {
                        setScores(['', '', '']);
                    }
                    
                    // Load all ends data
                    if (data.scores) {
                        setAllEnds(data.scores);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading scores:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveScores = async (endNumber, endScores) => {
        if (!currentUser) return;
        
        try {
            setLoading(true);
            setSaveSuccess(false);
            const userDoc = doc(db, 'users', currentUser.uid);
            
            // Create or get competition ID
            let compId = competitionId;
            if (!compId) {
                compId = `comp_${Date.now()}`;
                setCompetitionId(compId);
            }
            
            // Update scores in Firestore
            const endKey = `end_${endNumber}`;
            const updatedScores = {
                ...allEnds,
                [endKey]: endScores
            };
            
            await setDoc(userDoc, {
                currentCompetition: compId,
                scores: updatedScores,
                lastUpdated: new Date(),
                userId: currentUser.uid,
                userEmail: currentUser.email
            }, { merge: true });
            
            setAllEnds(updatedScores);
            setSaveSuccess(true);
            
            // Hide success indicator after 2 seconds
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
            console.error('Error saving scores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = async (index, value) => {
        console.log(`Score change: Arrow ${index + 1}, Value: "${value}"`);
        const newScores = [...scores];
        newScores[index] = value;
        setScores(newScores);
        
        // Auto-save after each score change (non-blocking)
        saveScores(currentEnd, newScores).catch(error => {
            console.error('Error saving scores:', error);
        });
    };

    const handleNextEnd = async () => {
        // Save current end before moving to next
        await saveScores(currentEnd, scores);
        setCurrentEnd(currentEnd + 1);
    };

    const handlePreviousEnd = async () => {
        if (currentEnd > 1) {
            // Save current end before moving to previous
            await saveScores(currentEnd, scores);
            setCurrentEnd(currentEnd - 1);
        }
    };

    const totalScore = calculateTotalScore(scores);
    const averageScore = calculateAverageScore(scores.filter(score => score !== ''));

    // Calculate total competition score
    const competitionTotal = Object.values(allEnds).reduce((total, endScores) => {
        return total + calculateTotalScore(endScores);
    }, 0);

    if (loading) {
        return (
            <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading scores...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                End {currentEnd} Scoring
            </h2>
            
            {/* Save Status Indicator */}
            {loading && (
                <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-700">Saving scores...</span>
                    </div>
                </div>
            )}
            
            {/* Save Success Indicator */}
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
            
            {/* Competition Total */}
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <div className="text-center">
                    <span className="text-sm text-gray-600">Competition Total: </span>
                    <span className="text-xl font-bold text-blue-600">{competitionTotal}</span>
                </div>
            </div>
            
            <div className="mb-6">
                <div className="flex justify-center space-x-4 mb-4">
                    {scores.map((score, index) => (
                        <div key={index} className="text-center">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Arrow {index + 1}
                            </label>
                            <ScoreInput
                                value={score}
                                onChange={(value) => handleScoreChange(index, value)}
                                placeholder="0-10"
                                autoFocus={false}
                            />
                        </div>
                    ))}
                </div>
                
                <div className="text-center space-y-2">
                    <div className="text-lg">
                        <span className="font-semibold">End Total: </span>
                        <span className="text-blue-600 font-bold">{totalScore}</span>
                    </div>
                    <div className="text-lg">
                        <span className="font-semibold">End Average: </span>
                        <span className="text-green-600 font-bold">
                            {averageScore.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-between">
                <button
                    onClick={handlePreviousEnd}
                    disabled={currentEnd <= 1}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous End
                </button>
                <button
                    onClick={handleNextEnd}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                    Next End
                </button>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="font-semibold text-gray-800 mb-2">Scoring Guide:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <span className="bg-yellow-400 text-black px-1 rounded font-bold">X</span> = 10 points (gold - perfect)</li>
                    <li>• <span className="bg-yellow-400 text-black px-1 rounded font-bold">10</span> = 10 points (gold - perfect)</li>
                    <li>• <span className="bg-yellow-400 text-black px-1 rounded font-bold">9</span> = 9 points (gold - excellent)</li>
                    <li>• <span className="bg-red-600 text-white px-1 rounded font-bold">8</span> = 8 points (red - good)</li>
                    <li>• <span className="bg-red-600 text-white px-1 rounded font-bold">7</span> = 7 points (red - good)</li>
                    <li>• <span className="bg-cyan-400 text-black px-1 rounded font-bold">6</span> = 6 points (blue - fair)</li>
                    <li>• <span className="bg-cyan-400 text-black px-1 rounded font-bold">5</span> = 5 points (blue - fair)</li>
                    <li>• <span className="bg-gray-800 text-white px-1 rounded font-bold">4</span> = 4 points (black - poor)</li>
                    <li>• <span className="bg-gray-800 text-white px-1 rounded font-bold">3</span> = 3 points (black - poor)</li>
                    <li>• <span className="bg-white text-black px-1 rounded font-bold border border-gray-300">2</span> = 2 points (white - very poor)</li>
                    <li>• <span className="bg-white text-black px-1 rounded font-bold border border-gray-300">1</span> = 1 point (white - very poor)</li>
                    <li>• <span className="bg-white text-gray-500 px-1 rounded font-bold border border-gray-300">M</span> = 0 points (miss)</li>
                </ul>
            </div>
        </div>
    );
}

export default ScoringInterface; 