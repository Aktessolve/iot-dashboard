import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcvkAPLKiCdPra2tnkjwXD4MgsvJZmo1E",
  authDomain: "iotipcc-482110.firebaseapp.com",
  projectId: "iotipcc-482110"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
