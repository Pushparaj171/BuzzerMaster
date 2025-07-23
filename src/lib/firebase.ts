'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  projectId: 'buzzmaster-6g7xs',
  appId: '1:835983360831:web:ed099fa60e02f4c1e9098a',
  storageBucket: 'buzzmaster-6g7xs.firebasestorage.app',
  apiKey: 'AIzaSyAtJrsfuLTYIJOzH0aZcuLqljVH2kq-bUw',
  authDomain: 'buzzmaster-6g7xs.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '835983360831',
  databaseURL: 'https://buzzmaster-6g7xs-default-rtdb.firebaseio.com',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const database = getDatabase(app);

export { app, database };
