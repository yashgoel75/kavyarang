import { NextRequest, NextResponse } from "next/server";
import { register } from "@/instrumentation";
import { Post, User } from "../../../../../db/schema";

export async function POST(req: NextRequest) {
  try {
    await register();

    const { postId, email } = await req.json();

    if (!postId || !email) {
      return NextResponse.json(
        { error: "Post ID and email are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const post = await Post.findById(postId).populate("author");
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const hasLiked = user.likes?.includes(postId);

    if (hasLiked) {
      await User.updateOne({ email }, { $pull: { likes: postId } });
      post.likes = Math.max(0, post.likes - 1);
    } else {
      await User.updateOne({ email }, { $addToSet: { likes: postId } });
      post.likes += 1;

      if (post.author.email !== email) {
        const notification = {
          id: new Date().getTime().toString(),
          type: "post_like",
          fromEmail: email,
          postId: post._id,
          read: false,
          createdAt: new Date(),
        };

        await User.updateOne(
          { email: post.author.email },
          { $push: { notifications: notification } }
        );
      }
    }

    await post.save();

    return NextResponse.json(
      { message: hasLiked ? "Post unliked" : "Post liked", likes: post.likes },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
