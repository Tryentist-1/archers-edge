import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    loadProfilesFromFirebase, 
    saveProfileToFirebase, 
    shouldUseFirebase 
} from '../services/firebaseService';

const NewArcherStartup = ({ onComplete, onSkip }) => {
    const { currentUser } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [showCreateProfile, setShowCreateProfile] = useState(false);
    const [newProfileData, setNewProfileData] = useState({
        firstName: '',
        lastName: '',
        email: currentUser?.email || '',
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
        isMe: true,
        isFavorite: false,
        isActive: true
    });

    useEffect(() => {
        loadProfiles();
    }, [currentUser]);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            let loadedProfiles = [];
            
            // Try to load from Firebase first
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    const firebaseProfiles = await loadProfilesFromFirebase(currentUser.uid);
                    if (firebaseProfiles && firebaseProfiles.length > 0) {
                        loadedProfiles = firebaseProfiles;
                        localStorage.setItem('archerProfiles', JSON.stringify(firebaseProfiles));
                    }
                } catch (error) {
                    console.error('Error loading from Firebase:', error);
                }
            }
            
            // Fallback to localStorage
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

            // Auto-select profile if email matches
            if (currentUser?.email) {
                const matchingProfile = sortedProfiles.find(profile => 
                    profile.email && profile.email.toLowerCase() === currentUser.email.toLowerCase()
                );
                if (matchingProfile) {
                    setSelectedProfile(matchingProfile);
                }
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSelect = (profile) => {
        setSelectedProfile(profile);
    };

    const handleCreateProfile = () => {
        setShowCreateProfile(true);
    };

    const handleNewProfileChange = (field, value) => {
        setNewProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleCreateNewProfile = async () => {
        if (!newProfileData.firstName || !newProfileData.lastName) {
            alert('Please enter your first and last name');
            return;
        }

        try {
            const newProfile = {
                ...newProfileData,
                id: Date.now().toString(),
                userId: currentUser?.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to Firebase if online
            if (shouldUseFirebase(currentUser?.uid)) {
                await saveProfileToFirebase(newProfile, currentUser.uid);
            }

            // Save to localStorage
            const updatedProfiles = [...profiles, newProfile];
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));

            setSelectedProfile(newProfile);
            setShowCreateProfile(false);
            setProfiles(updatedProfiles);
        } catch (error) {
            console.error('Error creating profile:', error);
            alert('Error creating profile. Please try again.');
        }
    };

    const handleContinue = () => {
        if (!selectedProfile) {
            alert('Please select or create your profile first');
            return;
        }

        // Update the selected profile as "Me" profile
        const updatedProfiles = profiles.map(profile => ({
            ...profile,
            isMe: profile.id === selectedProfile.id
        }));

        // Save updated profiles
        localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
        
        // Mark first login as completed
        localStorage.setItem('firstLoginCompleted', 'true');
        
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

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        Welcome to Archer's Edge! 🏹
                    </h1>
                    <p className="text-gray-600">
                        Let's identify your profile to get you started with scoring and tracking your progress.
                    </p>
                </div>

                {!showCreateProfile ? (
                    <div>
                        {/* Existing Profiles Section */}
                        {profiles.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                    Select Your Profile
                                </h2>
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {profiles.map(profile => (
                                        <div
                                            key={profile.id}
                                            className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                                selectedProfile?.id === profile.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                            onClick={() => handleProfileSelect(profile)}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-4 h-4 rounded-full border-2 ${
                                                    selectedProfile?.id === profile.id
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedProfile?.id === profile.id && (
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

                        {/* Create New Profile Option */}
                        <div className="border-t pt-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                {profiles.length > 0 ? 'Or Create a New Profile' : 'Create Your Profile'}
                            </h2>
                            <button
                                onClick={handleCreateProfile}
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                {profiles.length > 0 ? 'Create New Profile' : 'Create My Profile'}
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4 mt-8">
                            <button
                                onClick={handleSkip}
                                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Skip for Now
                            </button>
                            <button
                                onClick={handleContinue}
                                disabled={!selectedProfile}
                                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                                    selectedProfile
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Create Profile Form */}
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Create Your Profile
                        </h2>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newProfileData.firstName}
                                        onChange={(e) => handleNewProfileChange('firstName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newProfileData.lastName}
                                        onChange={(e) => handleNewProfileChange('lastName', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter last name"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={newProfileData.email}
                                        onChange={(e) => handleNewProfileChange('email', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter email"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={newProfileData.phone}
                                        onChange={(e) => handleNewProfileChange('phone', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter phone"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gender
                                    </label>
                                    <select
                                        value={newProfileData.gender}
                                        onChange={(e) => handleNewProfileChange('gender', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Division
                                    </label>
                                    <select
                                        value={newProfileData.division}
                                        onChange={(e) => handleNewProfileChange('division', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="V">Varsity</option>
                                        <option value="JV">Junior Varsity</option>
                                        <option value="MS">Middle School</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bow Type
                                    </label>
                                    <select
                                        value={newProfileData.bowType}
                                        onChange={(e) => handleNewProfileChange('bowType', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Recurve ILF">Recurve ILF</option>
                                        <option value="Compound">Compound</option>
                                        <option value="Barebow">Barebow</option>
                                        <option value="Traditional">Traditional</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    School
                                </label>
                                <input
                                    type="text"
                                    value={newProfileData.school}
                                    onChange={(e) => handleNewProfileChange('school', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter school or club name"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-4 mt-8">
                            <button
                                onClick={() => setShowCreateProfile(false)}
                                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleCreateNewProfile}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Create Profile
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewArcherStartup; 