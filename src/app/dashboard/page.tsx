"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import { useState, useEffect } from "react";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) {
        fetchUserName(user.email);
      } else {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserName = async (email: string) => {
    try {
      // const token = await getFirebaseToken();
      const response = await fetch(
        `/api/user?email=${encodeURIComponent(email)}`,
        {
          headers: {
            // Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch user name");
      setDisplayName(data.name);
      console.log("Fetched user name:", data.name);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <div className="relative flex items-center justify-center">
        My name is {displayName}
      </div>
      <Navigation />
    </>
  );
}
