"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, Query, FirestoreError } from "firebase/firestore";
import { useFirestore } from "@/firebase";

export function useCollection(pathOrQuery: string | Query) {
  const firestore = useFirestore();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    const ref =
      typeof pathOrQuery === "string"
        ? collection(firestore, pathOrQuery)
        : pathOrQuery;

    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setData(results);
        setLoading(false);
      },
      (err) => {
        console.error("useCollection error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, pathOrQuery]);

  return { data, loading, error };
}
