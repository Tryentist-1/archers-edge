# Archer's Edge - Development TODO

## 🏆 COMPETITION RESULTS & SCORECARD IMPROVEMENTS (CURRENT SPRINT)
**Priority**: HIGH - Core functionality for competition management
**Status**: IN PROGRESS - Enhanced results view implemented

### Current Issues Identified
- [x] **Score-Archer Linkage**: Scores do not properly link to archer profiles
- [x] **Competition Results**: No proper results page showing archer rankings
- [x] **Scorecard Display**: Missing detailed scorecard view for individual archers
- [x] **Competition Integration**: Scores not available in competition screens
- [x] **Results Summary**: No top 5 rankings by event category

### Required Improvements

#### 1. Enhanced Competition Results Page ✅ COMPLETED
- [x] **Results Overview**
  - [x] Show each archer with running total or completed total
  - [x] Display archer name, division, school, current score
  - [x] Indicate completion status (in progress/completed)
  - [x] Sort by score (highest first) within divisions
  - [x] Show top 5 in each event category (MV, MJV, FV, FJV, etc.)

- [x] **Archer Detail View**
  - [x] Click on archer to see detailed scorecard
  - [x] Display archer name in bold at top
  - [x] Show competition name and date
  - [x] Indicate if Varsity or JV score
  - [x] Display complete 12-end scorecard with all arrows
  - [x] Show running totals and averages per end
  - [x] Include final totals (score, tens, Xs, average)

#### 2. Scorecard Improvements ✅ COMPLETED
- [x] **Detailed Scorecard Component**
  - [x] Create `CompetitionScorecard.jsx` component
  - [x] Match ranking round results format
  - [x] Bold archer name at top
  - [x] Competition name and date
  - [x] Varsity/JV indicator
  - [x] Complete 12-end breakdown
  - [x] Running totals and averages
  - [x] Final statistics

- [x] **Scorecard Data Structure**
  - [x] Link scores to archer profiles via `archerId`
  - [x] Store competition metadata (name, date, type)
  - [x] Include division and gender information
  - [x] Track completion status and verification

#### 3. Competition Management Integration ✅ COMPLETED
- [x] **Results Tab in Competition Management**
  - [x] Add "Results" tab to competition details
  - [x] Show archer list with scores
  - [x] Display completion status
  - [x] Link to detailed scorecards
  - [x] Show top 5 rankings by division

- [x] **Score Linking**
  - [x] Ensure all scores link to archer profiles
  - [x] Update scoring components to save archer ID
  - [x] Link competition scores to competition records
  - [x] Maintain proper data relationships

#### 4. Data Model Improvements ✅ COMPLETED
- [x] **Enhanced Score Storage**
  - [x] Update `competitionScores` collection structure
  - [x] Ensure `archerId` is always included
  - [x] Add competition metadata to each score
  - [x] Include division and gender information
  - [x] Track completion and verification status

- [x] **Profile Integration**
  - [x] Link scores to archer profiles
  - [x] Update profile performance stats
  - [x] Show recent competition scores in profiles
  - [x] Calculate and display PRs and averages

#### 5. UI/UX Enhancements ✅ COMPLETED
- [x] **Results Page Design**
  - [x] Clean, mobile-friendly results layout
  - [x] Easy navigation between archers
  - [x] Clear completion status indicators
  - [x] Intuitive scorecard access

- [x] **Scorecard Design**
  - [x] Professional scorecard layout
  - [x] Clear arrow-by-arrow breakdown
  - [x] Running totals and averages
  - [x] Final statistics summary

### Implementation Plan

#### Phase 1: Data Structure & Linking ✅ COMPLETED
- [x] Update scoring components to properly link scores to archers
- [x] Enhance `competitionScores` collection structure
- [x] Ensure all scores include archer profile information
- [x] Update Firebase service functions for proper data relationships

#### Phase 2: Competition Results Page ✅ COMPLETED
- [x] Create enhanced results view in CompetitionManagement
- [x] Display archer list with scores and completion status
- [x] Implement top 5 rankings by division
- [x] Add navigation to detailed scorecards

#### Phase 3: Detailed Scorecard Component ✅ COMPLETED
- [x] Create `CompetitionScorecard.jsx` component
- [x] Implement professional scorecard layout
- [x] Display complete 12-end breakdown
- [x] Show running totals and final statistics

