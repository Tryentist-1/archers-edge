import React from 'react'
import './App.css'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import Login from './components/Login.jsx'
import ScoringInterface from './components/ScoringInterface.jsx'

function AppContent() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="App">
      <header className="App-header">
        <h1>Archer's Edge</h1>
        <p>Modern archery scoring and management</p>
        {currentUser && (
          <div className="flex items-center space-x-4 mt-4">
            <span className="text-sm opacity-80">
              Welcome, {currentUser.phoneNumber || currentUser.email}
            </span>
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        )}
      </header>
      <main className="min-h-screen bg-gray-100 py-8">
        {currentUser ? (
          <ScoringInterface />
        ) : (
          <Login />
        )}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App 