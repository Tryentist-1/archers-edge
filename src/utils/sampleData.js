// Sample Coach Profiles to add to existing profiles
export const sampleCoachProfiles = [
  {
    id: 'coach-1',
    firstName: 'Coach',
    lastName: 'TEST',
    email: 'coach.test@school.edu',
    phone: '+1234567890',
    role: 'Coach',
    school: 'TEST',
    team: 'TEST',
    division: 'Coach',
    bowType: 'Coach',
    isActive: true,
    isMe: false,
    isFavorite: false,
    createdBy: 'system',
    updatedBy: 'system',
    updatedAt: new Date().toISOString()
  }
];

// Function to add coach profiles to existing profiles
export const addCoachProfilesToExisting = () => {
  try {
    const existingProfiles = localStorage.getItem('archerProfiles');
    if (existingProfiles) {
      const profiles = JSON.parse(existingProfiles);
      
      // Check if coach profiles already exist
      const existingCoachIds = profiles.filter(p => p.role === 'Coach').map(p => p.id);
      const newCoachProfiles = sampleCoachProfiles.filter(coach => 
        !existingCoachIds.includes(coach.id)
      );
      
      if (newCoachProfiles.length > 0) {
        const updatedProfiles = [...profiles, ...newCoachProfiles];
        localStorage.setItem('archerProfiles', JSON.stringify(updatedProfiles));
        console.log('Added coach profiles:', newCoachProfiles);
        return newCoachProfiles;
      } else {
        console.log('Coach profiles already exist');
        return [];
      }
    } else {
      // No existing profiles, create new with coach profiles
      localStorage.setItem('archerProfiles', JSON.stringify(sampleCoachProfiles));
      console.log('Created new profiles with coach profiles:', sampleCoachProfiles);
      return sampleCoachProfiles;
    }
  } catch (error) {
    console.error('Error adding coach profiles:', error);
    return [];
  }
};

// Function to create sample teams in Firebase
export const createSampleTeams = async () => {
  try {
    const { saveTeamToFirebase } = await import('../services/firebaseService.js');
    
    const sampleTeams = [
      {
        teamCode: 'TEST-TEST',
        name: 'TEST Team',
        school: 'TEST',
        team: 'TEST',
        coach: 'Coach TEST',
        archers: [
          {
            id: 'archer-1',
            firstName: 'Robin',
            lastName: 'Hood',
            email: 'robin.hood@test.edu',
            phone: '+1234567890',
            school: 'TEST',
            team: 'TEST',
            division: 'V',
            bowType: 'Recurve ILF'
          },
          {
            id: 'archer-2',
            firstName: 'Green',
            lastName: 'Arrow',
            email: 'green.arrow@test.edu',
            phone: '+1234567891',
            school: 'TEST',
            team: 'TEST',
            division: 'V',
            bowType: 'Recurve ILF'
          },
          {
            id: 'archer-3',
            firstName: 'Katniss',
            lastName: 'Aberdeen',
            email: 'katniss.aberdeen@test.edu',
            phone: '+1234567892',
            school: 'TEST',
            team: 'TEST',
            division: 'V',
            bowType: 'Recurve ILF'
          },
          {
            id: 'archer-4',
            firstName: 'Merida',
            lastName: 'DunBroch',
            email: 'merida.dunbroch@test.edu',
            phone: '+1234567893',
            school: 'TEST',
            team: 'TEST',
            division: 'V',
            bowType: 'Recurve ILF'
          }
        ]
      }
    ];

    for (const team of sampleTeams) {
      await saveTeamToFirebase(team, 'system');
      console.log('Created team:', team.teamCode);
    }

    return sampleTeams;
  } catch (error) {
    console.error('Error creating sample teams:', error);
    return [];
  }
}; 