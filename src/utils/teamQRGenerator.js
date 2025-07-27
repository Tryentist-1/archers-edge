/**
 * Team QR Code Generator Utility
 * 
 * This utility helps coaches generate QR codes that contain team data
 * which can be scanned by archers to quickly load their team profiles.
 */

// Sample team data structure
const sampleTeams = {
  'TEST': {
    name: 'TEST Team',
    school: 'TEST',
    coach: 'Coach TEST',
    archers: [
      {
        id: 'team-1',
        firstName: 'Robin',
        lastName: 'Hood',
        email: 'robin.hood@test.edu',
        phone: '+1234567890',
        division: 'V',
        level: 'Advanced',
        school: 'TEST'
      },
      {
        id: 'team-2',
        firstName: 'Green',
        lastName: 'Arrow',
        email: 'green.arrow@test.edu',
        phone: '+1234567891',
        division: 'V',
        level: 'Advanced',
        school: 'TEST'
      },
      {
        id: 'team-3',
        firstName: 'Katniss',
        lastName: 'Aberdeen',
        email: 'katniss.aberdeen@test.edu',
        phone: '+1234567892',
        division: 'JV',
        level: 'Advanced',
        school: 'TEST'
      },
      {
        id: 'team-4',
        firstName: 'Merida',
        lastName: 'DunBroch',
        email: 'merida.dunbroch@test.edu',
        phone: '+1234567893',
        division: 'V',
        level: 'Advanced',
        school: 'TEST'
      }
    ]
  },
  'CAMP': {
    name: 'Camp Team',
    school: 'CAMP',
    coach: 'Coach Camp',
    archers: [
      {
        id: 'camp-1',
        firstName: 'Brandon',
        lastName: 'Camp',
        email: 'brandon.camp@school.edu',
        phone: '+1234567890',
        division: 'V',
        level: 'Advanced',
        school: 'CAMP'
      },
      {
        id: 'camp-2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@school.edu',
        phone: '+1234567891',
        division: 'JV',
        level: 'Intermediate',
        school: 'CAMP'
      },
      {
        id: 'camp-3',
        firstName: 'Mike',
        lastName: 'Davis',
        email: 'mike.davis@school.edu',
        phone: '+1234567892',
        division: 'V',
        level: 'Beginner',
        school: 'CAMP'
      }
    ]
  },
  'WDV': {
    name: 'WDV Team',
    school: 'WDV',
    coach: 'Coach WDV',
    archers: [
      {
        id: 'wdv-1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@wdv.edu',
        phone: '+1234567890',
        division: 'V',
        level: 'Advanced',
        school: 'WDV'
      }
    ]
  },
  'BHS': {
    name: 'BHS Team',
    school: 'BHS',
    coach: 'Coach BHS',
    archers: [
      {
        id: 'bhs-1',
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@bhs.edu',
        phone: '+1234567890',
        division: 'V',
        level: 'Advanced',
        school: 'BHS'
      }
    ]
  },
  'ORANCO': {
    name: 'ORANCO Team',
    school: 'ORANCO',
    coach: 'Coach Oranco',
    archers: [
      {
        id: 'oranco-1',
        firstName: 'Alex',
        lastName: 'Wilson',
        email: 'alex.wilson@oranco.edu',
        phone: '+1234567890',
        division: 'V',
        level: 'Advanced',
        school: 'ORANCO'
      }
    ]
  },
  'JOAD Beaumont': {
    name: 'JOAD Beaumont Team',
    school: 'JOAD Beaumont',
    coach: 'Coach JOAD',
    archers: [
      {
        id: 'joad-1',
        firstName: 'Sam',
        lastName: 'Brown',
        email: 'sam.brown@joad.edu',
        phone: '+1234567890',
        division: 'V',
        level: 'Advanced',
        school: 'JOAD Beaumont'
      }
    ]
  }
};

/**
 * Generate a QR code URL for team data
 * @param {string} teamCode - The team code
 * @param {string} baseUrl - The base URL of the app
 * @returns {string} - URL with team code
 */
export function generateTeamQRUrl(teamCode, baseUrl = 'https://archers-edge.web.app') {
  const teamData = sampleTeams[teamCode];
  if (!teamData) {
    throw new Error(`Team code '${teamCode}' not found`);
  }

  // Use simple team code URL - the app will load team data from Firebase or fallback
  const qrUrl = `${baseUrl}?team=${encodeURIComponent(teamCode)}`;
  
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
  return ['TEST', 'CAMP', 'WDV', 'BHS', 'ORANCO', 'JOAD Beaumont'];
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
      '2. Scan this QR code with your phone camera',
      '3. The app will open with your team pre-loaded',
      '4. Select your profile from the team list',
      '5. You\'re ready to start scoring!'
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