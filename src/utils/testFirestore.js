/**
 * Firestore Connection Test Utility
 *
 * Use this to diagnose Firestore connection issues
 * Run in browser console: testFirestoreConnection()
 */

import { db } from "@/config/firebase";
import { collection, getDocs, addDoc, doc, setDoc } from "firebase/firestore";

export async function testFirestoreConnection() {
  console.log("🧪 Testing Firestore connection...");

  try {
    // Test 1: Read from users collection
    console.log("Test 1: Reading from 'users' collection...");
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);
    console.log("✅ Read successful! Found", snapshot.size, "users");

    // Test 2: Write to test collection
    console.log("Test 2: Writing to 'test' collection...");
    const testRef = collection(db, "test");
    await addDoc(testRef, {
      timestamp: new Date().toISOString(),
      message: "Connection test",
    });
    console.log("✅ Write successful!");

    // Test 3: Check if we can query by email
    console.log("Test 3: Testing email query...");
    const { query, where } = await import("firebase/firestore");
    const emailQuery = query(usersRef, where("email", "==", "test@test.com"));
    const emailSnapshot = await getDocs(emailQuery);
    console.log(
      "✅ Email query successful! (This would need an index in production)"
    );

    console.log("🎉 All tests passed! Firestore is working correctly.");
    return { success: true, message: "All tests passed" };
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    if (error.code === "permission-denied") {
      console.error("🔴 ISSUE: Firestore rules are blocking access.");
      console.error(
        "Fix: Deploy rules with: firebase deploy --only firestore:rules"
      );
    } else if (
      error.code === "unavailable" ||
      error.code === "failed-precondition"
    ) {
      console.error("🔴 ISSUE: Cannot connect to Firestore.");
      console.error("Fix: Check if Firestore is enabled in Firebase Console");
    } else if (error.message?.includes("index")) {
      console.error("🔴 ISSUE: Missing Firestore index.");
      console.error("Fix: Create index on 'users.email' in Firebase Console");
    }

    return { success: false, error: error.message, code: error.code };
  }
}

// Make it available globally for easy testing
if (typeof window !== "undefined") {
  window.testFirestoreConnection = testFirestoreConnection;
}
