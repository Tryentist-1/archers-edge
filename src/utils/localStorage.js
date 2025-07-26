/**
 * Local Storage Utilities
 * 
 * Provides offline data persistence for the archery scoring app.
 * Falls back to local storage when Firebase is unavailable.
 */

const STORAGE_KEYS = {
    CURRENT_BALE: 'archers_edge_current_bale',
    USER_SESSION: 'archers_edge_user_session',
    APP_STATE: 'archers_edge_app_state',
    ARCHER_PROFILES: 'archerProfiles',
    OAS_COMPETITIONS: 'oasCompetitions',
    COMPLETED_ROUNDS: 'completedRounds',
    SYNC_STATUS: 'archers_edge_sync_status'
};

export const LocalStorage = {
    // Save bale data to local storage
    saveBaleData: (baleData) => {
        try {
            localStorage.setItem(STORAGE_KEYS.CURRENT_BALE, JSON.stringify(baleData));
            console.log('Saved bale data to local storage:', baleData);
            return true;
        } catch (error) {
            console.error('Error saving to local storage:', error);
            return false;
        }
    },

    // Load bale data from local storage
    loadBaleData: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.CURRENT_BALE);
            if (data) {
                const parsed = JSON.parse(data);
                console.log('Loaded bale data from local storage:', parsed);
                return parsed;
            }
            return null;
        } catch (error) {
            console.error('Error loading from local storage:', error);
            return null;
        }
    },

    // Save user session
    saveUserSession: (sessionData) => {
        try {
            localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            console.error('Error saving user session:', error);
            return false;
        }
    },

    // Load user session
    loadUserSession: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading user session:', error);
            return null;
        }
    },

    // Save app state
    saveAppState: (appState) => {
        try {
            localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(appState));
            return true;
        } catch (error) {
            console.error('Error saving app state:', error);
            return false;
        }
    },

    // Load app state
    loadAppState: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.APP_STATE);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading app state:', error);
            return null;
        }
    },

    // Save sync status
    saveSyncStatus: (syncData) => {
        try {
            const statusData = {
                ...syncData,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(statusData));
            return true;
        } catch (error) {
            console.error('Error saving sync status:', error);
            return false;
        }
    },

    // Load sync status
    loadSyncStatus: () => {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading sync status:', error);
            return null;
        }
    },

    // Clear bale data only
    clearBaleData: () => {
        try {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_BALE);
            console.log('Cleared bale data from local storage');
            return true;
        } catch (error) {
            console.error('Error clearing bale data:', error);
            return false;
        }
    },

    // Clear profiles only
    clearProfiles: () => {
        try {
            localStorage.removeItem(STORAGE_KEYS.ARCHER_PROFILES);
            console.log('Cleared profiles from local storage');
            return true;
        } catch (error) {
            console.error('Error clearing profiles:', error);
            return false;
        }
    },

    // Clear competitions only
    clearCompetitions: () => {
        try {
            localStorage.removeItem(STORAGE_KEYS.OAS_COMPETITIONS);
            console.log('Cleared competitions from local storage');
            return true;
        } catch (error) {
            console.error('Error clearing competitions:', error);
            return false;
        }
    },

    // Clear completed rounds only
    clearCompletedRounds: () => {
        try {
            localStorage.removeItem(STORAGE_KEYS.COMPLETED_ROUNDS);
            console.log('Cleared completed rounds from local storage');
            return true;
        } catch (error) {
            console.error('Error clearing completed rounds:', error);
            return false;
        }
    },

    // Clear sync status
    clearSyncStatus: () => {
        try {
            localStorage.removeItem(STORAGE_KEYS.SYNC_STATUS);
            console.log('Cleared sync status from local storage');
            return true;
        } catch (error) {
            console.error('Error clearing sync status:', error);
            return false;
        }
    },

    // Purge all user data (but keep session)
    purgeUserData: () => {
        try {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_BALE);
            localStorage.removeItem(STORAGE_KEYS.ARCHER_PROFILES);
            localStorage.removeItem(STORAGE_KEYS.OAS_COMPETITIONS);
            localStorage.removeItem(STORAGE_KEYS.COMPLETED_ROUNDS);
            localStorage.removeItem(STORAGE_KEYS.APP_STATE);
            localStorage.removeItem(STORAGE_KEYS.SYNC_STATUS);
            console.log('Purged all user data from local storage');
            return true;
        } catch (error) {
            console.error('Error purging user data:', error);
            return false;
        }
    },

    // Clear all local storage
    clearAll: () => {
        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('Cleared all local storage');
        } catch (error) {
            console.error('Error clearing local storage:', error);
        }
    },

    // Get storage info for debugging
    getStorageInfo: () => {
        try {
            const info = {};
            Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
                const data = localStorage.getItem(key);
                info[name] = {
                    exists: !!data,
                    size: data ? data.length : 0,
                    data: data ? JSON.parse(data) : null
                };
            });
            return info;
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {};
        }
    },

    // Check if local storage is available
    isAvailable: () => {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}; 