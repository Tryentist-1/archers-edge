# Development & Deployment Guide

## 🚀 Local Development Server

### Quick Start
```bash
# Start development server with network access
npm run dev -- --host

# Or start without network access (localhost only)
npm run dev
```

### Network Access for Mobile Testing
```bash
# This exposes the server to your local network
npm run dev -- --host

# You'll see output like:
# ➜  Local:   http://localhost:3000/
# ➜  Network: http://172.16.0.97:3000/
```

### Common Issues & Solutions

#### **Port Already in Use**
```bash
# Check what's using the port
lsof -i :3000

# Kill processes using the port
kill -9 [PID]

# Or kill all npm processes
pkill -f "npm run dev"
```

#### **Multiple Dev Servers Running**
```bash
# Kill all dev servers
pkill -f "npm run dev"

# Start fresh
npm run dev -- --host
```

#### **Can't Connect from Phone**
1. **Check Network**: Ensure phone and Mac are on same WiFi
2. **Check Firewall**: System Preferences > Security & Privacy > Firewall
3. **Try Different Port**: Server will auto-try next available port
4. **Use IP Address**: `http://172.16.0.97:3000` (not localhost)

### Development Workflow

#### **Starting a New Session**
```bash
# 1. Navigate to project
cd /Users/terry/web-mirrors/projects/archers-edge

# 2. Check if any dev servers are running
ps aux | grep "npm run dev" | grep -v grep

# 3. Kill any existing servers
pkill -f "npm run dev"

# 4. Start fresh server with network access
npm run dev -- --host
```

#### **Switching Between Branches**
```bash
# 1. Stop dev server
pkill -f "npm run dev"

# 2. Switch branches
git checkout [branch-name]

# 3. Install dependencies (if needed)
npm install

# 4. Start dev server
npm run dev -- --host
```

## 🔥 Production Deployment

### Firebase Deployment Workflow
```bash
# 1. Build for production
npm run build

# 2. Deploy to Firebase hosting
firebase deploy --only hosting

# 3. Verify deployment
# Check: https://archers-edge.web.app
```

### Pre-Deployment Checklist
- [ ] **Environment Variables**: All Firebase config in `.env`
- [ ] **No Hardcoded Credentials**: Check for API keys in code
- [ ] **Test Authentication**: Google and Phone auth working
- [ ] **Test Mobile**: App works on phone
- [ ] **Test Offline**: Core functionality works without internet
- [ ] **Build Success**: `npm run build` completes without errors
- [ ] **Git Status**: All changes committed and pushed

### Deployment Commands
```bash
# Build for production
npm run build

# Deploy to Firebase (full deployment)
firebase deploy

# Deploy only hosting (faster)
firebase deploy --only hosting

# Check deployment status
firebase hosting:channel:list

# Check Firebase project
firebase projects:list
firebase use
```

### Post-Deployment Verification
```bash
# 1. Check live site
open https://archers-edge.web.app

# 2. Test key functionality
- Authentication (Google login)
- Profile Management
- Competition Results
- Mobile responsiveness

# 3. Check console for errors
- Open browser dev tools
- Look for any console errors
- Test on mobile device
```

## 🔧 Environment Management

### Local Development (.env)
```bash
# Copy example file
cp .env.example .env

# Edit with your Firebase config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_key
```

### Production Environment
```bash
# Set Firebase project
firebase use [project-id]

# Set environment variables in Firebase Console
# Go to Functions > Configuration > Environment variables
```

## 📱 Mobile Testing

### Network Access Setup
```bash
# Get your Mac's IP address
ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1

# Start server with network access
npm run dev -- --host

# Access from phone: http://[YOUR_IP]:3000
```

### Testing Checklist
- [ ] **Authentication**: Google sign-in works
- [ ] **Phone Auth**: SMS verification works
- [ ] **Profile Selection**: Fallback auth works
- [ ] **Role-Based Access**: Different interfaces per role
- [ ] **Offline Functionality**: Core features work without internet
- [ ] **Mobile UI**: All elements fit on phone screen

## 🐛 Troubleshooting

### Dev Server Issues
```bash
# Port conflicts
lsof -i :3000
kill -9 [PID]

# Multiple servers
pkill -f "npm run dev"
npm run dev -- --host

# Dependencies
npm install
npm run dev -- --host
```

### Deployment Issues
```bash
# Check Firebase project
firebase projects:list
firebase use [project-id]

# Check hosting configuration
firebase hosting:channel:list

# Redeploy
firebase deploy --only hosting
```

### Authentication Issues
1. **Check Firebase Console**: Authentication > Sign-in methods
2. **Verify Domain**: Add your domain to authorized domains
3. **Check reCAPTCHA**: Verify site key configuration
4. **Test Environment**: Ensure `.env` variables are correct

## 📋 Session Management

### Current Deployment Status (January 27, 2025)
**Live URL**: https://archers-edge.web.app  
**Status**: ✅ **Production Ready**  
**Last Deployment**: January 27, 2025  

#### **Recent Deployments**
- ✅ **Bug Fix #001**: Profile Management screen loading error (isOnline import)
- ✅ **Bug Fix #002**: Cross-Origin-Opener-Policy console errors (Google OAuth)
- ✅ **Competition Results Sprint**: Enhanced results page and scorecard components
- ✅ **Authentication**: Google login with graceful error handling

#### **Verified Working Features**
- ✅ Profile Management (no more console errors)
- ✅ Google Authentication (clean console)
- ✅ Competition Results with rankings
- ✅ Detailed scorecard viewing
- ✅ Mobile responsiveness
- ✅ Offline functionality

### Starting a New Development Session
```bash
# 1. Navigate to project
cd /Users/terry/web-mirrors/projects/archers-edge

# 2. Check current branch
git branch

# 3. Pull latest changes
git pull

# 4. Kill any existing dev servers
pkill -f "npm run dev"

# 5. Start dev server with network access
npm run dev -- --host

# 6. Note the network URL for phone testing
# Example: http://172.16.0.97:3000
```

### Ending a Development Session
```bash
# 1. Stop dev server
pkill -f "npm run dev"

# 2. Commit changes (if needed)
git add .
git commit -m "Your commit message"

# 3. Push changes (if needed)
git push
```

## 🔒 Security Best Practices

### Development
- [ ] Never commit `.env` files
- [ ] Use different Firebase projects for dev/prod
- [ ] Test with placeholder values first
- [ ] Verify no hardcoded credentials

### Production
- [ ] Set environment variables in Firebase Console
- [ ] Use production Firebase project
- [ ] Test authentication thoroughly
- [ ] Monitor Firebase Console for issues

## 📞 Quick Reference

### Common Commands
```bash
# Start dev server (network access)
npm run dev -- --host

# Stop dev server
pkill -f "npm run dev"

# Deploy to production
firebase deploy

# Check Firebase project
firebase projects:list

# Switch Firebase project
firebase use [project-id]
```

### Network URLs
- **Local**: `http://localhost:3000`
- **Network**: `http://172.16.0.97:3000` (your IP may vary)
- **Production**: `https://archers-edge.web.app`

### Important Files
- `.env` - Local environment variables (not in git)
- `.env.example` - Template for environment setup
- `firebase.json` - Firebase configuration
- `src/config/firebase.js` - Firebase initialization 