import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    loadProfilesFromFirebase, 
    shouldUseFirebase,
    isOnline
} from '../services/firebaseService';
import ProfileEditor from './ProfileEditor';

const ProfileManagement = ({ onNavigate, onProfileSelect, selectedProfile: appSelectedProfile }) => {
    const { currentUser } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfileSelection, setShowProfileSelection] = useState(true);
    const [editingProfile, setEditingProfile] = useState(null);

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            console.log('=== LOAD PROFILES DEBUG ===');
            console.log('Loading profiles...');
            console.log('Current user:', currentUser);
            console.log('Is online:', isOnline());
            
            let loadedProfiles = [];
            
            // Try to load from Firebase first if online and not mock user
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    console.log('Attempting to load from Firebase...');
                    const firebaseProfiles = await loadProfilesFromFirebase(currentUser?.uid);
                    console.log('Profiles loaded from Firebase:', firebaseProfiles);
                    if (firebaseProfiles && firebaseProfiles.length > 0) {
                        loadedProfiles = firebaseProfiles;
                        localStorage.setItem('archerProfiles', JSON.stringify(firebaseProfiles));
                    }
                } catch (error) {
                    console.error('Error loading from Firebase, falling back to local:', error);
                }
            } else {
                console.log('Skipping Firebase load - offline, no user, or mock user');
            }
            
            // Fallback to local storage if no Firebase data
            if (loadedProfiles.length === 0) {
                const savedProfiles = localStorage.getItem('archerProfiles');
                console.log('Raw localStorage data:', savedProfiles);
                if (savedProfiles) {
                    const parsedProfiles = JSON.parse(savedProfiles);
                    console.log('Profiles loaded from localStorage:', parsedProfiles);
                    loadedProfiles = parsedProfiles;
                } else {
                    console.log('No profiles found in localStorage');
                }
            }
            
            console.log('Final loaded profiles:', loadedProfiles);
            
            // Sort profiles by firstName, then lastName
            const sortedProfiles = loadedProfiles.sort((a, b) => {
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
            
            console.log('Sorted profiles:', sortedProfiles);
            setProfiles(sortedProfiles);
            
            // Auto-select profile if provided by parent
            if (appSelectedProfile) {
                setSelectedProfile(appSelectedProfile);
                setShowProfileSelection(false);
            }
            
            console.log('=== END LOAD PROFILES DEBUG ===');
            
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectProfile = (profile) => {
        console.log('=== SELECT PROFILE DEBUG ===');
        console.log('Profile selected:', profile);
        console.log('Current user:', currentUser);
        console.log('User preferences before:', localStorage.getItem('archer_edge_user_preferences'));
        
        setSelectedProfile(profile);
        
        // Update user preferences
        const preferences = JSON.parse(localStorage.getItem('archer_edge_user_preferences') || '{}');
        preferences.myProfileId = profile.id;
        localStorage.setItem('archer_edge_user_preferences', JSON.stringify(preferences));
        
        console.log('User preferences after:', localStorage.getItem('archer_edge_user_preferences'));
        console.log('=== END SELECT PROFILE DEBUG ===');
        
        // Notify parent component
        if (onProfileSelect) {
            onProfileSelect(profile);
        }
    };

    const createNewProfile = () => {
        setEditingProfile({}); // Empty object for new profile
        setShowProfileSelection(false);
    };

    const editProfile = (profile) => {
        console.log('Editing profile:', profile);
        setEditingProfile(profile);
        setShowProfileSelection(false);
    };

    const handleProfileSave = (savedProfile, updatedProfiles) => {
        setProfiles(updatedProfiles);
        setEditingProfile(null);
        setShowProfileSelection(true);
        
        // Update selected profile if it was the one being edited
        if (selectedProfile && selectedProfile.id === savedProfile.id) {
            setSelectedProfile(savedProfile);
        }
    };

    const handleProfileCancel = () => {
        setEditingProfile(null);
        setShowProfileSelection(true);
    };

    const handleProfileNavigation = (action, data) => {
        if (action === 'edit' && data?.profileId) {
            const profile = profiles.find(p => p.id === data.profileId);
            if (profile) {
                setEditingProfile(profile);
                setShowProfileSelection(false);
            }
        } else if (action === 'list') {
            setEditingProfile(null);
            setShowProfileSelection(true);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profiles...</p>
                </div>
            </div>
        );
    }

    // Profile Editor View
    if (editingProfile !== null) {
        return (
            <ProfileEditor
                profile={editingProfile}
                profiles={profiles}
                onSave={handleProfileSave}
                onCancel={handleProfileCancel}
                onNavigate={handleProfileNavigation}
                mode="full"
                showNavigation={true}
                allowCreate={true}
                allowEdit={true}
                allowDelete={true}
            />
        );
    }

    // Profile Selection View
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">Profile Management</h1>
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
                        onClick={createNewProfile}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                        + New Profile
                    </button>
                    <button
                        onClick={() => onNavigate('team-archers')}
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Team View
                    </button>
                </div>
            </div>

            {/* Profile List */}
            <div className="p-4 space-y-3">
                {profiles.map((profile, index) => (
                    <div
                        key={profile.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => selectProfile(profile)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-medium text-lg">
                                            {profile.firstName?.[0]}{profile.lastName?.[0]}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-semibold text-gray-900">
                                                {profile.firstName} {profile.lastName}
                                            </h3>
                                            {profile.isFavorite && (
                                                <span className="text-yellow-500 text-lg">
                                                    ⭐
                                                </span>
                                            )}
                                            {profile.isMe && (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                    Me
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {profile.school || 'No School'} • {profile.role || 'Archer'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        editProfile(profile);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                    Edit
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                
                {profiles.length === 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <p className="text-gray-600 mb-4">No profiles found</p>
                        <button
                            onClick={createNewProfile}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                        >
                            Create Your First Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileManagement; 