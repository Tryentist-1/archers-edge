# Archer's Edge Development TODO

## Session 3: Firebase Authentication ✅ COMPLETED

### Goals:
- [x] Set up Firebase project and configuration
- [x] Implement authentication with Google and phone sign-in
- [x] Create login UI with modern design
- [x] Fix Tailwind CSS configuration issues
- [x] Test authentication flow
- [x] Fix phone authentication reCAPTCHA issues
- [x] Implement score persistence with Firestore

### Accomplishments:
- ✅ Created Firebase configuration with real project values
- ✅ Implemented AuthContext for state management
- ✅ Built Login component with Google and phone authentication
- ✅ Fixed Tailwind CSS v4 compatibility issues by downgrading to v3
- ✅ Server running successfully on http://localhost:3000
- ✅ Created comprehensive Firebase setup guide
- ✅ Fixed phone authentication with proper reCAPTCHA handling
- ✅ Implemented score persistence in Firestore database
- ✅ Added auto-save functionality for scores
- ✅ Created competition total tracking

### Next Steps:
- [ ] Enable phone authentication in Firebase Console
- [ ] Test phone authentication with real/test numbers
- [ ] Set up Firestore security rules
- [ ] Begin Session 4: Multiple Archers Per Bale (Core Functionality)

## Session 4: Multiple Archers Per Bale 🎯 **CORE FUNCTIONALITY**

### Goals:
- [x] **Archer Setup Interface**: Add/remove archers to bale
- [x] **Target Assignment**: Assign archers to targets (A, B, C, D, etc.)
- [x] **Multi-Archer Scoring**: Score multiple archers per end
- [x] **Archer Switching**: Switch between archers during scoring
- [x] **Individual Cards**: View individual archer scorecards
- [x] **Bale Totals**: Combined totals for all archers on bale

### Technical Tasks:
- [x] **Data Structure Redesign**:
  ```javascript
  {
    baleNumber: 1,
    archers: [
      {
        id: "archer1",
        firstName: "John",
        lastName: "Doe", 
        targetAssignment: "A",
        scores: [[10, 9, 8], [X, 10, 9], ...] // 12 ends x 3 arrows
      }
    ],
    currentEnd: 1,
    totalEnds: 12
  }
  ```
- [x] **Setup View**: Archer selection with target assignment
- [x] **Scoring View**: Multi-row table with all archers
- [x] **Card View**: Individual archer scorecard
- [x] **Navigation**: Switch between setup, scoring, and card views

### Recent Accomplishments:
- ✅ **Keypad Functionality**: Fixed keypad appearance and score entry
- ✅ **Focus Management**: Improved focus handling between ends and inputs
- ✅ **Blur Handling**: Added proper timeout-based blur detection
- ✅ **Color Contrast**: Fixed white text on white background in bale totals
- ✅ **Test Harness**: Added Vitest and React Testing Library for debugging
- ✅ **Local Storage**: Added debugging for persistence issues
- ✅ **End Navigation**: Fixed keypad dismissal when navigating between ends

### Current Issues to Fix:
- [x] **Close Button**: Keypad close button not working properly
- [x] **Keypad Dismissal**: Keypad doesn't dismiss when clicking outside
- [x] **Persistence**: App resets on refresh - need to fix local storage loading
- [x] **Debug Cleanup**: Remove debug indicators and console logs
- [x] **End Totals**: Fixed display to show end-specific totals instead of bale totals

### Reference Implementation:
Based on `/Users/terry/web-mirrors/tryentist/wdv/ranking_round.html`:
- ✅ **Setup Phase**: Select archers and assign targets
- ✅ **Scoring Phase**: Score all archers per end
- ✅ **Card Phase**: Individual archer verification
- ✅ **Bale Totals**: Combined verification and export

## Session 5: Competition Management

### Goals:
- [ ] Create competition creation interface
- [ ] Implement real-time leaderboards
- [ ] Add participant management
- [ ] Build scoring session management

## Session 6: Data Persistence & Offline Sync

### Goals:
- [ ] Implement offline-first architecture
- [ ] Add local storage for disconnected scenarios
- [ ] Create sync mechanism for when connection returns
- [ ] Add data export/import functionality

## Session 7: Polish & Deployment

### Goals:
- [ ] Mobile-responsive design optimization
- [ ] Performance optimization
- [ ] PWA features (offline, installable)
- [ ] Deploy to Firebase Hosting
- [ ] Final testing and bug fixes

## Current Status:
- ✅ **Session 3 Complete**: Firebase authentication working
- 🎯 **Session 4 In Progress**: Multiple archers per bale (CORE FUNCTIONALITY)
- ✅ **Keypad Working**: Scores can be entered and flow between fields
- ✅ **Focus Management**: Improved navigation between ends
- 🚀 **Server Running**: http://localhost:3000

## Recent Fixes:
- ✅ **Phone Authentication**: Fixed reCAPTCHA initialization and error handling
- ✅ **Score Persistence**: Scores now save to Firestore and persist between ends
- ✅ **Auto-save**: Scores automatically save after each change
- ✅ **Competition Tracking**: Added total competition score display
- ✅ **Color Coding**: Fixed to match exact archery color scheme
- ✅ **Keypad Functionality**: Keypad appears and accepts input correctly
- ✅ **Focus Management**: Proper focus handling between inputs and ends
- ✅ **Color Contrast**: Fixed white text on white background in totals

## Notes:
- Firebase configuration updated with real project values
- Tailwind CSS v3 installed and working
- Authentication UI ready for testing
- **Need to enable phone authentication in Firebase Console**
- **MULTIPLE ARCHERS PER BALE IS THE CORE FUNCTIONALITY** - not just a feature!
- Keypad functionality working but close button needs debugging
- Local storage persistence needs debugging for app reset issue 