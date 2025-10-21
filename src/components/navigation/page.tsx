"use client";

import { Home, Bookmark, Bell, User, Settings, Icon } from "lucide-react";
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

  const icons = [Home, Bookmark, Settings, User];

function renderIcons() {
  return (
    <div className="flex py-3 z-90 gap-7 border-1 border-gray-300 shadow-lg rounded-full px-7">
      {icons.map((Icon, indx) => {
        return (
          <Icon key={indx} size={isMobile ? 25 : 30} className="cursor-pointer hover:scale-125 transition" />
        );
      })}
    </div>
  );
}
  return (
    <>
      <div className="absolute w-full flex justify-center bottom-7">
        {renderIcons()}
      </div>
    </>
  );
}
