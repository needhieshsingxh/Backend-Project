import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId) {
    return res.status(404).json(new ApiError(404, "VideoId not found"));
  }

  const allComment = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        content: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "allComment",
      },
    },
    {
      $unwind: "$allComment",
    },
    {
      $sort: { createdAt: -1 }, 
    },
    {
      $limit: 10, 
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        "allComment.username": 1,
        "allComment.avatar": 1,
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, allComment, "Content found"));
});

const addComment = asyncHandler(async (req, res) => {
  
  const { videoId } = req.params;
  if (!videoId) {
    return res.status(404).json(new ApiError(200, "videoId doesn't exist"));
  }

  const userId = req.user._id;
  if (!userId) {
    return res.status(404).json(new ApiError(404, "UserId not found"));
  }

  const { content } = req.body;
  if (!content || content.trim() === "") {
    return res.status(400).json(new ApiError(400, "Content is required"));
  }

  const commentOnVideo = await Comment.create({
    content: content,
    video: videoId,
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, commentOnVideo, "Comment added"));
});

const updateComment = asyncHandler(async (req, res) => {
  
  const { content } = req.body;
  if (!content || content.trim() === "") {
    return res.status(404).json(new ApiError(404, "Comment is required"));
  }

  const { videoId, commentId } = req.params;
  if (!videoId) {
    return res.status(400).json(new ApiError(400, "VideoId invalid"));
  }

  if (!commentId) {
    return res.status(400).json(new ApiError(400, "commentId invalid"));
  }

  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json(new ApiError(404, "Invalid user"));
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: userId,
      video: videoId,
    },
    { $set: { content: content } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment update successful"));
});

const deleteComment = asyncHandler(async (req, res) => {
  

  const { videoId, commentId } = req.params;
  if (!videoId) {
    return res.status(400).json(new ApiError(400, "VideoId invalid"));
  }

  if (!commentId) {
    return res.status(400).json(new ApiError(400, "commentId invalid"));
  }

  const userId = req.user?._id;
  if (!userId) {
    return res.status(401).json(new ApiError(401, "Invalid user"));
  }

  const deleteComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: userId,
    video: videoId,
  });

  if (!deleteComment) {
    return res.status(404).json({
      message: "Action failed. Comment not found or unauthorized.",
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
