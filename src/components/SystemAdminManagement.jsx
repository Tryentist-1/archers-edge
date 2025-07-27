import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
    loadProfilesFromFirebase, 
    saveProfileToFirebase, 
    deleteProfileFromFirebase 
} from '../services/firebaseService';

function SystemAdminManagement() {
    const { currentUser, userRole } = useAuth();
    const [activeTab, setActiveTab] = useState('profiles');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Profile management state
    const [profiles, setProfiles] = useState([]);
    const [filterRole, setFilterRole] = useState('all');
    
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
            
            loadProfiles();
        } catch (error) {
            console.error('Error creating profile:', error);
            setError('Failed to create profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProfile = async (profileId) => {
        if (!window.confirm('Are you sure you want to delete this profile?')) {
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
            loadProfiles();
        } catch (error) {
            console.error('Error deleting profile:', error);
            setError('Failed to delete profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    useEffect(() => {
        const timer = setTimeout(clearMessages, 5000);
        return () => clearTimeout(timer);
    }, [error, success]);

    // Access control
    if (!currentUser || userRole !== 'System Admin') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">
                        You don't have permission to access System Admin Management. 
                        <br />
                        Current role: {userRole || 'none'}
                        <br />
                        Required: System Admin
                    </p>
                </div>
            </div>
        );
    }

    // Filter profiles by role
    const filteredProfiles = filterRole === 'all' 
        ? profiles 
        : profiles.filter(profile => profile.role === filterRole);

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">System Admin Management</h1>
                        <p className="text-gray-600">Manage all profiles and create coach accounts</p>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                            <p className="text-sm text-green-600">{success}</p>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('profiles')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'profiles'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                All Profiles
                            </button>
                            <button
                                onClick={() => setActiveTab('create')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'create'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Create Profile
                            </button>
                        </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {loading && (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}

                        {!loading && (
                            <>
                                {/* All Profiles Tab */}
                                {activeTab === 'profiles' && (
                                    <div className="space-y-6">
                                        {/* Filter */}
                                        <div className="flex items-center space-x-4">
                                            <label className="text-sm font-medium text-gray-700">Filter by Role:</label>
                                            <select
                                                value={filterRole}
                                                onChange={(e) => setFilterRole(e.target.value)}
                                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                                            >
                                                <option value="all">All Roles</option>
                                                <option value="System Admin">System Admin</option>
                                                <option value="Coach">Coach</option>
                                                <option value="Event Manager">Event Manager</option>
                                                <option value="Referee">Referee</option>
                                                <option value="Archer">Archer</option>
                                            </select>
                                        </div>

                                        {/* Profiles List */}
                                        <div className="space-y-2">
                                            {filteredProfiles.map(profile => (
                                                <div key={profile.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <span className="text-blue-600 font-medium">
                                                                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-gray-900">
                                                                    {profile.firstName} {profile.lastName}
                                                                </h3>
                                                                <p className="text-sm text-gray-600">
                                                                    {profile.email} • {profile.role}
                                                                    {profile.school && ` • ${profile.school}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                                            profile.role === 'System Admin' ? 'bg-purple-100 text-purple-800' :
                                                            profile.role === 'Coach' ? 'bg-blue-100 text-blue-800' :
                                                            profile.role === 'Event Manager' ? 'bg-green-100 text-green-800' :
                                                            profile.role === 'Referee' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                            {profile.role}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteProfile(profile.id)}
                                                            className="text-red-600 hover:text-red-800 text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {filteredProfiles.length === 0 && (
                                                <div className="text-center py-8 text-gray-500">
                                                    No profiles found for the selected filter.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Create Profile Tab */}
                                {activeTab === 'create' && (
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 rounded-lg p-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Profile</h3>
                                            <form onSubmit={handleCreateProfile} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            First Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={newProfile.firstName}
                                                            onChange={(e) => setNewProfile({...newProfile, firstName: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Last Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={newProfile.lastName}
                                                            onChange={(e) => setNewProfile({...newProfile, lastName: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Email
                                                        </label>
                                                        <input
                                                            type="email"
                                                            value={newProfile.email}
                                                            onChange={(e) => setNewProfile({...newProfile, email: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Phone
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            value={newProfile.phone}
                                                            onChange={(e) => setNewProfile({...newProfile, phone: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Role *
                                                        </label>
                                                        <select
                                                            required
                                                            value={newProfile.role}
                                                            onChange={(e) => setNewProfile({...newProfile, role: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        >
                                                            <option value="Coach">Coach</option>
                                                            <option value="Event Manager">Event Manager</option>
                                                            <option value="Referee">Referee</option>
                                                            <option value="Archer">Archer</option>
                                                            <option value="System Admin">System Admin</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            School/Team
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newProfile.school}
                                                            onChange={(e) => setNewProfile({...newProfile, school: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-end space-x-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('profiles')}
                                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                                                    >
                                                        Create Profile
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SystemAdminManagement; 