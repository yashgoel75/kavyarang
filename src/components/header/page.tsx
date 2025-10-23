"use client";

import GradientText from "../GradientText";
import { Search, User as UserIcon, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) fetchUserName(user.email);
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

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      setUser(null);
      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
      } else {
        setIsMobile(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      <div className="flex justify-between items-center px-5 mt-2 md:mt-0">
        <GradientText
          colors={[
            "#9a6f0bff",
            "#bd9864ff",
            "#dbb56aff",
            "#7f7464ff",
            "#e9e99dff",
          ]}
          animationSpeed={5}
          showBorder={false}
          className="custom-class text-[35px] md:text-[65px] ml-1"
        >
          kavyansh
        </GradientText>
        <div className="mr-5 md:hidden">
          <Search></Search>
        </div>
        <div className="flex items-center bg-gray-100 border-1 hidden md:flex md:w-[500px] border-gray-300 px-3 focus:outline-none rounded-md md:rounded-xl h-[30px] md:h-[40px] mx-5">
          <Search color="gray" />
          <input
            className="text-lg mx-3 h-full w-full focus:outline-none"
            placeholder="Search stories, authors, or topics..."
          ></input>
        </div>
        <div>
          {user ? (
            <div className="flex gap-2">
              <UserIcon />
              <button className="text-lg cursor-pointer" onClick={() => handleLogout()}>Logout</button>
            </div>
          ) : isMobile ? (
            <Menu />
          ) : (
            <div className="flex gap-2 h-[40px]">
              <button
                onClick={() => router.push("/auth/login")}
                className="flex items-center rounded-lg bg-gradient-to-br from-[#9a6f0bff] to-[#dbb56aff] text-white px-5 text-lg py-1 cursor-pointer"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/auth/register")}
                className="px-3 py-1 border border-gray-300 rounded-lg flex items-center text-lg cursor-pointer"
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