#### Phase 4: Integration & Testing ✅ COMPLETED
- [x] Integrate scorecard component into results flow
- [x] Test score linking and data relationships
- [x] Verify competition results display correctly
- [x] Test mobile responsiveness and usability

### Technical Requirements

#### Data Relationships ✅ COMPLETED
- [x] **Scores → Archers**: All scores must link to archer profiles via `archerId`
- [x] **Scores → Competitions**: All competition scores must link to competition records
- [x] **Profiles → Scores**: Archer profiles should show recent competition scores
- [x] **Competitions → Results**: Competition records should show all participant scores

#### Component Structure ✅ COMPLETED
- [x] **CompetitionManagement**: Enhanced with results tab and archer rankings
- [x] **CompetitionScorecard**: New component for detailed scorecard display
- [x] **ScoreHistory**: Updated to show competition vs practice rounds
- [x] **ArcherProfileWithStats**: Enhanced to show competition performance

#### Firebase Collections ✅ COMPLETED
- [x] **competitionScores**: Enhanced with proper archer and competition links
- [x] **profiles**: Updated with performance statistics and recent scores
- [x] **competitions**: Enhanced with results and participant information

### Success Criteria ✅ COMPLETED
- [x] All scores properly link to archer profiles
- [x] Competition results page shows archer rankings
- [x] Clicking archer shows detailed scorecard
- [x] Top 5 rankings displayed by division
- [x] Scorecards match ranking round format
- [x] Mobile-friendly design and navigation
- [x] Proper data relationships maintained

### 🎉 **COMPETITION RESULTS SPRINT COMPLETED**
**Status**: ✅ **COMPLETED** - All major features implemented and tested
**Next Priority**: Bale Assignment Management or Advanced Features

---

## 🔧 **PROFILE MANAGEMENT FIXES (CURRENT SPRINT)**
**Priority**: HIGH - User experience and data sync issues
**Status**: IN PROGRESS - Fixing profile filtering and sync

### Issues Identified
- [x] **Missing School Filter**: No way to filter profiles by school
- [x] **Team Field Confusion**: SystemAdminManagement had unused team field
- [x] **Firebase Sync Issues**: Profiles not syncing properly
- [x] **Profile Requirements**: Should only require school, not team

### Fixes Applied
- [x] **School Filter Added**: 
  - [x] ProfileManagement now has school filter
  - [x] SystemAdminManagement has school filter
  - [x] TeamArcherManagement has school filter
  - [x] All filters show count of filtered vs total profiles

- [x] **Team Field Removed**:
  - [x] Removed unused team field from SystemAdminManagement
  - [x] Simplified profile creation requirements
  - [x] School is now the primary organizational field

- [x] **Enhanced Debugging**:
  - [x] Added detailed Firebase sync logging
  - [x] Better error handling for sync issues
  - [x] Clear status messages for sync operations

### Testing Required
- [ ] Test school filtering in all profile management screens
- [ ] Verify Firebase sync is working correctly
- [ ] Test profile creation without team field
- [ ] Verify your test profiles (Robin Hood, Green Arrow, etc.) are visible
- [ ] Check that profiles sync between Profile Management and Team Management

### Next Steps
- [ ] Investigate why test profiles aren't syncing to Firebase
- [ ] Add bulk operations for profile management
- [ ] Improve profile search functionality
- [ ] Add profile import/export features

## 📚 DOCUMENTATION UPDATES ✅ COMPLETED
- [x] **Authentication Setup Guide** - Complete Firebase and reCAPTCHA setup instructions
- [x] **Development & Deployment Guide** - Local dev server and production deployment workflow
- [x] **Startup Script** - Automated dev server startup with network access
- [x] **Session Management** - Step-by-step workflow for new development sessions
- [x] **Style Guide** - Comprehensive UI patterns and OAS standards
- [x] **Roadmap Alignment** - Updated to reflect current TODO priorities

### Quick Start Commands
```bash
# Easy dev server startup (handles port conflicts automatically)
./scripts/start-dev.sh

# Manual startup
npm run dev -- --host

# Stop dev server
pkill -f "npm run dev"

# Deploy to production
firebase deploy
```

