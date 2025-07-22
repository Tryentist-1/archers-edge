import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    saveProfileToFirebase, 
    loadProfilesFromFirebase, 
    deleteProfileFromFirebase,
    isOnline 
} from '../services/firebaseService';

const ProfileManagement = ({ onNavigate }) => {
    const { currentUser } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        profileType: 'Compound', // Compound, Recurve, Youth, etc.
        dominantHand: 'Right',
        dominantEye: 'Right',
        bowWeight: '',
        drawLength: '',
        usArcheryNumber: '',
        nfaaNumber: '',
        defaultClassification: 'Varsity', // Varsity, JV, JOAD, NFAA classes
        sponsorships: '',
        profilePicture: null
    });

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            setLoading(true);
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

    const saveProfile = async (profileData) => {
        try {
            console.log('Saving profile:', profileData);
            console.log('Current user:', currentUser);
            console.log('Is online:', isOnline());
            
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
                    ...profileData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                updatedProfiles = [...profiles, profileToSave];
                console.log('Creating new profile:', profileToSave);
            }

            setProfiles(updatedProfiles);
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            console.log('Profile saved to localStorage');
            
            // Sync to Firebase if online
            if (isOnline() && currentUser) {
                try {
                    console.log('Attempting to sync to Firebase...');
                    await saveProfileToFirebase(profileToSave, currentUser.uid);
                    console.log('Profile synced to Firebase successfully');
                } catch (error) {
                    console.error('Error syncing to Firebase:', error);
                    // Don't throw error, just log it
                }
            } else {
                console.log('Skipping Firebase sync - offline or no user');
            }
            
            setIsEditing(false);
            setIsCreating(false);
            setSelectedProfile(null);
            resetForm();
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    };

    const deleteProfile = async (profileId) => {
        try {
            const updatedProfiles = profiles.filter(p => p.id !== profileId);
            setProfiles(updatedProfiles);
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            
            // Sync to Firebase if online
            if (isOnline() && currentUser) {
                try {
                    await deleteProfileFromFirebase(profileId);
                    console.log('Profile deleted from Firebase');
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
            profileType: profile.profileType || 'Compound',
            dominantHand: profile.dominantHand || 'Right',
            dominantEye: profile.dominantEye || 'Right',
            bowWeight: profile.bowWeight || '',
            drawLength: profile.drawLength || '',
            usArcheryNumber: profile.usArcheryNumber || '',
            nfaaNumber: profile.nfaaNumber || '',
            defaultClassification: profile.defaultClassification || 'Varsity',
            sponsorships: profile.sponsorships || '',
            profilePicture: profile.profilePicture || null
        });
        setIsEditing(true);
        setIsCreating(false);
    };

    const createNewProfile = () => {
        resetForm();
        setIsCreating(true);
        setIsEditing(false);
        setSelectedProfile(null);
    };

    const resetForm = () => {
        setProfileForm({
            firstName: '',
            lastName: '',
            profileType: 'Compound',
            dominantHand: 'Right',
            dominantEye: 'Right',
            bowWeight: '',
            drawLength: '',
            usArcheryNumber: '',
            nfaaNumber: '',
            defaultClassification: 'Varsity',
            sponsorships: '',
            profilePicture: null
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        saveProfile(profileForm);
    };

    const handleInputChange = (field, value) => {
        setProfileForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="w-full px-4">
                    <div className="flex justify-between items-center h-14">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Your Profile</h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => onNavigate('home')}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                            >
                                Home
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4">
                {!isCreating && !isEditing ? (
                    // Profile List View
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Archer Profiles</h2>
                            <button
                                onClick={createNewProfile}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                            >
                                + New Profile
                            </button>
                        </div>

                        {profiles.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">No profiles yet</h3>
                                <p className="text-gray-600 mb-4">Create your first archer profile to get started</p>
                                <button
                                    onClick={createNewProfile}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    + New Profile
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {profiles.map(profile => (
                                    <div key={profile.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <span className="text-blue-600 font-semibold">
                                                            {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-800">
                                                            {profile.firstName} {profile.lastName}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {profile.profileType} • {profile.defaultClassification}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Hand/Eye:</span>
                                                        <span className="ml-1">{profile.dominantHand}/{profile.dominantEye}</span>
                                                    </div>
                                                    {profile.bowWeight && (
                                                        <div>
                                                            <span className="text-gray-500">Bow:</span>
                                                            <span className="ml-1">{profile.bowWeight}#</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => editProfile(profile)}
                                                    className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => deleteProfile(profile.id)}
                                                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // Profile Form
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditing ? 'Edit Profile' : 'Create New Profile'}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setIsCreating(false);
                                    setSelectedProfile(null);
                                    resetForm();
                                }}
                                className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            {/* Basic Information */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Type</label>
                                        <select
                                            value={profileForm.profileType}
                                            onChange={(e) => handleInputChange('profileType', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="Compound">Compound</option>
                                            <option value="Recurve">Recurve</option>
                                            <option value="Youth">Youth</option>
                                            <option value="Traditional">Traditional</option>
                                            <option value="Barebow">Barebow</option>
                                        </select>
                                    </div>
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
                                </div>
                            </div>

                            {/* Equipment Information */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Equipment & Physical</h3>
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
                                            placeholder="e.g., 28.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Membership Information */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Membership & Sponsorships</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">US Archery Number</label>
                                        <input
                                            type="text"
                                            value={profileForm.usArcheryNumber}
                                            onChange={(e) => handleInputChange('usArcheryNumber', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 123456"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">NFAA Number</label>
                                        <input
                                            type="text"
                                            value={profileForm.nfaaNumber}
                                            onChange={(e) => handleInputChange('nfaaNumber', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., 123456"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sponsorships</label>
                                        <textarea
                                            value={profileForm.sponsorships}
                                            onChange={(e) => handleInputChange('sponsorships', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows="3"
                                            placeholder="List any sponsors or supporters..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setIsCreating(false);
                                        setSelectedProfile(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {isEditing ? 'Update Profile' : 'Create Profile'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProfileManagement; 