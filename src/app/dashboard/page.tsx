"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";
import { useState, useEffect } from "react";
import { getAuth, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  likes: number;
  color: string;
}

export default function dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user?.email) {
        fetchUserName(user.email);
      } else {
        router.replace("/");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserName = async (email: string) => {
    try {
      // const token = await getFirebaseToken();
      const response = await fetch(
        `/api/user?email=${encodeURIComponent(email)}`,
        {
          headers: {
            // Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch user name");
      setDisplayName(data.name);
      console.log("Fetched user name:", data.name);
    } catch (err) {
      console.error(err);
    }
  };

  const [posts, setPosts] = useState<Post[] | null>();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`/api/getPosts`);
        const data = await res.json();
        const filteredPosts = data.posts.filter((post: Post) => {
          return post.picture != null;
        });
        console.log(filteredPosts);
        setPosts(filteredPosts);
      } catch (error: unknown) {
        console.log(error);
      }
    };
    fetchPosts();
  }, []);

  return (
    <>
      <Header />
      <div className="relative min-h-screen flex items-center justify-center">
        My name is {displayName}
      </div>
      <Navigation />
      <Footer />
    </>
  );
}
