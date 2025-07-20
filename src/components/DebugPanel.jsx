import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const DebugPanel = () => {
  const { currentUser, loading } = useAuth();

  return (
    <div className="fixed top-0 left-0 bg-red-100 border border-red-400 p-2 m-2 rounded z-50 text-xs">
      <h3 className="font-bold">Debug Panel</h3>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>User: {currentUser ? 'Logged in' : 'Not logged in'}</div>
      <div>User ID: {currentUser?.uid || 'none'}</div>
      <div>Email: {currentUser?.email || 'none'}</div>
      <div>Time: {new Date().toLocaleTimeString()}</div>
    </div>
  );
};

export default DebugPanel; 