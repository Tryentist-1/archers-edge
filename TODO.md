# Archer's Edge - Development TODO

## 🔐 SECURE AUTHENTICATION RESTORATION (CURRENT SESSION)
**Branch**: `auth-restoration-secure`
**Priority**: CRITICAL - Security and functionality

### Security Checklist ✅
- [x] **Environment Variables**: Firebase config uses env vars (not hardcoded)
- [x] **Git Ignore**: .env file properly ignored
- [x] **No Hardcoded Keys**: No API keys in git history
- [x] **Secure Branch**: Working on isolated branch

### Authentication Restoration Tasks
- [x] **Restore Original Auth Files**
  - [x] Restore `src/contexts/AuthContext.jsx` from commit 322e926
  - [x] Restore `src/components/Login.jsx` from commit 322e926
  - [x] Update `src/config/firebase.js` with proper environment setup
  - [ ] Test Google authentication
  - [ ] Test Phone authentication with reCAPTCHA

- [x] **Role-Based Access Control**
  - [x] Define user roles: Coach, Event Manager, Ref, Archer
  - [x] Create role-based routing system
  - [x] Implement role-specific UI components
  - [x] Add role-based permissions

- [x] **Coach-Specific Features**
  - [x] Coach dashboard interface
  - [x] Team management tools
  - [x] Event creation and management
  - [x] Archer profile management
  - [x] Coach-School relationship system
  - [x] Coach assignment management
  - [x] Coach event management

- [ ] **Event Manager Features**
  - [ ] Event creation interface
  - [ ] Bale assignment management
  - [ ] Competition setup tools
  - [ ] Results management

- [ ] **Referee Features**
  - [ ] Referee scoring interface
  - [ ] Score validation tools
  - [ ] Competition oversight features

### Security Measures
- [x] **Environment Setup**
  - [x] Verify .env file is not tracked
  - [x] Update .env.example with all required variables
  - [ ] Test with placeholder values
  - [x] Document environment setup process

- [ ] **Testing**
  - [ ] Test authentication in development
  - [ ] Test role-based access
  - [ ] Test offline functionality
  - [ ] Test mobile compatibility

### Deployment Safety
- [ ] **Pre-Deployment Checklist**
  - [ ] No hardcoded credentials
  - [ ] Environment variables properly set
  - [ ] Role-based access working
  - [ ] Mobile authentication tested
  - [ ] Offline functionality preserved

### Next Steps
1. **Test Authentication**: Set up Firebase project and test Google/Phone auth
2. **Create Role-Specific Components**: Build Coach, Event Manager, and Ref interfaces
3. **Integrate with Existing Features**: Connect role-based access to current functionality
4. **Deploy Safely**: Test thoroughly before merging to main branch

## 📚 DOCUMENTATION UPDATES ✅ COMPLETED
- [x] **Authentication Setup Guide** - Complete Firebase and reCAPTCHA setup instructions
- [x] **Development & Deployment Guide** - Local dev server and production deployment workflow
- [x] **Startup Script** - Automated dev server startup with network access
- [x] **Session Management** - Step-by-step workflow for new development sessions

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
- [x] **Data Sync** - Add to homepage ✅ COMPLETED
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
- [ ] ProfileEditor component documentation
- [ ] Role-based access control guide

---

*Last updated: Session 10 - Unified ProfileEditor Implementation* 