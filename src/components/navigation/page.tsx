"use client";
import { Home, Bookmark, User, Bell, Compass, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

export default function Navigation() {
  const [isMobile, setIsMobile] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    const footer = document.getElementById("app-footer");
    if (footer) {
      const observer = new IntersectionObserver(
        (entries) => setIsFooterVisible(entries[0].isIntersecting),
        { threshold: 0.1 }
      );
      observer.observe(footer);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  const icons = [
    { name: Home, url: "dashboard", title: "Home" },
    { name: Bookmark, url: "bookmark", title: "Bookmarks" },
    { name: Compass, url: "discover", title: "Discover" },
    { name: Settings, url: "settings", title: "Settings" },

    { name: User, url: "account", title: "Account" },
  ];

  const [isDashboardPage, setIsDashboardPage] = useState(false);
  const [isBookmarkPage, setIsBookmarkPage] = useState(false);
  const [isDiscoverPage, setIsDiscoverPage] = useState(false);
  const [isNotificationsPage, setIsNotificationsPage] = useState(false);
  const [isAccountPage, setIsAccountPage] = useState(false);
  const [isSettingsPage, setIsSettingsPage] = useState(false);

  useEffect(() => {
    if (pathname.includes("dashboard")) {
      setIsBookmarkPage(false);
      setIsNotificationsPage(false);
      setIsAccountPage(false);
      setIsSettingsPage(false);
      setIsDiscoverPage(false);

      setIsDashboardPage(true);
    } else if (pathname.includes("bookmark")) {
      setIsNotificationsPage(false);
      setIsAccountPage(false);
      setIsDashboardPage(false);
      setIsSettingsPage(false);
      setIsDiscoverPage(false);

      setIsBookmarkPage(true);
    } else if (pathname.includes("notifications")) {
      setIsBookmarkPage(false);
      setIsAccountPage(false);
      setIsDashboardPage(false);
      setIsSettingsPage(false);
      setIsDiscoverPage(false);

      setIsNotificationsPage(true);
    } else if (pathname.includes("account")) {
      setIsBookmarkPage(false);
      setIsNotificationsPage(false);
      setIsDashboardPage(false);
      setIsSettingsPage(false);
      setIsDiscoverPage(false);

      setIsAccountPage(true);
    } else if (pathname.includes("discover")) {
      setIsBookmarkPage(false);
      setIsNotificationsPage(false);
      setIsDashboardPage(false);
      setIsAccountPage(false);
      setIsSettingsPage(false);

      setIsDiscoverPage(true);
    } else if (pathname.includes("settings")) {
      setIsBookmarkPage(false);
      setIsNotificationsPage(false);
      setIsDashboardPage(false);
      setIsAccountPage(false);
      setIsDiscoverPage(false);
      setIsSettingsPage(true);
    }
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-0 w-full flex justify-center transition-all duration-300 ease-in-out z-50 ${
        isFooterVisible
          ? "opacity-0 pointer-events-none translate-y-5"
          : "opacity-100 translate-y-0"
      }`}
    >
      <div className="flex py-3 gap-7 bg-white border border-gray-300 shadow-lg rounded-full px-7">
        {icons.map((icon, indx) => (
          <Link
            key={indx}
            href={
              icon.url === "notifications"
                ? "/account/notifications"
                : `/${icon.url}`
            }
            title={icon.title}
            className="relative group"
          >
            <icon.name
              size={isMobile ? 30 : 35}
              className={`cursor-pointer hover:scale-125 transition border-b-2 pb-1 ${
                icon.url == "account" && isAccountPage
                  ? "border-yellow-700"
                  : "border-white"
              } ${
                icon.url == "bookmark" && isBookmarkPage
                  ? "border-yellow-700"
                  : "border-white"
              } ${
                icon.url == "notifications" && isNotificationsPage
                  ? "border-yellow-700"
                  : "border-white"
              } ${
                icon.url == "dashboard" && isDashboardPage
                  ? "border-yellow-700"
                  : "border-white"
              } ${
                icon.url == "discover" && isDiscoverPage
                  ? "border-yellow-700"
                  : "border-white"
              } ${
                icon.url == "settings" && isSettingsPage
                  ? "border-yellow-700"
                  : "border-white"
              }`}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
