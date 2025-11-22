import React, { useState } from "react";
import PostCard from "./PostCard"; // Assuming this exists
import { User, Post } from "@/hooks/useDashboard";
import { useRouter } from "next/navigation";
import { getTextColor, getIconColor, getCommentColor } from "@/lib/utils";
import { User as FirebaseUser } from "firebase/auth";

interface FeedProps {
  posts: Post[] | null;
  userData: User | null;
  firebaseUser: FirebaseUser;
  likedPosts: Record<string, boolean>;
  bookmarkedPosts: Record<string, boolean>;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingPosts: boolean;
}

export default function PostFeed({
  posts,
  userData,
  firebaseUser,
  likedPosts,
  bookmarkedPosts,
  onLike,
  onBookmark,
  onLoadMore,
  hasMore,
  loadingPosts,
}: FeedProps) {
  const [filter, setFilter] = useState<"ALL" | "FRIENDS">("ALL");
  const router = useRouter();

  const getInitials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";

  // Filter logic
  const displayPosts =
    filter === "ALL"
      ? posts
      : posts?.filter((p) => userData?.following?.includes(p.author.email));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {userData?.name || "User"} 👋
        </h1>
        <p className="text-gray-600">
          Discover amazing content from the community
        </p>
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setFilter("ALL")}
          className={`border px-3 py-1 rounded-md cursor-pointer transition ${
            filter === "ALL"
              ? "bg-yellow-400 border-yellow-400 text-yellow-900"
              : "hover:border-yellow-400"
          }`}
        >
          Recents
        </button>
        <button
          onClick={() => setFilter("FRIENDS")}
          className={`border px-3 py-1 rounded-md cursor-pointer transition ${
            filter === "FRIENDS"
              ? "bg-yellow-400 border-yellow-400 text-yellow-900"
              : "hover:border-yellow-400"
          }`}
        >
          Friends
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayPosts?.length ? (
          displayPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              firebaseUser={firebaseUser}
              userData={userData}
              likedPosts={likedPosts}
              bookmarkedPosts={bookmarkedPosts}
              handleLike={onLike}
              handleBookmark={onBookmark}
              getTextColor={getTextColor}
              getIconColor={getIconColor}
              getCommentColor={getCommentColor}
              getInitials={getInitials}
              router={router}
            />
          ))
        ) : (
          <div className="col-span-full flex justify-center py-20 text-gray-500">
            {loadingPosts ? "Loading..." : "No posts found"}
          </div>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button
            onClick={onLoadMore}
            disabled={loadingPosts}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loadingPosts ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