## 🐛 BUGS AND TWEAKS TODO
- [x] **Header Navigation Fix** - "Archer's Edge" → Home, "First Last" → My Profile, "Logout" (remove selected profile confusion) ✅ COMPLETED
- [x] **Home Page Card Layout** - "My Profile", "New Ranking Round", "Score History" (default to "Show My Scores Only") ✅ COMPLETED
- [x] **Coaches** - Consolidate Profile Management into Team Archer Management and rename to "Coaches" ✅ COMPLETED
- [x] **Remove Quick Stats** - Clean up homepage layout ✅ COMPLETED
- [x] **Competitions** - Add to homepage ✅ COMPLETED
- [ ] **Save/Next Button Issue** - Ranking round save and next button requires 2 presses instead of 1
- [ ] **Unsaved Changes Helper Text** - Shows "unsaved changes" when navigating to previous end even though scores are synced to Firebase
- [ ] **Local Storage Sync Investigation** - Check if app has ability to save changes locally until connection to sync back to Firebase
- [x] **Mobile-Friendly Coach Management** - Convert table layout to card-based layout for better mobile experience ✅ COMPLETED
- [x] **Clean Coach Management UI** - Remove checkboxes, bulk functions, make names clickable, improve favorites, fix stats loading ✅ COMPLETED
- [x] **Archer Search Functionality** - Add search by name for existing archers in startup flow ✅ COMPLETED

## 🚀 NEW ARCHER STARTUP PROCESS CLEANUP ✅ COMPLETED
- [x] **Streamlined Profile Selection** - Create a single, clear flow for new archers to select their profile ✅ COMPLETED
- [x] **Auto-Detection Enhancement** - Improve email matching and profile auto-selection logic ✅ COMPLETED
- [x] **Profile Creation Integration** - Allow new archers to create their profile during startup if not found ✅ COMPLETED
- [x] **Simplified Navigation** - Reduce the number of steps and components involved in startup ✅ COMPLETED
- [x] **Clear "New Archer" Path** - Create a dedicated onboarding flow for first-time users ✅ COMPLETED
- [x] **Profile Validation** - Ensure selected profile has all required fields before proceeding ✅ COMPLETED

### Key Improvements Made:
1. **NewArcherStartup Component** - Created a dedicated component that consolidates profile selection and creation into a single, intuitive flow
2. **Enhanced Auto-Selection** - Improved logic to prioritize "Me" tagged profiles, then email matching, then first profile
3. **Integrated Profile Creation** - Users can now create their profile directly during startup if not found
4. **Simplified UI** - Clean, mobile-friendly interface with clear sections for existing profiles and profile creation
5. **Better Validation** - Ensures required fields are filled before allowing continuation
6. **Consistent Data Flow** - Properly saves to both Firebase and localStorage with consistent logic

## Current Session Goals ✅ ALL COMPLETED
- [x] **Profile Sorting** - Default sort by first name, then last name ✅ COMPLETED
- [x] **Profile Fields Enhancement** - Add Email, Phone, Varsity PR, JV PR, Avg Arrow fields ✅ COMPLETED
- [x] **Team Manager Fixes** - Fix "Score" button and clean up spacing/filter section ✅ COMPLETED
- [x] **Active Profile Filter** - Add "Active" field to hide inactive profiles by default ✅ COMPLETED
- [x] **First Login Prompt** - Guide users to tag their "Me" profile and favorites ✅ COMPLETED
- [x] **Profile Navigation** - Add "Next" and "Prev" buttons to cycle through profiles ✅ COMPLETED
- [x] **Practice Round Scoring** - Allow scoring rounds as practice (not competition) ✅ COMPLETED

## Future Sprints
- [ ] **Challenge System** - Send challenges to teammates and track results
- [ ] **Profile Pictures** - Add trading card style profile pictures
- [ ] **Bale Assignment Management** - Create and manage bale assignments for competitions
  - [ ] Create bale assignments for events with archer selection from profile list
  - [ ] Add/remove archers from bale assignments
  - [ ] Swap archers between bales
  - [ ] View bale assignments by competition
  - [ ] Export bale assignments for event organizers

---

## Implementation Details

### Header Navigation Fix
**Priority**: High
**Status**: Not Started
- [ ] Fix "Archer's Edge" to always navigate to home
- [ ] Show "First Last" of Me Profile instead of selected profile
- [ ] Make "First Last" navigate to My Profile
- [ ] Keep "Logout" functionality
- [ ] Remove confusion with selected profile display

