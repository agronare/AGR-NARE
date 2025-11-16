"use client";

import { signInWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "@/firebase";

export async function nonBlockingLogin(email: string, password: string) {
  const auth = useAuth();
  return await signInWithEmailAndPassword(auth, email, password);
}
