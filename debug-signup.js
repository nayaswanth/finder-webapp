// Debug script to test Firebase services
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBk7mlUbypMT4rsq4gLquiBSCdVyIEGiB8",
  authDomain: "finder-webapp.firebaseapp.com",
  databaseURL: "https://finder-webapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "finder-webapp",
  storageBucket: "finder-webapp.firebasestorage.app",
  messagingSenderId: "944048700192",
  appId: "1:944048700192:web:e7a686da117c216404b545"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testSignupFlow() {
  console.log('🧪 Testing signup flow...');
  
  const testEmail = `test${Date.now()}@debug.com`;
  const testPassword = 'testpass123';
  
  try {
    console.log('1️⃣ Creating user with Firebase Auth...');
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    console.log('✅ Auth user created:', user.uid);
    
    console.log('2️⃣ Creating employee record in Firestore...');
    const employeeData = {
      name: 'Debug Test User',
      email: user.email,
      industry: 'Technology Media Telecom',
      domain: 'Innovation Product Strategy',
      role: 'Senior Manager',
      uid: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const employeesRef = collection(db, 'employees');
    const docRef = await addDoc(employeesRef, employeeData);
    console.log('✅ Employee created with ID:', docRef.id);
    
    console.log('🎉 Test completed successfully!');
    return { success: true, userId: user.uid, employeeId: docRef.id };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run test
testSignupFlow().then(result => {
  console.log('📊 Final result:', result);
}).catch(console.error);
