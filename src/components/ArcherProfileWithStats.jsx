import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadArcherProfileWithScores } from '../services/firebaseService';

const ArcherProfileWithStats = ({ archerId, onNavigate }) => {
    const { currentUser } = useAuth();
    const [archerData, setArcherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (archerId) {
            loadArcherData();
        }
    }, [archerId]);

    const loadArcherData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const data = await loadArcherProfileWithScores(archerId);
            if (data) {
                setArcherData(data);
            } else {
                setError('Archer profile not found');
            }
        } catch (err) {
            console.error('Error loading archer data:', err);
            setError('Failed to load archer data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getScoreColor = (score) => {
        if (score >= 9.0) return 'text-yellow-600 font-bold';
        if (score >= 7.0) return 'text-red-600 font-bold';
        if (score >= 5.0) return 'text-blue-600 font-bold';
        return 'text-gray-600';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-lg">Loading archer profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-red-600 text-lg">{error}</div>
            </div>
        );
    }

    if (!archerData) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-gray-600 text-lg">No archer data available</div>
            </div>
        );
    }

    const { performanceStats, recentScores } = archerData;

    return (
        <div className="max-w-4xl mx-auto p-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            {archerData.firstName} {archerData.lastName}
                        </h1>
                        <p className="text-gray-600 mt-1">
                            {archerData.defaultClassification || 'Archer'} • {archerData.gender || 'N/A'}
                        </p>
                    </div>
                    <button
                        onClick={() => onNavigate('home')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        ← Back
                    </button>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                            {performanceStats.totalRounds}
                        </div>
                        <div className="text-sm text-gray-600">Total Rounds</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className={`text-2xl font-bold ${getScoreColor(performanceStats.averageScore)}`}>
                            {performanceStats.averageScore}
                        </div>
                        <div className="text-sm text-gray-600">Average Score</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                            {performanceStats.bestScore}
                        </div>
                        <div className="text-sm text-gray-600">Best Score</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                            {performanceStats.totalTens}
                        </div>
                        <div className="text-sm text-gray-600">Total 10s</div>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-gray-800">
                            {performanceStats.totalXs}
                        </div>
                        <div className="text-sm text-gray-600">Total Xs</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-gray-800">
                            {performanceStats.consistency}
                        </div>
                        <div className="text-sm text-gray-600">Consistency</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-gray-800">
                            {performanceStats.totalArrows}
                        </div>
                        <div className="text-sm text-gray-600">Total Arrows</div>
                    </div>
                </div>
            </div>

            {/* Recent Scores */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Scores</h2>
                
                {recentScores.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                        No recent scores available
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentScores.map((score, index) => (
                            <div key={score.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            {score.competitionName || 'Practice Round'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {formatDate(score.completedAt)} • Bale {score.baleNumber} • Target {score.targetAssignment}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold ${getScoreColor(score.totals?.totalScore / (score.totalEnds * score.arrowsPerEnd))}`}>
                                            {score.totals?.totalScore || 0}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {score.roundType}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Score Details */}
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">10s:</span>
                                        <span className="font-semibold ml-1">{score.totals?.totalTens || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Xs:</span>
                                        <span className="font-semibold ml-1">{score.totals?.totalXs || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Avg:</span>
                                        <span className={`font-semibold ml-1 ${getScoreColor(score.totals?.totalScore / (score.totalEnds * score.arrowsPerEnd))}`}>
                                            {score.totals?.totalScore ? (score.totals.totalScore / (score.totalEnds * score.arrowsPerEnd)).toFixed(1) : '0.0'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArcherProfileWithStats; 