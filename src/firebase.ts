import { initializeApp } from "firebase/app";
import firebaseConfig from "./firebaseConfig";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator,
} from "firebase/auth";
import { connectFirestoreEmulator } from "firebase/firestore";
import { QueryClient } from "@tanstack/react-query";

const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const queryClient = new QueryClient();

connectAuthEmulator(auth, "http://127.0.0.1:9099");
connectFirestoreEmulator(db, "127.0.0.1", 8080);

setPersistence(auth, browserLocalPersistence);
