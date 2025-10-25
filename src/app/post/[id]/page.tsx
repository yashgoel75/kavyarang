"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Header from "@/components/header/page";
import Footer from "@/components/footer/page";
import Navigation from "@/components/navigation/page";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";

interface Author {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface Comment {
  _id: string;
  author: Author;
  content: string;
  likes: number;
  parentComment: string | null;
  createdAt: string;
  replies?: Comment[];
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
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (postId) {
      fetchPost(postId);
    }
  }, [postId]);

  const fetchPost = async (id: string) => {
    try {
      const res = await fetch(`/api/post?postId=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load post");
      setPost(data.post);

      if (firebaseUser?.email) {
        checkUserInteractions(id, firebaseUser.email);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkUserInteractions = async (postId: string, email: string) => {
    try {
      const res = await fetch(
        `/api/user/interactions?postId=${encodeURIComponent(
          postId
        )}&email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (res.ok) {
        setIsLiked(data.isLiked);
        setIsBookmarked(data.isBookmarked);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async () => {
    if (!firebaseUser || !post) return;

    try {
      const res = await fetch(`/api/post/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post._id,
          email: firebaseUser.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to like post");

      setIsLiked(!isLiked);
      setPost((prev) =>
        prev
          ? { ...prev, likes: isLiked ? prev.likes - 1 : prev.likes + 1 }
          : null
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async () => {
    if (!firebaseUser || !post) return;

    try {
      const res = await fetch(`/api/post/bookmark`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post._id,
          email: firebaseUser.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to bookmark post");

      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitComment = async () => {
    if (!firebaseUser || !post || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/post/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post._id,
          email: firebaseUser.email,
          content: commentText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");

      setCommentText("");
      fetchPost(postId);
    } catch (err) {
      console.error(err);
      alert("Failed to post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitReply = async (commentId: string) => {
    if (!firebaseUser || !post || !replyText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/post/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: post._id,
          email: firebaseUser.email,
          content: replyText,
          parentComment: commentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post reply");

      setReplyText("");
      setReplyTo(null);
      fetchPost(postId);
    } catch (err) {
      console.error(err);
      alert("Failed to post reply.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const organizeComments = (comments: Comment[]): Comment[] => {
    const commentMap: { [key: string]: Comment } = {};
    const rootComments: Comment[] = [];

    comments.forEach((comment) => {
      commentMap[comment._id] = { ...comment, replies: [] };
    });

    comments.forEach((comment) => {
      if (comment.parentComment) {
        const parent = commentMap[comment.parentComment];
        if (parent) {
          parent.replies!.push(commentMap[comment._id]);
        }
      } else {
        rootComments.push(commentMap[comment._id]);
      }
    });

    return rootComments;
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-gray-300 border-t-[#bd9864ff] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading post...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Header />
        <main className="flex items-center justify-center h-[70vh]">
          <p className="text-gray-600">Post not found.</p>
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

  const textColor = getTextColor(post.color || "#ffffff");
  const wordCount = post.content ? post.content.split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200) || 1;
  const organizedComments = organizeComments(post.comments || []);

  const renderComment = (comment: Comment, level: number = 0) => (
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
          {comment.author.profilePicture ? (
            <div className="relative w-10 h-10">
              <Image
                src={comment.author.profilePicture}
                alt={comment.author.name}
                fill
                className="rounded-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#bd9864ff] to-[#dbb56aff] text-sm font-semibold text-white">
              {comment.author.name.charAt(0).toUpperCase()}
            </div>
          )}
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
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#bd9864ff]">
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
              <span>{comment.likes}</span>
            </button>
            {firebaseUser && (
              <button
                onClick={() => setReplyTo(comment._id)}
                className="text-sm text-gray-500 hover:text-[#bd9864ff]"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#bd9864ff] focus:border-[#bd9864ff] focus:outline-none resize-none"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleSubmitReply(comment._id)}
                  disabled={isSubmittingComment || !replyText.trim()}
                  className="px-4 py-1 bg-[#bd9864ff] text-white text-sm rounded-md hover:bg-[#9a6f0bff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? "Posting..." : "Reply"}
                </button>
                <button
                  onClick={() => {
                    setReplyTo(null);
                    setReplyText("");
                  }}
                  className="px-4 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {comment.replies &&
            comment.replies.length > 0 &&
            comment.replies.map((reply) => renderComment(reply, level + 1))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10 min-h-[85vh]">
        <article
          style={{
            backgroundColor: post.color || "#ffffff",
            color: textColor,
          }}
          className="rounded-lg shadow-lg p-8 mb-8 border border-gray-100"
        >
          <div className="mb-6">
            <div
              className="flex items-center gap-3 mb-4 cursor-pointer"
              onClick={() => router.push(`/user/${post.author.username}`)}
            >
              {post.author.profilePicture ? (
                <div className="relative w-12 h-12">
                  <Image
                    src={post.author.profilePicture}
                    alt={post.author.name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#bd9864ff] to-[#dbb56aff] text-lg font-semibold text-white">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold hover:underline">
                  {post.author.name}
                </h3>
                <p className="text-sm opacity-75">@{post.author.username}</p>
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-3">{post.title}</h1>

            <div className="flex items-center gap-4 text-sm opacity-75">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>{readingTime} min read</span>
            </div>
          </div>

          {post.picture && (
            <div className="relative w-full h-96 mb-6 rounded-lg overflow-hidden">
              <Image
                src={post.picture}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div
            className="prose max-w-none mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content }}
          ></div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{
                    backgroundColor:
                      textColor === "#000000"
                        ? "rgba(0,0,0,0.1)"
                        : "rgba(255,255,255,0.2)",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleLike}
              disabled={!firebaseUser}
              className={`flex items-center gap-2 ${
                isLiked ? "text-red-500" : ""
              } hover:scale-110 transition-transform disabled:cursor-not-allowed`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold">{post.likes}</span>
            </button>

            <button
              onClick={handleBookmark}
              disabled={!firebaseUser}
              className={`flex items-center gap-2 ${
                isBookmarked ? "text-yellow-500" : ""
              } hover:scale-110 transition-transform disabled:cursor-not-allowed`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill={isBookmarked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-semibold">
                {post.comments?.length || 0}
              </span>
            </div>
          </div>
        </article>

        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Comments ({post.comments?.length || 0})
          </h2>

          {firebaseUser ? (
            <div className="mb-8">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full border border-gray-300 rounded-md px-4 py-3 focus:ring-2 focus:ring-[#bd9864ff] focus:border-[#bd9864ff] focus:outline-none resize-none"
                rows={3}
              />
              <button
                onClick={handleSubmitComment}
                disabled={isSubmittingComment || !commentText.trim()}
                className="mt-3 px-6 py-2 bg-[#bd9864ff] text-white rounded-md hover:bg-[#9a6f0bff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingComment ? "Posting..." : "Post Comment"}
              </button>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-gray-50 rounded-md text-center">
              <p className="text-gray-600">
                Please log in to comment on this post.
              </p>
            </div>
          )}

          {organizedComments.length > 0 ? (
            <div className="space-y-2">
              {organizedComments.map((comment) => renderComment(comment))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          )}
        </div>
      </main>
      <Navigation />
      <Footer />
    </>
  );
}
