import React, { useState } from 'react';
import ScoreInput from './ScoreInput.jsx';
import { calculateTotalScore, calculateAverageScore } from '../utils/scoring.js';

/**
 * ScoringInterface Component
 * 
 * A simple interface for testing the scoring components and logic.
 * This will be replaced with more sophisticated components later.
 */
function ScoringInterface() {
    const [scores, setScores] = useState(['', '', '']); // 3 arrows per end
    const [currentEnd, setCurrentEnd] = useState(1);

    const handleScoreChange = (index, value) => {
        const newScores = [...scores];
        newScores[index] = value;
        setScores(newScores);
    };

    const handleNextEnd = () => {
        // Save current end and move to next
        setCurrentEnd(currentEnd + 1);
        setScores(['', '', '']); // Reset for new end
    };

    const handlePreviousEnd = () => {
        if (currentEnd > 1) {
            setCurrentEnd(currentEnd - 1);
            setScores(['', '', '']); // Reset for previous end
        }
    };

    const totalScore = calculateTotalScore(scores);
    const averageScore = calculateAverageScore(scores.filter(score => score !== ''));

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                End {currentEnd} Scoring
            </h2>
            
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
                        <span className="font-semibold">Total: </span>
                        <span className="text-blue-600 font-bold">{totalScore}</span>
                    </div>
                    <div className="text-lg">
                        <span className="font-semibold">Average: </span>
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