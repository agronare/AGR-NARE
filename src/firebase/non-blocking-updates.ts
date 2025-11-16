"use client";

import {
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  addDoc,
  collection,
  DocumentReference,
  Firestore,
  CollectionReference,
  SetOptions
} from "firebase/firestore";

type Ref = DocumentReference | string;

/** Normaliza string → DocumentReference */
function toDocRef(firestore: Firestore, ref: Ref): DocumentReference {
  return typeof ref === "string"
    ? doc(firestore, ref)
    : ref;
}

/** Normaliza string → CollectionReference */
function toColRef(firestore: Firestore, ref: Ref): CollectionReference {
  return typeof ref === "string"
    ? collection(firestore, ref)
    : (ref as any);
}

/* ============================================================
   🚀 API segura SIN HOOKS: se debe pasar el firestore manualmente
   ============================================================ */

/** ADD */
export async function addDocumentNonBlocking(
  firestore: Firestore,
  ref: Ref,
  data: any
) {
  const col = toColRef(firestore, ref);
  return addDoc(col, data);
}

/** SET */
export async function setDocumentNonBlocking(
  firestore: Firestore,
  ref: Ref,
  data: any,
  options?: SetOptions
) {
  const docRef = toDocRef(firestore, ref);
  return setDoc(docRef, data, options ?? {});
}

/** UPDATE */
export async function updateDocumentNonBlocking(
  firestore: Firestore,
  ref: Ref,
  data: any
) {
  const docRef = toDocRef(firestore, ref);
  return updateDoc(docRef, data);
}

/** DELETE */
export async function deleteDocumentNonBlocking(
  firestore: Firestore,
  ref: Ref
) {
  const docRef = toDocRef(firestore, ref);
  return deleteDoc(docRef);
}
