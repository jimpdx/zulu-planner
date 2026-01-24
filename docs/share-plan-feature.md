# Share Plan Feature

Share a plan via URL like `https://perflight.com/events/c8fh23ds`. Recipients can view, edit, and generate their own share link (like a gist).

## Prerequisites

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Create a project" (free Spark plan is fine)
3. Name it something like "zulu-planner"
4. Disable Google Analytics (not needed)
5. Once created, click the web icon (`</>`) to add a web app
6. Register app name (e.g., "zulu-planner-web")
7. Copy the `firebaseConfig` object — you'll need the values for `.env`

### 2. Enable Firestore

1. In the Firebase console, go to Build > Firestore Database
2. Click "Create database"
3. Choose a location (e.g., `us-central1`)
4. Start in **production mode** and apply these security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /plans/{planId} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasAll(['plan', 'facilities', 'controllers', 'createdAt'])
                    && request.resource.data.plan is map
                    && request.resource.data.facilities is list
                    && request.resource.data.controllers is list;
    }
  }
}
```

This allows anyone to read plans and create new ones, but not update or delete existing plans.

### 3. Environment Variables

Create `.env` in the project root (already gitignored via `.vscode*` pattern — add `.env` to `.gitignore` explicitly):

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Install Firebase SDK

```bash
npm install firebase
```

---

## Code Changes

### New Files

#### `src/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
```

#### `src/services/sharePlan.ts`

```typescript
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { PlanState } from '../types'

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

export async function savePlan(state: PlanState): Promise<string> {
  const id = generateId()
  await setDoc(doc(db, 'plans', id), {
    ...state,
    createdAt: new Date().toISOString(),
  })
  return id
}

export async function loadPlan(id: string): Promise<PlanState | null> {
  const snap = await getDoc(doc(db, 'plans', id))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    plan: data.plan,
    facilities: data.facilities,
    controllers: data.controllers,
  }
}
```

#### `src/components/ShareButton.tsx`

```typescript
import { useState } from 'react'
import { usePlan } from '../context/PlanContext'
import { savePlan } from '../services/sharePlan'

export function ShareButton() {
  const { state } = usePlan()
  const [status, setStatus] = useState<'idle' | 'saving' | 'copied' | 'error'>('idle')

  async function handleShare() {
    setStatus('saving')
    try {
      const id = await savePlan(state)
      const url = `${window.location.origin}/events/${id}`
      await navigator.clipboard.writeText(url)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={status === 'saving'}
      className="text-text/60 hover:text-text transition-colors"
      title="Share this plan"
    >
      {status === 'copied' ? (
        <span className="text-green-400 text-sm">Link copied!</span>
      ) : status === 'error' ? (
        <span className="text-red-400 text-sm">Error</span>
      ) : status === 'saving' ? (
        <span className="text-text/40 text-sm">Saving...</span>
      ) : (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
      )}
    </button>
  )
}
```

#### `public/.htaccess`

This enables SPA routing on Apache so `/events/c8fh23ds` serves `index.html`:

```apache
RewriteEngine On
RewriteBase /events/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /events/index.html [L]
```

---

### Modified Files

#### `src/context/PlanContext.tsx`

Add `LOAD_PLAN` action and URL detection:

```diff
-import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react'
-import type { PlanState, Plan, Facility, Controller } from '../types'
+import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from 'react'
+import type { PlanState, Plan, Facility, Controller } from '../types'
+import { loadPlan } from '../services/sharePlan'

 // ... (keep existing defaultPlan, defaultState, loadState unchanged)

 type Action =
   | { type: 'UPDATE_PLAN'; payload: Partial<Plan> }
   // ... existing actions ...
+  | { type: 'LOAD_PLAN'; payload: PlanState }
   | { type: 'RESET' }

 // In the reducer, add before RESET case:
+    case 'LOAD_PLAN':
+      return action.payload

+const BASE_PATH = '/events/'
+
+function getSharedPlanId(): string | null {
+  const path = window.location.pathname
+  if (!path.startsWith(BASE_PATH)) return null
+  const id = path.slice(BASE_PATH.length).replace(/\/$/, '')
+  return id || null
+}

 export function PlanProvider({ children }: { children: ReactNode }) {
   const [state, dispatch] = useReducer(reducer, undefined, loadState)
+  const [loading, setLoading] = useState(() => !!getSharedPlanId())
+
+  useEffect(() => {
+    const id = getSharedPlanId()
+    if (!id) return
+    loadPlan(id).then(plan => {
+      if (plan) {
+        dispatch({ type: 'LOAD_PLAN', payload: plan })
+      }
+      setLoading(false)
+    }).catch(() => setLoading(false))
+  }, [])

   useEffect(() => {
-    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
-  }, [state])
+    if (!loading) {
+      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
+    }
+  }, [state, loading])

+  if (loading) {
+    return <div className="text-center text-text/60 py-12">Loading shared plan...</div>
+  }

   // ... rest unchanged
 }
```

#### `src/App.tsx`

Add the ShareButton to the header icons:

```diff
+import { ShareButton } from './components/ShareButton'

 // In the header div with Discord/GitHub icons, add before the Discord link:
+            <ShareButton />
```

#### `.gitignore`

Add `.env`:

```diff
+.env
```

---

## How It Works

1. User builds a plan (facilities, controllers, shifts)
2. Clicks the share icon in the header
3. Plan state is saved to Firestore with an 8-char random ID
4. URL is copied to clipboard: `https://perflight.com/events/a1b2c3d4`
5. Recipient opens the link
6. `.htaccess` rewrites the path to serve `index.html`
7. App detects the ID in the URL path, fetches from Firestore
8. Plan loads into the app — recipient can edit freely (changes go to their localStorage)
9. They can click share to save their own version with a new URL

---

## Firestore Data Structure

```
plans/
  a1b2c3d4/
    plan: { name, baseDateUTC, depStart, depEnd, ... }
    facilities: [ { id, name, timezone, type, ... }, ... ]
    controllers: [ { id, name, timezone, facilityId, ... }, ... ]
    createdAt: "2026-01-23T..."
```

---

## Cost / Limits (Spark Free Tier)

- 1 GB storage
- 50k reads/day, 20k writes/day
- 10 GB/month network egress

For a plan-sharing tool this is more than sufficient.
