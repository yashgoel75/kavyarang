"use client";

import { Home, Bookmark, Bell, User, Settings } from "lucide-react";
import { useState, useEffect } from "react";

export default function Navigation() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (window.innerWidth <= 768) {
      setIsMobile(true);
    } else {
      setIsMobile(false);
    }
  });
  return (
    <>
      <div className="absolute w-full flex justify-center bottom-7">
        <div className="flex py-3 z-90 gap-7 border-1 border-gray-300 shadow-lg rounded-full px-7">
          <Home
            size={isMobile ? 25 : 30}
            className="cursor-pointer hover:scale-125 transition"
          />
          <Bookmark
            size={isMobile ? 25 : 30}
            className="cursor-pointer hover:scale-125 transition"
          />
          {/* <div className="relative inline-block">
            <Bell
              size={isMobile ? 25 : 30}
              className="cursor-pointer hover:scale-125 transition"
            />
            <span className="absolute -top-1 -right-2 flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-full bg-amber-500"></span>
            </span>
          </div> */}
          <Settings
            size={isMobile ? 25 : 30}
            className="cursor-pointer hover:scale-125 transition"
          />

          <User
            size={isMobile ? 25 : 30}
            className="cursor-pointer hover:scale-125 transition"
          />
        </div>
      </div>
    </>
  );
}
