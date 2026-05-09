# Firebase Setup Guide for SukiScale

This guide will help you set up Firebase to sync data between your mobile app (offline-first) and web app (online).

## Overview

- **Mobile App**: Works offline with SQLite, syncs to Firebase when online
- **Web App**: Connects to Firebase for real-time data
- **Offline Support**: Firebase Firestore persists data locally, automatically syncs when connection returns

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create Project"
3. Name your project (e.g., "sukiscale-app")
4. Disable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Register Your Apps

### For Mobile App (iOS/Android):

1. In Firebase Console, click the Android icon (</>) to add an Android app
2. Enter package name: `com.anonymous.sukiscale` (check your app.json for the exact name)
3. Download `google-services.json`
4. Place it in: `android/app/google-services.json`
5. For iOS, repeat with iOS icon and download `GoogleService-Info.plist`

### For Web App:

1. In Firebase Console, click the Web icon (</>)
2. Register app with nickname "sukiscale-web"
3. **Important**: Copy the Firebase config object shown
4. Update `config/firebase.ts` with your config:

```typescript
export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Step 3: Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create Database"
3. Choose **"Start in production mode"**
4. Select a region close to your users (e.g., `asia-southeast1` for Philippines)

## Step 4: Set Up Security Rules

1. Go to Firestore Database > Rules
2. Replace with these rules for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Note**: This requires users to be authenticated. For public access (testing only):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click "Publish"

## Step 5: Enable Authentication (Optional but Recommended)

1. Go to "Authentication" in Firebase Console
2. Click "Get Started"
3. Enable "Email/Password" provider
4. This allows users to have their own data

## Step 6: Test the Setup

### Mobile App:

```bash
npx expo run:android
# or
npx expo run:ios
```

1. Add a farmer while online - should sync to Firebase
2. Go offline (airplane mode)
3. Add another farmer - saved locally
4. Go back online - data should sync automatically

### Web App:

```bash
npm run web
```

1. Open browser at `localhost:19006`
2. Data from mobile should appear automatically
3. Add data in web - should sync to mobile

## How It Works

### Data Flow:

```
┌─────────────────┐     ┌───────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│   Firebase    │◄────│    Web App      │
│  (Offline/Local)│◄────│   Firestore   │────▶│   (Online)      │
└─────────────────┘     └───────────────┘     └─────────────────┘
```

### Offline Behavior:

1. **Mobile Offline**: 
   - Data saved to SQLite (local)
   - Firebase queues changes locally
   - No errors shown to user
   - Automatic sync when online

2. **Mobile Online**:
   - Data saves to SQLite
   - Immediately syncs to Firebase
   - Updates web app in real-time

3. **Web App**:
   - Always connects to Firebase
   - Shows real-time updates
   - Can work offline with browser cache

## Troubleshooting

### Sync Not Working:

1. Check Firebase config is correct in `config/firebase.ts`
2. Check Firestore rules allow read/write
3. Check user is authenticated (if using auth)
4. Check internet connection
5. Check browser console for errors

### Mobile Not Syncing:

```bash
# Clear all data and reinstall
npx expo run:android --clear-cache
```

### Web Not Loading:

```bash
# Clear webpack cache
npx expo start --web --clear
```

## Data Structure in Firestore

```
/farmers/{farmerId} - Farmer data with userId
/products/{productId} - Product data with userId
/transactions/{transactionId} - Transaction data with userId
/debtRecords/{recordId} - Debt record data with userId
```

Each document has a `userId` field to separate data between users.

## Next Steps

1. Set up Firebase project
2. Update `config/firebase.ts` with your config
3. Test sync between mobile and web
4. Consider adding user authentication for data security

## Support

- Firebase docs: https://firebase.google.com/docs/firestore
- Firestore offline: https://firebase.google.com/docs/firestore/manage-data/enable-offline
