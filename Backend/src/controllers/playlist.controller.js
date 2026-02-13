import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
   
    const {name, description} = req.body
    if(!name || !description){
        return res.status(400).json(new ApiError(400, "Name and description required to create a playlist"))
    } 

    const userId = req.user?._id;
    if(!userId){
        return res.status(400).json(new ApiError(400, "Invalid userId"));
    }

    const {videoId} = req.params;
    if(!videoId || !isValidObjectId(videoId)){
    return res.status(400).json(400, "Invalid VideoId") }
    
    const playlist = await Playlist.create(
       { name, 
        description,
        videos: videoId ? [videoId]: [],
        owner: userId,
    }
    )

    if(!playlist){
        return res.status(500).json(new ApiError(500, "Failed to create playlist"))}

    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully!"))

    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId){
        return res.status(400).json(new ApiError(400, "Invalid UserId"));
    }

    const userPlaylists = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },{
                    $lookup:{
                        from: "videos",
                        localField: "videos",
                        foreignField: "_id",
                        as: "videos"
                    }
        },
            {
            $sort:{createdAt: -1}
        }
    ])
    
    if(userPlaylists.length === 0 || !userPlaylists){
        return res.status(400).json(new ApiError(400, "Playlist not found"));
    }

    return res.status(201).json(new ApiResponse(201, userPlaylists, "User Playlist found successfully"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        return res.status(400).json(new ApiError(400, "Invalid playlistId"));
    }

    const playlistById = Playlist.aggregate([
     {   $match:{
            _id: new mongoose.Types.objectId(playlistId)
        }
    },
    {

    }
    ])

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}