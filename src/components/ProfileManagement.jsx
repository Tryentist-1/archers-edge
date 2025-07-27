import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    saveProfileToFirebase, 
    loadProfilesFromFirebase, 
    deleteProfileFromFirebase,
    isOnline,
    shouldUseFirebase
} from '../services/firebaseService';

const ProfileManagement = ({ onNavigate, onProfileSelect, selectedProfile: appSelectedProfile }) => {
    const { currentUser } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [showProfileSelection, setShowProfileSelection] = useState(true);
    const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: 'M',
        school: '',
        grade: '',
        division: 'V',
        dominantHand: 'Right',
        dominantEye: 'Right',
        drawLength: '',
        bowType: 'Recurve ILF',
        bowLength: '66',
        bowWeight: '',
        varsityPR: '',
        jvPR: '',
        avgArrow: '',
        role: 'Archer',
        usArcheryNumber: '',
        nfaaNumber: '',
        sponsorships: '',
        isMe: false,
        isFavorite: false,
        isActive: true
    });

    useEffect(() => {
        loadProfiles();
    }, []);

    // Update form when selected profile changes (for editing)
    useEffect(() => {
        if (selectedProfile && isEditing) {
            console.log('Updating form with selected profile:', selectedProfile);
            setProfileForm({
                firstName: selectedProfile.firstName || '',
                lastName: selectedProfile.lastName || '',
                email: selectedProfile.email || '',
                phone: selectedProfile.phone || '',
                gender: selectedProfile.gender || 'M',
                school: selectedProfile.school || '',
                grade: selectedProfile.grade || '',
                division: selectedProfile.division || selectedProfile.defaultClassification || 'V',
                dominantHand: selectedProfile.dominantHand || 'Right',
                dominantEye: selectedProfile.dominantEye || 'Right',
                drawLength: selectedProfile.drawLength || '',
                bowType: selectedProfile.bowType || selectedProfile.profileType || 'Recurve ILF',
                bowLength: selectedProfile.bowLength || '66',
                bowWeight: selectedProfile.bowWeight || '',
                varsityPR: selectedProfile.varsityPR || '',
                jvPR: selectedProfile.jvPR || '',
                avgArrow: selectedProfile.avgArrow || '',
                role: selectedProfile.role || 'Archer',
                usArcheryNumber: selectedProfile.usArcheryNumber || '',
                nfaaNumber: selectedProfile.nfaaNumber || '',
                sponsorships: selectedProfile.sponsorships || '',
                isMe: selectedProfile.isMe || false,
                isFavorite: selectedProfile.isFavorite || false,
                isActive: selectedProfile.isActive !== undefined ? selectedProfile.isActive : true
            });
        }
    }, [selectedProfile, isEditing]);

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
                        // Save to localStorage for offline access
                        localStorage.setItem('archerProfiles', JSON.stringify(loadedProfiles));
                    }
                } catch (error) {
                    console.error('Error loading from Firebase:', error);
                }
            }
            
            // Fallback to localStorage
            if (loadedProfiles.length === 0) {
                console.log('Loading from localStorage...');
                const savedProfiles = localStorage.getItem('archerProfiles');
                if (savedProfiles) {
                    loadedProfiles = JSON.parse(savedProfiles);
                    console.log('Profiles loaded from localStorage:', loadedProfiles);
                }
            }
            
            console.log('Final loaded profiles:', loadedProfiles);
            setProfiles(loadedProfiles);
            
            // Auto-select first profile if none selected
            if (loadedProfiles.length > 0 && !selectedProfile) {
                autoSelectProfile(loadedProfiles);
            }
            
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const autoSelectProfile = (loadedProfiles) => {
        // First priority: find profile tagged as "Me"
        let meProfile = loadedProfiles.find(profile => profile.isMe === true);
        
        // Second priority: try to match by email
        if (!meProfile && currentUser?.email) {
            meProfile = loadedProfiles.find(profile => 
                profile.email && profile.email.toLowerCase() === currentUser.email.toLowerCase()
            );
        }
        
        // Third priority: use the first profile
        if (!meProfile && loadedProfiles.length > 0) {
            meProfile = loadedProfiles[0];
        }
        
        if (meProfile) {
            console.log('Auto-selected profile:', meProfile);
            setSelectedProfile(meProfile);
            setCurrentProfileIndex(loadedProfiles.findIndex(p => p.id === meProfile.id));
        }
    };

    const selectProfile = (profile) => {
        console.log('=== SELECT PROFILE DEBUG ===');
        console.log('Profile selected:', profile);
        console.log('Current user:', currentUser);
        console.log('User preferences before:', localStorage.getItem('archer_edge_user_preferences'));
        
        setSelectedProfile(profile);
        setCurrentProfileIndex(profiles.findIndex(p => p.id === profile.id));
        setShowProfileSelection(false);
        setIsEditing(false);
        setIsCreating(false);
        
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
        setSelectedProfile(null);
        setIsEditing(true);
        setIsCreating(true);
        setShowProfileSelection(false);
        resetForm();
    };

    const saveProfile = async (profileData) => {
        try {
            setSaving(true);
            setSaveMessage('');
            
            console.log('=== SAVE PROFILE DEBUG ===');
            console.log('Saving profile data:', profileData);
            console.log('Current user:', currentUser);
            
            // Check for duplicates
            const duplicateCheck = checkForDuplicateProfile(profileData);
            if (duplicateCheck.isDuplicate) {
                setSaveMessage(`Error: ${duplicateCheck.message}`);
                return;
            }
            
            // Create profile object
            const profileToSave = {
                id: isCreating ? `profile_${Date.now()}` : selectedProfile.id,
                ...profileData,
                createdAt: isCreating ? new Date().toISOString() : selectedProfile.createdAt,
                updatedAt: new Date().toISOString(),
                createdBy: currentUser?.uid || 'profile-user',
                isActive: true
            };
            
            console.log('Profile to save:', profileToSave);
            
            // Save to localStorage
            const existingProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
            let updatedProfiles;
            
            if (isCreating) {
                updatedProfiles = [...existingProfiles, profileToSave];
            } else {
                updatedProfiles = existingProfiles.map(p => 
                    p.id === selectedProfile.id ? profileToSave : p
                );
            }
            
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            setProfiles(updatedProfiles);
            
            // Save to Firebase if possible
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    await saveProfileToFirebase(profileToSave, currentUser.uid);
                    console.log('Profile saved to Firebase successfully');
                } catch (error) {
                    console.error('Error saving to Firebase:', error);
                    setSaveMessage('Saved locally, but failed to sync to cloud');
                }
            }
            
            setSaveMessage('Profile saved successfully!');
            setIsEditing(false);
            setIsCreating(false);
            setSelectedProfile(profileToSave);
            
            // Update current profile index
            const newIndex = updatedProfiles.findIndex(p => p.id === profileToSave.id);
            setCurrentProfileIndex(newIndex);
            
            console.log('=== END SAVE PROFILE DEBUG ===');
            
            // Auto-select if this is the first profile
            if (updatedProfiles.length === 1) {
                selectProfile(profileToSave);
            }
            
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveMessage('Error saving profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const cleanupOrphanedScores = (deletedProfileId) => {
        try {
            // Clean up any scores associated with this profile
            const savedScores = localStorage.getItem('archerScores');
            if (savedScores) {
                const scores = JSON.parse(savedScores);
                const updatedScores = scores.filter(score => score.archerId !== deletedProfileId);
                localStorage.setItem('archerScores', JSON.stringify(updatedScores));
                console.log('Cleaned up orphaned scores for profile:', deletedProfileId);
            }
        } catch (error) {
            console.error('Error cleaning up orphaned scores:', error);
        }
    };

    const deleteProfile = async (profileId) => {
        if (!window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
            return;
        }
        
        try {
            console.log('=== DELETE PROFILE DEBUG ===');
            console.log('Deleting profile ID:', profileId);
            console.log('Current profiles count:', profiles.length);
            
            // Remove from localStorage
            const existingProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
            const updatedProfiles = existingProfiles.filter(p => p.id !== profileId);
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            setProfiles(updatedProfiles);
            
            console.log('Profiles after filtering:', updatedProfiles);
            console.log('=== END DELETE PROFILE DEBUG ===');
            
            // Remove from Firebase if possible
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    await deleteProfileFromFirebase(profileId, currentUser.uid);
                    console.log('Profile deleted from Firebase successfully');
                } catch (error) {
                    console.error('Error deleting from Firebase:', error);
                }
            }
            
            // Clean up orphaned scores
            cleanupOrphanedScores(profileId);
            
            // Update selected profile if the deleted one was selected
            if (selectedProfile && selectedProfile.id === profileId) {
                if (updatedProfiles.length > 0) {
                    setSelectedProfile(updatedProfiles[0]);
                    setCurrentProfileIndex(0);
                } else {
                    setSelectedProfile(null);
                    setCurrentProfileIndex(0);
                }
            }
            
            // Reload profiles to ensure sync
            setTimeout(() => {
                loadProfiles();
            }, 100);
            
        } catch (error) {
            console.error('Error deleting profile:', error);
        }
    };

    const handleViewStats = (profileId) => {
        onNavigate('archer-stats', { archerId: profileId });
    };

    const editProfile = (profile) => {
        console.log('Editing profile:', profile);
        setSelectedProfile(profile);
        setIsEditing(true);
        setIsCreating(false);
        setShowProfileSelection(false);
        setCurrentProfileIndex(profiles.findIndex(p => p.id === profile.id));
    };

    const resetForm = () => {
        setProfileForm({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            gender: 'M',
            school: '',
            grade: '',
            division: 'V',
            dominantHand: 'Right',
            dominantEye: 'Right',
            drawLength: '',
            bowType: 'Recurve ILF',
            bowLength: '66',
            bowWeight: '',
            varsityPR: '',
            jvPR: '',
            avgArrow: '',
            role: 'Archer',
            usArcheryNumber: '',
            nfaaNumber: '',
            sponsorships: '',
            isMe: false,
            isFavorite: false,
            isActive: true
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        saveProfile(profileForm);
    };

    const checkForDuplicateProfile = (profileData) => {
        const existingProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
        
        // Check for exact name match
        const nameMatch = existingProfiles.find(p => 
            p.firstName?.toLowerCase() === profileData.firstName?.toLowerCase() &&
            p.lastName?.toLowerCase() === profileData.lastName?.toLowerCase() &&
            p.id !== selectedProfile?.id
        );
        
        if (nameMatch) {
            return {
                isDuplicate: true,
                message: `A profile for ${profileData.firstName} ${profileData.lastName} already exists.`
            };
        }
        
        // Check for email match
        if (profileData.email) {
            const emailMatch = existingProfiles.find(p => 
                p.email?.toLowerCase() === profileData.email?.toLowerCase() &&
                p.id !== selectedProfile?.id
            );
            
            if (emailMatch) {
                return {
                    isDuplicate: true,
                    message: `A profile with email ${profileData.email} already exists.`
                };
            }
        }
        
        return { isDuplicate: false };
    };

    const handleInputChange = (field, value) => {
        setProfileForm(prev => ({ ...prev, [field]: value }));
    };

    const toggleTag = async (profileId, tagType) => {
        try {
            const existingProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
            const updatedProfiles = existingProfiles.map(profile => {
                if (profile.id === profileId) {
                    return {
                        ...profile,
                        [tagType]: !profile[tagType]
                    };
                }
                return profile;
            });
            
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            setProfiles(updatedProfiles);
            
            // Update selected profile if it's the one being modified
            if (selectedProfile && selectedProfile.id === profileId) {
                const updatedProfile = updatedProfiles.find(p => p.id === profileId);
                setSelectedProfile(updatedProfile);
            }
            
        } catch (error) {
            console.error('Error toggling tag:', error);
        }
    };

    const navigateToNextProfile = () => {
        if (currentProfileIndex < profiles.length - 1) {
            const nextProfile = profiles[currentProfileIndex + 1];
            selectProfile(nextProfile);
        }
    };

    const navigateToPrevProfile = () => {
        if (currentProfileIndex > 0) {
            const prevProfile = profiles[currentProfileIndex - 1];
            selectProfile(prevProfile);
        }
    };

    const updateCurrentProfileIndex = (profileId) => {
        const index = profiles.findIndex(p => p.id === profileId);
        if (index !== -1) {
            setCurrentProfileIndex(index);
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

    // Profile Selection View
    if (showProfileSelection) {
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
                                            <h3 className="font-semibold text-gray-900">
                                                {profile.firstName} {profile.lastName}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {profile.school || 'No School'} • {profile.role || 'Archer'}
                                            </p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                {profile.isMe && (
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                        Me
                                                    </span>
                                                )}
                                                {profile.isFavorite && (
                                                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                                        ⭐
                                                    </span>
                                                )}
                                            </div>
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
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteProfile(profile.id);
                                        }}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Delete
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
    }

    // Profile Edit/Create View
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => setShowProfileSelection(true)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            ← Back to Profiles
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {isCreating ? 'Create Profile' : 'Edit Profile'}
                        </h1>
                    </div>
                    <div className="text-sm text-gray-600">
                        {profiles.length > 0 && `${currentProfileIndex + 1} of ${profiles.length}`}
                    </div>
                </div>
            </div>

            {/* Action Buttons - Always at Top */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex space-x-3">
                    <button
                        onClick={handleFormSubmit}
                        disabled={saving}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button
                        onClick={() => setShowProfileSelection(true)}
                        className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
                {saveMessage && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                        saveMessage.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                        {saveMessage}
                    </div>
                )}
            </div>

            {/* Form Content */}
            <div className="p-4 space-y-4">
                <form onSubmit={handleFormSubmit}>
                    {/* Contact Information Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-blue-600 text-sm">👤</span>
                            </span>
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profileForm.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={profileForm.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={profileForm.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Archer Details Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-green-600 text-sm">🏹</span>
                            </span>
                            Archer Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Gender
                                </label>
                                <select
                                    value={profileForm.gender}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    School
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.school}
                                    onChange={(e) => handleInputChange('school', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Grade
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.grade}
                                    onChange={(e) => handleInputChange('grade', e.target.value)}
                                    placeholder="9, 10, 11, 12"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Division
                                </label>
                                <select
                                    value={profileForm.division}
                                    onChange={(e) => handleInputChange('division', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="V">Varsity</option>
                                    <option value="JV">Junior Varsity</option>
                                    <option value="MS">Middle School</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dominant Hand
                                </label>
                                <select
                                    value={profileForm.dominantHand}
                                    onChange={(e) => handleInputChange('dominantHand', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Right">Right</option>
                                    <option value="Left">Left</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Dominant Eye
                                </label>
                                <select
                                    value={profileForm.dominantEye}
                                    onChange={(e) => handleInputChange('dominantEye', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Right">Right</option>
                                    <option value="Left">Left</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Equipment Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-purple-600 text-sm">🎯</span>
                            </span>
                            Equipment
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bow Type
                                </label>
                                <select
                                    value={profileForm.bowType}
                                    onChange={(e) => handleInputChange('bowType', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Recurve ILF">Recurve ILF</option>
                                    <option value="Compound">Compound</option>
                                    <option value="Barebow">Barebow</option>
                                    <option value="Traditional">Traditional</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bow Length (inches)
                                </label>
                                <select
                                    value={profileForm.bowLength}
                                    onChange={(e) => handleInputChange('bowLength', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="62">62"</option>
                                    <option value="64">64"</option>
                                    <option value="66">66"</option>
                                    <option value="68">68"</option>
                                    <option value="70">70"</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Draw Length (inches)
                                </label>
                                <input
                                    type="number"
                                    value={profileForm.drawLength}
                                    onChange={(e) => handleInputChange('drawLength', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Bow Weight (lbs)
                                </label>
                                <input
                                    type="number"
                                    value={profileForm.bowWeight}
                                    onChange={(e) => handleInputChange('bowWeight', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role & Permissions Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <span className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-orange-600 text-sm">🔐</span>
                            </span>
                            Role & Permissions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role
                                </label>
                                <select
                                    value={profileForm.role}
                                    onChange={(e) => handleInputChange('role', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="Archer">Archer</option>
                                    <option value="Team Captain">Team Captain</option>
                                    <option value="Coach">Coach</option>
                                    <option value="Referee">Referee</option>
                                    <option value="Event Manager">Event Manager</option>
                                    <option value="System Admin">System Admin</option>
                                </select>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={profileForm.isMe}
                                        onChange={(e) => handleInputChange('isMe', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Mark as "Me"</span>
                                </label>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={profileForm.isFavorite}
                                        onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Favorite</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileManagement; 