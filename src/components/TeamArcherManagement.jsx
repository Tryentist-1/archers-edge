import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    loadAllArchers,
    shouldUseFirebase
} from '../services/firebaseService';
import ProfileEditor from './ProfileEditor';

const TeamArcherManagement = ({ onNavigate }) => {
    const { currentUser } = useAuth();
    const [archers, setArchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingArcher, setEditingArcher] = useState(null);

    useEffect(() => {
        loadArchers();
    }, []);

    const loadArchers = async () => {
        try {
            setLoading(true);
            console.log('=== LOAD ARCHERS DEBUG ===');
            console.log('Loading archers...');
            console.log('Current user:', currentUser);
            
            let loadedArchers = [];
            
            // Try to load from Firebase first if online and not mock user
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    console.log('Attempting to load from Firebase...');
                    const firebaseArchers = await loadAllArchers(currentUser?.uid);
                    console.log('Archers loaded from Firebase:', firebaseArchers);
                    if (firebaseArchers && firebaseArchers.length > 0) {
                        loadedArchers = firebaseArchers;
                        localStorage.setItem('archerProfiles', JSON.stringify(firebaseArchers));
                    }
                } catch (error) {
                    console.error('Error loading from Firebase, falling back to local:', error);
                }
            } else {
                console.log('Skipping Firebase load - offline, no user, or mock user');
            }
            
            // Fallback to local storage if no Firebase data
            if (loadedArchers.length === 0) {
                const savedArchers = localStorage.getItem('archerProfiles');
                console.log('Raw localStorage data:', savedArchers);
                if (savedArchers) {
                    const parsedArchers = JSON.parse(savedArchers);
                    console.log('Archers loaded from localStorage:', parsedArchers);
                    loadedArchers = parsedArchers;
                } else {
                    console.log('No archers found in localStorage');
                }
            }
            
            console.log('Final loaded archers:', loadedArchers);
            
            // Sort archers by firstName, then lastName
            const sortedArchers = loadedArchers.sort((a, b) => {
                const firstNameA = (a.firstName || '').toLowerCase();
                const firstNameB = (b.firstName || '').toLowerCase();
                const lastNameA = (a.lastName || '').toLowerCase();
                const lastNameB = (b.lastName || '').toLowerCase();
                
                // First sort by firstName
                if (firstNameA !== firstNameB) {
                    return firstNameA.localeCompare(firstNameB);
                }
                
                // If firstName is the same, sort by lastName
                return lastNameA.localeCompare(lastNameB);
            });
            
            console.log('Sorted archers:', sortedArchers);
            setArchers(sortedArchers);
            
            console.log('=== END LOAD ARCHERS DEBUG ===');
            
        } catch (error) {
            console.error('Error loading archers:', error);
        } finally {
            setLoading(false);
        }
    };

    const editArcher = (archer) => {
        console.log('Editing archer:', archer);
        setEditingArcher(archer);
    };

    const handleArcherSave = (savedArcher, updatedArchers) => {
        setArchers(updatedArchers);
        setEditingArcher(null);
    };

    const handleArcherCancel = () => {
        setEditingArcher(null);
    };

    const handleArcherNavigation = (action, data) => {
        if (action === 'edit' && data?.profileId) {
            const archer = archers.find(a => a.id === data.profileId);
            if (archer) {
                setEditingArcher(archer);
            }
        } else if (action === 'list') {
            setEditingArcher(null);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading archers...</p>
                </div>
            </div>
        );
    }

    // Profile Editor View
    if (editingArcher !== null) {
        return (
            <ProfileEditor
                profile={editingArcher}
                profiles={archers}
                onSave={handleArcherSave}
                onCancel={handleArcherCancel}
                onNavigate={handleArcherNavigation}
                mode="full"
                showNavigation={true}
                allowCreate={false}
                allowEdit={true}
                allowDelete={true}
            />
        );
    }

    // Archer List View
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Team Archers</h1>
                    <button
                        onClick={() => onNavigate('home')}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>

            {/* Action Buttons - Always at Top */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex space-x-3">
                    <button
                        onClick={() => onNavigate('profiles')}
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Profile Management
                    </button>
                </div>
            </div>

            {/* Archer List */}
            <div className="p-4 space-y-3">
                {archers.map((archer, index) => (
                    <div
                        key={archer.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => editArcher(archer)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-medium text-lg">
                                            {archer.firstName?.[0]}{archer.lastName?.[0]}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-gray-900">
                                                {archer.firstName} {archer.lastName}
                                            </h3>
                                            {archer.isFavorite && (
                                                <span className="text-yellow-500 text-lg">
                                                    ⭐
                                                </span>
                                            )}
                                            {archer.isMe && (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                    Me
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {archer.school || 'No School'} • {archer.role || 'Archer'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        editArcher(archer);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {archers.length === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <p className="text-gray-600 mb-4">No archers found</p>
                        <button
                            onClick={() => onNavigate('profiles')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                        >
                            Go to Profile Management
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamArcherManagement; 