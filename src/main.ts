import './style.css'
// src/main.ts
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";
import { getFunctions } from "firebase/functions";
import { httpsCallable } from "firebase/functions";
import { ChangeLitterData, ChangeLitterResponse } from "../shared/functions";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence, User } from "firebase/auth";

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const functions = getFunctions(app);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);
const changeLitter = httpsCallable<ChangeLitterData, ChangeLitterResponse>(functions, 'app/changeLitter');

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


function onUserSignedIn(user: User) {
  console.log(user);
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <h1>Cat Litter Tracker</h1>
    <button id="changeLitter">Change Litter</button>
    <div id="loader" style="display: none;">Loading...</div>
    <p>Last changed: <span id="lastChanged">Not yet changed</span></p>
  `;

  setupChangeLitter(
    document.querySelector<HTMLButtonElement>('#changeLitter')!,
    document.querySelector<HTMLSpanElement>('#lastChanged')!,
    document.querySelector<HTMLDivElement>('#loader')!);

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
        await changeLitter();
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
