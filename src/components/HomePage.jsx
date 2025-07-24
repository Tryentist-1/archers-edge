import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadProfilesFromFirebase, loadArcherProfileWithScores } from '../services/firebaseService';

const HomePage = ({ currentUser, onNavigate, baleData }) => {
    const { currentUser: authUser } = useAuth();
    const [myProfile, setMyProfile] = useState(null);
    const [myStats, setMyStats] = useState(null);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load user's personal profile on component mount
    useEffect(() => {
        loadMyProfile();
    }, [authUser]);

    const loadMyProfile = async () => {
        try {
            setLoading(true);
            
            // Load all profiles for the current user
            let profiles = [];
            if (authUser?.uid) {
                try {
                    profiles = await loadProfilesFromFirebase(authUser.uid);
                } catch (error) {
                    console.error('Error loading profiles:', error);
                }
            }
            
            // Fallback to localStorage
            if (profiles.length === 0) {
                const savedProfiles = localStorage.getItem('archerProfiles');
                if (savedProfiles) {
                    profiles = JSON.parse(savedProfiles);
                }
            }

            // Set profiles state for favorites section
            setProfiles(profiles);

            // Find "my" profile by prioritizing "isMe" tag, then email matching
            let myProfile = null;
            
            // First priority: find profile tagged as "Me"
            myProfile = profiles.find(profile => profile.isMe === true);
            
            // Second priority: try to match by email
            if (!myProfile && authUser?.email) {
                myProfile = profiles.find(profile => 
                    profile.email && profile.email.toLowerCase() === authUser.email.toLowerCase()
                );
            }
            
            // Third priority: use the first profile (most common case)
            if (!myProfile && profiles.length > 0) {
                myProfile = profiles[0];
            }

            if (myProfile) {
                setMyProfile(myProfile);
                
                // Load detailed profile with scores
                try {
                    const detailedProfile = await loadArcherProfileWithScores(myProfile.id);
                    if (detailedProfile) {
                        setMyStats(detailedProfile.performanceStats);
                    }
                } catch (error) {
                    console.error('Error loading profile stats:', error);
                }
            }
        } catch (error) {
            console.error('Error loading my profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigation = (destination) => {
        onNavigate(destination);
    };

    // Debug logging
    console.log('HomePage baleData:', baleData);
    console.log('baleData.archers:', baleData?.archers);
    console.log('baleData.archers.length:', baleData?.archers?.length);
    console.log('My Profile:', myProfile);
    console.log('My Stats:', myStats);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="w-full px-1">
                    <div className="flex justify-between items-center h-12">
                        <div className="flex items-center">
                            <h1 className="text-lg font-semibold text-gray-900">Archer's Edge</h1>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-600">
                                {currentUser?.email}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4">

                {/* My Profile Card - Auto-detected */}
                {myProfile && (
                    <div className="mb-6">
                        <div 
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => handleNavigation('profile')}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-lg font-semibold text-blue-800">My Profile</h3>
                                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Me</span>
                                    </div>
                                    <p className="text-sm text-blue-700">
                                        {myProfile.firstName} {myProfile.lastName} • {myProfile.division} • {myProfile.bowType}
                                    </p>
                                </div>
                                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Favorites Section */}
                {(() => {
                    const favoriteProfiles = profiles?.filter(p => p.isFavorite && p.id !== myProfile?.id) || [];
                    return favoriteProfiles.length > 0 ? (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">My Favorites</h3>
                            <div className="space-y-2">
                                {favoriteProfiles.map(profile => (
                                    <div 
                                        key={profile.id}
                                        className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 cursor-pointer hover:bg-yellow-100 transition-colors"
                                        onClick={() => handleNavigation('profile')}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                                <span className="text-yellow-600 text-sm">⭐</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-yellow-800">
                                                    {profile.firstName} {profile.lastName}
                                                </p>
                                                <p className="text-xs text-yellow-700">
                                                    {profile.division} • {profile.bowType}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null;
                })()}

                {/* Round in Progress Card */}
                {baleData && baleData.archers && baleData.archers.length > 0 && (
                    <div className="mb-6">
                        <div 
                            className="bg-orange-50 border border-orange-200 rounded-lg p-4 cursor-pointer hover:bg-orange-100 transition-colors"
                            onClick={() => {
                                console.log('Round in Progress clicked, navigating to scoring');
                                handleNavigation('scoring');
                            }}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-orange-800">Round in Progress</h3>
                                    <p className="text-sm text-orange-700">
                                        Bale {baleData.baleNumber} • {baleData.archers.length} archer{baleData.archers.length !== 1 ? 's' : ''} • End {baleData.currentEnd || 1}
                                    </p>
                                    {baleData.competitionName && (
                                        <p className="text-xs text-orange-600 mt-1">
                                            {baleData.competitionName}
                                        </p>
                                    )}
                                </div>
                                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Cards */}
                <div className="space-y-4">
                    {/* New Ranking Round Card */}
                    <div 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleNavigation('new-round')}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800">New Ranking Round</h3>
                                <p className="text-sm text-gray-600">Start scoring a new OAS ranking round</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Score History Card */}
                    <div 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleNavigation('scores')}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800">Score History</h3>
                                <p className="text-sm text-gray-600">View your completed rounds and statistics</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Coaches Card (Coach Tools) */}
                    <div 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleNavigation('team-archers')}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800">Coaches</h3>
                                <p className="text-sm text-gray-600">Coach Tools - Manage all team profiles and assignments</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Competition Management Card */}
                    <div 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleNavigation('competitions')}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800">Competitions</h3>
                                <p className="text-sm text-gray-600">Create and manage OAS competitions and rounds</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>

                    {/* Data Sync Panel Card */}
                    <div 
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleNavigation('data-sync')}
                    >
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800">Data Sync</h3>
                                <p className="text-sm text-gray-600">Manage data sync and troubleshoot issues</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default HomePage; 