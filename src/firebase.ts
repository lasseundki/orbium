import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            "AIzaSyAzX4JJJqCP6aAnpmlkDC_wcnyLMyA50sI",
  authDomain:        "orbium-kreiswerk.firebaseapp.com",
  projectId:         "orbium-kreiswerk",
  storageBucket:     "orbium-kreiswerk.firebasestorage.app",
  messagingSenderId: "436178843932",
  appId:             "1:436178843932:web:c03a871a842369dce6e2d9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
