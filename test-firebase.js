// Simple Firebase test
import { app, auth, db } from './src/firebase/firebase.js';
import { getDoc, doc } from 'firebase/firestore';

console.log('🔥 Testing Firebase configuration...');
console.log('App:', app);
console.log('Auth:', auth);
console.log('Firestore:', db);

// Test Firestore connection
async function testFirestore() {
  try {
    console.log('📡 Testing Firestore connection...');
    const testDoc = doc(db, 'test', 'connection');
    await getDoc(testDoc);
    console.log('✅ Firestore connection successful');
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
  }
}

testFirestore();
