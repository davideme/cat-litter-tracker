/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import express from "express";
import admin from "firebase-admin";
import cors from "cors";
import {
  ChangeLitterResponse,
  LastChangedResponse,
} from "../../shared/functions";
import { Timestamp } from "firebase-admin/firestore";

admin.initializeApp();

const app = express();

// Apply CORS middleware to the express app
app.use(cors({ origin: true }));

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

const db = admin.firestore();

app.get("/lastChanged", async (
  req: express.Request,
  res: express.Response<{ data: LastChangedResponse }>) => {
  const snapshot = await db.collection("litterChanges").doc("lastChange").get();
  const lastChangedTimestamp: Timestamp = snapshot.data()?.date || null;
  const lastChangedDate = lastChangedTimestamp?.toDate() || null;

  const response: LastChangedResponse = {
    lastChanged: lastChangedDate,
  };
  res.json({ data: response });
});

app.post("/changeLitter", async (
  req: express.Request,
  res: express.Response<{ data: ChangeLitterResponse | string }>) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1] || "";
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    console.log(`User ${userId} has changed the litter`);
    const lastChanged: Date = new Date();

    // Update the last litter change for each cat in the household
    const cats = req.body.cats; // Assuming the request body contains an array of cat IDs
    for (const catId of cats) {
      await db.collection("litterChanges")
        .doc(catId)
        .set({ date: lastChanged });
    }

    const response: ChangeLitterResponse = {
      success: true,
      lastChanged,
    };
    res.json({ data: response });
  } catch (error) {
    res.status(401).send({ data: "Unauthorized" });
  }
});

exports.app = functions.https.onRequest(app);
