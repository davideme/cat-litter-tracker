import './style.css'
// src/main.ts
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";
import { getFunctions } from "firebase/functions";
import { httpsCallable } from "firebase/functions";
import {ChangeLitterData, ChangeLitterResponse} from "../shared/functions";

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const functions = getFunctions(app);
const changeLitter = httpsCallable<ChangeLitterData, ChangeLitterResponse>(functions, 'app/changeLitter');

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <h1>Cat Litter Tracker</h1>
  <button id="changeLitter">Change Litter</button>
  <p>Last changed: <span id="lastChanged">Not yet changed</span></p>
`

setupChangeLitter(
  document.querySelector<HTMLButtonElement>('#changeLitter')!, 
  document.querySelector<HTMLSpanElement>('#lastChanged')!)

async function setLastChanged(element: HTMLSpanElement) {
  const result = await (await fetch('https://us-central1-cat-litter-tracker-app.cloudfunctions.net/app/lastChanged')).json();
  element.textContent = result.data.lastChanged ? new Date(result.data.lastChanged).toLocaleString() : 'Not yet changed';
}

function setupChangeLitter(element: HTMLButtonElement, lastChangedElement: HTMLSpanElement) {  
  element.addEventListener('click', async () => {
    await changeLitter();
    await setLastChanged(lastChangedElement);
  })
}