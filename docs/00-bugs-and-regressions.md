# Bugs and Regressions Tracking

## 🚨 Critical Issues

### 1. App Reset on Page Refresh
**Status:** 🔴 CRITICAL - BLOCKING
**Description:** App completely resets when page refreshes, losing all scoring data
**Impact:** Users lose work when phone goes to sleep or browser refreshes
**Root Cause:** Firebase authentication and data loading issues
**Priority:** P0 - Must fix immediately

### 2. Bale Totals Not Displaying
**Status:** 🔴 HIGH - BLOCKING
**Description:** "Bale Totals" section shows empty values even when scores are entered
**Impact:** Users can't see cumulative scores for the bale
**Root Cause:** Data structure mismatch or calculation error
**Priority:** P1 - Must fix for usability

### 3. Close Button Not Working
**Status:** 🟡 MEDIUM
**Description:** Keypad close button doesn't dismiss the keypad
**Impact:** Users can't close the keypad interface
**Root Cause:** Event handling or callback issue
**Priority:** P2 - Affects usability

### 4. Focus Issues When Switching Ends
**Status:** 🟡 MEDIUM
**Description:** Focus doesn't go to first arrow of first archer when changing ends
**Impact:** Poor user experience, requires manual navigation
**Root Cause:** DOM targeting or timing issues
**Priority:** P2 - Affects workflow efficiency

## 🔧 Technical Issues

### 5. PostCSS/Tailwind Configuration Errors
**Status:** 🟡 MEDIUM
**Description:** PostCSS errors about Tailwind plugin configuration
**Impact:** Build warnings and potential styling issues
**Root Cause:** Outdated PostCSS configuration
**Priority:** P3 - Technical debt

### 6. Firebase Authentication Errors
**Status:** 🟡 MEDIUM
**Description:** reCAPTCHA initialization errors in console
**Impact:** Potential authentication issues
**Root Cause:** reCAPTCHA configuration or browser compatibility
**Priority:** P3 - Technical debt

### 7. Data Persistence Issues
**Status:** 🔴 HIGH
**Description:** Scores not persisting when switching between views
**Impact:** Data loss when navigating between screens
**Root Cause:** State management or Firebase sync issues
**Priority:** P1 - Data integrity

## 📱 Mobile-Specific Issues

### 8. Offline Functionality Missing
**Status:** 🔴 CRITICAL - BLOCKING
**Description:** No offline storage, app requires constant internet
**Impact:** App unusable in poor connectivity areas
**Root Cause:** No local storage implementation
**Priority:** P0 - Core requirement

### 9. Phone Sleep/Refresh Handling
**Status:** 🔴 CRITICAL - BLOCKING
**Description:** App resets when phone goes to sleep or browser refreshes
**Impact:** Users lose work frequently
**Root Cause:** No session persistence or local storage
**Priority:** P0 - Core requirement

## 🎯 Feature Gaps

### 10. Missing Offline Storage
**Status:** 🔴 CRITICAL
**Description:** No local storage for offline functionality
**Impact:** App not suitable for tournament use
**Priority:** P0 - Core requirement

### 11. Session Persistence
**Status:** 🔴 HIGH
**Description:** No session management for app state
**Impact:** Users lose work on any interruption
**Priority:** P1 - Core requirement

## 📊 Progress Tracking

### Fixed Issues
- ✅ Mobile keypad interface implemented
- ✅ Compact mobile layout
- ✅ Auto-advance focus (partially working)
- ✅ Color-coded scoring
- ✅ Individual archer scorecard view

### In Progress
- 🔄 Data persistence fixes
- 🔄 Focus management improvements
- 🔄 Totals calculation debugging

### Blocked
- ❌ Offline functionality (requires architecture change)
- ❌ Session persistence (requires local storage)

## 🚀 Next Steps

### Immediate (This Session)
1. **Fix app reset on refresh** - Implement local storage fallback
2. **Fix bale totals display** - Debug calculation logic
3. **Fix close button** - Debug event handling
4. **Fix focus issues** - Improve DOM targeting

### Short Term (Next Session)
1. **Implement offline storage** - Local storage for scores
2. **Add session persistence** - Maintain app state
3. **Fix PostCSS errors** - Update build configuration
4. **Improve error handling** - Better user feedback

### Long Term
1. **Full offline functionality** - Complete offline mode
2. **Data sync** - Sync local data when online
3. **Performance optimization** - Reduce bundle size
4. **Testing** - Comprehensive mobile testing

## 📝 Notes

- **Mobile Priority:** All fixes must work on mobile devices
- **Offline Requirement:** App must work without internet
- **Data Integrity:** No data loss under any circumstances
- **User Experience:** Smooth, intuitive workflow

## 🔍 Debugging

### Console Logs to Monitor
- `Calculating bale totals for end: X`
- `Archer [Name] scores for endX: {...}`
- `Bale totals result: {...}`
- `Found first input: [element]`
- `Close button clicked`
- `handleCloseKeypad called`

### Test Scenarios
1. Enter scores → refresh page → check if data persists
2. Switch ends → check if focus goes to first arrow
3. Enter scores → check if totals appear
4. Click close button → check if keypad dismisses
5. Put phone to sleep → wake up → check if app resets 