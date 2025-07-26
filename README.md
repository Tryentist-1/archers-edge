# Archer's Edge 🏹

A modern, mobile-first archery scoring and management application designed for high school teams, clubs, and tournaments.

## 🚀 **Current Status: Production Ready**

**Last Updated:** January 2025  
**Status:** All core functionality implemented and working. Ready for enhanced features.

## ✨ **Features**

### ✅ **Core Functionality (Production Ready)**
- **Multi-Archer Scoring** - Score multiple archers per bale with target assignments
- **Profile Management** - Full CRUD operations for archer profiles with Firebase sync
- **Competition Management** - OAS competitions with division support (M/F, V/JV)
- **Team Management** - Coach view for managing team archers
- **Authentication** - Google and mobile login with offline support
- **Data Persistence** - Local storage with Firebase sync for offline capability
- **Mobile-First Design** - Optimized for phone screens with responsive UI

### 🎯 **Next Phase Features (In Development)**
- **Arrow Placement Visualization** - Interactive target diagrams for shot analysis
- **Group Size Calculation** - Statistical analysis of arrow groupings
- **Real-time Leaderboards** - Live competition updates
- **Coach's Notes System** - Structured feedback and training tracking
- **Safety Guidelines** - Mandatory registration acceptance
- **Performance Analytics** - Enhanced data visualization

## 🛠 **Technical Stack**

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Hosting)
- **State Management:** React Context + Local Storage
- **Testing:** Vitest + React Testing Library
- **Deployment:** Firebase Hosting

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd archers-edge

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📱 **Mobile-First Design**

The application is optimized for mobile devices and works seamlessly on phones and tablets:

- **Responsive Layout** - Adapts to different screen sizes
- **Touch-Friendly Interface** - Large buttons and intuitive navigation
- **Offline Capability** - Works without internet connection
- **Fast Loading** - Optimized for mobile networks

## 🔐 **Authentication**

- **Google Sign-In** - Quick authentication with Google accounts
- **Mobile Authentication** - Phone number verification (configured)
- **Offline Support** - Works without internet connection
- **Session Persistence** - Maintains login state across sessions

## 📊 **Scoring System**

### Multi-Archer Support
- Score multiple archers simultaneously on the same bale
- Assign archers to targets (A, B, C, D, etc.)
- Individual scorecards for each archer
- Combined bale totals and statistics

### Competition Management
- Create and manage OAS competitions
- Support for different divisions (M/F, V/JV)
- Team archer management
- Competition-specific scoring rules

## 🎯 **User Roles**

### Archer
- Create and manage personal profiles
- Enter scores during practice and competitions
- View individual performance statistics
- Access offline scoring capability

### Coach
- Manage team archer profiles
- Track archer progress and performance
- Create and manage competitions
- Access team-wide analytics

### Tournament Organizer
- Set up competitions and divisions
- Manage participant registration
- Track real-time competition results
- Generate final results and rankings

## 🔧 **Configuration**

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication (Google, Phone)
3. Set up Firestore database
4. Update `src/config/firebase.js` with your project credentials

### Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Firebase project credentials:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
   ```

**⚠️ Security Note:** The `.env` file is already in `.gitignore` to prevent accidentally committing sensitive credentials. Never commit API keys or other secrets to version control.

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:profile
npm run test:auth
npm run test:firebase
```

## 📁 **Project Structure**

```
src/
├── components/          # React components
│   ├── Login.jsx       # Authentication interface
│   ├── HomePage.jsx    # Main dashboard
│   ├── ArcherSetup.jsx # Multi-archer setup
│   ├── MultiArcherScoring.jsx # Core scoring interface
│   ├── ProfileManagement.jsx # Archer profile management
│   ├── CompetitionManagement.jsx # Competition setup
│   └── TeamArcherManagement.jsx # Team management
├── contexts/           # React contexts
│   └── AuthContext.jsx # Authentication state
├── services/           # Firebase and API services
├── utils/              # Utility functions
├── config/             # Configuration files
└── styles/             # CSS and styling
```

## 🚀 **Deployment**

### Firebase Hosting
```bash
# Build the application
npm run build

# Deploy to Firebase
firebase deploy
```

### Environment Setup
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

## 📈 **Performance**

- **Fast Loading** - Optimized bundle size and lazy loading
- **Offline Support** - Service worker for offline functionality
- **Mobile Optimized** - Touch-friendly interface and responsive design
- **Data Efficiency** - Minimal network requests with local caching

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## 📄 **License**

This project is licensed under the ISC License.

## 🆘 **Support**

For support and questions:
- Check the documentation in `/docs/`
- Review the Product Requirements Document
- Check the bugs and regressions tracking

## 🎯 **Roadmap**

### Session 8: Enhanced Features
- [ ] Arrow placement visualization
- [ ] Group size calculation algorithms
- [ ] Real-time leaderboard system
- [ ] Coach's notes functionality

### Future Enhancements
- [ ] Advanced analytics and performance prediction
- [ ] Tournament management system
- [ ] Social features and team communication
- [ ] Third-party archery system integration

---

**Built with ❤️ for the archery community**

