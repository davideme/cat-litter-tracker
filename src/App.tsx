import './App.css'
// import './style.css'
// src/main.ts
import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";
import firebase from "firebase/compat/app";
import * as firebaseui from "firebaseui";
import { getAuth, setPersistence, browserLocalPersistence, User, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, DocumentReference } from "firebase/firestore";
import { Household, addCatsToHousehold, addHousehold, addLitterEvent, fetchCatsOfHousehold, fetchMostRecentLitterEvents, fetchOwnedHousehold } from './api';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from 'react';

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, '127.0.0.1', 8080);

setPersistence(auth, browserLocalPersistence);

function App() {
  return (
    <>
      <h1>Cat Litter Tracker</h1>
      <div className="card">
        <CurrentUser />
      </div>
    </>
  )
}

export default App;


const CurrentUser = () => {
  const [user, loading, error] = useAuthState(auth);
  const [cat, setCat] = useState<DocumentReference>();
  const [litterEvent, setLitterEvent] = useState<{ name: string; timestamp: string }>();
  const [household, setHousehold] = useState<Household>();

  useEffect(() => {
    if (user || loading) {
      return;
    }
    // Initialize the FirebaseUI Widget using Firebase.
    var ui = new firebaseui.auth.AuthUI(auth);
    ui.start('#firebaseui-auth-container', {
      signInOptions: [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      ],
      signInSuccessUrl: '/',
    });
  }, [user, loading]);
  useEffect(() => {
    (async () => {
      await loadHousehold();
    })();
  }, [user]);

  async function loadHousehold() {
    if (!user || loading) {
      return;
    }
    const household = (await fetchOwnedHousehold(db, user))[0];
    setHousehold(household);
    if (household) {
      const cat = (await fetchCatsOfHousehold(db, household.id))[0];
      setCat(cat);
      const litterEvent = (await fetchMostRecentLitterEvents(cat))[0];
      setLitterEvent(litterEvent);
    }
  }

  if (loading) {
    return (
      <div>
        <p>Initialising User...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
      </div>
    );
  }
  if (user) {
    return <UserDashboard user={user} cat={cat} litterEvent={litterEvent} household={household} loadHousehold={loadHousehold} />;
  } else {
    return <UserSignedOut />;
  }
};


function UserSignedOut() {
  return (
    <div id="firebaseui-auth-container"></div>
  )
}

function UserDashboard({ user, cat, litterEvent, household, loadHousehold }: { user: User, cat?: DocumentReference, litterEvent?: { name: string; timestamp: string }, household?: Household, loadHousehold: () => Promise<void> }) {
  const [isLoadingAddHousehold, setIsLoadingAddHousehold] = useState(false);
  const onClickAddHousehold = async () => {
    setIsLoadingAddHousehold(true);
    const householdId = await addHousehold(db, { name: 'My Household', roles: { [user.uid]: 'owner' } });
    await addCatsToHousehold(db, householdId, [{ name: 'Yoda' }]);
    await loadHousehold();
    setIsLoadingAddHousehold(false);
  };

  const [isLoadingChangeLitter, setIsLoadingChangeLitter] = useState(false);
  async function onClickChangeLitter() {
    setIsLoadingChangeLitter(true);
    try {
      if (cat) {
        await addLitterEvent(cat, { name: 'changed litter' });
        await loadHousehold();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingChangeLitter(false);
    }
  }

  return (
    <>
      <h2 id="householdName">{household ? household.name : 'My household'}</h2>
      <button id="addHousehold" onClick={onClickAddHousehold} disabled={household != undefined || isLoadingAddHousehold}>Add Household</button>
      <button id="changeLitter" onClick={onClickChangeLitter} disabled={isLoadingChangeLitter}>Change Litter</button>
      <div id="loader" style={{ display: isLoadingAddHousehold || isLoadingChangeLitter ? 'block' : 'none' }} >Loading...</div>
      <p>Last changed: <span id="lastChanged">{litterEvent?.timestamp ? new Date(litterEvent.timestamp).toLocaleString() : "Not yet changed"}</span></p>
    </>
  );
}
