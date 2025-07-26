import React, { useState } from 'react';
import { generateTeamQRCode, getAvailableTeamCodes } from '../utils/teamQRGenerator.js';

function CoachQRGenerator() {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [qrInfo, setQrInfo] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const availableTeams = getAvailableTeamCodes();

  const handleGenerateQR = () => {
    if (!selectedTeam) return;

    try {
      const info = generateTeamQRCode(selectedTeam);
      setQrInfo(info);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    alert('URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Coach QR Code Generator</h1>
          
          <div className="space-y-6">
            {/* Team Selection */}
            <div>
              <label htmlFor="team" className="block text-sm font-medium text-gray-700 mb-2">
                Select Team
              </label>
              <select
                id="team"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a team...</option>
                {availableTeams.map(teamCode => (
                  <option key={teamCode} value={teamCode}>
                    {teamCode.replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateQR}
              disabled={!selectedTeam}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate QR Code
            </button>

            {/* QR Code Display */}
            {qrInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  QR Code for {qrInfo.teamName}
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Team Info */}
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">School:</span>
                      <p className="text-gray-900">{qrInfo.school}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Coach:</span>
                      <p className="text-gray-900">{qrInfo.coach}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Archers:</span>
                      <p className="text-gray-900">{qrInfo.archerCount} archers</p>
                    </div>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-xs text-gray-500">QR Code</span>
                    </div>
                    <p className="text-xs text-gray-500">Scan with Archer's Edge app</p>
                  </div>
                </div>

                {/* URLs */}
                <div className="mt-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QR Code URL (for QR code generators):
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={qrInfo.qrUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => handleCopyUrl(qrInfo.qrUrl)}
                        className="px-3 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Code URL (for manual entry):
                    </label>
                    <div className="flex">
                      <input
                        type="text"
                        value={qrInfo.teamCodeUrl}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => handleCopyUrl(qrInfo.teamCodeUrl)}
                        className="px-3 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-6">
                  <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    {showInstructions ? 'Hide' : 'Show'} Instructions
                  </button>
                  
                  {showInstructions && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-4">
                      <h3 className="text-sm font-medium text-blue-900 mb-2">Instructions for Archers:</h3>
                      <ol className="text-sm text-blue-800 space-y-1">
                        {qrInfo.instructions.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Usage Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">How to Use:</h3>
              <ol className="text-sm text-yellow-800 space-y-1">
                <li>1. Select your team from the dropdown</li>
                <li>2. Click "Generate QR Code"</li>
                <li>3. Use a QR code generator (like qr-code-generator.com) with the QR Code URL</li>
                <li>4. Print the QR code and give it to your archers</li>
                <li>5. Archers scan the QR code with the Archer's Edge app</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoachQRGenerator; 