### Home Page Card Layout
**Priority**: High
**Status**: Not Started
- [ ] "My Profile" card
- [ ] "New Ranking Round" (rename from "New Round")
- [ ] "Score History" (default to "Show My Scores Only")
- [ ] "Team Archer Management" (Coach Tools)
- [ ] "Competitions"
- [ ] "Data Sync"
- [ ] Remove Quick Stats section

### Team Archer Management Enhancement
**Priority**: Medium
**Status**: Not Started
- [ ] Replicate Profile Management functionality
- [ ] Allow coaches to manage all team profiles
- [ ] Individual archers only manage their own profile
- [ ] Add coach-specific features

### Bale Assignment Management
**Priority**: High
**Status**: Not Started
- [ ] **Bale Assignment Interface**
  - [ ] Add "Bale Assignments" section to Competition Management
  - [ ] Create bale assignment form with archer selection
  - [ ] Display existing bale assignments for each competition
  - [ ] Add drag-and-drop functionality for archer swapping
- [ ] **Archer Management**
  - [ ] Pull archer list from existing profiles
  - [ ] Filter archers by division, gender, school
  - [ ] Add/remove archers from bale assignments
  - [ ] Swap archers between different bales
  - [ ] Validate bale capacity (max 4 archers per bale)
- [ ] **Data Structure**
  - [ ] Create baleAssignment collection in Firebase
  - [ ] Store bale assignments linked to competitions
  - [ ] Include archer IDs, bale numbers, target assignments
  - [ ] Add assignment timestamps and created by user
- [ ] **Export Features**
  - [ ] Generate PDF bale assignment sheets
  - [ ] Export to CSV for event organizers
  - [ ] Print-friendly bale assignment cards
- [ ] **Integration**
  - [ ] Link bale assignments to scoring interface
  - [ ] Pre-populate archer lists in scoring setup
  - [ ] Show bale assignments in competition details

### 1. First Login Prompt ✅ COMPLETED
**Priority**: High
**Status**: ✅ COMPLETED
- [x] Create onboarding flow for new users
- [x] Prompt to identify "Me" profile
- [x] Prompt to tag favorite teammates
- [x] Save preferences to user settings
- [x] Integrate with App.jsx navigation flow
- [x] Handle skip functionality

### 2. Profile Sorting ✅ COMPLETED
**Priority**: High  
**Status**: ✅ COMPLETED
- [x] Update ProfileManagement component to sort by firstName, then lastName
- [x] Update TeamArcherManagement component with same sorting
- [x] Ensure sorting persists across sessions

### 3. Profile Fields Enhancement ✅ COMPLETED
**Priority**: High
**Status**: ✅ COMPLETED
- [x] Add Email field to profile form
- [x] Add Phone field to profile form  
- [x] Add Varsity PR field (number input)
- [x] Add JV PR field (number input)
- [x] Add Avg Arrow field (decimal input)
- [x] Update Firebase schema and localStorage
- [x] Update profile display to show new fields
- [x] Add Active field with default true

### 4. Profile Navigation ✅ COMPLETED
**Priority**: Medium
**Status**: ✅ COMPLETED
- [x] Add "Next" and "Prev" buttons to profile view
- [x] Cycle through filtered profiles
- [x] Handle edge cases (first/last profile)
- [x] Maintain current filter/sort state
- [x] Show current position (e.g., "2 of 5")

### 5. Team Manager Fixes ✅ COMPLETED
**Priority**: High
**Status**: ✅ COMPLETED
- [x] Fix "Score" button functionality (navigate to multi-scoring)
- [x] Shrink filter section to one line
- [x] Clean up spacing and layout
- [x] Make dropdowns and search fields smaller
- [x] Add bulk score button for selected archers
- [x] Add "Show Inactive" toggle

### 6. Active Profile Filter ✅ COMPLETED
**Priority**: Medium
**Status**: ✅ COMPLETED
- [x] Add filter to hide inactive profiles by default
- [x] Add toggle to show/hide inactive profiles
- [x] Update profile lists to respect active filter

### 7. Practice Round Scoring ✅ COMPLETED
**Priority**: Medium
**Status**: ✅ COMPLETED
- [x] Add "Practice Round" option to scoring setup
- [x] Skip competition selection for practice rounds
- [x] Store practice rounds separately from competition rounds
- [x] Update score history to distinguish practice vs competition
- [x] Add visual indicators for practice rounds in score history

---

