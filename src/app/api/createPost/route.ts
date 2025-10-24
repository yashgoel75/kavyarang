import { NextRequest, NextResponse } from "next/server";
import { User } from "../../../../db/schema";
import { register } from "@/instrumentation";

interface CreatePostRequest {
  title: string;
  content: string;
  picture?: string | null;
    email: string;
}

export async function POST(req: NextRequest) {
  await register();

  try {
    const body: CreatePostRequest = await req.json();
    const { title, content, picture, email } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to associate the post with a user." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const newPost = {
      title,
      content,
      picture: picture || null,
      author: user._id,
      likes: 0,
      comments: [],
    };

    user.posts.push(newPost);
    await user.save();

    return NextResponse.json(
      { message: "Post created successfully", post: newPost },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating post:", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
