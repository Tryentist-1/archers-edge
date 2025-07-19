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
        } catch (error) {
            console.error('Error saving scores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = async (index, value) => {
        const newScores = [...scores];
        newScores[index] = value;
        setScores(newScores);
        
        // Auto-save after each score change
        await saveScores(currentEnd, newScores);
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
                                autoFocus={index === 0}
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
                    <li>• <strong>X</strong> = 10 points (gold)</li>
                    <li>• <strong>10</strong> = 10 points (teal)</li>
                    <li>• <strong>9</strong> = 9 points (blue)</li>
                    <li>• <strong>8</strong> = 8 points (green)</li>
                    <li>• <strong>M</strong> = 0 points (miss)</li>
                </ul>
            </div>
        </div>
    );
}

export default ScoringInterface; 