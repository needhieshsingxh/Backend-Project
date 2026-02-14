import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res
      .status(400)
      .json(
        new ApiError(400, "Name and description required to create a playlist")
      );
  }

  const userId = req.user?._id;

  if (!userId) {
    return res.status(400).json(new ApiError(400, "Invalid userId"));
  }

  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Invalid VideoId"));
  }

  const playlist = await Playlist.create({
    name,
    description,
    videos: videoId ? [videoId] : [],
    owner: userId,
  });

  if (!playlist) {
    return res.status(500).json(new ApiError(500, "Failed to create playlist"));
  }

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully!"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId || !isValidObjectId(userId)) {
    return res.status(400).json(new ApiError(400, "Invalid UserId"));
  }

  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  if (!userPlaylists || userPlaylists.length === 0) {
    return res.status(404).json(new ApiError(404, "Playlist not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "User Playlist found successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    return res.status(400).json(new ApiError(400, "Invalid playlistId"));
  }

  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json(new ApiError(400, "Invalid UserId"));
  }

  const playlistById = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  if (!playlistById || playlistById.length === 0) {
    return res
      .status(404)
      .json(new ApiError(404, "No playlists found for this user"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, playlistById, "User playlists found successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    return res.status(400).json(new ApiError(400, "Invalid Playlist Id"));
  }

  if (!videoId || !isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Invalid Video Id"));
  }

  const userId = req.user?._id;

  if (!userId) {
    return res.status(400).json(new ApiError(400, "Invalid UserId"));
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    { _id: playlistId, owner: userId },
    { $addToSet: { videos: videoId } },
    { new: true }
  );

  if (!updatedPlaylist) {
    return res.status(404).json(new ApiError(404, "Playlist not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    return res.status(400).json(new ApiError(400, "Invalid Playlist Id"));
  }

  if (!videoId || !isValidObjectId(videoId)) {
    return res.status(400).json(new ApiError(400, "Invalid Video Id"));
  }

  const userId = req.user?._id;

  if (!userId) {
    return res.status(400).json(new ApiError(400, "Invalid UserId"));
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: userId },
    { $pull: { videos: videoId } },
    { new: true }
  );

  if (!updatedPlaylist) {
    return res.status(404).json(new ApiError(404, "Playlist not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    return res.status(400).json(new ApiError(400, "Invalid Playlist Id"));
  }

  const userId = req.user?._id;

  if (!userId || !isValidObjectId(userId)) {
    return res.status(401).json(new ApiError(401, "Invalid User Id"));
  }

  const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: userId,
  });

  if (!deletedPlaylist) {
    return res.status(404).json(new ApiError(404, "Playlist not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylist, "Playlist removed successfully")
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!playlistId || !isValidObjectId(playlistId)) {
    return res.status(400).json(new ApiError(400, "Invalid playlistId"));
  }

  if (!name?.trim() && !description?.trim()) {
    return res
      .status(400)
      .json(new ApiError(400, "At least name or description is required"));
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    { _id: playlistId },
    {
      $set: {
        name: name,
        description: description,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    return res.status(404).json(new ApiError(404, "Playlist not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylist, "Playlist updated successfully")
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
