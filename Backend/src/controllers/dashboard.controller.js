import mongoose, { isValidObjectId } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User Id")
    }
    const {channelId} = req.params;

    const subscriberCount = await Subscription.countDocuments({
    channel: userId 
     })

    const channelStats = await Video.aggregate([
       { $match: {
            owner: new mongoose.Types.ObjectId(userId),
        }
       },
       {
           $lookup: {
               from: "likes",
               localField: "_id",
               foreignField: "video",
               as: "likes"
            }
        },
       
        {
            $group: {
                _id: null,
                totalVideos: {$sum: 1},
                totalViews: {$sum: "$views"},
                totalLikes: {$sum: {$size:  "$likes"}} 
            }
        },

        
    ])

    const stats = channelStats[0] || {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0
    };

    const finalData = {
        totalVideos: stats.totalVideos,
        totalViews: stats.totalViews,
        totalLikes: stats.totalLikes,
        totalSubscribers: subscriberCount
    };

    return res
        .status(200)
        .json(new ApiResponse(200, finalData, "Channel stats fetched successfully."));


})

const getChannelVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Channel Id");
    }

   
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                isPublished: true 
            }
        },
        {
            $sort: { createdAt: -1 } 
        },
        {
            $skip: skip
        },
        {
            $limit: parseInt(limit)
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                isPublished: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully."));
});

export {
    getChannelStats, 
    getChannelVideos
    }