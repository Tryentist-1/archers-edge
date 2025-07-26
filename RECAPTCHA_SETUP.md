# reCAPTCHA Setup Guide

## Step 1: Get Your reCAPTCHA Site Key

### Option A: Google Cloud Console (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (`archers-edge`)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **reCAPTCHA API key**
5. Choose **reCAPTCHA v2** → **Invisible reCAPTCHA badge**
6. Add your domains:
   - `localhost` (for development)
   - `172.16.0.97` (for local network testing)
   - Your production domain when ready
7. Click **Create**
8. Copy the **Site Key** (starts with `6L...`)

### Option B: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`archers-edge`)
3. Navigate to **Authentication** → **Settings**
4. Scroll down to **reCAPTCHA Enterprise**
5. Enable and configure if available

## Step 2: Add Site Key to Environment

Create a `.env` file in your project root with:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyDjCqHqMT-3LkKWGFlRx2Mls37vJTN0d7k
VITE_FIREBASE_AUTH_DOMAIN=archers-edge.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=archers-edge
VITE_FIREBASE_STORAGE_BUCKET=archers-edge.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1056447684075
VITE_FIREBASE_APP_ID=1:1056447684075:web:9fdd213f321c50f4758dae

# reCAPTCHA Site Key - Replace with your actual site key
VITE_RECAPTCHA_SITE_KEY=6Lxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Restart Development Server

After adding the `.env` file:

```bash
npm run dev -- --host
```

## Step 4: Test Phone Authentication

1. Go to `http://localhost:3000` (not the IP address)
2. Enter your phone number: `+14244439811`
3. Click "Send Code"
4. Check your phone for the verification code

## Troubleshooting

### "reCAPTCHA site key not configured"
- Make sure you created the `.env` file
- Check that the site key starts with `6L`
- Restart the dev server after adding the `.env` file

### "Domain not authorized"
- Add `localhost` to your reCAPTCHA domain list
- For local network testing, add your IP address
- Wait a few minutes for changes to propagate

### "reCAPTCHA verification failed"
- Try refreshing the page
- Check browser console for errors
- Make sure you're using `localhost:3000` not the IP address

## For Development Testing

If you want to test without reCAPTCHA, use the **"Mobile Test Login"** button which bypasses phone authentication entirely. 