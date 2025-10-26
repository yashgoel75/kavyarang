"use client";

import Header from "@/components/header/page";
import Navigation from "@/components/navigation/page";
import Footer from "@/components/footer/page";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  tags?: string[];
  author: User;
  likes: number;
  comments: string[];
  createdAt: string;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/search?query=${encodeURIComponent(query)}`
        );
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Search failed");

        setUsers(data.users || []);
        setPosts(data.posts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8 min-h-[90vh]">
        <h1 className="text-2xl font-semibold mb-6">
          Search Results for &quot;{query}&quot;
        </h1>

        {loading && <p className="text-gray-500">Loading results...</p>}

        {!loading && users.length === 0 && posts.length === 0 && (
          <p className="text-gray-500">No results found.</p>
        )}

        {users.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">Users</h2>
            <div className="space-y-4">
              {users.map((user) => (
                <Link
                  key={user._id}
                  href={`/user/${user.username}`}
                  className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50 transition"
                >
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="rounded-full w-10 h-10 object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-semibold">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                    {user.bio && (
                      <p className="text-sm text-gray-400 line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3">Posts</h2>
            <div className="space-y-5">
              {posts.map((post) => (
                <Link
                  key={post._id}
                  href={`/post/${post._id}`}
                  className="block p-4 border rounded-md hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    {post.author.profilePicture ? (
                      <Image
                        src={post.author.profilePicture}
                        alt={post.author.name}
                        width={30}
                        height={30}
                        className="rounded-full w-10 h-10 object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-semibold text-sm">
                        {getInitials(post.author.name)}
                      </div>
                    )}
                    <p className="text-sm text-gray-700">
                      {post.author.name} · @{post.author.username}
                    </p>
                  </div>

                  <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                  <p
                    className="text-gray-600 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html:
                        post.content?.length > 200
                          ? post.content.slice(0, 200) + "..."
                          : post.content,
                    }}
                  ></p>

                  {post.picture && (
                    <div className="mt-2">
                      <Image
                        src={post.picture}
                        alt="Post image"
                        width={500}
                        height={300}
                        className="rounded-md"
                      />
                    </div>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-200 px-2 py-1 rounded-md text-gray-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <Navigation />
      <Footer />
    </>
  );
}