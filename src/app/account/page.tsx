"use client";

import { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface User {
  name: string;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  posts?: Post[];
}

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  likes: number;
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
      setUserData(data.user);
      setFormData(data.user);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!firebaseUser) return;

    if (formData?.username !== userData?.username) {
      if (!usernameAvailable || usernameAlreadyTaken) {
        alert("Please choose an available username.");
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
          updates: formData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");

      setUserData(data.user);
      setIsEdit(false);
      setUsernameAvailable(true);
      setUsernameAlreadyTaken(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update account.");
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

  useEffect(() => {
    const newUsername = formData?.username;
    if (!newUsername || newUsername === userData?.username) return;

    const delay = setTimeout(() => {
      isUsernameAvailable(newUsername);
    }, 800);

    return () => clearTimeout(delay);
  }, [formData?.username]);

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

      setUserData(data.user);
      setFormData(data.user);
    } catch (err) {
      console.error(err);
      alert("Failed to upload profile picture.");
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

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10 min-h-[85vh]">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-1">My Account</h2>
          <div className="h-0.5 w-20 bg-gradient-to-r from-[#bd9864ff] to-transparent"></div>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-8 mb-8 border border-gray-100">
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
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute bottom-0 right-0 bg-[#bd9864ff] text-white p-2.5 rounded-full shadow-md hover:bg-[#9a6f0bff] hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {!isEdit ? (
              <div className="text-center space-y-2 w-full">
                <h3 className="text-2xl font-semibold text-gray-800">
                  {userData.name}
                </h3>
                <p className="text-gray-500">@{userData.username}</p>
                <p className="text-gray-600 text-sm">{userData.email}</p>
                {userData.bio && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-700 italic">"{userData.bio}"</p>
                  </div>
                )}
                <button
                  onClick={() => setIsEdit(true)}
                  className="mt-6 bg-[#bd9864ff] hover:bg-[#9a6f0bff] text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
                >
                  Edit Profile
                </button>
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
                  className="w-full bg-[#bd9864ff] text-white font-medium py-2 rounded-md hover:bg-[#9a6f0bff] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>

                <button
                  onClick={() => setIsEdit(false)}
                  className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-2xl font-semibold text-gray-800">My Posts</h3>
            </div>
            <div className="px-3 py-1 rounded-md text-sm bg-green-600 hover:bg-green-700 cursor-pointer text-white">
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
              {userData.posts.map((post) => (
                <div
                  key={post._id}
                  className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow duration-200"
                >
                  <h4 className="text-lg font-semibold mb-2 text-gray-800">
                    {post.title}
                  </h4>
                  <p
                    className="text-gray-600 text-sm mb-3 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html:
                        post.content.length > 120
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
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
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
              ))}
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
