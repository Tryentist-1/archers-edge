/**
 * Team QR Code Generator Utility
 * 
 * This utility helps coaches generate QR codes that contain team data
 * which can be scanned by archers to quickly load their team profiles.
 */

// Sample team data structure
const sampleTeams = {
  'TEST-TEST': {
    name: 'TEST Team',
    school: 'TEST School',
    coach: 'Coach TEST',
    archers: [
      {
        id: 'team-1',
        firstName: 'Robin',
        lastName: 'Hood',
        email: 'robin.hood@test.edu',
        phone: '+1234567890',
        team: 'TEST',
        level: 'Advanced',
        school: 'TEST'
      },
      {
        id: 'team-2',
        firstName: 'Green',
        lastName: 'Arrow',
        email: 'green.arrow@test.edu',
        phone: '+1234567891',
        team: 'TEST',
        level: 'Advanced',
        school: 'TEST'
      },
      {
        id: 'team-3',
        firstName: 'Katniss',
        lastName: 'Aberdeen',
        email: 'katniss.aberdeen@test.edu',
        phone: '+1234567892',
        team: 'TEST',
        level: 'Advanced',
        school: 'TEST'
      },
      {
        id: 'team-4',
        firstName: 'Merida',
        lastName: 'DunBroch',
        email: 'merida.dunbroch@test.edu',
        phone: '+1234567893',
        team: 'TEST',
        level: 'Advanced',
        school: 'TEST'
      }
    ]
  },
  'CAMP-VARSITY': {
    name: 'Camp Varsity Team',
    school: 'CAMP',
    coach: 'Coach Camp',
    archers: [
      {
        id: 'camp-1',
        firstName: 'Brandon',
        lastName: 'Camp',
        email: 'brandon.camp@school.edu',
        phone: '+1234567890',
        team: 'VARSITY',
        level: 'Advanced',
        school: 'CAMP'
      },
      {
        id: 'camp-2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@school.edu',
        phone: '+1234567891',
        team: 'VARSITY',
        level: 'Intermediate',
        school: 'CAMP'
      }
    ]
  },
  'CAMP-JV': {
    name: 'Camp JV Team',
    school: 'CAMP',
    coach: 'Coach Camp',
    archers: [
      {
        id: 'camp-jv-1',
        firstName: 'Mike',
        lastName: 'Davis',
        email: 'mike.davis@school.edu',
        phone: '+1234567892',
        team: 'JV',
        level: 'Beginner',
        school: 'CAMP'
      }
    ]
  }
};

/**
 * Generate a QR code URL for a team
 * @param {string} teamCode - The team code (e.g., 'CENTRAL-VARSITY')
 * @param {string} baseUrl - The base URL of the app
 * @returns {string} - URL that can be converted to QR code
 */
export function generateTeamQRUrl(teamCode, baseUrl = 'https://archers-edge.web.app') {
  const teamData = sampleTeams[teamCode];
  if (!teamData) {
    throw new Error(`Team code '${teamCode}' not found`);
  }

  // Encode team data as URL parameter
  const encodedData = encodeURIComponent(JSON.stringify(teamData.archers));
  
  // Create URL with team data
  const qrUrl = `${baseUrl}?data=${encodedData}`;
  
  return qrUrl;
}

/**
 * Generate a simple team code URL (for manual entry)
 * @param {string} teamCode - The team code
 * @param {string} baseUrl - The base URL of the app
 * @returns {string} - URL with team code
 */
export function generateTeamCodeUrl(teamCode, baseUrl = 'https://archers-edge.web.app') {
  return `${baseUrl}?team=${encodeURIComponent(teamCode)}`;
}

/**
 * Get all available team codes
 * @returns {string[]} - Array of available team codes
 */
export function getAvailableTeamCodes() {
  return ['TEST-TEST', 'CAMP-VARSITY', 'CAMP-JV'];
}

/**
 * Get team information
 * @param {string} teamCode - The team code
 * @returns {object|null} - Team information or null if not found
 */
export function getTeamInfo(teamCode) {
  return sampleTeams[teamCode] || null;
}

/**
 * Create a QR code data URL for display
 * @param {string} teamCode - The team code
 * @param {string} baseUrl - The base URL of the app
 * @returns {Promise<string>} - Data URL for QR code image
 */
export async function generateQRCodeDataUrl(teamCode, baseUrl = 'https://archers-edge.web.app') {
  const qrUrl = generateTeamQRUrl(teamCode, baseUrl);
  
  // For now, return a placeholder
  // In a real implementation, you'd use a QR code library like qrcode.js
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="black">
        Scan to load ${teamCode}
      </text>
    </svg>
  `)}`;
}

/**
 * Generate team QR codes for coaches
 * @param {string} teamCode - The team code
 * @returns {object} - QR code information
 */
export function generateTeamQRCode(teamCode) {
  const teamInfo = getTeamInfo(teamCode);
  if (!teamInfo) {
    throw new Error(`Team code '${teamCode}' not found`);
  }

  const qrUrl = generateTeamQRUrl(teamCode);
  const teamCodeUrl = generateTeamCodeUrl(teamCode);

  return {
    teamCode,
    teamName: teamInfo.name,
    school: teamInfo.school,
    coach: teamInfo.coach,
    archerCount: teamInfo.archers.length,
    qrUrl,
    teamCodeUrl,
    instructions: [
      '1. Open Archer\'s Edge app on your phone',
      '2. Go to "Select from Existing Profiles"',
      '3. Click "Scan QR Code"',
      '4. Point camera at this QR code',
      '5. Your team profiles will be loaded automatically'
    ]
  };
}

export default {
  generateTeamQRUrl,
  generateTeamCodeUrl,
  getAvailableTeamCodes,
  getTeamInfo,
  generateQRCodeDataUrl,
  generateTeamQRCode
}; 