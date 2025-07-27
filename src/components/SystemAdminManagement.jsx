import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    loadProfilesFromFirebase, 
    saveProfileToFirebase, 
    deleteProfileFromFirebase 
} from '../services/firebaseService';
import ProfileEditor from './ProfileEditor';

function SystemAdminManagement() {
    const { currentUser, userRole } = useAuth();
    const [activeTab, setActiveTab] = useState('profiles');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Profile management state
    const [profiles, setProfiles] = useState([]);
    const [filterRole, setFilterRole] = useState('all');
    const [editingProfile, setEditingProfile] = useState(null);
    
    // New profile creation state
    const [newProfile, setNewProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'Coach',
        school: '',
        team: '',
        division: 'V',
        bowType: 'Recurve ILF'
    });

    useEffect(() => {
        loadProfiles();
    }, []);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            setError('');
            
            let allProfiles = [];
            
            // Try Firebase first
            if (currentUser?.uid) {
                try {
                    allProfiles = await loadProfilesFromFirebase(currentUser.uid);
                } catch (error) {
                    console.error('Error loading from Firebase:', error);
                }
            }
            
            // Fallback to localStorage
            if (allProfiles.length === 0) {
                const storedProfiles = localStorage.getItem('archerProfiles');
                if (storedProfiles) {
                    allProfiles = JSON.parse(storedProfiles);
                }
            }
            
            setProfiles(allProfiles);
        } catch (error) {
            console.error('Error loading profiles:', error);
            setError('Failed to load profiles: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');
            
            const profileData = {
                id: `profile_${Date.now()}`,
                ...newProfile,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: currentUser?.uid || 'system-admin',
                isActive: true
            };
            
            // Save to localStorage
            const existingProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
            const updatedProfiles = [...existingProfiles, profileData];
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            
            // Save to Firebase if possible
            if (currentUser?.uid) {
                try {
                    await saveProfileToFirebase(profileData, currentUser.uid);
                } catch (error) {
                    console.error('Error saving to Firebase:', error);
                }
            }
            
            setSuccess(`Created ${newProfile.role} profile: ${newProfile.firstName} ${newProfile.lastName}`);
            setNewProfile({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                role: 'Coach',
                school: '',
                team: '',
                division: 'V',
                bowType: 'Recurve ILF'
            });
            
            // Reload profiles
            await loadProfiles();
            
        } catch (error) {
            console.error('Error creating profile:', error);
            setError('Failed to create profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProfile = async (profileId) => {
        if (!window.confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            
            // Remove from localStorage
            const existingProfiles = JSON.parse(localStorage.getItem('archerProfiles') || '[]');
            const updatedProfiles = existingProfiles.filter(p => p.id !== profileId);
            localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
            
            // Remove from Firebase if possible
            if (currentUser?.uid) {
                try {
                    await deleteProfileFromFirebase(profileId, currentUser.uid);
                } catch (error) {
                    console.error('Error deleting from Firebase:', error);
                }
            }
            
            setSuccess('Profile deleted successfully');
            setProfiles(updatedProfiles);
            
        } catch (error) {
            console.error('Error deleting profile:', error);
            setError('Failed to delete profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const editProfile = (profile) => {
        setEditingProfile(profile);
    };

    const handleProfileSave = (savedProfile, updatedProfiles) => {
        setProfiles(updatedProfiles);
        setEditingProfile(null);
        setSuccess('Profile updated successfully');
    };

    const handleProfileCancel = () => {
        setEditingProfile(null);
    };

    const handleProfileNavigation = (action, data) => {
        if (action === 'edit' && data?.profileId) {
            const profile = profiles.find(p => p.id === data.profileId);
            if (profile) {
                setEditingProfile(profile);
            }
        } else if (action === 'list') {
            setEditingProfile(null);
        }
    };

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

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
                allowCreate={false}
                allowEdit={true}
                allowDelete={true}
            />
        );
    }

    const filteredProfiles = profiles.filter(profile => {
        if (filterRole === 'all') return true;
        return profile.role === filterRole;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold text-gray-900">System Admin Management</h1>
                    <div className="text-sm text-gray-600">
                        Role: {userRole}
                    </div>
                </div>
            </div>

            {/* Action Buttons - Always at Top */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex space-x-3">
                    <button
                        onClick={() => setActiveTab('profiles')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'profiles' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Profiles
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'create' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Create Profile
                    </button>
                </div>
            </div>

            {/* Messages */}
            {(error || success) && (
                <div className="bg-white border-b border-gray-200 px-4 py-3">
                    {error && (
                        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-2">
                            {error}
                            <button onClick={clearMessages} className="ml-2 text-red-600 hover:text-red-800">
                                ×
                            </button>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-100 text-green-800 p-3 rounded-lg">
                            {success}
                            <button onClick={clearMessages} className="ml-2 text-green-600 hover:text-green-800">
                                ×
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                {activeTab === 'profiles' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-700">Filter by Role:</label>
                                <select
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="Archer">Archer</option>
                                    <option value="Coach">Coach</option>
                                    <option value="Referee">Referee</option>
                                    <option value="Event Manager">Event Manager</option>
                                    <option value="System Admin">System Admin</option>
                                </select>
                                <span className="text-sm text-gray-600">
                                    {filteredProfiles.length} profiles
                                </span>
                            </div>
                        </div>

                        {/* Profile List */}
                        <div className="space-y-3">
                            {filteredProfiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
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
                                                        {profile.email} • {profile.role || 'Archer'}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {profile.school || 'No School'} • {profile.division || 'No Division'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => editProfile(profile)}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProfile(profile.id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {filteredProfiles.length === 0 && (
                                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                                    <p className="text-gray-600 mb-4">
                                        {filterRole === 'all' ? 'No profiles found' : `No ${filterRole} profiles found`}
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('create')}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                                    >
                                        Create First Profile
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Profile</h2>
                        <form onSubmit={handleCreateProfile} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newProfile.firstName}
                                        onChange={(e) => setNewProfile(prev => ({ ...prev, firstName: e.target.value }))}
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
                                        value={newProfile.lastName}
                                        onChange={(e) => setNewProfile(prev => ({ ...prev, lastName: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={newProfile.email}
                                        onChange={(e) => setNewProfile(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={newProfile.phone}
                                        onChange={(e) => setNewProfile(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Role *
                                    </label>
                                    <select
                                        required
                                        value={newProfile.role}
                                        onChange={(e) => setNewProfile(prev => ({ ...prev, role: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Archer">Archer</option>
                                        <option value="Coach">Coach</option>
                                        <option value="Referee">Referee</option>
                                        <option value="Event Manager">Event Manager</option>
                                        <option value="System Admin">System Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        School
                                    </label>
                                    <input
                                        type="text"
                                        value={newProfile.school}
                                        onChange={(e) => setNewProfile(prev => ({ ...prev, school: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Division
                                    </label>
                                    <select
                                        value={newProfile.division}
                                        onChange={(e) => setNewProfile(prev => ({ ...prev, division: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="V">Varsity</option>
                                        <option value="JV">Junior Varsity</option>
                                        <option value="MS">Middle School</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bow Type
                                    </label>
                                    <select
                                        value={newProfile.bowType}
                                        onChange={(e) => setNewProfile(prev => ({ ...prev, bowType: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Recurve ILF">Recurve ILF</option>
                                        <option value="Compound">Compound</option>
                                        <option value="Barebow">Barebow</option>
                                        <option value="Traditional">Traditional</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? 'Creating...' : 'Create Profile'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('profiles')}
                                    className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SystemAdminManagement; 