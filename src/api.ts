import {
  DocumentData,
  DocumentReference,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

type Ref = { id: string };

// Household API
export type Household = { name?: string };

export async function fetchOwnedHousehold(
  userId: string
): Promise<(Ref & Household)[]> {
  const householdsCollection = collection(db, "households");
  const querySnapshot = await getDocs(
    query(householdsCollection, where(`roles.${userId}`, "==", "owner"))
  );
  const ownedHouseholds: (Ref & Household)[] = [];
  querySnapshot.forEach((doc) => {
    ownedHouseholds.push({ id: doc.id, ...doc.data() });
  });
  console.log("Owned households: ", ownedHouseholds);
  return ownedHouseholds;
}

export async function addHousehold(
  householdWithRoles: Household & {
    roles: { [userId: string]: string };
  }
): Promise<string> {
  const householdsCollection = collection(db, "households");
  const newHouseholdDoc = doc(householdsCollection);
  await setDoc(newHouseholdDoc, householdWithRoles);
  return newHouseholdDoc.id;
}

export async function updateHousehold(
  householdId: string,
  household: { name: string }
): Promise<void> {
  const householdDoc = doc(db, `households/${householdId}`);
  return await updateDoc(householdDoc, {
    name: household.name,
  });
}

// Cat API

export type Cat = { name?: string };

export async function fetchCatsOfHousehold(
  householdId: string
): Promise<(Ref & Cat)[]> {
  const catsCollection = collection(db, `households/${householdId}/cats`);
  const querySnapshot = await getDocs(catsCollection);
  const cats: (Ref & Cat)[] = [];
  querySnapshot.forEach((doc) => {
    cats.push({ id: doc.id, ...doc.data() });
  });
  return cats;
}

export async function addCatsToHousehold(
  householdId: string,
  cats: Cat[]
): Promise<DocumentReference[]> {
  const catsCollection = collection(db, `households/${householdId}/cats`);
  const newCatDocs: DocumentReference<DocumentData, DocumentData>[] = [];
  for (const cat of cats) {
    const newCatDoc = doc(catsCollection);
    await setDoc(newCatDoc, cat);
    newCatDocs.push(newCatDoc);
  }
  return newCatDocs;
}

export async function updateCat(
  householdId: string,
  catId: string,
  cat: { name: string }
): Promise<void> {
  const householdDoc = doc(db, `households/${householdId}/cats/${catId}`);
  return await updateDoc(householdDoc, {
    name: cat.name,
  });
}

// Litter API

export async function addLitterEvent(
  householdId: string,
  catId: string,
  event: { name: string }
) {
  const currentTime = new Date().toISOString();
  const litterEventsCollection = collection(
    db,
    `households/${householdId}/cats/${catId}/litterEvents`
  );
  const newLitterEventDoc = doc(litterEventsCollection);
  return await setDoc(newLitterEventDoc, {
    name: event.name,
    timestamp: currentTime,
  });
}

export type LitterEvent = { id: string; name?: string; timestamp?: string };

export async function fetchMostRecentLitterEvents(
  householdId: string,
  catId: string
): Promise<LitterEvent[]> {
  const litterEventsCollection = collection(
    db,
    `households/${householdId}/cats/${catId}/litterEvents`
  );
  const querySnapshot = await getDocs(
    query(litterEventsCollection, orderBy("timestamp", "desc"))
  );
  const litterEvents: LitterEvent[] = [];
  querySnapshot.forEach((doc) => {
    litterEvents.push({ id: doc.id, ...doc.data() });
  });
  return litterEvents;
}
