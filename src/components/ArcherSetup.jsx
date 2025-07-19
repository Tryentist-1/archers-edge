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

        const newArcher = {
            ...archer,
            targetAssignment: nextTarget,
            scores: Array(12).fill(null).map(() => ['', '', '']) // 12 ends, 3 arrows each
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

    const handleStartScoring = async () => {
        if (archers.length === 0) {
            alert('Please add at least one archer to the bale.');
            return;
        }

        setLoading(true);
        try {
            const baleData = {
                baleNumber,
                archers,
                currentEnd: 1,
                totalEnds: 12,
                createdBy: currentUser.uid,
                createdAt: new Date(),
                status: 'active'
            };

            const userDoc = doc(db, 'users', currentUser.uid);
            await setDoc(userDoc, {
                currentBale: baleData,
                lastUpdated: new Date()
            }, { merge: true });

            onSetupComplete(baleData);
        } catch (error) {
            console.error('Error saving bale setup:', error);
            alert('Error saving bale setup. Please try again.');
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
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

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
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                No archers added yet. Select archers from the left panel.
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