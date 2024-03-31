import './style.css'
// src/main.ts
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, User, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { addCatsToHousehold, addHousehold, addLitterEvent, fetchCatsOfHousehold, fetchOwnedHousehold } from './api';

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

  setupChangeLitter(
    document.querySelector<HTMLButtonElement>('#changeLitter')!,
    document.querySelector<HTMLSpanElement>('#lastChanged')!,
    document.querySelector<HTMLDivElement>('#loader')!);
  setLastChanged(document.querySelector<HTMLSpanElement>('#lastChanged')!);

  document.querySelector<HTMLButtonElement>('#addHousehold')!.addEventListener('click', async () => {
    const householdId = await addHousehold(db, { name: 'My Household', roles: { [user.uid]: 'owner' } });
    await addCatsToHousehold(db, householdId, [{ name: 'Yoda' }]);
  });

  const household = (await fetchOwnedHousehold(db, user))[0]
  fetchHouseholdName(household.name ?? 'My household');
  const cat = (await fetchCatsOfHousehold(db, household.id))[0];

  async function fetchHouseholdName(householdName: string) {
    const householdNameElement = document.querySelector<HTMLHeadingElement>('#householdName')!;
    householdNameElement.textContent = householdName;
    const addHouseholdElement = document.querySelector<HTMLButtonElement>('#addHousehold')!;
    addHouseholdElement.disabled = true;
  }


  async function setLastChanged(element: HTMLSpanElement) {
    try {
      const idToken = await user.getIdToken();
      const result = await (await fetch('https://us-central1-cat-litter-tracker-app.cloudfunctions.net/app/lastChanged', {
        headers: {
          'Authorization': 'Bearer ' + idToken
        },
      })).json();
      element.textContent = result.data.lastChanged ? new Date(result.data.lastChanged).toLocaleString() : 'Not yet changed';
    } catch (error) {
      console.error(error);
    }
  }

  function setupChangeLitter(buttonElement: HTMLButtonElement, lastChangedElement: HTMLSpanElement, loaderElement: HTMLDivElement) {
    buttonElement.addEventListener('click', async () => {
      buttonElement.disabled = true;
      loaderElement.style.display = 'block';
      try {
        await addLitterEvent(cat, { name: 'changed litter' });
        await setLastChanged(lastChangedElement);
      } catch (error) {
        console.error(error);
      } finally {
        buttonElement.disabled = false;
        loaderElement.style.display = 'none';
      }
    });
  }
}
