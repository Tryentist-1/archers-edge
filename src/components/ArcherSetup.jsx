import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const ArcherSetup = ({ onSetupComplete }) => {
    const { currentUser } = useAuth();
    const [baleNumber, setBaleNumber] = useState(1);
    const [archers, setArchers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableTargets, setAvailableTargets] = useState(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    const [loading, setLoading] = useState(false);
    const [showAddArcher, setShowAddArcher] = useState(false);
    const [newArcher, setNewArcher] = useState({
        firstName: '',
        lastName: '',
        school: '',
        level: 'Recurve',
        gender: 'M'
    });

    // Debug: Log authentication status
    useEffect(() => {
        console.log('ArcherSetup - Authentication status:', {
            currentUser: currentUser ? {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName
            } : null,
            isAuthenticated: !!currentUser
        });
    }, [currentUser]);

    // Sample archer data - in real app this would come from a database
    const sampleArchers = [
        { id: '1', firstName: 'John', lastName: 'Doe', school: 'Archery Club', level: 'Recurve', gender: 'M' },
        { id: '2', firstName: 'Jane', lastName: 'Smith', school: 'Archery Club', level: 'Compound', gender: 'F' },
        { id: '3', firstName: 'Mike', lastName: 'Johnson', school: 'Target Masters', level: 'Recurve', gender: 'M' },
        { id: '4', firstName: 'Sarah', lastName: 'Wilson', school: 'Target Masters', level: 'Compound', gender: 'F' },
        { id: '5', firstName: 'David', lastName: 'Brown', school: 'Archery Club', level: 'Recurve', gender: 'M' },
    ];

    const filteredArchers = sampleArchers.filter(archer => {
        const fullName = `${archer.firstName} ${archer.lastName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    const addArcherToBale = (archer) => {
        const usedTargets = archers.map(a => a.targetAssignment);
        const availableTargets = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].filter(t => !usedTargets.includes(t));
        const nextTarget = availableTargets.length > 0 ? availableTargets[0] : 'A';

        // Create scores object instead of nested arrays for Firestore compatibility
        const scoresObject = {};
        for (let end = 1; end <= 12; end++) {
            scoresObject[`end${end}`] = {
                arrow1: '',
                arrow2: '',
                arrow3: ''
            };
        }

        const newArcher = {
            ...archer,
            targetAssignment: nextTarget,
            scores: scoresObject // Use object instead of nested arrays
        };

        setArchers([...archers, newArcher]);
    };

    const removeArcherFromBale = (archerId) => {
        setArchers(archers.filter(a => a.id !== archerId));
    };

    const updateTargetAssignment = (archerId, newTarget) => {
        setArchers(archers.map(archer => 
            archer.id === archerId 
                ? { ...archer, targetAssignment: newTarget }
                : archer
        ));
    };

    const handleAddNewArcher = () => {
        if (!newArcher.firstName || !newArcher.lastName) {
            alert('Please enter first and last name');
            return;
        }

        const newArcherWithId = {
            ...newArcher,
            id: Date.now().toString(), // Simple ID generation
        };

        // Add to sample archers (in real app, this would save to database)
        sampleArchers.push(newArcherWithId);
        
        // Add to bale
        addArcherToBale(newArcherWithId);
        
        // Reset form
        setNewArcher({
            firstName: '',
            lastName: '',
            school: '',
            level: 'Recurve',
            gender: 'M'
        });
        setShowAddArcher(false);
    };

    const handleStartScoring = async () => {
        if (archers.length === 0) {
            alert('Please add at least one archer to the bale.');
            return;
        }

        setLoading(true);
        try {
            console.log('Starting bale setup...', { currentUser, archers });
            
            const baleData = {
                baleNumber,
                archers,
                currentEnd: 1,
                totalEnds: 12,
                createdBy: currentUser.uid,
                createdAt: new Date(),
                status: 'active'
            };

            console.log('Bale data to save:', baleData);

            const userDoc = doc(db, 'users', currentUser.uid);
            console.log('Saving to document:', `users/${currentUser.uid}`);
            
            await setDoc(userDoc, {
                currentBale: baleData,
                lastUpdated: new Date()
            }, { merge: true });

            console.log('Bale setup saved successfully!');
            onSetupComplete(baleData);
        } catch (error) {
            console.error('Error saving bale setup:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
            
            // More specific error messages
            if (error.code === 'permission-denied') {
                alert('Permission denied. Please check your Firebase security rules.');
            } else if (error.code === 'unauthenticated') {
                alert('You are not authenticated. Please sign in again.');
            } else if (error.code === 'network-request-failed') {
                alert('Network error. Please check your internet connection.');
            } else {
                alert(`Error saving bale setup: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    Setup Bale {baleNumber}
                </h2>

                {/* Bale Number Selection */}
                <div className="mb-6 p-4 bg-gray-50 rounded-md">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bale Number:
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="99"
                        value={baleNumber}
                        onChange={(e) => setBaleNumber(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                </div>

                {/* Add New Archer Button */}
                <div className="mb-6 flex space-x-4">
                    <button
                        onClick={() => setShowAddArcher(!showAddArcher)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                        {showAddArcher ? 'Cancel' : '+ Add New Archer'}
                    </button>
                    
                    {/* Debug: Test Firebase connection */}
                    <button
                        onClick={async () => {
                            try {
                                console.log('Testing Firebase connection...');
                                const testDoc = doc(db, 'test', 'connection');
                                await setDoc(testDoc, { timestamp: new Date() });
                                console.log('Firebase connection successful!');
                                alert('Firebase connection test successful!');
                            } catch (error) {
                                console.error('Firebase connection test failed:', error);
                                alert(`Firebase test failed: ${error.message}`);
                            }
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
                    >
                        Test Firebase
                    </button>
                </div>

                {/* Add New Archer Form */}
                {showAddArcher && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Archer</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    value={newArcher.firstName}
                                    onChange={(e) => setNewArcher({...newArcher, firstName: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    placeholder="First Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    value={newArcher.lastName}
                                    onChange={(e) => setNewArcher({...newArcher, lastName: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    placeholder="Last Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    School/Club
                                </label>
                                <input
                                    type="text"
                                    value={newArcher.school}
                                    onChange={(e) => setNewArcher({...newArcher, school: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    placeholder="School or Club"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Level
                                </label>
                                <select
                                    value={newArcher.level}
                                    onChange={(e) => setNewArcher({...newArcher, level: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                >
                                    <option value="Recurve">Recurve</option>
                                    <option value="Compound">Compound</option>
                                    <option value="Barebow">Barebow</option>
                                    <option value="Traditional">Traditional</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Gender
                                </label>
                                <select
                                    value={newArcher.gender}
                                    onChange={(e) => setNewArcher({...newArcher, gender: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                >
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={handleAddNewArcher}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Add Archer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Archer Search */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Archers:
                    </label>
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Available Archers */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Available Archers ({filteredArchers.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredArchers.map(archer => {
                                const isAdded = archers.some(a => a.id === archer.id);
                                return (
                                    <div
                                        key={archer.id}
                                        className={`p-3 border rounded-md cursor-pointer transition-colors ${
                                            isAdded 
                                                ? 'bg-green-50 border-green-300' 
                                                : 'bg-white border-gray-300 hover:bg-gray-50'
                                        }`}
                                        onClick={() => !isAdded && addArcherToBale(archer)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <div className="font-medium">
                                                    {archer.firstName} {archer.lastName}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {archer.school} • {archer.level} • {archer.gender}
                                                </div>
                                            </div>
                                            {isAdded && (
                                                <span className="text-green-600 text-sm font-medium">
                                                    ✓ Added
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Archers */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Bale Archers ({archers.length})
                        </h3>
                        {archers.length === 0 ? (
                            <div className="text-gray-500 text-center py-8">
                                No archers added yet. Select archers from the left panel or add new ones.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {archers.map(archer => (
                                    <div key={archer.id} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <div className="flex justify-between items-center">
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    {archer.firstName} {archer.lastName}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    {archer.school} • {archer.level} • {archer.gender}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <select
                                                    value={archer.targetAssignment}
                                                    onChange={(e) => updateTargetAssignment(archer.id, e.target.value)}
                                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                >
                                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(target => (
                                                        <option key={target} value={target}>
                                                            Target {target}
                                                        </option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => removeArcherFromBale(archer.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Start Scoring Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={handleStartScoring}
                        disabled={archers.length === 0 || loading}
                        className={`px-6 py-3 rounded-md font-medium text-white ${
                            archers.length === 0 || loading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {loading ? 'Saving...' : `Start Scoring (${archers.length} archer${archers.length !== 1 ? 's' : ''})`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArcherSetup; 