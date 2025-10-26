"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Bookmarks() {
  interface User {
    _id: string;
    name: string;
    username: string;
    email: string;
    bio?: string;
    profilePicture?: string;
    bookmarks?: string[];
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
    author: string;
  }

  interface PostWithAuthor extends Omit<Post, "author"> {
    author: {
      _id: string;
      name: string;
      profilePicture?: string;
    };
  }

  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [postsWithAuthors, setPostsWithAuthors] = useState<PostWithAuthor[]>(
    []
  );
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        `/api/getUserByEmail?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load user data");
      setUserData(data.user);

      if (data.user?.bookmarks?.length > 0) {
        const postsRes = await fetch(
          `/api/posts?ids=${data.user.bookmarks.join(",")}`
        );
        const postsData = await postsRes.json();
        if (!postsRes.ok)
          throw new Error(postsData.error || "Failed to load bookmarked posts");

        await fetchAuthorsForPosts(postsData.posts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuthorsForPosts = async (posts: Post[]) => {
    try {
      const postsWithAuthorData = await Promise.all(
        posts.map(async (post) => {
          try {
            const authorRes = await fetch(
              `/api/getUserByObjectId?objectId=${post.author}`
            );
            if (authorRes.ok) {
              const authorData = await authorRes.json();
              return {
                ...post,
                author: {
                  _id: post.author,
                  name: authorData.user?.name || "Anonymous",
                  profilePicture: authorData.user?.profilePicture,
                },
              };
            } else {
              throw new Error("Failed to fetch author");
            }
          } catch (error) {
            console.error(`Failed to fetch author ${post.author}:`, error);
            return {
              ...post,
              author: {
                _id: post.author,
                name: "Unknown User",
                profilePicture: undefined,
              },
            };
          }
        })
      );
      setPostsWithAuthors(postsWithAuthorData);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  const getTextColor = (bgColor: string) => {
    const color = bgColor.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? "#000000" : "#ffffff";
  };

  const getBackgroundColor = (textColor: string) =>
    textColor === "#000000" ? "#ffffff" : "#000000";

  const getInitials = (name: string) => {
    if (!name || name === "Unknown User") return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleDelete = async (postId: string) => {
    if (!firebaseUser?.email) return;

    try {
      const res = await fetch("/api/bookmark/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: firebaseUser.email,
          postId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove bookmark");
      }

      setPostsWithAuthors((prev) => prev.filter((post) => post._id !== postId));

      console.log(`Bookmark for post ${postId} removed successfully`);
    } catch (error) {
      console.error("Error removing bookmark:", error);
      alert("Failed to remove bookmark. Please try again.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-10 px-5 md:px-20">
        <h2 className="text-3xl font-bold mb-8 text-center">Your Bookmarks</h2>

        {postsWithAuthors.length === 0 ? (
          <p className="text-center text-gray-500">
            You haven&rsquo;t bookmarked any posts yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {postsWithAuthors.map((post) => {
              const readingTime = Math.ceil(
                post.content.split(" ").length / 200
              );

              return (
                <div
                  key={post._id}
                  style={{
                    backgroundColor: post.color || "#ffffff",
                    color: getTextColor(post.color || "#ffffff"),
                  }}
                  className="border border-gray-200 rounded-xl shadow-md p-5 hover:shadow-lg transition-shadow duration-300 relative flex flex-col"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => router.push(`/user/${userData?.username}`)}
                    >
                      {post.author.profilePicture ? (
                        <Image
                          src={post.author.profilePicture}
                          alt={post.author.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover w-12 h-12"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-semibold text-sm">
                          {getInitials(post.author.name)}
                        </div>
                      )}
                      <span className="font-medium">{post.author.name}</span>
                    </div>

                    <div>
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
                        className="cursor-pointer"
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
                        className="absolute top-12 right-5 px-3 py-1 rounded-md text-sm cursor-pointer transition-colors duration-200 hover:bg-red-700 hover:text-white z-10"
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

                  <div className="flex-grow cursor-pointer" onClick={() => router.push(`/post/${post._id}`)}>
                    <h4 className="text-xl font-semibold mb-2">{post.title}</h4>
                    <span className="text-xs mb-2 block">
                      {readingTime} min read
                    </span>
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
                  </div>

                  <div
                    className="flex items-center justify-between mt-4 pt-3 border-t text-sm"
                    style={{
                      borderColor: getTextColor(post.color || "#ffffff") + "20",
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-red-500"
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
                    <button className="text-blue-600 hover:underline text-sm font-medium">
                      Like
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Navigation />
      <Footer />
    </>
  );
}
