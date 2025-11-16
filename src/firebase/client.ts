"use client";

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// Firebase solo debe inicializarse una vez
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const firebaseApp = app;
export const auth = getAuth(app);
export const firestore = getFirestore(app);
