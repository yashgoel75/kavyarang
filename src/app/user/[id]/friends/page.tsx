"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";

interface Friend {
  name: string;
  username: string;
  profilePicture?: string;
  email: string;
}

interface UserData {
  name: string;
  username: string;
  profilePicture?: string;
  followers: string[];
  following: string[];
}

export default function UserFriendsPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params.id;
  const userId = Array.isArray(rawId) ? rawId[0] : rawId ?? "";

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [profileUserData, setProfileUserData] = useState<UserData | null>(null);
  const [followers, setFollowers] = useState<Friend[]>([]);
  const [following, setFollowing] = useState<Friend[]>([]);
  const [mutualFriends, setMutualFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "followers" | "following" | "mutual"
  >("followers");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setFirebaseUser(user);
        fetchCurrentUser(user.email);
      } else {
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchCurrentUser = async (email: string) => {
    try {
      const res = await fetch(
        `/api/user/posts?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      setCurrentUserData({
        name: data.user.name,
        username: data.user.username,
        profilePicture: data.user.profilePicture,
        followers: data.user.followers || [],
        following: data.user.following || [],
      });
      fetchProfileUser();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProfileUser = async () => {
    try {
      const res = await fetch(
        `/api/getUser?username=${encodeURIComponent(userId)}`
      );
      const data = await res.json();
      const user: UserData = {
        name: data.user.name,
        username: data.user.username,
        profilePicture: data.user.profilePicture,
        followers: data.user.followers || [],
        following: data.user.following || [],
      };
      setProfileUserData(user);

      await Promise.all([
        fetchFriends(user.followers, setFollowers),
        fetchFriends(user.following, setFollowing),
      ]);

      const mutualEmails = user.followers.filter((email) =>
        currentUserData?.following.includes(email)
      );
      await fetchFriends(mutualEmails, setMutualFriends);
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

  if (loading) return <p className="text-center mt-20">Loading friends...</p>;
  if (!profileUserData)
    return <p className="text-center mt-20 text-gray-500">User not found</p>;

  const FriendCard = ({ friend }: { friend: Friend }) => {
    const isFollowing = currentUserData?.following.includes(friend.email);
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
        {isFollowing && (
          <span className="px-3 py-1 rounded-md text-sm bg-gray-200 text-gray-700 cursor-default">
            Following
          </span>
        )}
      </div>
    );
  };

  const displayedFriends =
    activeTab === "followers"
      ? followers
      : activeTab === "following"
      ? following
      : mutualFriends;

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10 min-h-[85vh]">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          {profileUserData.name}&rsquo;s Friends
        </h2>

        <div className="flex gap-4 mb-6">
          <button
            className={`px-4 py-2 rounded-md font-medium cursor-pointer ${
              activeTab === "followers"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveTab("followers")}
          >
            Followers ({followers.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium cursor-pointer ${
              activeTab === "following"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveTab("following")}
          >
            Following ({following.length})
          </button>
          <button
            className={`px-4 py-2 rounded-md font-medium cursor-pointer ${
              activeTab === "mutual"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
            onClick={() => setActiveTab("mutual")}
          >
            Mutual Friends ({mutualFriends.length})
          </button>
        </div>

        {displayedFriends.length === 0 ? (
          <p className="text-gray-500">
            {activeTab === "followers"
              ? "No followers"
              : activeTab === "following"
              ? "Not following anyone"
              : "No mutual friends"}
          </p>
        ) : (
          <div className="space-y-2">
            {displayedFriends.map((friend) => (
              <FriendCard key={friend.email} friend={friend} />
            ))}
          </div>
        )}
      </main>
      <Navigation />
      <Footer />
    </>
  );
}
