"use client";

import { Home, Bookmark, User, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Navigation() {
  const [isMobile, setIsMobile] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    const footer = document.getElementById("app-footer");
    if (footer) {
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          setIsFooterVisible(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );

      observer.observe(footer);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  const icons = [
    { name: Home, url: "dashboard" },
    { name: Bookmark, url: "bookmark" },
    { name: Settings, url: "settings" },
    { name: User, url: "account" },
  ];

  return (
    <>
      <div
        className={`fixed bottom-6 left-0 w-full flex justify-center transition-all duration-300 ease-in-out z-1000 ${
          isFooterVisible
            ? "opacity-0 pointer-events-none translate-y-5"
            : "opacity-100 translate-y-0"
        }`}
      >
        <div className="flex py-3 gap-7 bg-white border border-gray-300 shadow-lg rounded-full px-7">
          {icons.map((Icon, indx) => (
            <Link key={indx} href={`/${Icon.url}`}>
              <Icon.name
                size={isMobile ? 25 : 30}
                className="cursor-pointer hover:scale-125 transition"
              />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