## Completed Features ✅
- [x] **Tagging System** - "Me" and "Favorites" profile tagging
- [x] **Enhanced Homepage** - My Profile card and Favorites section
- [x] **Auto-Detection** - Smart profile matching for "Me" profile
- [x] **Visual Badges** - Blue "Me" badges and yellow ⭐ for favorites
- [x] **Profile Sorting** - Default sort by firstName, then lastName
- [x] **Enhanced Profile Fields** - Email, Phone, Varsity PR, JV PR, Avg Arrow, Active status
- [x] **Team Manager Improvements** - Compact filters, fixed Score button, bulk scoring, active filter
- [x] **First Login Onboarding** - Guided setup for new users to identify "Me" profile and favorites
- [x] **Profile Navigation** - Next/Prev buttons to cycle through profiles with position indicator
- [x] **Practice Round Scoring** - Option to score rounds as practice without competition selection

---

## 🎉 Session Summary

**All Current Session Goals Completed Successfully!**

### Key Improvements Made:
1. **Enhanced User Experience** - First login onboarding, profile navigation, and improved team management
2. **Better Data Organization** - Profile sorting, enhanced fields, and active/inactive filtering
3. **Improved Scoring Workflow** - Practice rounds, bulk scoring, and better navigation
4. **Visual Enhancements** - Compact filters, badges, and clear indicators for different round types

### Technical Achievements:
- ✅ All features deployed to production at https://archers-edge.web.app
- ✅ Maintained backward compatibility with existing data
- ✅ Mobile-first design principles followed
- ✅ Offline functionality preserved
- ✅ Firebase integration working properly

---

## Technical Notes
- All profile changes need Firebase and localStorage sync
- Maintain backward compatibility with existing profiles
- Follow mobile-first design principles
- Ensure offline functionality works properly 

## 🎯 Current Session Goals
- [x] Implement unified ProfileEditor component with Back/Next navigation
- [x] Update ProfileManagement to use unified editor
- [x] Update TeamArcherManagement to use unified editor  
- [x] Update SystemAdminManagement to use unified editor
- [ ] Test unified editor across all modules
- [ ] Verify Back/Next navigation works correctly
- [ ] Ensure System Admin can now edit profiles

## ✅ Recent Achievements

### Unified ProfileEditor Implementation (Session 10)
**Status: COMPLETED** ✅

**What was implemented:**
- Created unified `ProfileEditor` component with:
  - Back/Next navigation buttons for profile browsing
  - Configurable props for different contexts (create/edit/delete permissions)
  - Modal and full-page modes
  - Consistent mobile-first UI with grouped cards
  - Action buttons always at the top
  - Position indicator (e.g., "3 of 12")

**Components Updated:**
- `ProfileManagement.jsx` - Now uses ProfileEditor for editing
- `TeamArcherManagement.jsx` - Now uses ProfileEditor for editing  
- `SystemAdminManagement.jsx` - Now uses ProfileEditor for editing

**Key Features:**
- ✅ **Single Edit Interface**: Consistent across all components
- ✅ **Navigation Built-in**: Back/Next functionality with position indicator
- ✅ **System Admin Fixed**: Can now edit profiles (was missing before)
- ✅ **Maintainable**: One place to update edit functionality
- ✅ **Mobile-First**: Responsive design with action buttons at top
- ✅ **Configurable**: Different permissions per context (create/edit/delete)

**Architecture Benefits:**
- **Single Source of Truth**: One edit form for all components
- **Consistent UX**: Same editing experience everywhere
- **Easier Maintenance**: One place to update edit functionality
- **Better Testing**: Single component to test
- **Navigation Built-in**: Can add Back/Next navigation easily

## 🐛 Known Bugs & Issues

### High Priority
- [ ] "Start Practice Round" button unresponsive
- [ ] Creating competition results in null error
- [ ] QR code generator team dropdown is blank
- [ ] Firebase Firestore indexing errors for `competitionScores`

### Medium Priority  
- [ ] Mobile display issues on login page
- [ ] "No profiles found" screen when trying to select existing profiles
- [ ] Null error when selecting profile while team data loading
- [ ] Profile deletion navigates to random profile

### Low Priority
- [ ] Vite build warnings about dynamic imports
- [ ] Light/dark mode implementation (future consideration)

## 🚀 New Features

### Completed
- [x] Unified ProfileEditor with Back/Next navigation
- [x] System Admin can now edit profiles
- [x] Consistent edit interface across all modules
- [x] Mobile-first UI redesign for profile management

