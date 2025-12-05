"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GradientText from "@/components/GradientText";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Home as HomeIcon } from "lucide-react";
import { Ticket } from "lucide-react";

import "./page.css";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  function goToDashboard() {
    if (user?.email) {
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }

  return (
    <main className="main-container bg-[#2E2B26] flex flex-col items-center justify-center min-h-screen p-4">
      <span className="text-4xl dm-serif-display-regular-italic text-[#9a6f0bff]">
        Welcome to
      </span>

      <span className="kavyansh custom-class text-[65px] md:text-[100px] text-[#9a6f0bff]">
        Kavyalok
      </span>

      <div className="flex-col md:flex md:flex-row gap-5 mt-5 space-y-5 md:space-y-0">
        <div onClick={goToDashboard} className="px-5 py-2 w-65 flex justify-center rounded-lg border-2 border-gray-500 hover:border-yellow-700 cursor-pointer transition">
          <button className="flex cursor-pointer">
            <HomeIcon />
            &nbsp;Dashboard
          </button>
        </div>
        <div onClick={() => {router.push("/competitions")}} className="px-5 py-2 w-65 flex justify-center rounded-lg border-2 border-gray-500 hover:border-yellow-700 cursor-pointer transition">
          <button className="flex cursor-pointer">
            <Ticket />
            &nbsp;Competitions and Events
          </button>
        </div>
      </div>
    </main>
  );
}
