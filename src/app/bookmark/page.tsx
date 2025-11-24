"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";

import { useState, useEffect, useCallback, useMemo } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

import PostCard from "@/components/dashboard/PostCard";

export default function Bookmarks() {
  const router = useRouter();

  interface Post {
    _id: string;
    title: string;
    content: string;
    picture?: string;
    author: User;
    likes: number;
    comments: [string];
    color: string;
  }

  interface User {
    name: string;
    username: string;
    email: string;
    bio?: string;
    profilePicture?: string;
    isVerified: boolean;
    posts?: Post[];
    snapchat: string;
    instagram: string;
    defaultPostColor: string;
    followers: string[];
    following: string[];
  }

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user?.email) return router.replace("/");

      setFirebaseUser(user);
      fetchBookmarks(user.email);
    });

    return unsubscribe;
  }, []);

  const fetchBookmarks = async (email: string) => {
    try {
      const userRes = await fetch(
        `/api/getUserBookmarks?email=${encodeURIComponent(email)}`
      );
      const userJSON = await userRes.json();

      if (!userRes.ok) throw new Error(userJSON.error);

      const bookmarkIds = userJSON?.user?.bookmarks || [];
      setUserData(userJSON.user);

      if (bookmarkIds.length === 0) {
        setPosts([]);
        return setLoading(false);
      }

      const postsRes = await fetch(`/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: bookmarkIds }),
      });

      const postsJSON = await postsRes.json();
      if (!postsRes.ok) throw new Error(postsJSON.error);

      setPosts(postsJSON.posts);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch your bookmarks.");
    } finally {
      setLoading(false);
    }
  };

  const defaultPostColor = userData?.defaultPostColor;

  const handleDelete = useCallback(
    async (postId: string) => {
      if (!firebaseUser?.email) return;

      try {
        const res = await fetch("/api/bookmark/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: firebaseUser.email,
            postId,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        setPosts((prev) => prev.filter((p) => p._id !== postId));
      } catch (err) {
        console.error(err);
        alert("Failed to remove bookmark.");
      }
    },
    [firebaseUser?.email]
  );

  const getTextColor = useCallback((hex: string) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000" : "#fff";
  }, []);

  const getInitials = useCallback((name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const getIconColor = useCallback(
    (bg: string, active: boolean) => {
      if (active) return "#e63946"; // liked = red
      return getTextColor(bg);
    },
    [getTextColor]
  );

  const getCommentColor = useCallback(
    (bg: string) => {
      return getTextColor(bg) === "#000" ? "#333" : "#ddd";
    },
    [getTextColor]
  );

  if (loading) {
    return (
      <>
        <Header />

        <div className="min-h-screen bg-gray-50 py-10 px-5 md:px-20">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Your Bookmarks
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="border border-gray-200 p-5 rounded-lg bg-white shadow-sm animate-pulse space-y-4"
              >
                <div className="h-5 w-40 bg-gray-300 rounded"></div>

                <div className="h-4 w-24 bg-gray-200 rounded"></div>

                <div className="h-4 w-full bg-gray-200 rounded"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-4 w-2/3 bg-gray-200 rounded"></div>

                <div className="h-48 w-full bg-gray-300 rounded-md"></div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Navigation />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <div className="min-h-screen bg-gray-50 py-10 px-5 md:px-20">
        <h2 className="text-3xl font-bold mb-8 text-center">Your Bookmarks</h2>

        {posts.length === 0 ? (
          <p className="text-center text-gray-500">
            You haven’t bookmarked any posts yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                defaultPostColor={defaultPostColor || "null"}
                firebaseUser={firebaseUser}
                userData={userData}
                likedPosts={{}}
                bookmarkedPosts={{ [post._id]: true }}
                handleLike={() => {}}
                handleBookmark={() => handleDelete(post._id)}
                getTextColor={getTextColor}
                getIconColor={getIconColor}
                getCommentColor={getCommentColor}
                getInitials={getInitials}
                router={router}
              />
            ))}
          </div>
        )}
      </div>

      <Navigation />
      <Footer />
    </>
  );
}