### Planned
- [ ] Coach-School/team relationship management
- [ ] Coach-Event management
- [ ] Team data loading from server (URL command or QR code)
- [ ] Integration with existing Firebase team records
- [ ] Light/dark mode toggle

## 🔧 Technical Debt

### UI/UX Improvements Needed
- [ ] Clean up "super clunky interface elements"
- [ ] Move all action buttons to the top
- [ ] Keep action buttons short and simple
- [ ] Group elements into "nice rounded corner boxes"
- [ ] Fix tiny checkboxes
- [ ] Ensure action buttons are not below the fold
- [ ] Apply improvements to Competition area

### Code Quality
- [ ] Remove duplicate edit form code across components
- [ ] Standardize profile loading logic
- [ ] Improve error handling consistency
- [ ] Add comprehensive test coverage for ProfileEditor

## 📋 Future Sprints

### Sprint 11: Profile Navigation & Testing
- [ ] Test unified ProfileEditor across all modules
- [ ] Verify Back/Next navigation works correctly
- [ ] Test System Admin profile editing
- [ ] Fix any remaining profile management issues

### Sprint 12: Competition & Scoring
- [ ] Fix "Start Practice Round" button
- [ ] Fix competition creation null error
- [ ] Resolve Firebase indexing issues
- [ ] Implement competition scoring workflow

### Sprint 13: Team Management
- [ ] Implement Coach-School/team relationship
- [ ] Add Coach-Event management
- [ ] Fix QR code generator team dropdown
- [ ] Add team data loading from server

### Sprint 14: UI Polish
- [ ] Implement comprehensive UI improvement plan
- [ ] Add light/dark mode
- [ ] Polish mobile experience
- [ ] Improve accessibility

## 🎨 UI Improvement Plan

### Phase 1: Core Layout & Navigation
- [x] Move action buttons to top of all screens
- [x] Implement consistent header design
- [x] Add proper navigation between views
- [x] Ensure mobile-first responsive design

### Phase 2: Component-Specific Improvements
- [x] Profile management redesign with grouped cards
- [x] Competition management cleanup
- [x] Team archer management consistency
- [ ] Login page mobile optimization
- [ ] Scoring interface improvements

### Phase 3: Advanced Features
- [ ] Light/dark mode implementation
- [ ] Advanced filtering and search
- [ ] Bulk operations for team management
- [ ] Enhanced data visualization

### Design System
**Color Palette:**
- Primary: Blue (#3B82F6)
- Success: Green (#10B981) 
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Neutral: Gray (#6B7280)

**Component Structure:**
- Header with navigation
- Action buttons at top
- Content in grouped cards
- Consistent spacing and typography

## 🔐 Security & Permissions

### Role-Based Access Control
- [x] System Admin: Full access to all profiles
- [x] Coach: Can manage team archers
- [x] Archer: Can edit own profile
- [x] Event Manager: Can view competition data
- [x] Referee: Can view scoring data

### Authentication
- [x] Google Sign-in
- [x] Phone Number authentication
- [x] reCAPTCHA integration
- [x] Offline capability with localStorage fallback

## 📊 Data Management

### Firebase Integration
- [x] Profile data sync to Firestore
- [x] Competition data storage
- [x] Score tracking
- [ ] Team relationship management
- [ ] Coach assignment tracking

### Offline Support
- [x] localStorage fallback for profiles
- [x] Offline score entry
- [x] Data sync when online
- [ ] Conflict resolution for offline changes

## 🧪 Testing

### Unit Tests
- [x] ProfileManagement.test.jsx
- [x] AuthContext.test.jsx
- [x] firebaseService.test.js
- [ ] ProfileEditor.test.jsx (needed)
- [ ] TeamArcherManagement.test.jsx (needed)

### Integration Tests
- [ ] End-to-end profile editing workflow
- [ ] Navigation between profile views
- [ ] System Admin profile management
- [ ] Offline/online data sync

## 📚 Documentation

### User Guides
- [ ] Profile management guide
- [ ] Competition setup guide
- [ ] Team management guide
- [ ] Offline usage guide

### Developer Documentation
- [x] Firebase setup guide
- [x] Phone authentication setup
- [x] reCAPTCHA configuration
- [x] ProfileEditor component documentation
- [x] Role-based access control guide
- [x] Style guide with UI patterns

---

*Last updated: Session 11 - Competition Management Sprint Focus* 