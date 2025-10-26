"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";

interface Notification {
  id: string;
  type: "new_follower" | "post_like";
  fromEmail: string;
  postId?: string;
  createdAt: string;
  read: boolean;
  fromUser?: { name: string; username: string; profilePicture?: string };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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
          <p className="text-center mt-20">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="text-center mt-20 text-gray-500">
            No new notifications
          </p>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition cursor-pointer"
                onClick={() => handleNotificationClick(notif)}
              >
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
                    notif.fromUser?.name.charAt(0).toUpperCase()
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
