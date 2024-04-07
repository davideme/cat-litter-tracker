import {
  DocumentData,
  DocumentReference,
  Firestore,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

// Household API
export type Household = { id: string; name?: string };

export async function fetchOwnedHousehold(
  db: Firestore,
  userId: string
): Promise<Household[]> {
  const householdsCollection = collection(db, "households");
  const querySnapshot = await getDocs(
    query(householdsCollection, where(`roles.${userId}`, "==", "owner"))
  );
  const ownedHouseholds: { id: string; name?: string }[] = [];
  querySnapshot.forEach((doc) => {
    const householdData = doc.data();
    ownedHouseholds.push({ id: doc.id, ...householdData });
  });
  console.log("Owned households: ", ownedHouseholds);
  return ownedHouseholds;
}

export async function addHousehold(
  db: Firestore,
  household: { name: string; roles: { [userId: string]: string } }
): Promise<string> {
  const householdsCollection = collection(db, "households");
  const newHouseholdDoc = doc(householdsCollection);
  try {
    await setDoc(newHouseholdDoc, household);
    console.log("Household added to Firestore");
  } catch (error) {
    console.error("Error adding household to Firestore: ", error);
  }
  return newHouseholdDoc.id;
}

export async function updateHousehold(
  db: Firestore,
  householdId: string,
  household: { name: string }
): Promise<void> {
  const householdDoc = doc(db, `households/${householdId}`);
  return await updateDoc(householdDoc, {
    name: household.name,
  });
}

// Cat API

export type Cat = { id: string; name?: string };

export async function fetchCatsOfHousehold(
  db: Firestore,
  householdId: string
): Promise<Cat[]> {
  const catsCollection = collection(db, `households/${householdId}/cats`);
  const querySnapshot = await getDocs(catsCollection);
  const cats: Cat[] = [];
  querySnapshot.forEach((doc) => {
    cats.push({ id: doc.id, ...doc.data() });
  });
  return cats;
}

export async function addCatsToHousehold(
  db: Firestore,
  householdId: string,
  cats: { name: string }[]
): Promise<DocumentReference[]> {
  const catsCollection = collection(db, `households/${householdId}/cats`);
  const newCatDocs: DocumentReference<DocumentData, DocumentData>[] = [];
  for (const cat of cats) {
    const newCatDoc = doc(catsCollection);
    try {
      await setDoc(newCatDoc, cat);
      newCatDocs.push(newCatDoc);
      console.log("Cat added to Firestore");
    } catch (error) {
      console.error("Error adding cat to Firestore: ", error);
    }
  }
  return newCatDocs;
}

// Litter API

export async function addLitterEvent(
  db: Firestore,
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
  try {
    await setDoc(newLitterEventDoc, {
      name: event.name,
      timestamp: currentTime,
    });
    console.log("Litter event added to Firestore");
  } catch (error) {
    console.error("Error adding litter event to Firestore: ", error);
  }
}

export async function fetchMostRecentLitterEvents(
  db: Firestore,
  householdId: string,
  catId: string
): Promise<{ name: string; timestamp: string }[]> {
  const litterEventsCollection = collection(
    db,
    `households/${householdId}/cats/${catId}/litterEvents`
  );
  const querySnapshot = await getDocs(
    query(litterEventsCollection, orderBy("timestamp", "desc"), limit(1))
  );
  const litterEvents: { name: string; timestamp: string }[] = [];
  querySnapshot.forEach((doc) => {
    const litterEventData = doc.data();
    litterEvents.push({
      name: litterEventData.name,
      timestamp: litterEventData.timestamp,
    });
  });
  console.log("Most recent litter events: ", litterEvents);
  return litterEvents;
}
