"use client";

import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Heart, Bookmark, MessageCircle } from "lucide-react";

interface Author {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
  isVerified: boolean;
}

interface Comment {
  _id: string;
  author: Author;
  content: string;
  likes: number;
  parentComment: string | null;
  createdAt: string;
  replies: Comment[];
}

interface Post {
  _id: string;
  title: string;
  content: string;
  picture?: string;
  author: Author;
  tags: string[];
  likes: number;
  color: string;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  const [organizedComments, setOrganizedComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setFirebaseUser(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (postId) fetchPost(postId);
  }, [postId]);

  const organizeComments = (comments: Comment[]): Comment[] => {
    const map: Record<string, Comment> = {};
    const roots: Comment[] = [];

    comments.forEach((c) => {
      map[c._id] = { ...c, replies: [] };
    });

    comments.forEach((c) => {
      if (c.parentComment) {
        const parent = map[c.parentComment];
        if (parent) parent.replies.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });

    return roots;
  };

  const fetchPost = async (id: string) => {
    try {
      const res = await fetch(`/api/post?postId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const mergedPost = {
        ...data.post,
        comments: data.comments || [],
      };

      setPost(mergedPost);
      setOrganizedComments(organizeComments(mergedPost.comments));

      if (firebaseUser?.email) {
        checkUserInteractions(id, firebaseUser.email);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const checkUserInteractions = async (postId: string, email: string) => {
    try {
      const res = await fetch(
        `/api/interactions?email=${encodeURIComponent(
          email
        )}&postIds=${encodeURIComponent(JSON.stringify([postId]))}`
      );
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.likes.includes(postId));
        setIsBookmarked(data.bookmarks.includes(postId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLike = async () => {
    if (!firebaseUser || !post) return;

    try {
      const res = await fetch("/api/post/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post._id, email: firebaseUser.email }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setIsLiked((prev) => !prev);
      setPost((prev) => (prev ? { ...prev, likes: data.likes } : prev));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookmark = async () => {
    if (!firebaseUser || !post) return;

    try {
      const res = await fetch("/api/post/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post._id, email: firebaseUser.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsBookmarked((prev) => !prev);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitComment = async () => {
    if (!firebaseUser || !post || !commentText.trim()) return;

    setIsSubmittingComment(true);

    try {
      const res = await fetch("/api/post/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          email: firebaseUser.email,
          content: commentText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Add to post
      setPost((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data.comment] } : prev
      );

      // Add to organizedComments as root
      setOrganizedComments((prev) => [
        ...prev,
        { ...data.comment, replies: [] },
      ]);

      setCommentText("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!firebaseUser || !post || !replyText.trim()) return;

    setIsSubmittingComment(true);

    try {
      const res = await fetch("/api/post/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post._id,
          email: firebaseUser.email,
          content: replyText,
          parentComment: parentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Update full comments list
      setPost((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data.comment] } : prev
      );

      // Insert reply into tree
      setOrganizedComments((prev) => {
        const clone = structuredClone(prev);

        const insert = (list: Comment[]): boolean => {
          for (const c of list) {
            if (c._id === parentId) {
              c.replies.push({ ...data.comment, replies: [] });
              return true;
            }
            if (insert(c.replies)) return true;
          }
          return false;
        };

        insert(clone);
        return clone;
      });

      setReplyText("");
      setReplyTo(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getInitials = (name: string) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const getTextColor = (hex: string) => {
    hex = hex.replace("#", "");
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000" : "#fff";
  };

  const renderComment = useCallback(
    (comment: Comment, level = 0) => (
      <div
        key={comment._id}
        className={`${
          level > 0 ? "ml-8 mt-4" : "mt-6"
        } border-l-2 border-gray-200 pl-4`}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 cursor-pointer"
            onClick={() => router.push(`/user/${comment.author.username}`)}
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              {comment.author.profilePicture ? (
                <Image
                  src={comment.author.profilePicture}
                  alt={comment.author.name}
                  fill
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#bd9864ff] to-[#dbb56aff] text-sm font-semibold text-white">
                  {getInitials(comment.author.name)}
                </div>
              )}

              {comment.author.isVerified && (
                <div className="absolute bottom-0 right-0 bg-green-700 rounded-full p-[3px]">
                  <Check size={10} color="white" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className="font-semibold text-gray-800 cursor-pointer hover:underline"
                onClick={() => router.push(`/user/${comment.author._id}`)}
              >
                {comment.author.name}
              </span>
              <span className="text-gray-500 text-sm">
                @{comment.author.username}
              </span>
              <span className="text-gray-400 text-xs">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="text-gray-700 mt-1">{comment.content}</p>

            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1 text-sm text-gray-500">
                ❤️ {comment.likes}
              </span>

              {firebaseUser && (
                <button
                  className="text-sm text-gray-500 hover:text-[#bd9864ff]"
                  onClick={() => setReplyTo(comment._id)}
                >
                  Reply
                </button>
              )}
            </div>

            {replyTo === comment._id && (
              <div className="mt-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.author.name}...`}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleSubmitReply(comment._id)}
                    disabled={!replyText.trim() || isSubmittingComment}
                    className="px-4 py-1 bg-[#bd9864ff] text-white text-sm rounded-md"
                  >
                    {isSubmittingComment ? "Posting..." : "Reply"}
                  </button>
                  <button
                    onClick={() => {
                      setReplyTo(null);
                      setReplyText("");
                    }}
                    className="px-4 py-1 bg-gray-200 text-sm rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {comment.replies?.map((reply) => renderComment(reply, level + 1))}
          </div>
        </div>
      </div>
    ),
    [replyTo, replyText, isSubmittingComment, firebaseUser]
  );

