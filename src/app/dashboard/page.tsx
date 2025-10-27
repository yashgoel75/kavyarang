"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import snapchat from "../../../public/snapchat.png";
import instagram from "../../../public/instagram.png";
import Link from "next/link";

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  author: User;
  likes: number;
  color: string;
}

interface User {
  name: string;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  posts?: Post[];
  snapchat: string;
  instagram: string;
  followers: string[];
  following: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState<
    Record<string, boolean>
    >({});
  const [fetchedInteractionIds, setFetchedInteractionIds] = useState<Set<string>>(new Set());


  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) {
        fetchUserData(user.email);
        setFirebaseUser(user);
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
      setUserData(data.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userData) return;

    const fetchPosts = async () => {
      if (loadingPosts || !hasMore) return;

      setLoadingPosts(true);
      try {
        const res = await fetch(`/api/getPosts?page=${page}&limit=9`);
        const data = await res.json();

        const filtered = data.posts.filter(
          (p: Post) => p.author.email !== userData.email
        );

        setPosts((prev) => (prev ? [...prev, ...filtered] : filtered));
        setHasMore(data.hasMore);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [page, userData]);

  useEffect(() => {
  if (!firebaseUser || !posts?.length) return;

  const fetchInteractions = async () => {
    const newPostIds = posts
      .map((p) => p._id)
      .filter((id) => !fetchedInteractionIds.has(id));

    if (newPostIds.length === 0) return;

    try {
      const res = await fetch(`/api/interactions`, {
        method: "POST",
        body: JSON.stringify({ email: firebaseUser.email, postIds: newPostIds }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.ok) {
        setLikedPosts((prev) => {
          const updated = { ...prev };
          data.likes.forEach((id: string) => (updated[id] = true));
          return updated;
        });

        setBookmarkedPosts((prev) => {
          const updated = { ...prev };
          data.bookmarks.forEach((id: string) => (updated[id] = true));
          return updated;
        });

        setFetchedInteractionIds((prev) => {
          const updated = new Set(prev);
          newPostIds.forEach((id) => updated.add(id));
          return updated;
        });
      }
    } catch (err) {
      console.error("Failed to load interactions", err);
    }
  };

  fetchInteractions();
}, [firebaseUser, posts]);


  const handleLike = async (postId: string) => {
    if (!firebaseUser) return;

    try {
      const res = await fetch(`/api/post/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, email: firebaseUser.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to like post");

      setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));

      setPosts((prev) =>
        prev
          ? prev.map((p) =>
              p._id === postId ? { ...p, likes: data.likes } : p
            )
          : prev
      );
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!firebaseUser) return;
    try {
      const res = await fetch(`/api/post/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, email: firebaseUser.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bookmark post");

      setBookmarkedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
    } catch (err) {
      console.error(err);
    }
  };

  function getTextColor(bgColor: string): string {
    if (!bgColor) return "#000000";

    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 150 ? "#000000" : "#ffffff";
  }

  function getIconColor(bgColor: string, isLiked: boolean): string {
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (isLiked) {
      return luminance < 120 ? "#ffdfdfff" : "#e11d48";
    }

    return luminance < 120 ? "#f1f1f1" : "#555555";
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="flex flex-1 relative">
        <aside
          className={`fixed md:static top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } 
          w-80 overflow-hidden`}
        >
          <div className="h-full flex flex-col">
            <button
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full md:hidden z-10"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>

            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : userData ? (
              <div className="flex flex-col h-full">
                <div className="relative">
                  <div className="h-32 bg-white"></div>
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                    <img
                      src={
                        userData.profilePicture ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`
                      }
                      alt={userData.name}
                      className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-white"
                    />
                  </div>
                </div>

                <div className="pt-20 px-6 pb-4 text-center border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {userData.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    @{userData.username}
                  </p>
                  {userData.bio && (
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                      {userData.bio}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {userData.posts?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Posts</div>
                  </div>
                  <Link href="/account">
                    <div className="text-center cursor-pointer">
                      <div className="text-2xl font-bold text-gray-800">
                        {userData.followers?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Followers
                      </div>
                    </div>
                  </Link>
                  <Link href="/account">
                    <div className="text-center cursor-pointer">
                      <div className="text-2xl font-bold text-gray-800">
                        {userData.following?.length || 0}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Following
                      </div>
                    </div>
                  </Link>
                </div>

                {(userData.instagram || userData.snapchat) && (
                  <div className="px-6 py-4 space-y-3">
                    {userData.instagram && (
                      <a
                        href={`https://instagram.com/${userData.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-5 py-2 rounded-xl bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                      >
                        <Image
                          src={instagram}
                          width={25}
                          height={25}
                          alt="Instagram"
                        />
                        <span className="font-medium truncate">
                          {userData.instagram}
                        </span>
                      </a>
                    )}
                    {userData.snapchat && (
                      <a
                        href={`https://snapchat.com/add/${userData.snapchat}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-5 py-2 rounded-xl bg-[#f5ec00] text-black shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                      >
                        <Image
                          src={snapchat}
                          width={25}
                          height={25}
                          alt="Snapchat"
                        />
                        <span className="font-medium truncate">
                          {userData.snapchat}
                        </span>
                      </a>
                    )}
                  </div>
                )}

                <div className="px-6 mt-25">
                  <Link href="/account">
                    <button className="cursor-pointer w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium">
                      View Profile
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Failed to load profile
              </div>
            )}
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto md:ml-0 pb-20">
          <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {userData?.name || "User"} 👋
              </h1>
              <p className="text-gray-600">
                Discover amazing content from the community
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts?.length ? (
                posts.map((post) => (
                  <div
                    key={post._id}
                    style={{
                      backgroundColor: post.color || "#ffffff",
                      color: getTextColor(post.color || "#ffffff"),
                    }}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col"
                  >
                    {post.picture && (
                      <Link href={`/post/${post._id}`}>
                        <div className="relative overflow-hidden h-56 cursor-pointer">
                          <img
                            src={post.picture}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      </Link>
                    )}

                    <div className="flex flex-col flex-grow p-5">
                      <Link href={`/post/${post._id}`}>
                        <h2 className="font-bold text-xl   mb-2 line-clamp-1">
                          {post.title}
                        </h2>
                        <p
                          className="text-sm leading-relaxed line-clamp-3 mb-4 flex-grow"
                          dangerouslySetInnerHTML={{
                            __html:
                              post.content?.length > 120
                                ? post.content.slice(0, 120) + "..."
                                : post.content,
                          }}
                        ></p>
                      </Link>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                        <div className="flex gap-3 items-center">
                          <button
                            onClick={() => handleLike(post._id)}
                            disabled={!firebaseUser}
                            className={`flex items-center gap-2 transition-transform hover:scale-110 disabled:cursor-not-allowed`}
                            style={{
                              color: getIconColor(
                                post.color || "#ffffff",
                                likedPosts[post._id]
                              ),
                              textShadow:
                                getTextColor(post.color || "#ffffff") ===
                                "#ffffff"
                                  ? "0 0 4px rgba(0,0,0,0.4)"
                                  : "0 0 4px rgba(255,255,255,0.4)",
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill={
                                likedPosts[post._id]
                                  ? getIconColor(post.color || "#ffffff", true)
                                  : "none"
                              }
                              stroke={getIconColor(
                                post.color || "#ffffff",
                                likedPosts[post._id]
                              )}
                              strokeWidth="1.5"
                              className="h-5 w-5 transition-all duration-200"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm font-semibold">
                              {post.likes}
                            </span>
                          </button>

                          <button
                            onClick={() => handleBookmark(post._id)}
                            disabled={!firebaseUser}
                            className={`flex items-center gap-2 hover:scale-110 transition-transform disabled:cursor-not-allowed ${
                              bookmarkedPosts[post._id] ? "text-yellow-500" : ""
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill={
                                bookmarkedPosts[post._id]
                                  ? "currentColor"
                                  : "none"
                              }
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                          </button>
                        </div>

                        <Link href={`/post/${post._id}`}>
                          <button className="cursor-pointer text-sm font-medium">
                            Tap to Comment
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-500">Loading posts...</p>
                </div>
              )}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  disabled={loadingPosts}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-all font-medium"
                >
                  {loadingPosts ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      <Navigation />
    </div>
  );
}
