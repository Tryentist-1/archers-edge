# Archer's Edge - Style Guide

**Date:** January 27, 2025  
**Status:** ACTIVE - Based on current implementation and UI improvement plan

## 🎨 **Design Philosophy**

### **Mobile-First Approach**
- All components designed for mobile devices first
- Touch-friendly interfaces with 44px minimum touch targets
- Responsive design that scales to desktop
- Offline-capable functionality

### **Professional Archery Standards**
- OAS (Ontario Archery Society) compliant scoring
- Color-coded performance indicators matching target rings
- Professional scorecard verification workflow
- Industry-standard terminology and layouts

## 🎨 **Color Palette**

### **Primary Colors**
```css
/* Primary Brand Colors */
--primary: #2563eb;        /* Blue - Primary actions, navigation */
--secondary: #64748b;       /* Gray - Secondary text, borders */
--success: #059669;         /* Green - Success states, positive actions */
--warning: #d97706;         /* Yellow - Warnings, alerts */
--error: #dc2626;          /* Red - Errors, destructive actions */
```

### **Background & Surface Colors**
```css
/* Light Mode */
--background: #ffffff;      /* Main background */
--surface: #f8fafc;        /* Card backgrounds, elevated surfaces */
--text-primary: #1e293b;   /* Primary text */
--text-secondary: #64748b; /* Secondary text, labels */

/* Dark Mode (Future) */
--background-dark: #0f172a;
--surface-dark: #1e293b;
--text-primary-dark: #f1f5f9;
--text-secondary-dark: #cbd5e1;
```

### **Scoring Color System**
```css
/* OAS Target Ring Colors */
--score-x: #ff6b6b;        /* Red for X (10) */
--score-10: #4ecdc4;       /* Teal for 10 */
--score-9: #45b7d1;        /* Blue for 9 */
--score-8: #96ceb4;        /* Green for 8 */
--score-7: #feca57;        /* Yellow for 7 */
--score-6: #ff9ff3;        /* Pink for 6 */
--score-5: #54a0ff;        /* Light blue for 5 */
--score-4: #5f27cd;        /* Purple for 4 */
--score-3: #00d2d3;        /* Cyan for 3 */
--score-2: #ff9f43;        /* Orange for 2 */
--score-1: #ee5a24;        /* Dark orange for 1 */
--score-m: #2c3e50;        /* Dark gray for M (miss) */
--score-empty: #ecf0f1;    /* Light gray for empty */
```

### **Performance Indicators**
```css
/* Average Score Colors (OAS Standard) */
--avg-gold: #fbbf24;       /* 9.0+ - Gold ring performance */
--avg-red: #dc2626;        /* 7.0+ - Red ring performance */
--avg-blue: #3b82f6;       /* 5.0+ - Blue ring performance */
--avg-gray: #6b7280;       /* <5.0 - Gray ring performance */
```

## 📱 **Component Structure**

### **Standard Form Layout**
```jsx
<div className="form-container">
  {/* Action Buttons - Always at Top */}
  <div className="action-bar">
    <button className="btn-primary">Save</button>
    <button className="btn-secondary">Cancel</button>
  </div>
  
  {/* Grouped Content Cards */}
  <div className="content-cards">
    <div className="card contact-info">
      <h3>Contact Information</h3>
      {/* Contact fields */}
    </div>
    
    <div className="card archer-details">
      <h3>Archer Details</h3>
      {/* Archer fields */}
    </div>
    
    <div className="card equipment">
      <h3>Equipment</h3>
      {/* Equipment fields */}
    </div>
  </div>
</div>
```

### **Card Design**
```css
/* Standard Card Styling */
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4;
}

.card h3 {
  @apply text-lg font-semibold text-gray-800 mb-3;
}

.card-content {
  @apply space-y-4;
}
```

### **Button Hierarchy**
```css
/* Primary Actions */
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700;
}

/* Secondary Actions */
.btn-secondary {
  @apply bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300;
}

/* Success Actions */
.btn-success {
  @apply bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700;
}

/* Destructive Actions */
.btn-danger {
  @apply bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700;
}
```

## 📱 **Mobile-First Responsive Design**

### **Breakpoints**
```css
/* Mobile First Approach */
/* Mobile: 320px - 768px (default) */
/* Tablet: 768px - 1024px */
/* Desktop: 1024px+ */
```

### **Mobile Optimizations**
- **Touch Targets**: Minimum 44px height/width for all interactive elements
- **Font Size**: 16px minimum to prevent iOS zoom
- **Spacing**: Generous padding and margins for touch interaction
- **Navigation**: Bottom sheet modals and swipe gestures
- **Headers**: Simplified, essential information only

### **Keypad & Input Styling**
```css
/* Mobile Keypad */
.keypad-btn {
  min-height: 44px;
  min-width: 44px;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  font-size: 16px !important;
}

/* Score Input Fields */
.score-input-keypad {
  min-height: 44px;
  touch-action: manipulation;
  font-size: 16px !important;
}
```

