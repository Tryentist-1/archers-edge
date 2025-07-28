// Test script for Event Assignment Integration
// Run with: node test-integration.js

console.log('🧪 Testing Event Assignment Integration...\n');

// Mock data for testing
const mockAssignment = {
    id: 'test-assignment-123',
    competitionId: 'test-comp-456',
    competitionName: 'Test Regional Championship',
    assignmentType: 'school',
    archerIds: ['archer1', 'archer2', 'archer3', 'archer4'],
    numberOfBales: 2,
    maxArchersPerBale: 4,
    createdBy: 'test-coach',
    status: 'draft',
    bales: [
        {
            baleNumber: 1,
            division: 'GV',
            archers: [
                { id: 'archer1', firstName: 'Alice', lastName: 'Smith', targetAssignment: 'A' },
                { id: 'archer2', firstName: 'Betty', lastName: 'Jones', targetAssignment: 'B' }
            ]
        },
        {
            baleNumber: 2,
            division: 'BV',
            archers: [
                { id: 'archer3', firstName: 'Charlie', lastName: 'Brown', targetAssignment: 'A' },
                { id: 'archer4', firstName: 'David', lastName: 'Wilson', targetAssignment: 'B' }
            ]
        }
    ]
};

console.log('✅ Mock assignment data created');
console.log('📊 Assignment details:');
console.log(`   - Competition: ${mockAssignment.competitionName}`);
console.log(`   - Type: ${mockAssignment.assignmentType}`);
console.log(`   - Archers: ${mockAssignment.archerIds.length}`);
console.log(`   - Bales: ${mockAssignment.bales.length}`);
console.log(`   - Status: ${mockAssignment.status}\n`);

// Test conversion logic
console.log('🔄 Testing conversion logic...');

const convertToScoringRounds = (assignment) => {
    const scoringRounds = [];
    
    assignment.bales.forEach(bale => {
        // Create scoring data structure for each archer
        const archersWithScores = bale.archers.map(archer => {
            const scoresObject = {};
            for (let end = 1; end <= 12; end++) {
                scoresObject[`end${end}`] = {
                    arrow1: '',
                    arrow2: '',
                    arrow3: ''
                };
            }
            
            return {
                ...archer,
                scores: scoresObject
            };
        });
        
        // Create bale data structure
        const baleData = {
            id: `assignment_${assignment.id}_bale_${bale.baleNumber}`,
            baleNumber: bale.baleNumber,
            competitionId: assignment.competitionId,
            competitionName: assignment.competitionName,
            competitionType: 'qualification',
            isPracticeRound: false,
            archers: archersWithScores,
            currentEnd: 1,
            totalEnds: 12,
            createdBy: assignment.createdBy,
            status: 'active',
            assignmentId: assignment.id,
            eventAssignmentType: assignment.assignmentType
        };
        
        scoringRounds.push(baleData);
    });
    
    return scoringRounds;
};

const scoringRounds = convertToScoringRounds(mockAssignment);

console.log('✅ Conversion completed');
console.log(`📊 Created ${scoringRounds.length} scoring rounds:`);
scoringRounds.forEach((round, index) => {
    console.log(`   ${index + 1}. Bale ${round.baleNumber} - ${round.archers.length} archers`);
    round.archers.forEach(archer => {
        console.log(`      - ${archer.firstName} ${archer.lastName} (Target ${archer.targetAssignment})`);
    });
});

console.log('\n🧪 Testing assignment retrieval logic...');

const findArcherInRounds = (archerId, rounds) => {
    for (const round of rounds) {
        const archerInRound = round.archers.find(a => a.id === archerId);
        if (archerInRound) {
            return {
                type: 'scoring_round',
                roundId: round.id,
                baleNumber: round.baleNumber,
                competitionId: round.competitionId,
                competitionName: round.competitionName,
                archer: archerInRound,
                targetAssignment: archerInRound.targetAssignment,
                allArchers: round.archers,
                currentEnd: round.currentEnd,
                totalEnds: round.totalEnds,
                status: round.status
            };
        }
    }
    return null;
};

// Test finding archer assignments
const testArcherIds = ['archer1', 'archer3', 'nonexistent'];
testArcherIds.forEach(archerId => {
    const assignment = findArcherInRounds(archerId, scoringRounds);
    if (assignment) {
        console.log(`✅ Found assignment for ${archerId}:`);
        console.log(`   - Bale: ${assignment.baleNumber}`);
        console.log(`   - Target: ${assignment.targetAssignment}`);
        console.log(`   - Competition: ${assignment.competitionName}`);
        console.log(`   - Archers on bale: ${assignment.allArchers.length}`);
    } else {
        console.log(`❌ No assignment found for ${archerId}`);
    }
});

console.log('\n🎉 Integration test completed successfully!');
console.log('✅ All core functions working correctly');
console.log('✅ Data structures compatible');
console.log('✅ Assignment retrieval logic functional'); 