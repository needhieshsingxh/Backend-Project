import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const userId = req.user?._id;
    if(!userId){
        return res.status(401).json(new ApiError(401, "Invalid UserId"))
    }

    const {content} = req.body;
    if(!content || content.trim() === ""){
        return res.status(400).json(new ApiError(400, "Content required"));
    }

    const tweet = await Tweet.create({
        content: content,
        owner: userId
    })

    if(!tweet){
        return res.status(500).json(new ApiError(500, "Tweet failed"))
    }

    return res.status(201).json(new ApiResponse(201, tweet, "Tweet successfull"));

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId =  req.user?._id;
    if(!userId){
        return res.status(401).json(new ApiError(401, "Invalid UserId"))
    };

    const userAllTweet = await Tweet.aggregate([
       { $match: {
            owner: new mongoose.Types.ObjectId(userId),
            content: {  $exists: true}
        }},
        {
        $lookup:{
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "usersTweets"
        }    
        },
        {
            $unwind: "$usersTweets"
        },
            {
            $project: {
                content: 1,
                createdAt: 1,
                "usersTweets.username": 1,
                "usersTweets.avatar": 1,
            }
        }

        

    ]);

    if(!userAllTweet || userAllTweet.length === ""){
        return res.status(404).json(new ApiError(404, "Tweets not found"))
    }

    return res.status(200).json(new ApiResponse(200, userAllTweet, "Users all tweet"))

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const userId = req.user?._id;
    if(!userId){
        return res.status(401).json(new ApiError(401, "Invalid userId"));
    }

    const {content} = req.body;
    if(!content){
          return res.status(400).json(new ApiError(400, "Content required to update"));
    }

    const {tweetId} = req.params;
    if(!tweetId){
        return res.status(400).json(new ApiError(400, "Invalid tweetId"));
    }


    const updateTweet =  await Tweet.findOneAndUpdate(
        {
            owner: userId,
            _id:  tweetId,
        },
        {
            $set: {content: content}
        },
        {
            new: true
        }
    )
    if(!updateTweet){
        return res.status(500).json(new ApiError(500, "Tweet update failed"))
    }

    return res.status(200).json(new ApiResponse(200, updateTweet, "Tweet update successful"))



})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const userId = req.user?._id;
    if(!userId){
        return res.status(401).json(new ApiError(401, "userId invalid"))
    };

    const {tweetId} = req.params;
    if(!tweetId){
        return res.status(400).json(new ApiError(400, "tweetId invalid"));
    }

    const deleteTweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: userId
    });

    if(!deleteTweet){
        return res.status(404).json(new ApiError(404, "Tweet Delete unsuccessful"))
    }

    return res.status(200).json(new ApiResponse(200, deleteTweet, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}