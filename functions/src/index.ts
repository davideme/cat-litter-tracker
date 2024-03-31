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

admin.initializeApp();

const app = express();

// Apply CORS middleware to the express app
app.use(cors({ origin: true }));

// Handle preflight requests
app.options("*", cors());

app.use(express.json());

exports.app = functions.https.onRequest(app);
