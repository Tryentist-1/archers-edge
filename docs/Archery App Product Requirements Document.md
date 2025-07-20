# **Archery Management Application (Archer's Edge) \- Product Requirements Document**

## **1\. Introduction**

This document outlines the requirements for the "Archer's Edge" web application, designed to manage high school archery teams and expand to support archery clubs, shoots, and tournaments. The application aims to provide a streamlined experience for archers, coaches, and event organizers, leveraging cloud-based services for scalability and real-time data.

## **2\. Goals**

* To provide a robust, mobile-friendly web application that supports offline scoring and data synchronization.  
* To simplify the registration, scoring, and results management for archery competitions.  
* To offer insightful data analysis for archers and coaches to track progress and improve performance.  
* To enhance the overall experience for participants and spectators at archery events.

## **3\. Target Audience / Personas**

### **3.1. Archer**

Individuals participating in archery, ranging from high school team members to club archers.

* **Primary Use:** Scoring, tracking personal progress, viewing results.

### **3.2. Coach**

Individuals responsible for training and managing archery teams or groups.

* **Primary Use:** Team management, providing feedback, tracking student progress, scheduling.

### **3.3. Tournament Organizer / Club Manager**

Individuals or groups responsible for setting up, running, and managing archery shoots and tournaments.

* **Primary Use:** Event setup, registration management, results calculation, awards, communication.

### **3.4. Spectator / Parent**

Individuals interested in following competition results or reviewing an archer's performance.

* **Primary Use:** Viewing live scores, rankings, and published results.

## **4\. Key Features & User Stories**

### **4.1. User Management & Profiles**

**Feature: Archer Profile Management**

* **As an archer,** I want to create and manage multiple profiles (e.g., Compound, Recurve, Youth) so I can track different equipment or roles.  
* **As an archer,** I want to record my dominant hand, dominant eye, and recommended equipment (bow weight, draw length) in my profile so coaches have essential information.  
* **As an archer,** I want to store my US Archery/World Archery and NFAA membership numbers in my profile so my affiliation is recognized.  
* **As an archer,** I want to set a default classification for my profile (e.g., Varsity, Junior Varsity, JOAD, NFAA classes) so it's pre-selected for competitions.  
* **As an archer,** I want to upload a profile picture and see my stats displayed in a dynamic "sports card" format so my profile is engaging and visually appealing.  
* **As an archer,** I want to see any personal sponsorships listed on my profile so my supporters get visibility.

**Feature: Authentication & Access**

* **As an archer,** I want to log in using my mobile phone number with SMS verification so the sign-up process is quick and easy.  
* **As an archer,** I want to log in using my Google account so I have a convenient authentication option.  
* **As a family head/parent,** I want to link multiple archer profiles to a single phone number so I can manage my family's participation easily.

**Feature: Coach's Tools & Notes**

* **As a coach,** I want to record the date each camper completes mandatory safety training so I can ensure compliance.  
* **As a coach,** I want to add and update "Coach's Notes" for each archer's profile over time so I can track their progress and areas for improvement.  
* **As a coach,** I want a structured template for coach's notes (Anchor, Release, Aim, Form, Mental Focus, General Notes) so feedback is consistent and easy to provide.  
* **As a coach,** I want to manage sign-ups for 10-minute "coach's corner" sessions during practice so I can schedule and focus those sessions effectively.

### **4.2. Competition Management**

**Feature: Event Setup & Registration**

* **As a tournament organizer,** I want to define new competitions, including customizable targets and scoring rules (e.g., 1-10 points, 10-8-5 points, 3 arrows/end, 1 arrow/target) so I can support various event formats (Olympic, NFAA Field/Hunter, Novelty shoots, OAS Ranking/Head-to-Head).  
* **As an archer,** I want to register for a specific competition, selecting my profile and the class I will shoot in for that event, so my entry details are accurate.  
* **As a tournament organizer,** I want to assign archers to bails (up to 8 archers per bail) so I can manage shooting groups efficiently.
* As a tournament organizer I want to be able to have the app understand NFAA rounds from https://nfaausa.com/about/constitution/divisions-of-competition&term=

**Feature: Digital Scorecard & Scoring**

* **As an archer,** I want to use a digital scorecard on my mobile device to record my scores and the scores of others on my bail, replacing paper scorecards.  
* **As an archer,** I want the app to track individual scores for every arrow shot, by target and by end (e.g., all 36 arrows over 12 ends, or all 42 arrows in a novelty shoot) so my complete performance is recorded.  
* **As an archer,** I want to visualize my arrow placement on a target diagram by touching the screen so I can analyze my shot patterns.  
* **As an archer,** I want the app to calculate my group size and 80% group size (excluding outliers) based on arrow placement, so I can assess my consistency. (Future: Track over time)

**Feature: Data Synchronization & Validation**

* **As an archer/scorer,** I want the app to store data locally so I can continue scoring even with bad or no internet connection.  
* **As an archer/scorer,** I want the app to periodically submit my scores to a central database when connectivity is available so my data is backed up.  
* **As an archer/scorer,** I want to synchronize my scores with another scorer's app to validate and confirm results before final submission.

### **4.3. Data Analysis & Reporting**

**Feature: Real-time & Post-Event Results**

* **As a spectator/archer,** I want to view a live leaderboard that updates in real-time during a tournament, showing current standings, so I can follow the competition's progress.  
* **As an archer,** I want to see my current average arrow score and an estimated probability of winning based on that average during live events, so I can gauge my performance.  
* **As a tournament organizer,** I want the app to accurately calculate and display first, second, and third place winners for each class, based on NFAA rules, so I can quickly hand out awards.  
* **As a tournament organizer,** I want to publish comprehensive results after a shoot, including archers' individual scores, rankings within their divisions, overall high scores, and other interesting statistics, so participants can review their performance.  
* **As a tournament organizer,** I want to display club and shoot sponsor information on the published results so sponsors receive visibility.  
* **As a coach,** I want to receive data on my students' groupings so I can identify who needs additional support.

**Feature: Communication & Engagement**

* **As a club manager,** I want to maintain a master list of everyone who has attended a shoot, with an opt-in for email and text communication, so I can send results or reminders for upcoming events.

### **4.4. Usability & User Interface**

**Feature: Streamlined User Experience**

* **As a user,** I want the app's interface to be streamlined and intuitive for my specific persona (archer, coach, spectator) to avoid clutter and improve efficiency.  
* **As a new registrant,** I want a pop-up displaying mandatory safety guidelines during registration, requiring my acceptance, so I am aware of and agree to the rules.

## **5\. Technical Considerations**

* **Backend:** Firebase (Firestore for real-time database, Authentication for user login).  
* **Frontend:** Web-based application, optimized for mobile devices.  
* **Data Storage:** Local storage for offline capabilities, synchronized with Firebase Firestore.  
* **Scalability:** Leverage Firebase's inherent scalability to support growing user bases and competition sizes.  
* **Security:** Utilize Firebase's built-in authentication and security rules.