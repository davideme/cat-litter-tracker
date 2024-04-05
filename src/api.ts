import { User } from "firebase/auth";
import { DocumentData, DocumentReference, Firestore, collection, doc, getDocs, limit, orderBy, query, setDoc, where } from "firebase/firestore";

// Household API
export type Household = { id: string; name?: string }

export async function fetchOwnedHousehold(db: Firestore, user: User): Promise<Household[]> {
    const householdsCollection = collection(db, "households");
    const querySnapshot = await getDocs(query(householdsCollection, where(`roles.${user.uid}`, "==", "owner")));
    const ownedHouseholds: { id: string; name?: string }[] = [];
    querySnapshot.forEach((doc) => {
        const householdData = doc.data();
        ownedHouseholds.push({ id: doc.id, ...householdData });
    });
    console.log("Owned households: ", ownedHouseholds);
    return ownedHouseholds;
}

export async function addHousehold(db: Firestore, household: { name: string, roles: { [userId: string]: string } }): Promise<string> {
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

// Cat API

export async function fetchCatsOfHousehold(db: Firestore, householdId: string): Promise<DocumentReference[]> {
    const catsCollection = collection(db, `households/${householdId}/cats`);
    const querySnapshot = await getDocs(catsCollection);
    const cats: DocumentReference[] = [];
    querySnapshot.forEach((doc) => {
        const catData = doc.ref;
        cats.push(catData);
    });
    console.log("Cats of household: ", cats);
    return cats;
}

export async function addCatsToHousehold(db: Firestore, householdId: string, cats: { name: string }[]): Promise<DocumentReference[]> {
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

export async function addLitterEvent(catRef: DocumentReference, event: { name: string }) {
    const currentTime = new Date().toISOString();
    const litterEventsCollection = collection(catRef, "litterEvents");
    const newLitterEventDoc = doc(litterEventsCollection);
    try {
        await setDoc(newLitterEventDoc, { name: event.name, timestamp: currentTime });
        console.log("Litter event added to Firestore");
    } catch (error) {
        console.error("Error adding litter event to Firestore: ", error);
    }
}

export async function fetchMostRecentLitterEvents(catRef: DocumentReference): Promise<{ name: string; timestamp: string }[]> {
    const litterEventsCollection = collection(catRef, "litterEvents");
    const querySnapshot = await getDocs(query(litterEventsCollection, orderBy("timestamp", "desc"), limit(1)));
    const litterEvents: { name: string; timestamp: string }[] = [];
    querySnapshot.forEach((doc) => {
        const litterEventData = doc.data();
        litterEvents.push({ name: litterEventData.name, timestamp: litterEventData.timestamp });
    });
    console.log("Most recent litter events: ", litterEvents); return litterEvents;
}