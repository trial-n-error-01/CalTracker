# Nourish

A dashboard-first calorie tracker built with React, TypeScript, Vite, Firebase, Recharts, and Lucide.

## Current Features

- Meal-based daily logging for breakfast, lunch, dinner, and snacks
- Direct calorie, protein, and fiber input with add and remove actions
- Daily calorie target progress
- Weekly calorie chart
- Monthly calorie trend chart
- Responsive desktop and mobile layouts
- Firebase Auth and Firestore client initialization

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- A Firebase project for authentication and database development

Check your installed versions:

```bash
node --version
npm --version
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Firebase Setup

Firebase is configured in [src/lib/firebase.ts](src/lib/firebase.ts). The app reads configuration from Vite environment variables.

1. Create or open a project in the [Firebase Console](https://console.firebase.google.com/).
2. Register a Web app in **Project settings**.
3. Enable authentication providers under **Authentication > Sign-in method**.
4. Create a Firestore database under **Firestore Database**.
5. Create a local environment file from the included template:

```bash
cp .env.example .env
```

Fill in the Firebase web app values:

```dotenv
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

Restart the dev server after changing `.env` values. Do not commit `.env` or other files containing secrets.

Firebase web configuration values are intended to be used client-side, but Firestore security rules must still protect user data.

## Available Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Type-check and create a production bundle in `dist/` |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production bundle locally |

Recommended verification before sharing changes:

```bash
npm run lint
npm run build
```

## Project Structure

```text
src/
  App.tsx             Main dashboard and daily-log interactions
  App.css             Application layout and responsive styles
  index.css           Global styles and typography
  lib/firebase.ts     Firebase app, Auth, and Firestore initialization
  main.tsx            React application entry point
.env.example          Firebase environment variable template
firestore.rules       Per-user Firestore access rules
```

## Current Data Status

The app uses Firebase Authentication with email and password. Signed-out visitors see the sign-in/create-account screen. Signed-in users see their own profile and an empty daily log until they add food.

Daily entries and day totals are stored in Firestore under the authenticated user. The included `firestore.rules` file limits access to that user. Deploy the rules from the Firebase CLI with `firebase deploy --only firestore:rules` after initializing Firebase Hosting or the Firebase CLI for this project.

The Firestore shape is:

```text
users/{userId}
  displayName
  email
  maintenanceCalories

users/{userId}/days/{yyyy-mm-dd}/entries/{entryId}
  meal
  foodName
  calories
  protein
  fiber
  parts (optional array of { name, calories, protein, fiber })
  createdAt
```

## Deployment

Build the production bundle with:

```bash
npm run build
```

The output is placed in `dist/`. A hosting provider can deploy this directory as a single-page application.

For Firebase Hosting, add a `firebase.json` configuration that uses `dist/` as the public directory and rewrites application routes to `index.html`.
