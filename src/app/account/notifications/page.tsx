"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { Check } from "lucide-react";

interface Notification {
  id: string;
  type: "new_follower" | "post_like";
  fromEmail: string;
  postId?: string;
  createdAt: string;
  read: boolean;
  fromUser?: {
    name: string;
    username: string;
    profilePicture?: string;
    isVerified: boolean;
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const getInitials = (name: string) => {
    if (!name || name === "Unknown User") return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setFirebaseUser(user);
        fetchNotifications(user.email);
      } else {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchNotifications = async (email: string) => {
    try {
      const res = await fetch(
        `/api/notifications?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();

      const notificationsWithUser = await Promise.all(
        data.notifications.map(async (notif: Notification) => {
          const userRes = await fetch(
            `/api/getUserByEmail?email=${encodeURIComponent(notif.fromEmail)}`
          );
          const userData = await userRes.json();
          return { ...notif, fromUser: userData.user };
        })
      );

      setNotifications(notificationsWithUser);

      await fetch(`/api/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (notif.type === "new_follower" && notif.fromUser) {
      router.push(`/user/${notif.fromUser.username}`);
    } else if (notif.type === "post_like" && notif.postId) {
      router.push(`/post/${notif.postId}`);
    }
  };

  const renderNotificationText = (notif: Notification) => {
    if (notif.type === "new_follower") {
      return (
        <p className="text-gray-700">
          <span className="font-medium">{notif.fromUser?.name}</span> started
          following you
        </p>
      );
    } else if (notif.type === "post_like") {
      return (
        <p className="text-gray-700">
          <span className="font-medium">{notif.fromUser?.name}</span> liked your
          post
        </p>
      );
    }
    return null;
  };

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-10 min-h-[90vh]">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Notifications</h2>

        {loading ? (
          <div className="space-y-4 mt-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm animate-pulse"
              >
                <div className="w-12 h-12 rounded-full bg-gray-300"></div>

                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-300 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center mt-20 text-gray-500">
            No new notifications
          </p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id || `${notif.fromEmail}-${notif.createdAt}`}
                className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition cursor-pointer"
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="relative w-12 h-12">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-white font-medium">
                    {notif.fromUser?.profilePicture ? (
                      <Image
                        src={notif.fromUser.profilePicture}
                        alt={notif.fromUser.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-700 font-semibold text-sm">
                        {getInitials(notif.fromUser?.name || "")}
                      </div>
                    )}
                  </div>

                  {notif.fromUser?.isVerified && (
                    <div
                      title="Verified"
                      className="absolute bottom-0 right-0 translate-x-1 translate-y-1 bg-green-700 rounded-full p-1 flex items-center justify-center"
                    >
                      <Check size={12} color="white" />
                    </div>
                  )}
                </div>

                <div>
                  {renderNotificationText(notif)}
                  <p className="text-xs text-gray-500">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Navigation />
      <Footer />
    </>
  );
}
