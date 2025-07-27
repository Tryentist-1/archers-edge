import React, { useState, useEffect } from 'react';
import { generateTeamQRCode, getAvailableTeamCodes } from '../utils/teamQRGenerator.js';
import { getAvailableTeamsFromFirebase } from '../services/firebaseService.js';
import QRCode from 'qrcode';

function CoachQRGenerator() {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [qrInfo, setQrInfo] = useState(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load teams from Firebase
  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoading(true);
        setError('');
        console.log('CoachQRGenerator: Loading teams from Firebase...');
        
        const firebaseTeams = await getAvailableTeamsFromFirebase();
        console.log('CoachQRGenerator: Firebase teams:', firebaseTeams);
        
        if (firebaseTeams && firebaseTeams.length > 0) {
          setTeams(firebaseTeams);
        } else {
          // Fallback to hardcoded teams if Firebase has no teams
          console.log('CoachQRGenerator: No teams in Firebase, using hardcoded teams...');
          const hardcodedTeams = getAvailableTeamCodes().map(teamCode => {
            const teamInfo = generateTeamQRCode(teamCode);
            return {
              teamCode,
              name: teamInfo.teamName,
              school: teamInfo.school,
              team: teamInfo.team,
              archerCount: teamInfo.archerCount
            };
          });
          console.log('CoachQRGenerator: Hardcoded teams:', hardcodedTeams);
          setTeams(hardcodedTeams);
        }
      } catch (error) {
        console.error('Error loading teams:', error);
        setError('Failed to load teams from Firebase. Using sample teams instead.');
        
        // Fallback to hardcoded teams
        console.log('CoachQRGenerator: Falling back to hardcoded teams...');
        const hardcodedTeams = getAvailableTeamCodes().map(teamCode => {
          const teamInfo = generateTeamQRCode(teamCode);
          return {
            teamCode,
            name: teamInfo.teamName,
            school: teamInfo.school,
            team: teamInfo.team,
            archerCount: teamInfo.archerCount
          };
        });
        console.log('CoachQRGenerator: Hardcoded teams:', hardcodedTeams);
        setTeams(hardcodedTeams);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  const handleGenerateQR = async () => {
    if (!selectedTeam) return;

    try {
      setError('');
      const info = generateTeamQRCode(selectedTeam);
      setQrInfo(info);
      
      // Generate actual QR code
      try {
        const qrDataUrl = await QRCode.toDataURL(info.qrUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(qrDataUrl);
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        setQrCodeDataUrl('');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code. Please try again.');
    }
  };

  const handleCopyUrl = (url) => {
    try {
      navigator.clipboard.writeText(url);
      alert('URL copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy URL:', error);
      alert('Failed to copy URL. Please copy manually.');
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    
    try {
      const link = document.createElement('a');
      link.download = `qr-code-${selectedTeam}.png`;
      link.href = qrCodeDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download QR code:', error);
      alert('Failed to download QR code. Please right-click and save manually.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Coach QR Code Generator</h1>
          
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          
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
                {loading ? (
                  <option value="">Loading teams...</option>
                ) : teams.length === 0 ? (
                  <option value="">No teams available.</option>
                ) : (
                  teams.map(team => (
                    <option key={team.teamCode} value={team.teamCode}>
                      {team.name} ({team.archerCount} archers)
                    </option>
                  ))
                )}
              </select>
              
              {!loading && teams.length === 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  No teams found. Create some profiles with school information first.
                </p>
              )}
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateQR}
              disabled={!selectedTeam || loading}
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

                  {/* QR Code */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    {qrCodeDataUrl ? (
                      <div>
                        <img 
                          src={qrCodeDataUrl} 
                          alt="QR Code" 
                          className="w-32 h-32 mx-auto mb-2"
                        />
                        <button
                          onClick={handleDownloadQR}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                        >
                          Download QR Code
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-xs text-gray-500">Generating...</span>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">Scan with Archer's Edge app</p>
                  </div>
                </div>

                {/* URLs */}
                <div className="mt-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QR Code URL (for external QR generators):
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
                    <p className="text-xs text-gray-500 mt-1">
                      Use this URL with external QR generators if needed
                    </p>
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
                    <p className="text-xs text-gray-500 mt-1">
                      Archers can manually enter this URL in their browser
                    </p>
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
                <li>3. Download the generated QR code or use the URL with external generators</li>
                <li>4. Print the QR code and give it to your archers</li>
                <li>5. Archers scan the QR code with the Archer's Edge app</li>
              </ol>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Info:</h3>
                <p className="text-xs text-gray-600">Teams loaded: {teams.length}</p>
                <p className="text-xs text-gray-600">Selected team: {selectedTeam || 'none'}</p>
                <p className="text-xs text-gray-600">Loading: {loading ? 'yes' : 'no'}</p>
                <p className="text-xs text-gray-600">QR Code generated: {qrCodeDataUrl ? 'yes' : 'no'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoachQRGenerator; 