## 🏹 **Archery-Specific Components**

### **Scorecard Layout**
```jsx
/* Professional 9-Column OAS Scorecard */
<table className="scorecard-table">
  <thead>
    <tr>
      <th>E</th>    {/* End */}
      <th>A1</th>   {/* Arrow 1 */}
      <th>A2</th>   {/* Arrow 2 */}
      <th>A3</th>   {/* Arrow 3 */}
      <th>10s</th>  {/* Tens Count */}
      <th>Xs</th>   {/* X Count */}
      <th>END</th>  {/* End Total */}
      <th>RUN</th>  {/* Running Total */}
      <th>AVG</th>  {/* Average */}
    </tr>
  </thead>
</table>
```

### **Score Color Classes**
```css
/* Score Display Colors */
.score-x { @apply bg-yellow-400 text-black font-bold; }
.score-10 { @apply bg-yellow-400 text-black; }
.score-9 { @apply bg-red-600 text-white; }
.score-8 { @apply bg-red-600 text-white; }
.score-7 { @apply bg-red-600 text-white; }
.score-6 { @apply bg-cyan-400 text-black; }
.score-5 { @apply bg-cyan-400 text-black; }
.score-4 { @apply bg-gray-800 text-white; }
.score-3 { @apply bg-gray-800 text-white; }
.score-2 { @apply bg-white text-black border border-gray-300; }
.score-1 { @apply bg-white text-black border border-gray-300; }
.score-m { @apply bg-white text-gray-500 border border-gray-300; }
```

### **Performance Indicators**
```css
/* Average Score Colors */
.avg-gold { @apply bg-yellow-400 text-black; }    /* 9.0+ */
.avg-red { @apply bg-red-600 text-white; }        /* 7.0+ */
.avg-blue { @apply bg-blue-500 text-white; }      /* 5.0+ */
.avg-gray { @apply bg-gray-300 text-black; }      /* <5.0 */
```

## 🎯 **Typography**

### **Font Hierarchy**
```css
/* Headings */
h1 { @apply text-2xl font-bold text-gray-900; }
h2 { @apply text-xl font-semibold text-gray-800; }
h3 { @apply text-lg font-semibold text-gray-800; }

/* Body Text */
p { @apply text-base text-gray-700; }
.text-sm { @apply text-sm text-gray-600; }
.text-xs { @apply text-xs text-gray-500; }

/* Labels */
label { @apply text-sm font-medium text-gray-700; }
```

### **Special Text Elements**
```css
/* Archer Names */
.archer-name { @apply text-lg font-semibold text-gray-800; }

/* Competition Names */
.competition-name { @apply text-xl font-bold text-gray-900; }

/* Scores */
.score-display { @apply text-2xl font-bold; }

/* Status Indicators */
.status-badge { @apply px-2 py-1 text-xs rounded-full font-medium; }
```

## 🎨 **Layout Principles**

### **Action Button Placement**
- **Always at the top** of forms and pages
- **Short, clear labels** (Save, Cancel, Next, etc.)
- **Consistent styling** across all components
- **Never below the fold** on mobile

### **Information Grouping**
- **Logical card grouping** for related fields
- **Rounded corner cards** with subtle shadows
- **Clear visual hierarchy** with proper spacing
- **Mobile-first grid layouts**

### **Navigation**
- **Single home method** via "Archer's Edge" header
- **Consistent back buttons** for form navigation
- **Clear progress indicators** for multi-step processes
- **Touch-friendly navigation** elements

## 🔧 **Implementation Guidelines**

### **Component Structure**
1. **Action buttons at top**
2. **Grouped content in cards**
3. **Consistent spacing and typography**
4. **Mobile-first responsive design**
5. **Accessibility considerations**

### **Color Usage**
- **Primary Blue**: Navigation, main actions
- **Success Green**: Positive actions, completion
- **Warning Yellow**: Alerts, important notices
- **Error Red**: Destructive actions, errors
- **OAS Colors**: Scoring and performance indicators

### **Mobile Considerations**
- **Touch targets**: 44px minimum
- **Font size**: 16px minimum
- **Spacing**: Generous padding for touch
- **Navigation**: Simplified, essential only
- **Performance**: Optimized for mobile networks

## 📋 **Component Checklist**

### **Before Implementation**
- [ ] Mobile-first design approach
- [ ] Touch-friendly interface elements
- [ ] Consistent color usage
- [ ] Proper typography hierarchy
- [ ] Action buttons at top
- [ ] Logical information grouping
- [ ] Accessibility considerations
- [ ] Offline functionality support

### **After Implementation**
- [ ] Test on mobile devices
- [ ] Verify touch target sizes
- [ ] Check color contrast
- [ ] Validate responsive behavior
- [ ] Test offline functionality
- [ ] Review accessibility
- [ ] Confirm consistent styling

---

**This style guide ensures consistent, professional, and mobile-optimized design across all Archer's Edge components while maintaining OAS compliance and user experience standards.** 