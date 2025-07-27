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
        gender: 'M', // M, F
        school: '',
        grade: '',
        division: 'V', // V (Varsity), JV (Junior Varsity), MS (Middle School)
        dominantHand: 'Right',
        dominantEye: 'Right',
        drawLength: '',
        bowType: 'Recurve ILF', // Recurve ILF, Compound, Barebow, Traditional
        bowLength: '66', // 62, 64, 66, 68, 70
        bowWeight: '',
        varsityPR: '',
        jvPR: '',
        avgArrow: '',
        role: 'Archer', // Archer, Team Captain, Coach, Referee, Event Manager, System Admin
        usArcheryNumber: '',
        nfaaNumber: '',
        sponsorships: '',
        isMe: false, // Tag as "Me"
        isFavorite: false, // Tag as "Favorite"
        isActive: true // Active/Inactive status
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
                    const firebaseProfiles = await loadProfilesFromFirebase(currentUser.uid);
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

    // Update form when selected profile changes (for both selection and editing)
    useEffect(() => {
        if (selectedProfile && !isCreating) {
            console.log('=== POPULATE FORM DEBUG ===');
            console.log('Selected profile:', selectedProfile);
            console.log('isEditing:', isEditing);
            console.log('isCreating:', isCreating);
            
            const formData = {
                firstName: selectedProfile.firstName || '',
                lastName: selectedProfile.lastName || '',
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
                role: selectedProfile.role || 'Archer',
                usArcheryNumber: selectedProfile.usArcheryNumber || '',
                nfaaNumber: selectedProfile.nfaaNumber || '',
                sponsorships: selectedProfile.sponsorships || '',
                isMe: selectedProfile.isMe || false,
                isFavorite: selectedProfile.isFavorite || false
            };
            console.log('Setting form data:', formData);
            setProfileForm(formData);
        }
    }, [selectedProfile, isEditing, isCreating]);

    // Debug profileForm state
    useEffect(() => {
        console.log('ProfileForm state changed:', profileForm);
        console.log('Current selectedProfile:', selectedProfile);
        console.log('isEditing:', isEditing);
        console.log('isCreating:', isCreating);
    }, [profileForm, selectedProfile, isEditing, isCreating]);

    const selectProfile = (profile) => {
        console.log('=== SELECT PROFILE DEBUG ===');
        console.log('Selecting profile:', profile);
        setSelectedProfile(profile);
        setShowProfileSelection(false);
        setIsEditing(false);
        setIsCreating(false);
        updateCurrentProfileIndex(profile.id);
        
        // Populate form with selected profile data
        const formData = {
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            gender: profile.gender || 'M',
            school: profile.school || '',
            grade: profile.grade || '',
            division: profile.division || profile.defaultClassification || 'V',
            dominantHand: profile.dominantHand || 'Right',
            dominantEye: profile.dominantEye || 'Right',
            drawLength: profile.drawLength || '',
            bowType: profile.bowType || profile.profileType || 'Recurve ILF',
            bowLength: profile.bowLength || '66',
            bowWeight: profile.bowWeight || '',
            role: profile.role || 'Archer',
            usArcheryNumber: profile.usArcheryNumber || '',
            nfaaNumber: profile.nfaaNumber || '',
            sponsorships: profile.sponsorships || '',
            isMe: profile.isMe || false,
            isFavorite: profile.isFavorite || false
        };
        console.log('Setting form data for selected profile:', formData);
        setProfileForm(formData);
        
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
        // Prevent duplicate submissions
        if (saving) {
            console.log('Save already in progress, ignoring duplicate click');
            return;
        }

        try {
            setSaving(true);
            setSaveMessage('');
            
            console.log('=== SAVE PROFILE DEBUG ===');
            console.log('Profile data to save:', profileData);
            console.log('Current user:', currentUser);
            console.log('Is online:', isOnline());
            console.log('Is editing:', isEditing);
            console.log('Is creating:', isCreating);
            console.log('Selected profile:', selectedProfile);
            
            // Validate required fields
            if (!profileData.firstName?.trim() || !profileData.lastName?.trim()) {
                setSaveMessage('❌ First name and last name are required.');
                setSaving(false);
                return;
            }
            
            // Check for duplicates (only when creating new profiles)
            if (isCreating) {
                const duplicateError = checkForDuplicateProfile(profileData);
                if (duplicateError) {
                    setSaveMessage(`❌ ${duplicateError}`);
                    setSaving(false);
                    return;
                }
            }
            
            let updatedProfiles;
            let profileToSave;
            
            if (isEditing && selectedProfile) {
                // Update existing profile
                profileToSave = { 
                    ...selectedProfile, 
                    ...profileData,
                    updatedAt: new Date().toISOString()
                };
                updatedProfiles = profiles.map(p => 
                    p.id === selectedProfile.id ? profileToSave : p
                );
                console.log('=== UPDATE EXISTING PROFILE ===');
                console.log('Selected profile ID:', selectedProfile.id);
                console.log('Profile to save:', profileToSave);
                console.log('Updated profiles count:', updatedProfiles.length);
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
                console.log('=== CREATE NEW PROFILE ===');
                console.log('New profile:', profileToSave);
                console.log('Updated profiles count:', updatedProfiles.length);
            }
            
            // Save to local storage
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            setProfiles(updatedProfiles);
            
            // Save to Firebase if online and not mock user
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    await saveProfileToFirebase(profileToSave, currentUser.uid);
                    console.log('Profile saved to Firebase successfully');
                } catch (error) {
                    console.error('Error saving to Firebase:', error);
                }
            } else {
                console.log('Skipping Firebase save - offline or mock user');
            }
            
            // Set as selected profile
            setSelectedProfile(profileToSave);
            
            // Show success message with better feedback
            if (isCreating) {
                setSaveMessage(`✅ Profile created successfully for ${profileToSave.firstName} ${profileToSave.lastName}!`);
                
                // For new profiles, navigate back to profile list after short delay
                setTimeout(() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setShowProfileSelection(true);
                    setSaveMessage('');
                }, 2000);
            } else {
                setSaveMessage(`✅ Profile updated successfully for ${profileToSave.firstName} ${profileToSave.lastName}!`);
                setIsEditing(false);
                
                // Clear message after delay
                setTimeout(() => setSaveMessage(''), 4000);
            }
            
            // Notify parent component
            if (onProfileSelect) {
                onProfileSelect(profileToSave);
            }
            
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveMessage(`❌ Error saving profile: ${error.message}. Please try again.`);
        } finally {
            setSaving(false);
        }
    };

    const cleanupOrphanedScores = (deletedProfileId) => {
        try {
            // Clean up bale data that references the deleted profile
            const baleData = localStorage.getItem('baleData');
            if (baleData) {
                const parsedBaleData = JSON.parse(baleData);
                if (parsedBaleData && parsedBaleData.archers) {
                    // Remove the deleted profile from archers list
                    const updatedArchers = parsedBaleData.archers.filter(
                        archer => archer.id !== deletedProfileId
                    );
                    
                    if (updatedArchers.length !== parsedBaleData.archers.length) {
                        const updatedBaleData = {
                            ...parsedBaleData,
                            archers: updatedArchers
                        };
                        localStorage.setItem('baleData', JSON.stringify(updatedBaleData));
                        console.log('Cleaned up bale data for deleted profile');
                    }
                }
            }
            
            // Clean up app state that references the deleted profile
            const appState = localStorage.getItem('appState');
            if (appState) {
                const parsedAppState = JSON.parse(appState);
                if (parsedAppState && parsedAppState.selectedProfile && 
                    parsedAppState.selectedProfile.id === deletedProfileId) {
                    // Clear the selected profile if it was the deleted one
                    const updatedAppState = {
                        ...parsedAppState,
                        selectedProfile: null
                    };
                    localStorage.setItem('appState', JSON.stringify(updatedAppState));
                    console.log('Cleaned up app state for deleted profile');
                }
            }
        } catch (error) {
            console.error('Error cleaning up orphaned scores:', error);
        }
    };

    const deleteProfile = async (profileId) => {
        console.log('=== DELETE PROFILE DEBUG ===');
        console.log('Deleting profile ID:', profileId);
        console.log('Current profiles count:', profiles.length);
        
        if (!window.confirm('Are you sure you want to delete this profile? This will also remove any associated score records.')) {
            console.log('Delete cancelled by user');
            return;
        }
        
        try {
            const updatedProfiles = profiles.filter(p => p.id !== profileId);
            console.log('Profiles after filtering:', updatedProfiles.length);
            
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            setProfiles(updatedProfiles);
            
            // Clean up orphaned score records
            cleanupOrphanedScores(profileId);
            
            if (selectedProfile && selectedProfile.id === profileId) {
                setSelectedProfile(null);
                setShowProfileSelection(true);
            }
            
            // Delete from Firebase if online and not mock user
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    await deleteProfileFromFirebase(profileId, currentUser.uid);
                    console.log('Profile deleted from Firebase successfully');
                } catch (error) {
                    console.error('Error deleting from Firebase:', error);
                }
            } else {
                console.log('Skipping Firebase delete - offline or mock user');
            }
            
            console.log('Profile deletion completed successfully');
            
            // Reload data to ensure sync with other components
            setTimeout(() => {
                loadProfiles();
            }, 100);
        } catch (error) {
            console.error('Error deleting profile:', error);
        }
    };

    const handleViewStats = (profileId) => {
        // Navigate to archer stats view
        if (onNavigate) {
            onNavigate('archer-stats', { archerId: profileId });
        }
    };

    const editProfile = (profile) => {
        console.log('=== EDIT PROFILE DEBUG ===');
        console.log('Editing profile:', profile);
        setSelectedProfile(profile);
        
        // Reset form with profile data
        const formData = {
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            gender: profile.gender || 'M',
            school: profile.school || '',
            grade: profile.grade || '',
            division: profile.division || profile.defaultClassification || 'V',
            dominantHand: profile.dominantHand || 'Right',
            dominantEye: profile.dominantEye || 'Right',
            drawLength: profile.drawLength || '',
            bowType: profile.bowType || profile.profileType || 'Recurve ILF',
            bowLength: profile.bowLength || '66',
            bowWeight: profile.bowWeight || '',
            role: profile.role || 'Archer',
            usArcheryNumber: profile.usArcheryNumber || '',
            nfaaNumber: profile.nfaaNumber || '',
            sponsorships: profile.sponsorships || '',
            isMe: profile.isMe || false,
            isFavorite: profile.isFavorite || false
        };
        console.log('Setting form data for editing:', formData);
        setProfileForm(formData);
        
        setIsEditing(true);
        setIsCreating(false);
        setShowProfileSelection(false);
    };

    const resetForm = () => {
        console.log('=== RESET FORM DEBUG ===');
        const resetData = {
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
        };
        console.log('Resetting form to:', resetData);
        setProfileForm(resetData);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        // Prevent double submission
        if (saving) {
            console.log('Form submission blocked - save in progress');
            return;
        }
        
        console.log('=== FORM SUBMIT DEBUG ===');
        console.log('Form data:', profileForm);
        console.log('Form event:', e);
        
        // Show immediate feedback
        setSaveMessage('⏳ Saving profile...');
        
        saveProfile(profileForm);
    };

    const checkForDuplicateProfile = (profileData) => {
        const { firstName, lastName, email } = profileData;
        
        console.log('=== DUPLICATE CHECK DEBUG ===');
        console.log('Checking profile data:', profileData);
        console.log('Current selected profile:', selectedProfile);
        console.log('Is editing:', isEditing);
        console.log('Is creating:', isCreating);
        
        // Check for exact name match (excluding current profile if editing)
        const nameMatch = profiles.find(profile => {
            const nameMatches = profile.firstName?.toLowerCase() === firstName?.toLowerCase() &&
                               profile.lastName?.toLowerCase() === lastName?.toLowerCase();
            const isCurrentProfile = profile.id === selectedProfile?.id;
            
            console.log(`Profile ${profile.id}: nameMatches=${nameMatches}, isCurrentProfile=${isCurrentProfile}`);
            
            return nameMatches && !isCurrentProfile;
        });
        
        if (nameMatch) {
            console.log('Name duplicate found:', nameMatch);
            return `A profile for ${firstName} ${lastName} already exists.`;
        }
        
        // Check for email match (if email is provided)
        if (email) {
            const emailMatch = profiles.find(profile => {
                const emailMatches = profile.email?.toLowerCase() === email?.toLowerCase();
                const isCurrentProfile = profile.id === selectedProfile?.id;
                
                console.log(`Profile ${profile.id}: emailMatches=${emailMatches}, isCurrentProfile=${isCurrentProfile}`);
                
                return emailMatches && !isCurrentProfile;
            });
            
            if (emailMatch) {
                console.log('Email duplicate found:', emailMatch);
                return `A profile with email ${email} already exists.`;
            }
        }
        
        console.log('No duplicates found');
        return null;
    };

    const handleInputChange = (field, value) => {
        console.log('Input change:', field, value);
        setProfileForm(prev => {
            const newForm = { ...prev, [field]: value };
            console.log('Updated form:', newForm);
            return newForm;
        });
    };

    const toggleTag = async (profileId, tagType) => {
        try {
            const profile = profiles.find(p => p.id === profileId);
            if (!profile) return;

            // Toggle the tag
            const updatedProfile = {
                ...profile,
                [tagType]: !profile[tagType],
                updatedAt: new Date().toISOString()
            };

            // If setting "isMe" to true, unset it for all other profiles
            if (tagType === 'isMe' && !profile[tagType]) {
                const updatedProfiles = profiles.map(p => ({
                    ...p,
                    isMe: p.id === profileId ? true : false,
                    updatedAt: new Date().toISOString()
                }));
                setProfiles(updatedProfiles);
                localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
                
                // Save to Firebase
                if (shouldUseFirebase(currentUser?.uid)) {
                    for (const prof of updatedProfiles) {
                        try {
                            await saveProfileToFirebase(prof, currentUser.uid);
                        } catch (error) {
                            console.error('Error saving profile to Firebase:', error);
                        }
                    }
                }
            } else {
                // Update single profile
                const updatedProfiles = profiles.map(p => 
                    p.id === profileId ? updatedProfile : p
                );
                setProfiles(updatedProfiles);
                localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
                
                // Save to Firebase
                if (shouldUseFirebase(currentUser?.uid)) {
                    try {
                        await saveProfileToFirebase(updatedProfile, currentUser.uid);
                    } catch (error) {
                        console.error('Error saving profile to Firebase:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling tag:', error);
        }
    };

    const navigateToNextProfile = () => {
        if (currentProfileIndex < profiles.length - 1) {
            const nextIndex = currentProfileIndex + 1;
            setCurrentProfileIndex(nextIndex);
            selectProfile(profiles[nextIndex]);
        }
    };

    const navigateToPrevProfile = () => {
        if (currentProfileIndex > 0) {
            const prevIndex = currentProfileIndex - 1;
            setCurrentProfileIndex(prevIndex);
            selectProfile(profiles[prevIndex]);
        }
    };

    const updateCurrentProfileIndex = (profileId) => {
        const index = profiles.findIndex(p => p.id === profileId);
        if (index !== -1) {
            setCurrentProfileIndex(index);
        }
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
                                        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                                            appSelectedProfile?.id === profile.id
                                                ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                                                : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                        onClick={() => selectProfile(profile)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center space-x-2">
                                                {appSelectedProfile?.id === profile.id && (
                                                    <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0 animate-pulse"></div>
                                                )}
                                                <div>
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h5 className={`font-medium ${
                                                            appSelectedProfile?.id === profile.id 
                                                                ? 'text-blue-900' 
                                                                : 'text-gray-900'
                                                        }`}>
                                                            {profile.firstName} {profile.lastName}
                                                            {appSelectedProfile?.id === profile.id && (
                                                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </h5>
                                                        {/* Tags */}
                                                        <div className="flex space-x-1">
                                                            {profile.isMe && (
                                                                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                                                                    Me
                                                                </span>
                                                            )}
                                                            {profile.isFavorite && (
                                                                <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded-full">
                                                                    ⭐
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {profile.gender || 'M'} • {profile.division || profile.defaultClassification || 'V'} • {profile.bowType || profile.profileType || 'Recurve ILF'}
                                                    </p>
                                                    {profile.school && (
                                                        <p className="text-xs text-gray-500">{profile.school}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewStats(profile.id);
                                                    }}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                >
                                                    Stats
                                                </button>
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
                                                        toggleTag(profile.id, 'isMe');
                                                    }}
                                                    className={`px-3 py-1 rounded text-sm ${
                                                        profile.isMe 
                                                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                                    }`}
                                                >
                                                    {profile.isMe ? 'Me' : 'Tag Me'}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleTag(profile.id, 'isFavorite');
                                                    }}
                                                    className={`px-3 py-1 rounded text-sm ${
                                                        profile.isFavorite 
                                                            ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                                                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                                    }`}
                                                >
                                                    {profile.isFavorite ? '⭐' : '⭐'}
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
                        <div className="flex space-x-3">
                            <button
                                onClick={createNewProfile}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                + Create New Profile
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('Refresh profiles from Firebase? This will reload all profiles from the server.')) {
                                        localStorage.removeItem('archerProfiles');
                                        window.location.reload();
                                    }
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                title="Force refresh profiles from Firebase"
                            >
                                🔄 Refresh
                            </button>
                        </div>
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
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {isCreating ? 'Create New Profile' : 'Edit Profile'}
                        </h2>
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
                            👤 Individual Profile Management (Same data as Team Archers)
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {/* Navigation buttons - only show when editing existing profile */}
                        {!isCreating && selectedProfile && profiles.length > 1 && (
                            <>
                                <button
                                    onClick={navigateToPrevProfile}
                                    disabled={currentProfileIndex === 0}
                                    className={`px-3 py-2 rounded-md transition-colors ${
                                        currentProfileIndex === 0
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                    title="Previous Profile"
                                >
                                    ← Prev
                                </button>
                                <span className="text-sm text-gray-500">
                                    {currentProfileIndex + 1} of {profiles.length}
                                </span>
                                <button
                                    onClick={navigateToNextProfile}
                                    disabled={currentProfileIndex === profiles.length - 1}
                                    className={`px-3 py-2 rounded-md transition-colors ${
                                        currentProfileIndex === profiles.length - 1
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                    title="Next Profile"
                                >
                                    Next →
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setShowProfileSelection(true)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Back to Profiles
                        </button>
                    </div>
                </div>



                <form 
                    onSubmit={handleFormSubmit} 
                    className="space-y-6"
                >
                    {/* Row 1: Name Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                type="text"
                                value={profileForm.firstName}
                                onChange={(e) => handleInputChange('firstName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                placeholder="Enter first name"
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
                                placeholder="Enter last name"
                            />
                        </div>
                    </div>

                    {/* Row 1.5: Contact Information */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={profileForm.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="email@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="tel"
                                value={profileForm.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="(555) 123-4567"
                            />
                        </div>
                    </div>

                    {/* Row 2: School Information */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                                value={profileForm.gender}
                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                            <input
                                type="text"
                                value={profileForm.school}
                                onChange={(e) => handleInputChange('school', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="School name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                            <input
                                type="text"
                                value={profileForm.grade}
                                onChange={(e) => handleInputChange('grade', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="9, 10, 11, 12"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                            <select
                                value={profileForm.division}
                                onChange={(e) => handleInputChange('division', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="V">Varsity</option>
                                <option value="JV">Junior Varsity</option>
                                <option value="MS">Middle School</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Physical Characteristics */}
                    <div className="grid grid-cols-3 gap-4">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Draw Length (inches)</label>
                            <input
                                type="number"
                                step="0.5"
                                value={profileForm.drawLength}
                                onChange={(e) => handleInputChange('drawLength', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="28.5"
                            />
                        </div>
                    </div>

                    {/* Row 4: Equipment Information */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bow Type</label>
                            <select
                                value={profileForm.bowType}
                                onChange={(e) => handleInputChange('bowType', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Recurve ILF">Recurve ILF</option>
                                <option value="Compound">Compound</option>
                                <option value="Barebow">Barebow</option>
                                <option value="Traditional">Traditional</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bow Length (inches)</label>
                            <select
                                value={profileForm.bowLength}
                                onChange={(e) => handleInputChange('bowLength', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="62">62"</option>
                                <option value="64">64"</option>
                                <option value="66">66"</option>
                                <option value="68">68"</option>
                                <option value="70">70"</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bow Weight (lbs)</label>
                            <input
                                type="number"
                                value={profileForm.bowWeight}
                                onChange={(e) => handleInputChange('bowWeight', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="45"
                            />
                        </div>
                    </div>

                    {/* Row 5: Performance Records */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Varsity PR</label>
                            <input
                                type="number"
                                value={profileForm.varsityPR}
                                onChange={(e) => handleInputChange('varsityPR', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">JV PR</label>
                            <input
                                type="number"
                                value={profileForm.jvPR}
                                onChange={(e) => handleInputChange('jvPR', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avg Arrow</label>
                            <input
                                type="number"
                                step="0.1"
                                value={profileForm.avgArrow}
                                onChange={(e) => handleInputChange('avgArrow', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="9.5"
                            />
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    {/* Sponsorships */}
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

                    {/* Tags */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Is Me</label>
                            <input
                                type="checkbox"
                                checked={profileForm.isMe}
                                onChange={(e) => handleInputChange('isMe', e.target.checked)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Is Favorite</label>
                            <input
                                type="checkbox"
                                checked={profileForm.isFavorite}
                                onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                            <input
                                type="checkbox"
                                checked={profileForm.isActive}
                                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>
                    </div>

                    {/* Save Message - More Prominent */}
                    {saveMessage && (
                        <div className={`mt-6 p-4 rounded-lg shadow-md border-2 font-medium text-center ${
                            saveMessage.includes('❌') || saveMessage.includes('Error') || saveMessage.includes('required') || saveMessage.includes('already exists')
                                ? 'bg-red-50 text-red-800 border-red-300 shadow-red-100'
                                : 'bg-green-50 text-green-800 border-green-300 shadow-green-100'
                        }`}>
                            <div className="flex items-center justify-center">
                                <div className="text-lg">{saveMessage}</div>
                            </div>
                            {saveMessage.includes('✅') && (
                                <div className="text-sm text-green-600 mt-1">
                                    {isCreating ? 'Returning to profile list...' : 'Changes saved to your account'}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => setShowProfileSelection(true)}
                            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                            disabled={saving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className={`px-6 py-2 rounded-md transition-colors ${
                                saving 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                        >
                            {saving ? (
                                <span className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Saving...
                                </span>
                            ) : (
                                isCreating ? 'Create Profile' : 'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileManagement; 