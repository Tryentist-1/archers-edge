# Firebase Setup Guide

## Step 1: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. Click the web icon (</>) to add a web app if you haven't already
7. Copy the configuration object

## Step 2: Update Your Configuration

Replace the values in `src/config/firebase.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-your-actual-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 3: Enable Authentication Methods

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Phone" provider
5. Enable "Google" provider
6. For Google, add your domain to authorized domains

## Step 4: Set Up Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location close to your users

## Step 5: Test Your Setup

1. Start the development server: `npm run dev`
2. Open http://localhost:3000
3. Try signing in with Google or phone number
4. Check the browser console for any errors

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/invalid-api-key)"**
   - Check that your API key is correct
   - Make sure you copied the entire key

2. **"Firebase: Error (auth/unauthorized-domain)"**
   - Add `localhost` to authorized domains in Firebase Console
   - Go to Authentication > Settings > Authorized domains

3. **"Firebase: Error (auth/operation-not-allowed)"**
   - Enable the authentication method in Firebase Console
   - Go to Authentication > Sign-in method

4. **Tailwind CSS errors**
   - The PostCSS configuration has been updated
   - Restart the dev server: `npm run dev`

## Security Notes

- The API key is safe to include in client-side code
- Firebase security is controlled by Firestore Security Rules
- Never expose Firebase Admin SDK keys (server-side only)
- For production, set up proper Firestore security rules 