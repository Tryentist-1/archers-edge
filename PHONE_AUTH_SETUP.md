# Phone Authentication Setup Guide

## Enable Phone Authentication in Firebase Console

### Step 1: Enable Phone Provider
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Phone** provider
5. Click **Enable**
6. Click **Save**

### Step 2: Add Test Phone Numbers (Optional)
For development/testing, you can add test phone numbers:
1. In the Phone provider settings
2. Scroll down to **Phone numbers for testing**
3. Click **Add phone number**
4. Add your test phone number (e.g., +1234567890)
5. You'll receive a test verification code

### Step 3: Configure reCAPTCHA (if needed)
If you get reCAPTCHA errors:
1. Go to **Authentication** → **Settings**
2. Scroll down to **reCAPTCHA Enterprise**
3. Enable if needed for your domain

### Step 4: Add Authorized Domains
1. Go to **Authentication** → **Settings**
2. Scroll to **Authorized domains**
3. Add `localhost` for development
4. Add your production domain when ready

## Testing Phone Authentication

### Test Phone Numbers
- Use the test phone numbers you added in Step 2
- Or use your real phone number (you'll receive SMS)

### Common Issues & Solutions

**"Phone authentication is not enabled"**
- Make sure you enabled Phone provider in Firebase Console

**"Invalid phone number format"**
- Use international format: +1234567890
- Include country code

**"reCAPTCHA not initialized"**
- Refresh the page and try again
- Check browser console for errors

**"Too many requests"**
- Wait a few minutes before trying again
- Use test phone numbers for development

## Production Considerations

### SMS Costs
- Firebase charges for SMS verification
- Consider using test phone numbers during development
- Monitor usage in Firebase Console

### Security Rules
- Set up proper Firestore security rules
- Consider rate limiting for phone verification

### User Experience
- Add proper error handling
- Consider fallback authentication methods
- Test on various devices and browsers 