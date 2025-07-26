# Authentication Setup Guide

## 🔐 Secure Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# reCAPTCHA Configuration (required for phone authentication)
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here

# Development Settings
NODE_ENV=development
VITE_APP_ENV=development
```

### Firebase Setup Steps

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing project
   - Enable Authentication in the Firebase Console

2. **Configure Authentication Methods**
   - Go to Authentication > Sign-in method
   - Enable Google Sign-in
   - Enable Phone Number Sign-in
   - Add your domain to authorized domains

3. **Get Firebase Config**
   - Go to Project Settings > General
   - Scroll down to "Your apps"
   - Click on your web app or create a new one
   - Copy the config values to your `.env` file

4. **Set up reCAPTCHA**
   - Go to [reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
   - Create a new site
   - Choose reCAPTCHA v2 > Invisible
   - Add your domain
   - Copy the site key to `VITE_RECAPTCHA_SITE_KEY`

### Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] No API keys are hardcoded in source code
- [ ] Environment variables are properly validated
- [ ] reCAPTCHA is configured for phone authentication
- [ ] Firebase Authentication is enabled
- [ ] Authorized domains are configured

### Role-Based Access Control

The authentication system supports the following roles:

- **Archer**: Basic user with scoring and profile management
- **Coach**: Can manage team archers and create events
- **Event Manager**: Can create and manage competitions
- **Referee**: Can validate scores and oversee competitions
- **Admin**: Full system access

Roles are determined by email domain patterns or can be set via Firebase Custom Claims.

### Testing Authentication

1. **Development Testing**
   ```bash
   npm run dev
   ```
   - Test Google Sign-in
   - Test Phone authentication (requires real phone number)
   - Test profile selection fallback

2. **Production Testing**
   - Deploy to staging environment
   - Test all authentication methods
   - Verify role-based access control

### Troubleshooting

**Common Issues:**
- **reCAPTCHA errors**: Check domain configuration and site key
- **Phone auth fails**: Verify Firebase Phone Auth is enabled
- **Google auth fails**: Check authorized domains in Firebase Console
- **Environment variables missing**: Check `.env` file and variable names

**Security Notes:**
- Never commit `.env` files to version control
- Use different Firebase projects for development and production
- Regularly rotate API keys
- Monitor Firebase Console for suspicious activity 