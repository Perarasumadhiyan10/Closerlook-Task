# BUSGO – Smart Bus Ticket Booking

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Firebase configuration

1. Create a Firebase project and enable **Email/Password** Authentication.
2. Create a Firestore database.
3. Copy the Firebase web app configuration into `.env` using the variable names in `.env.example`.
4. Deploy `firestore.rules` in Firebase Console → Firestore → Rules.
5. Restart the Vite development server after changing `.env`.

No Firebase credentials are bundled in the source. The app clearly reports configuration issues and does not simulate Authentication when credentials are missing.

## Conductor access

Set a user's Firestore `users/{uid}.role` field to `conductor` to allow conductor verification and boarding updates. Normal passenger accounts default to `passenger`.

## Demo payment limitation

Payment is explicitly demo-only. It does not collect or process real card or banking information. The frontend creates the Firestore booking and atomically reserves seats in a transaction. For production, use a verified payment provider and a trusted backend/Cloud Function; never trust a client-only payment status.

## Scripts

- `npm run dev` – local development
- `npm run build` – production build
- `npm run lint` – lint source
