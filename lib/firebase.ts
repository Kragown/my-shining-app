import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined;
let auth: ReturnType<typeof getAuth> | null = null;

if (
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    if (Platform.OS === "web") {
      auth = getAuth(app);
    } else {
      const { initializeAuth, getReactNativePersistence } = require("firebase/auth");
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    }
  } else {
    app = getApps()[0] as FirebaseApp;
    auth = getAuth(app);
  }
}

export { app, auth };
const firestoreDatabaseId = process.env.EXPO_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID;
export const db = app
  ? firestoreDatabaseId
    ? getFirestore(app, firestoreDatabaseId)
    : getFirestore(app)
  : null;
