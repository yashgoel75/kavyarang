"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

import snapchat from "../../../../public/snapchat.png";
import instagram from "../../../../public/instagram.png";
import Link from "next/link";

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

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  likes: number;
  color: string;
}

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userId && firebaseUser) {
      fetchUserData(userId);
    }
  }, [firebaseUser, userId]);

  const fetchUserData = async (username: string) => {
    try {
      const userRes = await fetch(`/api/getUser?username=${username}`);
        const userData = await userRes.json();
        console.log(userData.user);
      if (!userRes.ok) throw new Error(userData.error || "Failed to load user profile");

      const postsRes = await fetch(
        `/api/user/posts?email=${encodeURIComponent(userData.user.email)}`
      );
      const postsData = await postsRes.json();
      if (!postsRes.ok) throw new Error(postsData.error || "Failed to load user posts");

      setUserData(postsData.user);

      if (firebaseUser?.email && postsData.user.followers) {
        setIsFollowing(postsData.user.followers.includes(firebaseUser.email));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!firebaseUser || !userData) return;

    setIsFollowLoading(true);
    try {
      const res = await fetch(`/api/user/follow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentUserEmail: firebaseUser.email,
          targetEmail: userData.email,
          action: isFollowing ? "unfollow" : "follow",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update follow status");

      setIsFollowing(!isFollowing);
      setUserData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          followers: isFollowing
            ? prev.followers.filter((email) => email !== firebaseUser.email)
            : [...prev.followers, firebaseUser.email!],
        };
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update follow status.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-gray-300 border-t-[#bd9864ff] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
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

  function getTextColor(bgColor: string): string {
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128 ? "#000000" : "#ffffff";
  }

  const isOwnProfile = firebaseUser?.email === userData.email;

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10 min-h-[85vh]">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-1">
            {isOwnProfile ? "My Account" : `${userData.name}'s Profile`}
          </h2>
          <div className="h-0.5 w-20 bg-gradient-to-r from-[#bd9864ff] to-transparent"></div>
        </div>

        <div className="flex-1 space-y-4 md:flex justify-around gap-1 bg-white shadow-sm rounded-lg p-8 mb-8 border border-gray-100">
          <div className="border-1 lg:w-lg rounded-xl shadow-lg border-gray-100 p-5">
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <div className="relative w-32 h-32">
                  {userData.profilePicture ? (
                    <Image
                      src={userData.profilePicture}
                      alt={`${userData.name}'s profile`}
                      fill
                      className="rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-[#bd9864ff] to-[#dbb56aff] text-3xl font-semibold text-white">
                      {userData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center space-y-2 w-full">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {userData.name}
                </h3>
                <p className="text-gray-500">@{userData.username}</p>
                {userData.bio && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-700 italic">&apos;{userData.bio}&apos;</p>
                  </div>
                )}
                {!isOwnProfile && firebaseUser && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isFollowLoading}
                    className={`mt-6 ${
                      isFollowing
                        ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                        : "bg-[#bd9864ff] hover:bg-[#9a6f0bff] text-white"
                    } px-6 py-2 rounded-md font-medium transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isFollowLoading
                      ? "Loading..."
                      : isFollowing
                      ? "Unfollow"
                      : "Follow"}
                  </button>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => router.push("/account")}
                    className="mt-6 bg-[#bd9864ff] hover:bg-[#9a6f0bff] text-white px-6 py-2 rounded-md font-medium transition-colors duration-200 cursor-pointer"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="border-1 rounded-xl shadow-lg border-gray-100 p-5">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-5">
                {userData.instagram && (
                  <div>
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
                        className="shadow-md"
                      />
                      <span className="font-medium truncate">
                        {userData.instagram}
                      </span>
                    </a>
                  </div>
                )}
                {userData.snapchat && (
                  <div>
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
                        className="rounded-full shadow-md"
                      />
                      <span className="font-medium truncate">
                        {userData.snapchat}
                      </span>
                    </a>
                  </div>
                )}
              </div>
              <div className="flex gap-4 justify-around bg-gray-50 md:flex-col md:space-y-4 md:mt-3 px-3 py-5 rounded-lg shadow-xl">
                <Link href={`/user/${userId}/friends`}>
                <div className="text-center cursor-pointer">
                  <h3 className="text-2xl font-semibold text-gray-800">
                    {userData.followers?.length || 0}
                  </h3>
                  <p>
                    {userData.followers?.length === 1
                      ? "follower"
                      : "followers"}
                  </p>
                  </div>
                </Link>
                <Link href={`/user/${userId}/friends`}>
                <div className="text-center cursor-pointer">
                  <h3 className="text-2xl font-semibold text-gray-800">
                    {userData.following?.length || 0}
                  </h3>
                  <p>
                    {userData.following?.length === 1
                      ? "following"
                      : "followings"}
                  </p>
                  </div>
                  </Link>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">
                {isOwnProfile ? "My Posts" : "Posts"}
              </h3>
            </div>
          </div>

          {userData.posts && userData.posts.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {userData.posts.map((post) => {
                const wordCount = post.content
                  ? post.content.split(/\s+/).length
                  : 0;
                const readingTime = Math.ceil(wordCount / 200) || 1;

                return (
                  <div
                    key={post._id}
                    style={{
                      backgroundColor: post.color || "#ffffff",
                      color: getTextColor(post.color || "#ffffff"),
                    }}
                    className="border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => router.push(`/post/${post._id}`)}
                  >
                    <div className="flex relative items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold">{post.title}</h4>
                      </div>
                    </div>
                    <span className="text-xs mb-2">{readingTime} min read</span>

                    <p
                      className="text-sm mb-3 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html:
                          post.content?.length > 120
                            ? post.content.slice(0, 120) + "..."
                            : post.content,
                      }}
                    ></p>

                    {post.picture && (
                      <div className="relative w-full h-48 mb-3 rounded-md overflow-hidden">
                        <Image
                          src={post.picture}
                          alt="Post image"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{post.likes} likes</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">No posts yet.</p>
            </div>
          )}
        </div>
      </main>
      <Navigation />
      <Footer />
    </>
  );
}