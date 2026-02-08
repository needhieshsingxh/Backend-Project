import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(404, "VideoId doesn't exist")
    }
    //TODO: toggle like on video
    const userId = req.user._id;
    if(!userId){
        return res.status(404).json(new ApiError(404, "user not found"))
    };

    const videoLike = await Like.findOne({video: videoId, likedBy: userId});

    if(videoLike) {
       const unlikeVideo =  await Like.findByIdAndDelete(videoLike._id);
        return res.status(200).json(new ApiResponse(200, unlikeVideo,"Unlike successfully"));
    }else{

   const videoLike = await Like.create({
     video: videoId,
     likedBy:  userId});

     return res.status(200).json(new ApiResponse(200, videoLike, "Like successfully"));
    }

    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "CommentId doesn't exist");
    }

    const userId = req.user._id;
    if(!userId){
      throw new ApiError(404, "User doesn't exist");
    }

    const commentLiked = await Like.findOne({comment:commentId, likedBy: userId});

    if(commentLiked){
        const commentUnlike =   await Like.findByIdAndDelete(commentLiked._id);
        return res.status(200).json(new ApiResponse(200, commentUnlike, "Comment Unliked" ))
    }else{
       const commentLike =  await Like.create({
            comment: commentId,
            likedBy: userId
        })
        return res.status(200).json(new ApiResponse(200, commentLike, "Comment liked"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Invalid tweetId");
    }

    const userId = req.user._id;
    if(!userId){
        throw new ApiError(404, "User doesn't exist");
    }

    const tweetLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })

    if(tweetLike){
       const tweetUnlike =  await Like.findByIdAndDelete(tweetLike._id);
       return res.status(200).json(new ApiResponse(200, tweetUnlike, "Tweet Unliked"))
    }else{
       const tweetLike =  await Like.create({
            tweet: tweetId,
            likedBy: userId
        })
        return res.status(200).json( new ApiResponse(200, tweetLike, "Tweet Liked"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const user  = req.user._id;
    
    if(!user){
        return res.status(404).json(new ApiError(404, "User doesn't exist"))
        
    }

    const likedVideo = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(user),
                video: {$exists: true}

            },
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoLiked",
            }
        },{
            $unwind: "$videoLiked"
        }
    ])
    
    if(likedVideo?.length <= 0){
        return res.status(404).json(new ApiError(404, "No video found"))
    }

    return res.status(200).json(new ApiResponse(200, likedVideo, "List of liked Video"))


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}