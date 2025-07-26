import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LocalStorage } from '../utils/localStorage';
import { 
    loadProfilesFromFirebase, 
    loadCompetitionsFromFirebase, 
    shouldUseFirebase,
    isOnline
} from '../services/firebaseService';

const DataSyncPanel = ({ onNavigate }) => {
    const { currentUser } = useAuth();
    const [storageInfo, setStorageInfo] = useState({});
    const [syncStatus, setSyncStatus] = useState('idle');
    const [message, setMessage] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        loadStorageInfo();
    }, []);

    const loadStorageInfo = () => {
        const info = LocalStorage.getStorageInfo();
        setStorageInfo(info);
    };

    const showMessage = (msg, type = 'info') => {
        setMessage({ text: msg, type });
        setTimeout(() => setMessage(''), 5000);
    };

    const handlePurgeUserData = () => {
        if (!window.confirm('⚠️ This will clear ALL local data (profiles, rounds, settings) and force a fresh sync from Firebase. Continue?')) {
            return;
        }

        try {
            LocalStorage.purgeUserData();
            loadStorageInfo();
            showMessage('✅ All local data purged successfully! Please refresh the page to reload from Firebase.', 'success');
            
            // Auto-refresh after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            showMessage(`❌ Error purging data: ${error.message}`, 'error');
        }
    };

    const handleClearProfiles = () => {
        if (!window.confirm('Clear local profiles? This will force reload from Firebase on next visit.')) {
            return;
        }

        try {
            LocalStorage.clearProfiles();
            loadStorageInfo();
            showMessage('✅ Local profiles cleared. Refresh to reload from Firebase.', 'success');
        } catch (error) {
            showMessage(`❌ Error clearing profiles: ${error.message}`, 'error');
        }
    };

    const handleClearBaleData = () => {
        if (!window.confirm('Clear current round data? This will end any active scoring session.')) {
            return;
        }

        try {
            LocalStorage.clearBaleData();
            loadStorageInfo();
            showMessage('✅ Current round data cleared.', 'success');
        } catch (error) {
            showMessage(`❌ Error clearing round data: ${error.message}`, 'error');
        }
    };

    const handleForceSync = async () => {
        if (!currentUser) {
            showMessage('❌ Must be logged in to sync with Firebase', 'error');
            return;
        }

        if (!shouldUseFirebase(currentUser.uid)) {
            showMessage('❌ Firebase sync not available for this user type', 'error');
            return;
        }

        setSyncStatus('syncing');
        showMessage('⏳ Syncing with Firebase...', 'info');

        try {
            // Load fresh data from Firebase
            console.log('Force syncing from Firebase...');
            
            const [profiles, competitions] = await Promise.all([
                loadProfilesFromFirebase(currentUser.uid),
                loadCompetitionsFromFirebase(currentUser.uid)
            ]);

            console.log('Synced data:', { profiles, competitions });

            // Update local storage with fresh data
            if (profiles.length > 0) {
                localStorage.setItem('archerProfiles', JSON.stringify(profiles));
            }
            if (competitions.length > 0) {
                localStorage.setItem('oasCompetitions', JSON.stringify(competitions));
            }

            // Save sync status
            LocalStorage.saveSyncStatus({
                lastSync: new Date().toISOString(),
                profilesCount: profiles.length,
                competitionsCount: competitions.length,
                status: 'success'
            });

            loadStorageInfo();
            setSyncStatus('success');
            showMessage(`✅ Sync complete! Loaded ${profiles.length} profiles, ${competitions.length} competitions.`, 'success');

        } catch (error) {
            console.error('Sync error:', error);
            setSyncStatus('error');
            showMessage(`❌ Sync failed: ${error.message}`, 'error');
        } finally {
            setTimeout(() => setSyncStatus('idle'), 3000);
        }
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleString();
        } catch {
            return 'Unknown';
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Data Sync & Debug Panel</h2>
                        <p className="text-gray-600">Manage local storage and Firebase sync</p>
                    </div>

                </div>

                {/* Status Message */}
                {message && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                        message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                        'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                        {message.text}
                    </div>
                )}

                {/* Connection Status */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2">Connection Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Online:</span>
                            <span className={`ml-2 ${isOnline() ? 'text-green-600' : 'text-red-600'}`}>
                                {isOnline() ? '✅ Yes' : '❌ No'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">Firebase:</span>
                            <span className={`ml-2 ${shouldUseFirebase(currentUser?.uid) ? 'text-green-600' : 'text-orange-600'}`}>
                                {shouldUseFirebase(currentUser?.uid) ? '✅ Available' : '⚠️ Mock User'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-600">User:</span>
                            <span className="ml-2 text-gray-800">{currentUser?.email || 'Not logged in'}</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Sync Status:</span>
                            <span className={`ml-2 ${
                                syncStatus === 'syncing' ? 'text-blue-600' :
                                syncStatus === 'success' ? 'text-green-600' :
                                syncStatus === 'error' ? 'text-red-600' : 'text-gray-600'
                            }`}>
                                {syncStatus === 'syncing' ? '⏳ Syncing...' :
                                 syncStatus === 'success' ? '✅ Success' :
                                 syncStatus === 'error' ? '❌ Error' : '⚫ Idle'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                        <button
                            onClick={handleForceSync}
                            disabled={syncStatus === 'syncing' || !shouldUseFirebase(currentUser?.uid)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            🔄 Force Sync
                        </button>
                        <button
                            onClick={handleClearProfiles}
                            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                        >
                            🗑️ Clear Profiles
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('Clear local competitions? This will force reload from Firebase on next visit.')) {
                                    try {
                                        LocalStorage.clearCompetitions();
                                        loadStorageInfo();
                                        showMessage('✅ Local competitions cleared. Refresh to reload from Firebase.', 'success');
                                    } catch (error) {
                                        showMessage(`❌ Error clearing competitions: ${error.message}`, 'error');
                                    }
                                }
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                            🗑️ Clear Competitions
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('Clear score history? This will remove all completed rounds from local storage.')) {
                                    try {
                                        LocalStorage.clearCompletedRounds();
                                        loadStorageInfo();
                                        showMessage('✅ Score history cleared. Refresh to reload from Firebase.', 'success');
                                    } catch (error) {
                                        showMessage(`❌ Error clearing score history: ${error.message}`, 'error');
                                    }
                                }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            🗑️ Clear Score History
                        </button>
                        <button
                            onClick={handleClearBaleData}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                        >
                            🗑️ Clear Round
                        </button>
                        <button
                            onClick={handlePurgeUserData}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                            💥 Purge All Data
                        </button>
                    </div>
                </div>

                {/* Storage Overview */}
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-800 mb-4">Local Storage Overview</h3>
                    <div className="space-y-3">
                        {Object.entries(storageInfo).map(([name, info]) => (
                            <div key={name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <span className="font-medium">{name.replace('_', ' ')}</span>
                                    <span className={`ml-2 text-sm ${info.exists ? 'text-green-600' : 'text-gray-500'}`}>
                                        {info.exists ? '✅ Has data' : '❌ Empty'}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                    {formatSize(info.size)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detailed View Toggle */}
                <div className="border-t pt-4">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        {showDetails ? '▼ Hide Details' : '▶ Show Storage Details'}
                    </button>

                    {showDetails && (
                        <div className="mt-4 space-y-4">
                            {Object.entries(storageInfo).map(([name, info]) => (
                                <div key={name} className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-800 mb-2">{name}</h4>
                                    {info.exists ? (
                                        <div>
                                            <div className="text-sm text-gray-600 mb-2">
                                                Size: {formatSize(info.size)} | 
                                                {info.data?.length && ` Items: ${info.data.length} |`}
                                                {info.data?.timestamp && ` Updated: ${formatDate(info.data.timestamp)}`}
                                            </div>
                                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                                                {JSON.stringify(info.data, null, 2)}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 text-sm">No data stored</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataSyncPanel; 