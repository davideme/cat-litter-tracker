/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import express from 'express';
import admin from 'firebase-admin';

admin.initializeApp();

const app = express();
const db = admin.firestore();

app.use(express.json());

app.get('/lastChanged', async (req: express.Request, res: express.Response) => {
  const snapshot = await db.collection('litterChanges').doc('lastChange').get();
  res.json({ lastChanged: snapshot.data()?.date || null });
});

app.post('/changeLitter', async (req: express.Request, res: express.Response) => {
  const lastChanged: Date = new Date();
  await db.collection('litterChanges').doc('lastChange').set({ date: lastChanged });
  res.json({ success: true, lastChanged });
});

exports.app = functions.https.onRequest(app);
