# Firebase Firestore Indexes Setup Guide

## 🔧 Current Issue
The app is encountering Firebase Firestore indexing errors when querying competition scores. This happens because Firestore requires composite indexes when filtering by multiple fields and ordering by another field.

## 🚀 Quick Fix (Immediate)
The code has been updated to avoid the index requirement by:
1. Removing `orderBy` from the query
2. Sorting the results in memory instead

This fix is already deployed and should resolve the immediate error.

## 📋 Setting Up Proper Indexes (Recommended)

### Option 1: Using Firebase Console (Manual)

1. **Go to Firebase Console**
   - Navigate to: https://console.firebase.google.com/project/archers-edge/firestore/indexes

2. **Create Required Indexes**
   - Click "Create Index"
   - Collection ID: `competitionScores`
   - Fields to index:
     - `archerId` (Ascending)
     - `competitionId` (Ascending) 
     - `completedAt` (Descending)
   - Click "Create"

3. **Create Additional Index**
   - Collection ID: `competitionScores`
   - Fields to index:
     - `archerId` (Ascending)
     - `completedAt` (Descending)
   - Click "Create"

### Option 2: Using Firebase CLI (Automated)

1. **Install Firebase CLI** (if not already installed)
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**
   ```bash
   firebase login
   ```

3. **Deploy Indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

## 🔍 Indexes Required

### 1. Competition Scores Index
- **Collection**: `competitionScores`
- **Fields**: 
  - `archerId` (Ascending)
  - `competitionId` (Ascending)
  - `completedAt` (Descending)

### 2. Archer Scores Index
- **Collection**: `competitionScores`
- **Fields**:
  - `archerId` (Ascending)
  - `completedAt` (Descending)

### 3. Profiles Index
- **Collection**: `profiles`
- **Fields**:
  - `school` (Ascending)
  - `role` (Ascending)

### 4. Coach Assignments Index
- **Collection**: `coachAssignments`
- **Fields**:
  - `coachId` (Ascending)
  - `school` (Ascending)

### 5. Coach Events Index
- **Collection**: `coachEvents`
- **Fields**:
  - `coachId` (Ascending)
  - `status` (Ascending)

## ⏱️ Index Build Time
- **Small datasets**: 1-5 minutes
- **Large datasets**: 10-30 minutes
- **Very large datasets**: 1-2 hours

## 🔄 Monitoring Index Status
1. Go to Firebase Console → Firestore → Indexes
2. Check the "Status" column
3. Wait for "Enabled" status before testing

## 🧪 Testing After Index Creation
1. Deploy the updated code with proper ordering
2. Test the Score History feature
3. Verify no more indexing errors

## 📝 Code Changes Needed After Indexes Are Ready

Once the indexes are created, you can revert the temporary fix by updating the `loadArcherCompetitionScores` function in `src/services/firebaseService.js`:

```javascript
// Revert to using orderBy in the query
scoresQuery = query(
    collection(db, 'competitionScores'),
    where('archerId', '==', archerId),
    where('competitionId', '==', competitionId),
    orderBy('completedAt', 'desc')
);
```

## 🆘 Troubleshooting

### Index Creation Fails
- Check that all field names match exactly
- Ensure field types are consistent
- Verify collection names are correct

### Still Getting Index Errors
- Wait for indexes to finish building
- Check index status in Firebase Console
- Clear browser cache and retry

### Performance Issues
- Consider reducing query complexity
- Use pagination for large datasets
- Monitor index usage in Firebase Console 