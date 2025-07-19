import React from 'react'
import './App.css'
import ScoringInterface from './components/ScoringInterface.jsx'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Archer's Edge</h1>
        <p>Modern archery scoring and management</p>
      </header>
      <main className="min-h-screen bg-gray-100 py-8">
        <ScoringInterface />
      </main>
    </div>
  )
}

export default App 