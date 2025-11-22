"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { useRouter } from "next/navigation";

import snapchat from "../../../public/snapchat.png";
import instagram from "../../../public/instagram.png";
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

export default function Account() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [formData, setFormData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);
  const [usernameAlreadyTaken, setUsernameAlreadyTaken] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setFirebaseUser(user);

        const cached = localStorage.getItem("userData");
        const cachedAt = localStorage.getItem("userDataCachedAt");
        const oneHour = 1000;

        // Check if cache exists and is still valid
        const isCacheValid =
          cached && cachedAt && Date.now() - Number(cachedAt) < oneHour;

        if (isCacheValid) {
          // Use cached data
          try {
            const parsed = JSON.parse(cached);
            setUserData(parsed);
            setFormData(parsed);
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
      setFormData(data.user);
      return data.user;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const handleUpdate = async () => {
    if (!firebaseUser) return;

    if (formData?.username !== userData?.username) {
      if (!usernameAvailable || usernameAlreadyTaken) {
        console.error("Please choose an available username.");
        return;
      }
    }

    setIsUpdating(true);

    try {
      const res = await fetch(`/api/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          updates: {
            name: formData?.name,
            username: formData?.username,
            bio: formData?.bio,
            instagram: formData?.instagram,
            snapchat: formData?.snapchat,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      setUserData((prev) => ({
        ...data.user,
        posts: prev?.posts || [],
      }));

      setIsEdit(false);
      setUsernameAvailable(true);
      setUsernameAlreadyTaken(false);
      localStorage.setItem("userData", JSON.stringify(data.user));
      localStorage.setItem("userDataCachedAt", Date.now().toString());
    } catch (err) {
      console.error("Failed to update account.", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!file) return;

    const signRes = await fetch("/api/signprofilepicture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folder: "profilePictures" }),
    });

    const { timestamp, signature, apiKey, folder } = await signRes.json();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await uploadRes.json();
    return data.secure_url;
  };

  const isUsernameAvailable = async (username: string) => {
    if (!username || username === userData?.username) {
      setUsernameAvailable(true);
      setUsernameAlreadyTaken(false);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const res = await fetch(
        `/api/register/member?username=${encodeURIComponent(username)}`
      );
      const data = await res.json();
      if (data.usernameExists) {
        setUsernameAvailable(false);
        setUsernameAlreadyTaken(true);
      } else {
        setUsernameAlreadyTaken(false);
        setUsernameAvailable(true);
      }
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!firebaseUser) return;

    try {
      const res = await fetch(`/api/user/posts`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          postId: postId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete post");

      setUserData((prev) => {
        if (!prev?.posts) return prev;
        return {
          ...prev,
          posts: prev.posts.filter((post) => post._id !== postId),
        };
      });

      console.log("Post deleted successfully.");
    } catch (err) {
      console.error("Failed to delete post.", err);
    }
  };

  useEffect(() => {
    const newUsername = formData?.username;
    if (!newUsername || newUsername === userData?.username) return;

    const delay = setTimeout(() => {
      isUsernameAvailable(newUsername);
    }, 800);

    return () => clearTimeout(delay);
  }, [formData?.username, userData?.username]);

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadProfilePicture(file);

      const res = await fetch(`/api/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          updates: { profilePicture: imageUrl },
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to update profile picture");

      setUserData((prev) => ({
        ...data.user,
        posts: prev?.posts || [],
      }));
      setFormData((prev) => ({
        ...data.user,
        posts: prev?.posts || [],
      }));
    } catch (err) {
      console.error("Failed to upload profile picture.", err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-gray-300 border-t-[#bd9864ff] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your account...</p>
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

  function getBackgroundColor(bgColor: string): string {
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128 ? "#000000" : "#ffffff";
  }

  return (
    <>
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10 min-h-[85vh]">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800 text-center">
            Account
          </h2>
        </div>

        <div className="flex-1 space-y-4 md:flex justify-around gap-1 bg-white shadow-sm rounded-xl p-2 md:p-8 mb-8 border border-gray-100">
          <div className="lg:w-lg p-5">
            <div className="flex gap-5">
              <div className="flex flex-col w-fit items-center">
                <div className="relative">
                  <div className="w-32 h-32">
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
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="absolute bottom-0 right-0 bg-[#bd9864ff] text-white p-2.5 rounded-full shadow-md hover:bg-[#9a6f0bff] hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    title="Change profile picture"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
              </div>
              <div className="flex flex-col items-start space-y-6 w-full relative">
                {!isEdit ? (
                  <div className="w-full relative">
                    <div className="absolute right-0 justify-end mb-3">
                      <button
                        onClick={() => setIsEdit(true)}
                        className="bg-[#bd9864ff] hover:bg-[#9a6f0bff] text-white px-4 py-1 rounded-md font-medium transition-colors duration-200 cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="space-y-2 w-full">
                      <h3 className="text-2xl font-semibold text-gray-800">
                        {userData.name}
                      </h3>
                      <p className="text-gray-500">@{userData.username}</p>
                      <p className="text-gray-600">{userData.email}</p>

                      {userData.bio && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-gray-700 italic">
                            &apos;{userData.bio}&apos;
                          </p>
                        </div>
                      )}

                      <div className="flex gap-5 mt-5">
                        {userData.instagram ? (
                          <a
                            href={`https://instagram.com/${userData.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-xl text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                          >
                            <Image
                              src={instagram}
                              width={30}
                              height={30}
                              alt="Instagram"
                              className="shadow-md"
                            />
                          </a>
                        ) : null}

                        {userData.snapchat ? (
                          <a
                            href={`https://snapchat.com/add/${userData.snapchat}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                          >
                            <Image
                              src={snapchat}
                              width={30}
                              height={30}
                              alt="Snapchat"
                              className="rounded-full shadow-md"
                            />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-md space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData?.name || ""}
                        onChange={(e) =>
                          setFormData((prev) =>
                            prev ? { ...prev, name: e.target.value } : null
                          )
                        }
                        className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-[#bd9864ff] focus:border-[#bd9864ff] focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={formData?.username || ""}
                        onChange={(e) => {
                          const newUsername = e.target.value;
                          setFormData((prev) =>
                            prev ? { ...prev, username: newUsername } : null
                          );
                        }}
                        className={`w-full border ${
                          formData?.username &&
                          formData.username !== userData?.username
                            ? usernameAlreadyTaken
                              ? "border-red-400 focus:ring-red-400 focus:border-red-400"
                              : usernameAvailable
                              ? "border-green-400 focus:ring-green-400 focus:border-green-400"
                              : "border-gray-300 focus:ring-[#bd9864ff] focus:border-[#bd9864ff]"
                            : "border-gray-300 focus:ring-[#bd9864ff] focus:border-[#bd9864ff]"
                        } px-4 py-2 rounded-md focus:ring-2 focus:outline-none transition-all`}
                      />
                      {isCheckingUsername &&
                        formData?.username !== userData?.username && (
                          <p className="text-xs text-gray-500 mt-1">
                            Checking availability...
                          </p>
                        )}
                      {!isCheckingUsername &&
                        formData?.username &&
                        formData.username !== userData?.username && (
                          <>
                            {usernameAlreadyTaken && (
                              <p className="text-xs text-red-600 mt-1">
                                Username is already taken
                              </p>
                            )}
                            {usernameAvailable && !usernameAlreadyTaken && (
                              <p className="text-xs text-green-600 mt-1">
                                Username is available
                              </p>
                            )}
                          </>
                        )}
                    </div>

                    <div className="w-full space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Instagram
                        </label>
                        <input
                          type="text"
                          value={formData?.instagram || ""}
                          onChange={(e) =>
                            setFormData((prev) =>
                              prev
                                ? { ...prev, instagram: e.target.value }
                                : null
                            )
                          }
                          className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-[#bd9864ff] focus:border-[#bd9864ff] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="w-full max-w-md space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Snapchat
                        </label>
                        <input
                          type="text"
                          value={formData?.snapchat || ""}
                          onChange={(e) =>
                            setFormData((prev) =>
                              prev
                                ? { ...prev, snapchat: e.target.value }
                                : null
                            )
                          }
                          className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-[#bd9864ff] focus:border-[#bd9864ff] focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bio
                      </label>
                      <textarea
                        value={formData?.bio || ""}
                        onChange={(e) =>
                          setFormData((prev) =>
                            prev ? { ...prev, bio: e.target.value } : null
                          )
                        }
                        rows={3}
                        className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-2 focus:ring-[#bd9864ff] focus:border-[#bd9864ff] focus:outline-none transition-all resize-none"
                      />
                    </div>

                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="w-full bg-[#bd9864ff] text-white font-medium py-2 rounded-md hover:bg-[#9a6f0bff] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      onClick={() => setIsEdit(false)}
                      className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-200 transition-colors duration-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="border-1 min-w-[300px] rounded-xl shadow-lg border-gray-100 p-5">
            <div className="flex flex-col space-y-4">
              <div className="flex gap-4 justify-around bg-gray-50 md:flex-col md:space-y-4 md:mt-3 px-3 py-5 rounded-lg shadow-xl">
                <Link href={"/account/friends"}>
                  <div className="text-center cursor-pointer">
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {userData.followers?.length || 0}
                    </h3>
                    <p>
                      {userData.followers?.length == 1
                        ? "follower"
                        : "followers"}
                    </p>
                  </div>
                </Link>
                <Link href={"/account/friends"}>
                  <div className="text-center cursor-pointer">
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {userData.following?.length || 0}
                    </h3>
                    <p>
                      {userData.following?.length == 1
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
              <h3 className="text-2xl font-semibold text-gray-800">My Posts</h3>
            </div>
            <div className="px-3 py-1 rounded-full text-sm bg-yellow-600 hover:bg-yellow-700 cursor-pointer text-white">
              <button
                className="cursor-pointer"
                onClick={() => router.push("/account/createPost")}
              >
                New Post
              </button>
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
                    className="cursor-pointer border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex relative items-center justify-between">
                      <div>
                        <h4
                          className="text-lg font-semibold"
                          onClick={() => router.push(`/post/${post._id}`)}
                        >
                          {post.title}
                        </h4>
                      </div>

                      <div className="">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-ellipsis-vertical-icon lucide-ellipsis-vertical cursor-pointer"
                          onClick={() =>
                            setOpenMenuPostId(
                              openMenuPostId === post._id ? null : post._id
                            )
                          }
                        >
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </div>

                      {openMenuPostId === post._id && (
                        <div
                          className="absolute top-6 right-0 z-10 px-3 py-1 rounded-md text-sm cursor-pointer transition-colors duration-200 hover:bg-red-700 hover:text-white"
                          onClick={() => handleDelete(post._id)}
                          style={{
                            backgroundColor: getTextColor(
                              post.color || "#ffffff"
                            ),
                            color: getBackgroundColor(
                              getTextColor(post.color || "#ffffff")
                            ),
                          }}
                        >
                          Delete
                        </div>
                      )}
                    </div>
                    <span className="text-xs mb-2">{readingTime} min read</span>

                    <p
                      className="text-sm mb-3 leading-relaxed"
                      onClick={() => router.push(`/post/${post._id}`)}
                      dangerouslySetInnerHTML={{
                        __html:
                          post.content?.length > 120
                            ? post.content.slice(0, 120) + "..."
                            : post.content,
                      }}
                    ></p>

                    {post.picture && (
                      <div
                        className="relative w-full h-48 mb-3 rounded-md overflow-hidden"
                        onClick={() => router.push(`/post/${post._id}`)}
                      >
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
