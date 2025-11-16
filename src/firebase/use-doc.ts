"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, FirestoreError } from "firebase/firestore";
import { useFirestore } from "@/firebase";

export function useDoc(path: string) {
  const firestore = useFirestore();

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    const ref = doc(firestore, path);

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
        setLoading(false);
      },
      (err) => {
        console.error("useDoc error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, loading, error };
}
