import React, { useState, useEffect } from 'react';
import { 
    assignCoachToSchool, 
    removeCoachFromSchool, 
    getCoachAssignments, 
    getSchoolCoaches,
    createCoachEvent,
    getCoachEvents,
    updateCoachEvent,
    deleteCoachEvent,
    assignArchersToEvent,
    loadProfilesFromFirebase
} from '../services/firebaseService.js';
import { useAuth } from '../contexts/AuthContext.jsx';

function CoachManagement() {
    const { currentUser, userRole } = useAuth();
    const [activeTab, setActiveTab] = useState('assignments');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Coach Assignment State
    const [assignments, setAssignments] = useState([]);
    const [newAssignment, setNewAssignment] = useState({
        coachId: '',
        school: '',
        team: '',
        role: 'head_coach'
    });

    // Coach Events State
    const [events, setEvents] = useState([]);
    const [newEvent, setNewEvent] = useState({
        name: '',
        date: '',
        location: '',
        type: 'practice',
        description: '',
        maxArchers: 20
    });

    // Available coaches and archers
    const [availableCoaches, setAvailableCoaches] = useState([]);
    const [availableArchers, setAvailableArchers] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            // Load coach assignments
            const coachAssignments = await getCoachAssignments();
            setAssignments(coachAssignments);

            // Load coach events
            const coachEvents = await getCoachEvents();
            setEvents(coachEvents);

            // Load available coaches (users with coach role)
            const profiles = await loadProfilesFromFirebase();
            const coaches = profiles.filter(profile => profile.role === 'Coach');
            setAvailableCoaches(coaches);

            // Load available archers
            const archers = profiles.filter(profile => profile.role === 'Archer');
            setAvailableArchers(archers);

        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignCoach = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');

            await assignCoachToSchool(
                newAssignment.coachId,
                newAssignment.school,
                newAssignment.team,
                newAssignment.role,
                currentUser.uid
            );

            setSuccess('Coach assigned successfully!');
            setNewAssignment({ coachId: '', school: '', team: '', role: 'head_coach' });
            loadData();
        } catch (error) {
            console.error('Error assigning coach:', error);
            setError('Failed to assign coach: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveCoach = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to remove this coach assignment?')) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            const assignment = assignments.find(a => a.id === assignmentId);
            await removeCoachFromSchool(assignment.coachId, assignment.school, assignment.team);

            setSuccess('Coach assignment removed successfully!');
            loadData();
        } catch (error) {
            console.error('Error removing coach assignment:', error);
            setError('Failed to remove coach assignment: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');

            const eventData = {
                id: `event_${Date.now()}`,
                ...newEvent,
                coachId: currentUser.uid
            };

            await createCoachEvent(eventData, currentUser.uid);

            setSuccess('Event created successfully!');
            setNewEvent({ name: '', date: '', location: '', type: 'practice', description: '', maxArchers: 20 });
            loadData();
        } catch (error) {
            console.error('Error creating event:', error);
            setError('Failed to create event: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!window.confirm('Are you sure you want to delete this event?')) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            await deleteCoachEvent(eventId);

            setSuccess('Event deleted successfully!');
            loadData();
        } catch (error) {
            console.error('Error deleting event:', error);
            setError('Failed to delete event: ' + error.message);
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

    // Debug logging
    console.log('CoachManagement: currentUser:', currentUser);
    console.log('CoachManagement: userRole:', userRole);
    console.log('CoachManagement: availableCoaches:', availableCoaches);

    if (!currentUser || (userRole !== 'admin' && userRole !== 'coach' && userRole !== 'System Admin')) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Access Denied</h2>
                    <p className="text-gray-600">
                        You don't have permission to access Coach Management. 
                        <br />
                        Current role: {userRole || 'none'}
                        <br />
                        Required: admin, coach, or System Admin
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white shadow rounded-lg">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-gray-900">Coach Management</h1>
                        <p className="text-gray-600">Manage coach assignments and events</p>
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
                                onClick={() => setActiveTab('assignments')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'assignments'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Coach Assignments
                            </button>
                            <button
                                onClick={() => setActiveTab('events')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'events'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Coach Events
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
                                {/* Coach Assignments Tab */}
                                {activeTab === 'assignments' && (
                                    <div className="space-y-6">
                                        {/* New Assignment Form */}
                                        <div className="bg-gray-50 rounded-lg p-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Coach to School</h3>
                                            <form onSubmit={handleAssignCoach} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Coach
                                                        </label>
                                                        <select
                                                            value={newAssignment.coachId}
                                                            onChange={(e) => setNewAssignment({...newAssignment, coachId: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            required
                                                        >
                                                            <option value="">Select Coach</option>
                                                            {availableCoaches.map(coach => (
                                                                <option key={coach.id} value={coach.id}>
                                                                    {coach.firstName} {coach.lastName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            School
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newAssignment.school}
                                                            onChange={(e) => setNewAssignment({...newAssignment, school: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="e.g., CENTRAL"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Team
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newAssignment.team}
                                                            onChange={(e) => setNewAssignment({...newAssignment, team: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="e.g., VARSITY"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Role
                                                        </label>
                                                        <select
                                                            value={newAssignment.role}
                                                            onChange={(e) => setNewAssignment({...newAssignment, role: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="head_coach">Head Coach</option>
                                                            <option value="assistant_coach">Assistant Coach</option>
                                                            <option value="volunteer_coach">Volunteer Coach</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    Assign Coach
                                                </button>
                                            </form>
                                        </div>

                                        {/* Assignments List */}
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">Current Assignments</h3>
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Coach
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                School
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Team
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Role
                                                            </th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {assignments.map((assignment) => {
                                                            const coach = availableCoaches.find(c => c.id === assignment.coachId);
                                                            return (
                                                                <tr key={assignment.id}>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {coach ? `${coach.firstName} ${coach.lastName}` : 'Unknown Coach'}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {assignment.school}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {assignment.team}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        {assignment.role.replace('_', ' ')}
                                                                    </td>
                                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                        <button
                                                                            onClick={() => handleRemoveCoach(assignment.id)}
                                                                            className="text-red-600 hover:text-red-900"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Coach Events Tab */}
                                {activeTab === 'events' && (
                                    <div className="space-y-6">
                                        {/* New Event Form */}
                                        <div className="bg-gray-50 rounded-lg p-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Event</h3>
                                            <form onSubmit={handleCreateEvent} className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Event Name
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newEvent.name}
                                                            onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="e.g., Varsity Practice"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Date
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={newEvent.date}
                                                            onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Location
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newEvent.location}
                                                            onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="e.g., School Gym"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Type
                                                        </label>
                                                        <select
                                                            value={newEvent.type}
                                                            onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="practice">Practice</option>
                                                            <option value="competition">Competition</option>
                                                            <option value="tryout">Tryout</option>
                                                            <option value="meeting">Meeting</option>
                                                        </select>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Description
                                                        </label>
                                                        <textarea
                                                            value={newEvent.description}
                                                            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            rows="3"
                                                            placeholder="Event details..."
                                                        />
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    Create Event
                                                </button>
                                            </form>
                                        </div>

                                        {/* Events List */}
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">Coach Events</h3>
                                            <div className="space-y-4">
                                                {events.map((event) => (
                                                    <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-6">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h4 className="text-lg font-medium text-gray-900">{event.name}</h4>
                                                                <p className="text-sm text-gray-600">{event.description}</p>
                                                                <div className="mt-2 space-y-1">
                                                                    <p className="text-sm text-gray-500">
                                                                        <span className="font-medium">Date:</span> {event.date}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        <span className="font-medium">Location:</span> {event.location}
                                                                    </p>
                                                                    <p className="text-sm text-gray-500">
                                                                        <span className="font-medium">Type:</span> {event.type}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteEvent(event.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
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

export default CoachManagement; 