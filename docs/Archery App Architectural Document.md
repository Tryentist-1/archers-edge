# **Archery Management Application (Archer's Edge) \- Architectural Document**

## **1\. Introduction**

This document outlines the proposed technical architecture for the "Archer's Edge" web application. It defines the system's components, chosen technologies, data flow, and considerations for scalability and security, specifically targeting a user base ranging from 30 to 400 active users.

## **2\. Architectural Overview**

The Archer's Edge application will follow a **client-serverless architecture** model, leveraging Google Firebase as its primary backend service. This approach minimizes server management overhead, provides built-in scalability, and offers robust authentication and real-time database capabilities.  
**High-Level Components:**

* **Client-Side (Frontend):** A Progressive Web Application (PWA) built with React, providing a rich, responsive user interface accessible via web browsers on various devices (mobile, tablet, desktop). It will utilize local storage for offline functionality.  
* **Backend Services (Firebase):**  
  * **Firestore:** A NoSQL cloud database for storing and synchronizing all application data (archer profiles, competition details, scores, coach's notes, etc.). Its real-time capabilities are crucial for live leaderboards and score synchronization.  
  * **Authentication:** Manages user registration and login, supporting phone number SMS verification and Google Sign-In.  
  * **Cloud Functions (Optional/Future):** For backend logic that cannot be handled directly by client-side code or Firestore security rules (e.g., complex score calculations, automated notifications if needed for scale).  
* **Deployment:** The frontend application will be hosted on a static web hosting service (e.g., Firebase Hosting, Netlify, Vercel).

**Data Flow:**

1. **User Interaction:** Users interact with the React PWA.  
2. **Local Storage:** Data is initially captured and stored in the browser's local storage for immediate offline access.  
3. **Synchronization:** When online, the PWA synchronizes data with Firestore.  
4. **Real-time Updates:** Firestore's real-time capabilities push updates to all subscribed clients (e.g., live leaderboards).  
5. **Authentication:** Firebase Authentication handles user identity and access control.

## **3\. Technology Stack**

* **Frontend Framework:** **React**  
  * **Justification:** Modern, component-based, efficient for building complex UIs, strong community support, and excellent for responsive design.  
  * **Styling:** **Tailwind CSS**  
    * **Justification:** Utility-first CSS framework for rapid UI development, highly customizable, and excellent for responsive design across mobile and desktop.  
  * **UI Components:** **shadcn/ui** (built on Tailwind CSS and Radix UI)  
    * **Justification:** Provides pre-built, accessible, and customizable UI components, accelerating development while maintaining a consistent design.  
  * **Charting/Visualization:** **Recharts**  
    * **Justification:** A composable charting library built with React and D3, suitable for displaying performance graphs (e.g., score trends, group size over time).  
  * **Icons:** **Lucide React** (for general UI icons), **Font Awesome/Phosphor Icons/Inline SVG** (for game-specific or unique icons).  
  * **State Management:** React Context API or Zustand (for more complex global state).  
* **Backend Services:** **Google Firebase**  
  * **Database:** **Firestore**  
    * **Justification:** NoSQL document database, real-time synchronization, offline support via SDKs, highly scalable, flexible data model. Ideal for dynamic data like scores and leaderboards.  
  * **Authentication:** **Firebase Authentication**  
    * **Justification:** Supports multiple authentication methods (Phone Number/SMS, Google Sign-In, Email/Password), robust security features, easy integration.  
  * **Hosting:** **Firebase Hosting**  
    * **Justification:** Fast, secure, and reliable static content hosting, CDN integration, custom domains, and easy deployment for React applications.  
  * **Cloud Functions (Potential Future Use):**  
    * **Justification:** Serverless execution environment for backend logic, triggered by events (e.g., new score submission, user registration). Could be used for complex calculations (e.g., advanced probability, batch processing of results) or integration with external APIs if needed.  
* **Local Storage:** Browser's localStorage API for temporary offline data persistence.

## **4\. Data Model (High-Level)**

Firestore's document-based model will be used. Collections will store related documents.

* **users Collection:**  
  * userId (Document ID)  
  * email  
  * phoneNumber  
  * displayName  
  * lastLogin  
  * linkedArcherProfiles (Array of Archer Profile IDs)  
  * optInEmail (Boolean)  
  * optInSMS (Boolean)  
* **archerProfiles Collection:**  
  * profileId (Document ID)  
  * userId (Reference to users collection)  
  * profileName (e.g., "Compound \- Jazz", "Recurve \- Jazz", "Morgan \- Youth")  
  * dominantHand (String: "Left", "Right")  
  * dominantEye (String: "Left", "Right")  
  * recommendedEquipment (Map: bowWeight, drawLength, bowType, etc.)  
  * usArcheryId (String, optional)  
  * nfaaId (String, optional)  
  * defaultClassification (String: "Varsity", "JOAD Bowman", etc.)  
  * profilePictureUrl (String)  
  * personalSponsorships (Array of Strings/Objects)  
  * averageArrowScore (Number, calculated)  
  * safetyTrainingDate (Timestamp)  
  * coachNotes (Array of Objects: date, coachId, anchor, release, aim, form, mentalFocus, generalNotes)  
* **competitions Collection:**  
  * competitionId (Document ID)  
  * name  
  * date  
  * location  
  * type (e.g., "Olympic Ranking", "NFAA Field", "Novelty")  
  * scoringRules (Map: pointsPerZone, arrowsPerEnd, numEnds, targetSize, targetDistances, etc.)  
  * status (e.g., "Upcoming", "Live", "Completed")  
  * clubId (Reference to clubs collection)  
  * sponsors (Array of Objects: name, logoUrl, websiteUrl)  
* **registrations Collection:**  
  * registrationId (Document ID)  
  * competitionId (Reference to competitions)  
  * archerProfileId (Reference to archerProfiles)  
  * classShotIn (String, specific to this competition)  
  * bailNumber (Number)  
  * targetNumber (Number)  
  * status (e.g., "Registered", "Scoring", "Completed")  
* **scores Collection (Subcollection under registrations or top-level with compound ID):**  
  * scoreId (Document ID)  
  * registrationId (Reference to registrations)  
  * endNumber (Number)  
  * arrowScores (Array of Numbers: e.g., \[10, 9, 8\])  
  * arrowPlacements (Array of Objects: x, y coordinates on target, optional)  
  * timestamp  
  * isFinalized (Boolean, for sync validation)  
* **clubs Collection:**  
  * clubId (Document ID)  
  * name  
  * contactEmail  
  * masterArcherList (Array of archerProfileId for opt-in communication)  
* **coachSessions Collection:**  
  * sessionId (Document ID)  
  * coachId (Reference to users or coaches if separate role)  
  * archerProfileId (Reference to archerProfiles)  
  * date  
  * timeSlot  
  * focusAreas (String/Array)

## **5\. Scalability Considerations (30-400 Users)**

Firebase is designed for scalability and should comfortably handle 30-400 active users.

* **Firestore:**  
  * **Real-time Updates:** Firestore's real-time listeners are highly efficient, pushing only changed data, which is ideal for live leaderboards without heavy server load.  
  * **Querying:** Efficient querying for individual archer data, competition data, and real-time leaderboards. Careful indexing will be required for optimal performance.  
  * **Data Structure:** Denormalization will be used where appropriate (e.g., embedding frequently accessed archer details within scores or registrations) to minimize reads and improve performance for common queries.  
  * **Read/Write Limits:** For 30-400 users, Firestore's default limits are more than sufficient. Even with frequent score updates, the per-document write limits are generous.  
* **Firebase Authentication:** Handles user authentication seamlessly, scaling automatically with the number of users.  
* **Firebase Hosting:** Leverages Google's global CDN, ensuring fast content delivery to users worldwide, regardless of traffic spikes within the 30-400 user range.  
* **Offline First:** The local storage and Firestore offline capabilities reduce the load on the backend by serving data directly from the device when possible, and syncing efficiently when online.  
* **Cost Efficiency:** Firebase's pay-as-you-go model ensures that costs scale with usage, making it economical for varying user loads.

## **6\. Security Considerations**

* **Firebase Security Rules:** Crucial for defining who can read and write which data in Firestore.  
  * **Authentication-based Access:** All data access will be tied to authenticated users.  
  * **User-Specific Data:** Users will only be able to read/write their own archer profiles, scores, and personal settings.  
  * **Role-Based Access:** Coaches will have read/write access to their team's archer profiles and notes. Tournament organizers will have broader write access to competition data.  
  * **Public Read Access:** Live leaderboards and published results can be made publicly readable.  
* **Firebase Authentication:** Handles user identity securely, including password hashing, multi-factor authentication (for phone numbers), and session management.  
* **Input Validation:** All user inputs will be validated on the client-side and, if necessary, on the server-side (via Cloud Functions) to prevent malicious data entry.  
* **Data Privacy:** Adherence to data privacy best practices, especially concerning contact information and opt-in preferences for communication.

## **7\. Offline Capabilities & Synchronization**

* **Local Storage:** The core scoring functionality will heavily rely on the browser's localStorage to store current competition scores and archer selections. This ensures uninterrupted use even without an internet connection.  
* **Firestore Offline Persistence:** The Firebase SDK provides built-in offline persistence, caching data locally and synchronizing changes automatically when connectivity is restored. This will be enabled for critical data like archer profiles and competition settings.  
* **Manual Sync/Validation:** The "synchronize with another scorer" feature will involve a peer-to-peer comparison of locally stored scores, followed by a confirmed submission to Firestore. This adds an extra layer of data integrity.

## **8\. Deployment**

The application will be deployed as a static web application to Firebase Hosting.

* **Build Process:** React application will be built into static HTML, CSS, and JavaScript files.  
* **Deployment:** These static assets will be deployed to Firebase Hosting, which automatically serves them over a CDN.  
* **Updates:** Continuous deployment (CI/CD) practices can be implemented to automate deployments upon code changes, ensuring rapid iterations.

This architecture provides a robust, scalable, and secure foundation for the Archer's Edge application, meeting the outlined product requirements and user expectations for your high school team and expanding club needs.