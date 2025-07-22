import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    saveProfileToFirebase, 
    loadProfilesFromFirebase, 
    deleteProfileFromFirebase,
    isOnline 
} from '../services/firebaseService';

const ProfileManagement = ({ onNavigate, onProfileSelect, selectedProfile: appSelectedProfile }) => {
    const { currentUser } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showProfileSelection, setShowProfileSelection] = useState(true);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        role: 'Archer', // Archer, Team Captain, Coach, Referee, Event Manager, System Admin
        profileType: 'Compound', // Compound, Recurve, Youth, etc.
        dominantHand: 'Right',
        dominantEye: 'Right',
        bowWeight: '',
        drawLength: '',
        usArcheryNumber: '',
        nfaaNumber: '',
        defaultClassification: 'Varsity', // Varsity, JV, JOAD, NFAA classes
        sponsorships: ''
    });

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
            
            // Try to load from Firebase first if online
            if (isOnline() && currentUser) {
                try {
                    console.log('Attempting to load from Firebase...');
                    const firebaseProfiles = await loadProfilesFromFirebase(currentUser.uid);
                    console.log('Profiles loaded from Firebase:', firebaseProfiles);
                    setProfiles(firebaseProfiles);
                    localStorage.setItem('archerProfiles', JSON.stringify(firebaseProfiles));
                } catch (error) {
                    console.error('Error loading from Firebase, falling back to local:', error);
                }
            } else {
                console.log('Skipping Firebase load - offline or no user');
            }
            
            // Fallback to local storage
            const savedProfiles = localStorage.getItem('archerProfiles');
            console.log('Raw localStorage data:', savedProfiles);
            if (savedProfiles) {
                const parsedProfiles = JSON.parse(savedProfiles);
                console.log('Profiles loaded from localStorage:', parsedProfiles);
                setProfiles(parsedProfiles);
            } else {
                console.log('No profiles found in localStorage');
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-select profile based on user info
    const autoSelectProfile = () => {
        if (!currentUser || profiles.length === 0) return;

        // Try to match by email first
        const emailMatch = profiles.find(profile => 
            profile.email && profile.email.toLowerCase() === currentUser.email?.toLowerCase()
        );
        if (emailMatch) {
            setSelectedProfile(emailMatch);
            setShowProfileSelection(false);
            return;
        }

        // Try to match by display name
        if (currentUser.displayName) {
            const nameMatch = profiles.find(profile => {
                const profileName = `${profile.firstName} ${profile.lastName}`.toLowerCase();
                const userName = currentUser.displayName.toLowerCase();
                return profileName.includes(userName) || userName.includes(profileName);
            });
            if (nameMatch) {
                setSelectedProfile(nameMatch);
                setShowProfileSelection(false);
                return;
            }
        }

        // If no match found, show selection
        setShowProfileSelection(true);
    };

    useEffect(() => {
        if (!loading && profiles.length > 0) {
            autoSelectProfile();
        }
    }, [loading, profiles, currentUser]);

    // Debug profileForm state
    useEffect(() => {
        console.log('ProfileForm state changed:', profileForm);
    }, [profileForm]);

    const selectProfile = (profile) => {
        setSelectedProfile(profile);
        setShowProfileSelection(false);
        setIsEditing(false);
        setIsCreating(false);
        if (onProfileSelect) {
            onProfileSelect(profile);
        }
    };

    const createNewProfile = () => {
        console.log('=== CREATE NEW PROFILE DEBUG ===');
        setSelectedProfile(null);
        setShowProfileSelection(false);
        setIsCreating(true);
        setIsEditing(false);
        resetForm();
        console.log('Form reset, isCreating:', true, 'isEditing:', false);
    };

    const saveProfile = async (profileData) => {
        try {
            console.log('=== SAVE PROFILE DEBUG ===');
            console.log('Profile data to save:', profileData);
            console.log('Current user:', currentUser);
            console.log('Is online:', isOnline());
            console.log('Is editing:', isEditing);
            console.log('Is creating:', isCreating);
            console.log('Selected profile:', selectedProfile);
            
            let updatedProfiles;
            let profileToSave;
            
            if (isEditing && selectedProfile) {
                // Update existing profile
                profileToSave = { ...selectedProfile, ...profileData };
                updatedProfiles = profiles.map(p => 
                    p.id === selectedProfile.id ? profileToSave : p
                );
                console.log('Updating existing profile:', profileToSave);
            } else {
                // Create new profile
                profileToSave = {
                    id: Date.now().toString(),
                    userId: currentUser.uid,
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    ...profileData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                updatedProfiles = [...profiles, profileToSave];
                console.log('Creating new profile:', profileToSave);
            }
            
            // Save to local storage
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            setProfiles(updatedProfiles);
            
            // Save to Firebase if online
            if (isOnline() && currentUser) {
                try {
                    await saveProfileToFirebase(profileToSave, currentUser.uid);
                    console.log('Profile saved to Firebase successfully');
                } catch (error) {
                    console.error('Error saving to Firebase:', error);
                }
            }
            
            // Set as selected profile
            setSelectedProfile(profileToSave);
            setIsCreating(false);
            setIsEditing(false);
            
            // Notify parent component
            if (onProfileSelect) {
                onProfileSelect(profileToSave);
            }
            
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    };

    const deleteProfile = async (profileId) => {
        if (!window.confirm('Are you sure you want to delete this profile?')) {
            return;
        }
        
        try {
            const updatedProfiles = profiles.filter(p => p.id !== profileId);
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            setProfiles(updatedProfiles);
            
            if (selectedProfile && selectedProfile.id === profileId) {
                setSelectedProfile(null);
                setShowProfileSelection(true);
            }
            
            // Delete from Firebase if online
            if (isOnline() && currentUser) {
                try {
                    await deleteProfileFromFirebase(profileId, currentUser.uid);
                    console.log('Profile deleted from Firebase successfully');
                } catch (error) {
                    console.error('Error deleting from Firebase:', error);
                }
            }
        } catch (error) {
            console.error('Error deleting profile:', error);
        }
    };

    const editProfile = (profile) => {
        setSelectedProfile(profile);
        setProfileForm({
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            role: profile.role || 'Archer',
            profileType: profile.profileType || 'Compound',
            dominantHand: profile.dominantHand || 'Right',
            dominantEye: profile.dominantEye || 'Right',
            bowWeight: profile.bowWeight || '',
            drawLength: profile.drawLength || '',
            usArcheryNumber: profile.usArcheryNumber || '',
            nfaaNumber: profile.nfaaNumber || '',
            defaultClassification: profile.defaultClassification || 'Varsity',
            sponsorships: profile.sponsorships || ''
        });
        setIsEditing(true);
        setIsCreating(false);
        setShowProfileSelection(false);
    };

    const resetForm = () => {
        console.log('=== RESET FORM DEBUG ===');
        const resetData = {
            firstName: '',
            lastName: '',
            role: 'Archer',
            profileType: 'Compound',
            dominantHand: 'Right',
            dominantEye: 'Right',
            bowWeight: '',
            drawLength: '',
            usArcheryNumber: '',
            nfaaNumber: '',
            defaultClassification: 'Varsity',
            sponsorships: ''
        };
        console.log('Resetting form to:', resetData);
        setProfileForm(resetData);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        console.log('=== FORM SUBMIT DEBUG ===');
        console.log('Form data:', profileForm);
        console.log('Form event:', e);
        saveProfile(profileForm);
    };

    const handleInputChange = (field, value) => {
        console.log('Input change:', field, value);
        setProfileForm(prev => {
            const newForm = { ...prev, [field]: value };
            console.log('Updated form:', newForm);
            return newForm;
        });
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading profiles...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Profile Selection Screen
    if (showProfileSelection) {
        return (
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Your Profile</h2>
                        <button
                            onClick={() => onNavigate('home')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Go to Home
                        </button>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Select Your Profile</h3>
                        <p className="text-gray-600 mb-4">
                            Choose your existing profile or create a new one to get started.
                        </p>
                    </div>

                    {profiles.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-md font-medium text-gray-700 mb-3">Your Profiles:</h4>
                            <div className="grid gap-3">
                                {profiles.map(profile => (
                                    <div
                                        key={profile.id}
                                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => selectProfile(profile)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h5 className="font-medium text-gray-900">
                                                    {profile.firstName} {profile.lastName}
                                                </h5>
                                                <p className="text-sm text-gray-600">
                                                    {profile.role} • {profile.profileType} • {profile.defaultClassification}
                                                </p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        editProfile(profile);
                                                    }}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteProfile(profile.id);
                                                    }}
                                                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t pt-6">
                        <button
                            onClick={createNewProfile}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                            + Create New Profile
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Profile Form Screen
    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {isCreating ? 'Create New Profile' : 'Edit Profile'}
                    </h2>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setShowProfileSelection(true)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Back to Profiles
                        </button>
                        <button
                            onClick={() => onNavigate('home')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>

                <form 
                    key={`${isCreating ? 'create' : 'edit'}-${selectedProfile?.id || 'new'}`}
                    onSubmit={handleFormSubmit} 
                    className="space-y-6"
                >
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                type="text"
                                value={profileForm.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                value={profileForm.lastName}
                                onChange={(e) => handleInputChange('lastName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    {/* Role and Profile Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                value={profileForm.role}
                                onChange={(e) => handleInputChange('role', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Archer">Archer</option>
                                <option value="Team Captain">Team Captain</option>
                                <option value="Coach">Coach</option>
                                <option value="Referee">Referee</option>
                                <option value="Event Manager">Event Manager</option>
                                <option value="System Admin">System Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Type</label>
                            <select
                                value={profileForm.profileType}
                                onChange={(e) => handleInputChange('profileType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Compound">Compound</option>
                                <option value="Recurve">Recurve</option>
                                <option value="Barebow">Barebow</option>
                                <option value="Traditional">Traditional</option>
                                <option value="Youth">Youth</option>
                            </select>
                        </div>
                    </div>

                    {/* Physical Characteristics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dominant Hand</label>
                            <select
                                value={profileForm.dominantHand}
                                onChange={(e) => handleInputChange('dominantHand', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Right">Right</option>
                                <option value="Left">Left</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dominant Eye</label>
                            <select
                                value={profileForm.dominantEye}
                                onChange={(e) => handleInputChange('dominantEye', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Right">Right</option>
                                <option value="Left">Left</option>
                            </select>
                        </div>
                    </div>

                    {/* Equipment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bow Weight (lbs)</label>
                            <input
                                type="number"
                                value={profileForm.bowWeight}
                                onChange={(e) => handleInputChange('bowWeight', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 45"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Draw Length (inches)</label>
                            <input
                                type="number"
                                value={profileForm.drawLength}
                                onChange={(e) => handleInputChange('drawLength', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., 28"
                            />
                        </div>
                    </div>

                    {/* Membership Numbers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">US Archery Number</label>
                            <input
                                type="text"
                                value={profileForm.usArcheryNumber}
                                onChange={(e) => handleInputChange('usArcheryNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Optional"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">NFAA Number</label>
                            <input
                                type="text"
                                value={profileForm.nfaaNumber}
                                onChange={(e) => handleInputChange('nfaaNumber', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    {/* Classification and Sponsorships */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Default Classification</label>
                            <select
                                value={profileForm.defaultClassification}
                                onChange={(e) => handleInputChange('defaultClassification', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Varsity">Varsity</option>
                                <option value="Junior Varsity">Junior Varsity</option>
                                <option value="JOAD">JOAD</option>
                                <option value="NFAA">NFAA</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sponsorships</label>
                            <input
                                type="text"
                                value={profileForm.sponsorships}
                                onChange={(e) => handleInputChange('sponsorships', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Optional sponsorships"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => setShowProfileSelection(true)}
                            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {isCreating ? 'Create Profile' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileManagement; 