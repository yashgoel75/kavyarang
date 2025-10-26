"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";

interface User {
  name: string;
  username: string;
  profilePicture?: string;
  followers: string[];
  following: string[];
}

interface Friend {
  name: string;
  username: string;
  profilePicture?: string;
  email: string;
}

export default function FriendsPage() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [followersDetails, setFollowersDetails] = useState<Friend[]>([]);
  const [followingDetails, setFollowingDetails] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    "followers"
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setFirebaseUser(user);
        fetchUserData(user.email);
      } else {
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (email: string) => {
    try {
      const res = await fetch(
        `/api/user/posts?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load user data");

      const user = {
        name: data.user.name,
        username: data.user.username,
        profilePicture: data.user.profilePicture,
        followers: data.user.followers || [],
        following: data.user.following || [],
      };
      setUserData(user);

      await Promise.all([
        fetchFriends(user.followers, setFollowersDetails),
        fetchFriends(user.following, setFollowingDetails),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async (
    emails: string[],
    setState: (friends: Friend[]) => void
  ) => {
    const friends: Friend[] = [];

    await Promise.all(
      emails.map(async (email) => {
        try {
          const res = await fetch(
            `/api/getUserByEmail?email=${encodeURIComponent(email)}`
          );
          const data = await res.json();
          if (res.ok && data.user) {
            friends.push({
              name: data.user.name,
              username: data.user.username,
              profilePicture: data.user.profilePicture,
              email: email,
            });
          }
        } catch (err) {
          console.error("Error fetching friend:", err);
        }
      })
    );

    setState(friends);
  };

  const handleFollowBack = async (friendEmail: string) => {
    if (!firebaseUser) return;
    try {
      const res = await fetch(`/api/user/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: firebaseUser.email,
          targetEmail: friendEmail,
          action: "follow",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const userEmail = firebaseUser?.email;
        if (userEmail) {
          fetchUserData(userEmail);
        }
      } else {
        alert(data.error || "Failed to follow back");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading friends...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!userData) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center h-[70vh]">
          <p className="text-gray-600">User not found.</p>
        </main>
        <Footer />
      </>
    );
  }

  const FriendCard = ({
    friend,
    isFollower,
  }: {
    friend: Friend;
    isFollower?: boolean;
  }) => {
    const isFollowing = userData.following.includes(friend.email);
    return (
      <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md transition">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push(`/user/${friend.username}`)}
        >
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-white font-medium">
            {friend.profilePicture ? (
              <Image
                src={friend.profilePicture}
                alt={friend.name}
                width={48}
                height={48}
                className="object-cover w-full h-full"
              />
            ) : (
              friend.name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-gray-700 font-medium">{friend.name}</span>
        </div>
        {isFollower && (
          <button
            className={`px-3 py-1 rounded-md text-sm ${
              isFollowing
                ? "bg-gray-200 text-gray-700 cursor-default"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            disabled={isFollowing}
            onClick={() => !isFollowing && handleFollowBack(friend.email)}
          >
            {isFollowing ? "Following" : "Follow Back"}
          </button>
        )}
      </div>
    );
  };

  const displayedFriends =
    activeTab === "followers" ? followersDetails : followingDetails;

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10 min-h-[90vh]">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Friends</h2>

        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-md font-medium cursor-pointer ${
              activeTab === "followers"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveTab("followers")}
          >
            Followers ({followersDetails.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium cursor-pointer ${
              activeTab === "following"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveTab("following")}
          >
            Following ({followingDetails.length})
          </button>
        </div>

        {displayedFriends.length === 0 ? (
          <p className="text-gray-500">
            {activeTab === "followers"
              ? "No followers yet."
              : "Not following anyone yet."}
          </p>
        ) : (
          <div className="space-y-2">
            {displayedFriends.map((friend) => (
              <FriendCard
                key={friend.email}
                friend={friend}
                isFollower={activeTab === "followers"}
              />
            ))}
          </div>
        )}
      </main>
      <Navigation />
      <Footer />
    </>
  );
}