  if (loading)
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-10 min-h-[85vh]">
          <article className="rounded-lg shadow-lg p-8 mb-8 bg-white animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gray-300 rounded-full" />

              <div className="space-y-2">
                <div className="w-32 h-4 bg-gray-300 rounded"></div>
                <div className="w-20 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>

            <div className="w-3/4 h-8 bg-gray-300 rounded mb-4"></div>

            <div className="flex gap-4 mb-6">
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
              <div className="w-10 h-4 bg-gray-200 rounded"></div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>

            <div className="w-full h-80 bg-gray-300 rounded-lg mb-6"></div>

            <div className="space-y-3 mb-6">
              <div className="w-full h-4 bg-gray-300 rounded"></div>
              <div className="w-5/6 h-4 bg-gray-300 rounded"></div>
              <div className="w-4/6 h-4 bg-gray-200 rounded"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
            </div>

            <div className="flex gap-3 mb-6">
              <div className="w-16 h-6 bg-gray-300 rounded-full"></div>
              <div className="w-14 h-6 bg-gray-300 rounded-full"></div>
              <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
            </div>

            <div className="flex gap-6 pt-6 border-t">
              <div className="w-16 h-4 bg-gray-300 rounded"></div>
              <div className="w-10 h-4 bg-gray-300 rounded"></div>
              <div className="w-16 h-4 bg-gray-300 rounded"></div>
            </div>
          </article>

          <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
            <div className="w-40 h-6 bg-gray-300 rounded mb-6"></div>

            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 mb-6">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1 space-y-3">
                  <div className="w-32 h-4 bg-gray-300 rounded"></div>
                  <div className="w-full h-4 bg-gray-200 rounded"></div>
                  <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
        <Footer />
      </>
    );

  if (!post)
    return (
      <>
        <Header />
        <main className="flex items-center justify-center h-[70vh]">
          Post not found.
        </main>
        <Footer />
      </>
    );

  const textColor = getTextColor(post.color || "#ffffff");
  const hoverBg = textColor === "#000" ? "bg-black/10" : "bg-white/20";

  const readingTime = Math.max(
    1,
    Math.ceil((post.content?.split(/\s+/).length || 0) / 200)
  );

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10 min-h-[85vh]">
        <article
          style={{ backgroundColor: post.color, color: textColor }}
          className="rounded-lg shadow-lg p-8 mb-8"
        >
          <div className="mb-6">
            <div
              className="flex items-center gap-3 mb-4 cursor-pointer"
              onClick={() => router.push(`/user/${post.author.username}`)}
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                {post.author.profilePicture ? (
                  <Image
                    src={post.author.profilePicture}
                    fill
                    alt={post.author.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#bd9864] text-white text-lg font-semibold">
                    {getInitials(post.author.name)}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold hover:underline">
                  {post.author.name}
                </h3>
                <p className="text-sm opacity-75">@{post.author.username}</p>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-3">{post.title}</h1>

            <div className="flex items-center gap-4 opacity-75 text-sm">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{readingTime} min read</span>
            </div>
          </div>
          {post.picture && (
            <div className="relative w-full h-96 rounded-lg overflow-hidden mb-6">
              <Image
                src={post.picture}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div
            className="prose max-w-none mb-6"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {post.tags?.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-black/10 text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 pt-6 border-t border-white/30">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition 
    ${hoverBg} hover:scale-105 active:scale-95`}
              style={{ color: isLiked ? "#e63946" : textColor }}
            >
              <Heart
                size={20}
                className={`${isLiked ? "fill-[#e63946]" : "fill-none"}`}
              />
              <span className="font-medium">{post.likes}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition 
    ${hoverBg} hover:scale-105 active:scale-95`}
              style={{ color: isBookmarked ? "#f4d03f" : textColor }}
            >
              <Bookmark
                size={20}
                className={`${isBookmarked ? "fill-[#f4d03f]" : "fill-none"}`}
              />
              <span className="font-medium">
                {isBookmarked ? "Saved" : "Save"}
              </span>
            </button>

            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg`}
              style={{ color: textColor }}
            >
              <MessageCircle size={20} className="opacity-80" />
              <span className="font-medium">{post.comments.length}</span>
            </div>
          </div>
        </article>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">
            Comments ({post.comments.length})
          </h2>

          {firebaseUser ? (
            <div className="mb-8">
              <textarea
                className="w-full border rounded-md px-4 py-2"
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isSubmittingComment}
                className="mt-3 px-6 py-2 bg-[#bd9864] text-white rounded-md"
              >
                {isSubmittingComment ? "Posting..." : "Post Comment"}
              </button>
            </div>
          ) : (
            <div className="mb-8 text-center text-gray-600">
              Please log in to comment.
            </div>
          )}

          {organizedComments.length > 0 ? (
            organizedComments.map((c) => renderComment(c))
          ) : (
            <div className="text-center text-gray-500">No comments yet.</div>
          )}
        </div>
      </main>

      <Navigation />
      <Footer />
    </>
  );
}
