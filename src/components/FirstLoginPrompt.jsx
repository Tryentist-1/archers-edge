import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadProfilesFromFirebase, shouldUseFirebase } from '../services/firebaseService';

const FirstLoginPrompt = ({ onComplete, onSkip }) => {
    const { currentUser } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [myProfileId, setMyProfileId] = useState('');
    const [favoriteProfileIds, setFavoriteProfileIds] = useState([]);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            let loadedProfiles = [];
            
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    const firebaseProfiles = await loadProfilesFromFirebase(currentUser.uid);
                    if (firebaseProfiles && firebaseProfiles.length > 0) {
                        loadedProfiles = firebaseProfiles;
                    }
                } catch (error) {
                    console.error('Error loading from Firebase:', error);
                }
            }
            
            if (loadedProfiles.length === 0) {
                const savedProfiles = localStorage.getItem('archerProfiles');
                if (savedProfiles) {
                    loadedProfiles = JSON.parse(savedProfiles);
                }
            }

            // Sort profiles by firstName, then lastName
            const sortedProfiles = loadedProfiles.sort((a, b) => {
                const firstNameA = (a.firstName || '').toLowerCase();
                const firstNameB = (b.firstName || '').toLowerCase();
                const lastNameA = (a.lastName || '').toLowerCase();
                const lastNameB = (b.lastName || '').toLowerCase();
                
                if (firstNameA !== firstNameB) {
                    return firstNameA.localeCompare(firstNameB);
                }
                return lastNameA.localeCompare(lastNameB);
            });

            setProfiles(sortedProfiles);
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMyProfileSelect = (profileId) => {
        setMyProfileId(profileId);
    };

    const handleFavoriteToggle = (profileId) => {
        setFavoriteProfileIds(prev => {
            if (prev.includes(profileId)) {
                return prev.filter(id => id !== profileId);
            } else {
                return [...prev, profileId];
            }
        });
    };

    const handleNext = () => {
        if (currentStep === 0 && !myProfileId) {
            alert('Please select your profile first.');
            return;
        }
        setCurrentStep(prev => prev + 1);
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(0, prev - 1));
    };

    const handleComplete = () => {
        // Update profiles with the selections
        const updatedProfiles = profiles.map(profile => ({
            ...profile,
            isMe: profile.id === myProfileId,
            isFavorite: favoriteProfileIds.includes(profile.id)
        }));

        // Save updated profiles
        localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
        
        // TODO: Save to Firebase if online
        onComplete(updatedProfiles);
    };

    const handleSkip = () => {
        onSkip();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading profiles...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (profiles.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Archer's Edge!</h2>
                    <p className="text-gray-600 mb-6">
                        You don't have any archer profiles yet. Let's create your first profile to get started.
                    </p>
                    <button
                        onClick={handleSkip}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Create Profile
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Step {currentStep + 1} of 2
                        </span>
                        <span className="text-sm text-gray-500">
                            {currentStep === 0 ? 'Identify Your Profile' : 'Tag Your Favorites'}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / 2) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Step 1: Identify Your Profile */}
                {currentStep === 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Welcome to Archer's Edge! 🏹
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Let's identify your profile so we can show you your personal stats and progress.
                        </p>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {profiles.map(profile => (
                                <div
                                    key={profile.id}
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                        myProfileId === profile.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                    onClick={() => handleMyProfileSelect(profile.id)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-4 h-4 rounded-full border-2 ${
                                            myProfileId === profile.id
                                                ? 'bg-blue-500 border-blue-500'
                                                : 'border-gray-300'
                                        }`}>
                                            {myProfileId === profile.id && (
                                                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">
                                                {profile.firstName} {profile.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {profile.school || 'No School'} • {profile.division || 'No Division'} • {profile.bowType || 'No Bow'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Tag Your Favorites */}
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Tag Your Favorite Teammates ⭐
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Select teammates you often shoot with. They'll appear in your "Favorites" section for quick access.
                        </p>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {profiles.filter(p => p.id !== myProfileId).map(profile => (
                                <div
                                    key={profile.id}
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                        favoriteProfileIds.includes(profile.id)
                                            ? 'border-yellow-500 bg-yellow-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                    }`}
                                    onClick={() => handleFavoriteToggle(profile.id)}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            {favoriteProfileIds.includes(profile.id) ? (
                                                <span className="text-yellow-500 text-lg">⭐</span>
                                            ) : (
                                                <span className="text-gray-400 text-lg">☆</span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">
                                                {profile.firstName} {profile.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {profile.school || 'No School'} • {profile.division || 'No Division'} • {profile.bowType || 'No Bow'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {profiles.filter(p => p.id !== myProfileId).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p>No other profiles found to tag as favorites.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                    <button
                        onClick={handleSkip}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Skip for now
                    </button>
                    
                    <div className="flex space-x-3">
                        {currentStep > 0 && (
                            <button
                                onClick={handleBack}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            >
                                Back
                            </button>
                        )}
                        
                        {currentStep < 1 ? (
                            <button
                                onClick={handleNext}
                                disabled={!myProfileId}
                                className={`px-6 py-2 rounded-md transition-colors ${
                                    myProfileId
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleComplete}
                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                Complete Setup
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FirstLoginPrompt; 