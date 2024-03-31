import './style.css'
// src/main.ts
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, User, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, DocumentReference } from "firebase/firestore";
import { addCatsToHousehold, addHousehold, addLitterEvent, fetchCatsOfHousehold, fetchMostRecentLitterEvents, fetchOwnedHousehold } from './api';

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, '127.0.0.1', 8080);

setPersistence(auth, browserLocalPersistence);

onAuthStateChanged(auth, (user: User | null) => {
  if (!user) {
    onUserSignedOut();
  } else {
    onUserSignedIn(user);
  }
});

function onUserSignedOut() {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <h1>Cat Litter Tracker</h1>
    <div id="firebaseui-auth-container"></div>
  `;

  // Initialize the FirebaseUI Widget using Firebase.
  var ui = new firebaseui.auth.AuthUI(auth);
  ui.start('#firebaseui-auth-container', {
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    ],
    signInSuccessUrl: '/',
  });
}


async function onUserSignedIn(user: User) {
  console.log(user);
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <h1>Cat Litter Tracker</h1>
    <h2 id="householdName"></h2>
    <button id="changeLitter">Change Litter</button>
    <button id="addHousehold">Add Household</button>
    <div id="loader" style="display: none;">Loading...</div>
    <p>Last changed: <span id="lastChanged">Not yet changed</span></p>
  `;

  const household = (await fetchOwnedHousehold(db, user))[0]
  fetchHouseholdName(household.name ?? 'My household');
  const cat = (await fetchCatsOfHousehold(db, household.id))[0];

  setupChangeLitter(
    document.querySelector<HTMLButtonElement>('#changeLitter')!,
    document.querySelector<HTMLSpanElement>('#lastChanged')!,
    document.querySelector<HTMLDivElement>('#loader')!);
  setLastChanged(cat, document.querySelector<HTMLSpanElement>('#lastChanged')!);

  document.querySelector<HTMLButtonElement>('#addHousehold')!.addEventListener('click', async () => {
    const householdId = await addHousehold(db, { name: 'My Household', roles: { [user.uid]: 'owner' } });
    await addCatsToHousehold(db, householdId, [{ name: 'Yoda' }]);
  });

  async function fetchHouseholdName(householdName: string) {
    const householdNameElement = document.querySelector<HTMLHeadingElement>('#householdName')!;
    householdNameElement.textContent = householdName;
    const addHouseholdElement = document.querySelector<HTMLButtonElement>('#addHousehold')!;
    addHouseholdElement.disabled = true;
  }


  async function setLastChanged(cat: DocumentReference, element: HTMLSpanElement) {
      const litterEvent = (await fetchMostRecentLitterEvents(cat))[0];
      element.textContent = litterEvent.timestamp ? new Date(litterEvent.timestamp).toLocaleString() : 'Not yet changed';
  }

  function setupChangeLitter(buttonElement: HTMLButtonElement, lastChangedElement: HTMLSpanElement, loaderElement: HTMLDivElement) {
    buttonElement.addEventListener('click', async () => {
      buttonElement.disabled = true;
      loaderElement.style.display = 'block';
      try {
        await addLitterEvent(cat, { name: 'changed litter' });
        await setLastChanged(cat, lastChangedElement);
      } catch (error) {
        console.error(error);
      } finally {
        buttonElement.disabled = false;
        loaderElement.style.display = 'none';
      }
    });
  }
}
