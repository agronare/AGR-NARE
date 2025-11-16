import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// Firebase solo debe inicializarse una vez
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// En el servidor SOLO Firestore funciona
export const firebaseApp = app;
export const firestore = getFirestore(app);
