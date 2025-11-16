"use client";

import Navigation from "@/components/navigation/page";
import { LogOut, Search, Send, UserIcon, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import snapchat from "../../../public/snapchat.png";
import instagram from "../../../public/instagram.png";
import Link from "next/link";
import PostCard from "./PostCard";
import GradientText from "@/components/GradientText";

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
  const [fetchedInteractionIds, setFetchedInteractionIds] = useState<
    Set<string>
  >(new Set());

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      setUser(null);
      localStorage.removeItem("userData");
      localStorage.removeItem("userDataCachedAt");
      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim() === "") return;
    router.push(`/search?query=${encodeURIComponent(searchQuery.trim())}`);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const menu = document.querySelector(".menu-dropdown");
      const icon = document.querySelector(".user-icon-btn");
      if (
        menu &&
        !menu.contains(e.target as Node) &&
        icon &&
        !icon.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const renderSearch = () => (
    <>
      <Search color="gray" size={20} />
      <input
        className="mx-3 h-full w-full focus:outline-none bg-transparent"
        placeholder="Search stories, authors, or topics..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
    </>
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setFirebaseUser(user);
        setUser(user);
        const cached = localStorage.getItem("userData");
        const cachedAt = localStorage.getItem("userDataCachedAt");
        const oneHour = 60 * 60 * 1000;

        // Check if cache exists and is still valid
        const isCacheValid =
          cached && cachedAt && Date.now() - Number(cachedAt) < oneHour;

        if (isCacheValid) {
          // Use cached data
          try {
            const parsed = JSON.parse(cached);
            setUserData(parsed);
            setLoading(false);
            console.log("Using cached data"); // Debug log
          } catch (error) {
            console.error("Cache parse error:", error);
            // If cache is corrupted, fetch fresh data
            fetchUserData(user.email)
              .then((data) => {
                if (data) {
                  localStorage.setItem("userData", JSON.stringify(data));
                  localStorage.setItem(
                    "userDataCachedAt",
                    Date.now().toString()
                  );
                }
              })
              .finally(() => setLoading(false));
          }
        } else {
          // Cache doesn't exist or is expired, fetch fresh data
          console.log("Fetching fresh data"); // Debug log
          fetchUserData(user.email)
            .then((data) => {
              if (data) {
                localStorage.setItem("userData", JSON.stringify(data));
                localStorage.setItem("userDataCachedAt", Date.now().toString());
              }
            })
            .finally(() => setLoading(false));
        }
      } else {
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUserData = async (email: string): Promise<User | null> => {
    try {
      const res = await fetch(
        `/api/user/posts?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load user data");
      setUserData(data.user);
      return data.user;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

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
          body: JSON.stringify({
            email: firebaseUser.email,
            postIds: newPostIds,
            page,
            limit: 9,
          }),
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
  }, [firebaseUser, posts, fetchedInteractionIds]);

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
    <div className="min-h-screen flex flex-col bg-white">
      <div className="flex flex-1 relative">
        <div
          className={`absolute ${
            isMobile ? "w-full px-7" : ""
          } md:static top-16 left-0 z-40 border-r border-gray-200 h-[calc(100vh-4rem)] bg-white shadow-lg
          transform transition-transform duration-300 ease-in-out overflow-y-auto z-1000
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } 
          w-80 min-h-screen max-h-screen`}
        >
          <aside>
            <div className="h-full flex flex-col">
              <span className="text-center custom-class text-[50px] mt-3">
                <GradientText
                  colors={[
                    "#9a6f0bff",
                    "#bd9864ff",
                    "#dbb56aff",
                    "#7f7464ff",
                    "#e9e99dff",
                  ]}
                  animationSpeed={5}
                  showBorder={false}
                >
                  <Link href="/dashboard">Kavyalok</Link>
                </GradientText>
              </span>

              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mt-15 border-yellow-500"></div>
                </div>
              ) : userData ? (
                <div className="flex flex-col h-full bg-white">
                  <div className="relative">
                    <div className="h-25 bg-white"></div>
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

                  <div className="px-6">
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
        </div>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto md:ml-0 pb-20">
          <header className="sticky top-0 z-50 bg-white">
            <div className="flex items-center justify-between px-4 md:px-6 h-16">
              <button
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div className="flex items-center gap-3 md:gap-4 ml-auto">
                {isMobile ? (
                  <>
                    <button
                      className="cursor-pointer hover:bg-gray-100 p-2 rounded-md transition active:scale-95"
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                    >
                      <Search size={22} />
                    </button>
                    {isSearchOpen && (
                      <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200 p-4 shadow-md">
                        <div className="flex items-center bg-gray-100 border border-gray-300 px-3 rounded-xl h-[40px]">
                          {renderSearch()}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center bg-gray-100 border border-gray-300 px-3 rounded-xl h-[40px] w-[500px]">
                    {renderSearch()}
                  </div>
                )}

                <div className="relative">
                  {user ? (
                    <>
                      <button
                        className="user-icon-btn p-2 rounded-full hover:bg-gray-100 cursor-pointer transition active:scale-95"
                        onClick={() => setIsOpen((prev) => !prev)}
                      >
                        <UserIcon size={25} strokeWidth={1.75} />
                      </button>

                      {isOpen && (
                        <div className="absolute right-0 mt-2 min-w-[160px] bg-white border border-gray-200 rounded-md shadow-lg z-50 menu-dropdown">
                          <div className="px-4 py-2 border-b border-gray-200">
                            <p className="font-semibold">
                              {userData?.name || "User"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                          >
                            <LogOut size={16} />
                            Logout
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex gap-2 h-[40px]">
                      <button
                        onClick={() => router.push("/auth/login")}
                        className="flex items-center rounded-lg bg-gradient-to-br from-[#9a6f0bff] to-[#dbb56aff] text-white px-4 text-sm py-1 cursor-pointer"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => router.push("/auth/register")}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm cursor-pointer"
                      >
                        Register
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>
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
                  <PostCard
                    key={post._id}
                    post={post}
                    firebaseUser={firebaseUser}
                    userData={userData}
                    likedPosts={likedPosts}
                    bookmarkedPosts={bookmarkedPosts}
                    handleLike={handleLike}
                    handleBookmark={handleBookmark}
                    getTextColor={getTextColor}
                    getIconColor={getIconColor}
                    getInitials={getInitials}
                    router={router}
                  />
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mb-4"></div>
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
