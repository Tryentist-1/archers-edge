# Archer's Edge - Development TODO

## 🐛 BUGS AND TWEAKS TODO
- [x] **Header Navigation Fix** - "Archer's Edge" → Home, "First Last" → My Profile, "Logout" (remove selected profile confusion) ✅ COMPLETED
- [x] **Home Page Card Layout** - "My Profile", "New Ranking Round", "Score History" (default to "Show My Scores Only") ✅ COMPLETED
- [x] **Team Archer Management** - Replicate Profile Management for coaches to manage all team profiles ✅ COMPLETED
- [x] **Remove Quick Stats** - Clean up homepage layout ✅ COMPLETED
- [x] **Competitions** - Add to homepage ✅ COMPLETED
- [x] **Data Sync** - Add to homepage ✅ COMPLETED

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