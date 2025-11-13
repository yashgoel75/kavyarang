"use client";

import GradientText from "../GradientText";
import { Search, LogOut, User as UserIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) fetchUserName(user.email);
    });
    return () => unsubscribe();
  }, []);

  const fetchUserName = async (email: string) => {
    try {
      const response = await fetch(
        `/api/user?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch user name");
      if (data?.name) setDisplayName(data.name);
    } catch (err) {
      console.error("Error fetching user name:", err);
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
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim() === "") return;
    router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.querySelector(".menu-dropdown");
      const icon = document.querySelector(".user-icon-btn");
      if (
        menu &&
        !menu.contains(e.target as Node) &&
        icon &&
        !icon.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const renderSearch = () => (
    <>
      <Search color="gray" size={20} />
      <input
        className="mx-3 h-full w-full focus:outline-none bg-transparent"
        placeholder="Search stories, authors, or topics..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
    </>
  );

  return (
    <>
      <div className="top-0 w-full flex justify-between items-center px-5 mt-2 md:mt-0 z-20 bg-white">
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
          Kavyalok
        </GradientText>

        <div className="flex items-center gap-3 md:gap-4">
          {isMobile ? (
            <button
              className="cursor-pointer hover:bg-gray-100 p-1 rounded-md transition active:scale-95"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search size={22} />
            </button>
          ) : (
            <div className="flex items-center bg-gray-100 border border-gray-300 px-3 rounded-xl h-[40px] w-[500px]">
              {renderSearch()}
            </div>
          )}

          <div className="relative">
            {user ? (
              <>
                <button
                  className="user-icon-btn p-1 rounded-full hover:bg-gray-100 cursor-pointer transition active:scale-95"
                  onClick={() => setIsOpen((prev) => !prev)}
                >
                  <UserIcon size={25} strokeWidth={1.75} />
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg z-50 menu-dropdown">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="font-semibold">{displayName || "User"}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-2 h-[40px]">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="flex items-center rounded-lg bg-gradient-to-br from-[#9a6f0bff] to-[#dbb56aff] text-white px-4 text-sm py-1 cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push("/auth/register")}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobile && isSearchOpen && (
        <div className="flex items-center bg-gray-100 border md:hidden my-2 border-gray-300 px-3 rounded-md h-[35px] mx-5">
          {renderSearch()}
        </div>
      )}

      <div className="border-1 border-gray-200 mt-2"></div>
    </>
  );
}
