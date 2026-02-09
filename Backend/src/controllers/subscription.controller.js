import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        return res.status(400).json(new ApiError(400, "Invalid channelId"))
    }
    
    const userId = req.user?._id;
    if(!userId){
        return res.status(400).json(new ApiError(400, "Invalid userId"));
    }

    const channelSubscriptitionStatus = await Subscription.exists(
        {
            subscriber: userId,
            channel: channelId
        }
    )

    if(!channelSubscriptitionStatus){
        const subscribeChannel = await Subscription.create({
           subscriber: userId,
            channel: channelId
        })
        if(!subscribeChannel){
            return res.status(400).json(new ApiError(400, "Channel subscription failed"))
        }
    return res.status(200).json(new ApiResponse(200, subscribeChannel, "Channel subsribed successfully"))
    }

    const unsubscribeChannel = await Subscription.findOneAndDelete(
        {
             subscriber: userId,
             channel: channelId
        }

    )
    if(!unsubscribeChannel){
        return res.status(400).json(new ApiError(400, "Channel unsubscription failed"))
    }

    return res.status(200).json(new ApiResponse(200, unsubscribeChannel, "Channel unsubsribed successfully" ));


    

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
         return res.status(400).json(new ApiError(400, "Invalid channelId"))
    }

    const subscriberList = await  Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberList"

            }
        },
        {
            $unwind: "$subscriberList"
        }

    ])

    if(subscriberList.length === 0){
        return res.status(404).json(new ApiError (404, "Subscriber not found"))
    }

    return res.status(200).json(new ApiResponse(200, subscriberList,"Subscriber list found successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId){
        return res.status(400).json(new ApiError(400, "Invalid subscriberId"));
    }

    const subscribedChannelList =  await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }

        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelList"
            }
        },
        {
            $unwind: "$channelList"
        }
    ])

     if(subscribedChannelList.length === 0){
        return res.status(404).json(new ApiError (404, "Subscribed Channel not found"))
    }

    return res.status(200).json(new ApiResponse(200, subscribedChannelList,"Subscribed Channel list found successfully"))


})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}