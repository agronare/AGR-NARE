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

type Ref = DocumentReference | CollectionReference | string;

function isCollectionReference(x: any): x is CollectionReference {
  return x && typeof x === 'object' && typeof x.path === 'string' && typeof (x as any).doc === 'function' && typeof (x as any).withConverter === 'function';
}

function isDocumentReference(x: any): x is DocumentReference {
  return x && typeof x === 'object' && typeof x.path === 'string' && typeof (x as any).id === 'string' && typeof (x as any).withConverter === 'function' && typeof (x as any).parent === 'object';
}

/** Normaliza string → DocumentReference */
function toDocRef(firestore: Firestore, ref: Ref): DocumentReference {
  if (typeof ref === 'string') return doc(firestore, ref);
  if (isDocumentReference(ref)) return ref as DocumentReference;
  // If a CollectionReference was passed where a DocumentReference is required, throw a clear error.
  throw new Error('Expected a DocumentReference or path string for document operations.');
}

/** Normaliza string → CollectionReference */
function toColRef(firestore: Firestore, ref: Ref): CollectionReference {
  if (typeof ref === 'string') return collection(firestore, ref);
  if (isCollectionReference(ref)) return ref as CollectionReference;
  // If a DocumentReference was passed where a CollectionReference is required, throw a clear error.
  throw new Error('Expected a CollectionReference or path string for collection operations.');
}

/* ============================================================
   🚀 API segura SIN HOOKS: se debe pasar el firestore manualmente
   ============================================================ */

/** ADD */
export async function addDocumentNonBlocking(...args: any[]) {
  // Supports two call signatures:
  // 1) addDocumentNonBlocking(firestore, refOrPath, data)
  // 2) addDocumentNonBlocking(collectionRef, data)
  try {
    if (args.length === 2) {
      const [colRef, data] = args as [CollectionReference, any];
      const promise = addDoc(colRef, data).catch((error) => {
        /* silent here; upstream non-blocking error emitter file handles emission */
      });
      return promise;
    }

    const [firestore, ref, data] = args as [Firestore, Ref, any];
    const col = toColRef(firestore, ref);
    return addDoc(col, data);
  } catch (err) {
    // Re-throw to surface programming errors (wrong ref types)
    throw err;
  }
}

/** SET */
export async function setDocumentNonBlocking(...args: any[]) {
  // Supports two signatures:
  // 1) setDocumentNonBlocking(firestore, refOrPath, data, options?)
  // 2) setDocumentNonBlocking(docRef, data, options?)
  if (args.length >= 2 && args.length <= 4) {
    if (args.length === 2 || (args.length === 3 && isDocumentReference(args[0]))) {
      // signature: (docRef, data, options?)
      const [docRef, data, options] = args as [DocumentReference, any, SetOptions | undefined];
      return setDoc(docRef, data, options || {});
    }

    // signature: (firestore, refOrPath, data, options?)
    const [firestore, ref, data, options] = args as [Firestore, Ref, any, SetOptions | undefined];
    const docRef = toDocRef(firestore, ref);
    return setDoc(docRef, data, options ?? {});
  }

  throw new Error('Invalid arguments for setDocumentNonBlocking');
}

/** UPDATE */
export async function updateDocumentNonBlocking(...args: any[]) {
  // Supports (docRef, data) or (firestore, refOrPath, data)
  if (args.length === 2 && isDocumentReference(args[0])) {
    const [docRef, data] = args as [DocumentReference, any];
    return updateDoc(docRef, data);
  }

  if (args.length === 3) {
    const [firestore, ref, data] = args as [Firestore, Ref, any];
    const docRef = toDocRef(firestore, ref);
    return updateDoc(docRef, data);
  }

  throw new Error('Invalid arguments for updateDocumentNonBlocking');
}

/** DELETE */
export async function deleteDocumentNonBlocking(...args: any[]) {
  // Supports (docRef) or (firestore, refOrPath)
  if (args.length === 1 && isDocumentReference(args[0])) {
    const [docRef] = args as [DocumentReference];
    return deleteDoc(docRef);
  }

  if (args.length === 2) {
    const [firestore, ref] = args as [Firestore, Ref];
    const docRef = toDocRef(firestore, ref);
    return deleteDoc(docRef);
  }

  throw new Error('Invalid arguments for deleteDocumentNonBlocking');
}
