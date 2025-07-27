import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    saveProfileToFirebase,
    shouldUseFirebase
} from '../services/firebaseService';

const ProfileEditor = ({ 
    profile, 
    profiles, 
    onSave, 
    onCancel, 
    onNavigate,
    mode = 'full', // 'full' or 'modal'
    showNavigation = true,
    allowCreate = true,
    allowEdit = true,
    allowDelete = true
}) => {
    const { currentUser } = useAuth();
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    
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

    // Update form when profile changes
    useEffect(() => {
        if (profile) {
            setProfileForm({
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                email: profile.email || '',
                phone: profile.phone || '',
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
                varsityPR: profile.varsityPR || '',
                jvPR: profile.jvPR || '',
                avgArrow: profile.avgArrow || '',
                role: profile.role || 'Archer',
                usArcheryNumber: profile.usArcheryNumber || '',
                nfaaNumber: profile.nfaaNumber || '',
                sponsorships: profile.sponsorships || '',
                isMe: profile.isMe || false,
                isFavorite: profile.isFavorite || false,
                isActive: profile.isActive !== undefined ? profile.isActive : true
            });
            
            // Update current index
            if (profiles && profiles.length > 0) {
                const index = profiles.findIndex(p => p.id === profile.id);
                setCurrentIndex(index >= 0 ? index : 0);
            }
        }
    }, [profile, profiles]);

    const handleInputChange = (field, value) => {
        setProfileForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setMessage('');

            // Validate required fields
            if (!profileForm.firstName?.trim() || !profileForm.lastName?.trim()) {
                setMessage('Error: First name and last name are required.');
                return;
            }

            // Create profile object
            const profileToSave = {
                id: profile ? profile.id : `profile_${Date.now()}`,
                ...profileForm,
                createdAt: profile ? profile.createdAt : new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: currentUser?.uid || 'profile-user',
                isActive: true
            };

            // Save to localStorage
            const existingProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
            let updatedProfiles;

            if (profile) {
                // Update existing
                updatedProfiles = existingProfiles.map(p => 
                    p.id === profile.id ? profileToSave : p
                );
            } else {
                // Create new
                updatedProfiles = [...existingProfiles, profileToSave];
            }

            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));

            // Save to Firebase if possible
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    await saveProfileToFirebase(profileToSave, currentUser.uid);
                } catch (error) {
                    console.error('Error saving to Firebase:', error);
                    setMessage('Saved locally, but failed to sync to cloud');
                }
            }

            setMessage('Profile saved successfully!');
            
            // Notify parent component
            if (onSave) {
                onSave(profileToSave, updatedProfiles);
            }

        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage('Error saving profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!profile || !allowDelete) return;
        
        if (!window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
            return;
        }

        try {
            // Remove from localStorage
            const existingProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
            const updatedProfiles = existingProfiles.filter(p => p.id !== profile.id);
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));

            // Remove from Firebase if possible
            if (shouldUseFirebase(currentUser?.uid)) {
                try {
                    const { deleteProfileFromFirebase } = await import('../services/firebaseService');
                    await deleteProfileFromFirebase(profile.id, currentUser.uid);
                } catch (error) {
                    console.error('Error deleting from Firebase:', error);
                }
            }

            setMessage('Profile deleted successfully!');
            
            // Navigate to next profile or back to list
            if (profiles && profiles.length > 1) {
                const nextIndex = currentIndex < profiles.length - 1 ? currentIndex : currentIndex - 1;
                if (nextIndex >= 0 && onNavigate) {
                    onNavigate('edit', { profileId: profiles[nextIndex].id });
                }
            } else if (onNavigate) {
                onNavigate('list');
            }

        } catch (error) {
            console.error('Error deleting profile:', error);
            setMessage('Error deleting profile: ' + error.message);
        }
    };

    const navigateToProfile = (direction) => {
        if (!profiles || profiles.length <= 1) return;
        
        let newIndex;
        if (direction === 'next') {
            newIndex = currentIndex < profiles.length - 1 ? currentIndex + 1 : 0;
        } else {
            newIndex = currentIndex > 0 ? currentIndex - 1 : profiles.length - 1;
        }
        
        if (onNavigate) {
            onNavigate('edit', { profileId: profiles[newIndex].id });
        }
    };

    const canNavigate = profiles && profiles.length > 1;
    const canGoBack = canNavigate && currentIndex > 0;
    const canGoNext = canNavigate && currentIndex < profiles.length - 1;

    // Modal mode wrapper
    if (mode === 'modal') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <ProfileEditorContent 
                        profile={profile}
                        profileForm={profileForm}
                        handleInputChange={handleInputChange}
                        handleSave={handleSave}
                        handleDelete={handleDelete}
                        navigateToProfile={navigateToProfile}
                        canGoBack={canGoBack}
                        canGoNext={canGoNext}
                        currentIndex={currentIndex}
                        profiles={profiles}
                        saving={saving}
                        message={message}
                        showNavigation={showNavigation}
                        allowDelete={allowDelete}
                        onCancel={onCancel}
                        mode={mode}
                    />
                </div>
            </div>
        );
    }

    // Full page mode
    return (
        <div className="min-h-screen bg-gray-50">
            <ProfileEditorContent 
                profile={profile}
                profileForm={profileForm}
                handleInputChange={handleInputChange}
                handleSave={handleSave}
                handleDelete={handleDelete}
                navigateToProfile={navigateToProfile}
                canGoBack={canGoBack}
                canGoNext={canGoNext}
                currentIndex={currentIndex}
                profiles={profiles}
                saving={saving}
                message={message}
                showNavigation={showNavigation}
                allowDelete={allowDelete}
                onCancel={onCancel}
                mode={mode}
            />
        </div>
    );
};

// Separate content component to avoid duplication
const ProfileEditorContent = ({
    profile,
    profileForm,
    handleInputChange,
    handleSave,
    handleDelete,
    navigateToProfile,
    canGoBack,
    canGoNext,
    currentIndex,
    profiles,
    saving,
    message,
    showNavigation,
    allowDelete,
    onCancel,
    mode
}) => {
    return (
        <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onCancel}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                            ← Back to List
                        </button>
                        <h1 className="text-xl font-semibold text-gray-900">
                            {profile ? 'Edit Profile' : 'Create Profile'}
                        </h1>
                    </div>
                    {showNavigation && profiles && profiles.length > 1 && (
                        <div className="text-sm text-gray-600">
                            {currentIndex + 1} of {profiles.length}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons - Always at Top */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex space-x-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                    {showNavigation && profiles && profiles.length > 1 && (
                        <>
                            <button
                                onClick={() => navigateToProfile('prev')}
                                disabled={!canGoBack}
                                className="px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-30 transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={() => navigateToProfile('next')}
                                disabled={!canGoNext}
                                className="px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-30 transition-colors"
                            >
                                Next →
                            </button>
                        </>
                    )}
                    {allowDelete && profile && (
                        <button
                            onClick={handleDelete}
                            className="px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                        >
                            Delete
                        </button>
                    )}
                    <button
                        onClick={onCancel}
                        className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
                {message && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                        message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                        {message}
                    </div>
                )}
            </div>

            {/* Form Content */}
            <div className="p-4 space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
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
                                        checked={profileForm.isActive}
                                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Active</span>
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
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={profileForm.isMe}
                                        onChange={(e) => handleInputChange('isMe', e.target.checked)}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Me</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default ProfileEditor; 