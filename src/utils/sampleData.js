// Sample Coach Profiles to add to existing profiles
export const sampleCoachProfiles = [
  {
    id: 'coach-1',
    firstName: 'Coach',
    lastName: 'Adams',
    email: 'coach.adams@school.edu',
    phone: '+1234567890',
    role: 'Coach',
    school: 'CENTRAL',
    team: 'VARSITY',
    division: 'Coach',
    bowType: 'Coach',
    isActive: true,
    isMe: false,
    isFavorite: false,
    createdBy: 'system',
    updatedBy: 'system',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'coach-2',
    firstName: 'Coach',
    lastName: 'Johnson',
    email: 'coach.johnson@school.edu',
    phone: '+1234567891',
    role: 'Coach',
    school: 'CENTRAL',
    team: 'JV',
    division: 'Coach',
    bowType: 'Coach',
    isActive: true,
    isMe: false,
    isFavorite: false,
    createdBy: 'system',
    updatedBy: 'system',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'coach-3',
    firstName: 'Coach',
    lastName: 'Davis',
    email: 'coach.davis@school.edu',
    phone: '+1234567892',
    role: 'Coach',
    school: 'WESTERN',
    team: 'VARSITY',
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
        teamCode: 'CENTRAL-VARSITY',
        name: 'Central High Varsity',
        school: 'CENTRAL',
        team: 'VARSITY',
        coach: 'Coach Adams',
        archers: [
          {
            id: 'archer-1',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@central.edu',
            phone: '+1234567890',
            school: 'CENTRAL',
            team: 'VARSITY',
            division: 'V',
            bowType: 'Recurve ILF'
          },
          {
            id: 'archer-2',
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah.johnson@central.edu',
            phone: '+1234567891',
            school: 'CENTRAL',
            team: 'VARSITY',
            division: 'V',
            bowType: 'Recurve ILF'
          }
        ]
      },
      {
        teamCode: 'CENTRAL-JV',
        name: 'Central High JV',
        school: 'CENTRAL',
        team: 'JV',
        coach: 'Coach Johnson',
        archers: [
          {
            id: 'archer-3',
            firstName: 'Mike',
            lastName: 'Davis',
            email: 'mike.davis@central.edu',
            phone: '+1234567892',
            school: 'CENTRAL',
            team: 'JV',
            division: 'JV',
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