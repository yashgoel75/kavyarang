import mongoose from "mongoose";

const { Schema } = mongoose;

const CommentSchema = new Schema({
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
}, { timestamps: true });


const PostSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    picture: String,
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    likes: { type: Number, default: 0 },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
}, { timestamps: true });


const UserSchema = new Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    posts: [PostSchema],
    bio: String,
    profilePicture: String,
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);
export const Comment = mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
