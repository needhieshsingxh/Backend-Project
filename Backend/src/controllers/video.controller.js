import mongoose, { isValidObjectId, Query } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import uploadOnCloudinary from "../utils/cloudinary.fileupload.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  if (!userId || !isValidObjectId(userId)) {
    return res.status(400).json(new ApiError(400, "Chennel id is required"));
  }

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const { seenVideosId = [] } = req.body;
  if (query?.trim()) {
    const allVideos = await Video.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
              ],
            },
            { isPublished: true },
          ],
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          thumbnail: 1,
          _id: 1,
          duration: 1,
          views: 1,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: (pageNumber - 1) * limitNumber,
      },
      {
        $limit: limitNumber,
      },
    ]);

    if (!allVideos?.length) {
      return res
        .status(404)
        .json(new ApiError(404, "No videos found matching your search"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, allVideos, "Videos fetched successfully"));
  } else {
    const randomVideo = await Video.aggregate([
      {
        $match: {
          isPublished: true,

          _id: {
            $nin: seenVideosId.map((e) => new mongoose.Types.ObjectId(e)),
          },
        },
      },
      {
        $sample: { size: 20 },
      },
      {
        $project: {
          title: 1,
          description: 1,
          thumbnail: 1,
          _id: 1,
          duration: 1,
          views: 1,
        },
      },
    ]);

    if (!randomVideo?.length) {
      return res
        .status(404)
        .json(new ApiError(404, "No videos found matching your search"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, randomVideo, "Videos fetched successfully"));
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description} = req.body;
  // TODO: get video, upload to cloudinary, create video
if (!title?.trim() || !description?.trim()) {
    return res.status(400).json(new ApiError(400, "Title and description are required"));
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if(!videoLocalPath){
    return res.status(400).json(new ApiError(400, "Video file is required"))
  }

  if(!thumbnailLocalPath){
    return res.status(400).json(new ApiError(400, "Thumbnail is required"));
  }

  
    const videoFileUpload = await uploadOnCloudinary(videoLocalPath);
   
    if(!videoFileUpload){
       throw new ApiError(500, "Video file upload failed")
    }

    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
    if(!thumbnailUpload){
        throw new ApiError(500, "Thumbnail upload failed")
    }


    const video = await Video.create({
        title,
        description,
        videoFile: videoFileUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: videoFileUpload.duration,
        owner: req.user._id
    })


    if(!video){
        throw new ApiError(500, "Video upload failed")
    }

    return res.status(200).json(new ApiResponse(200, video, 'Video uploaded successfully'))

  




});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid VideoId")
    }

    const video = await Video.findById(videoId);

if (!video) {
      return res
        .status(404)
        .json(new ApiError(404, "No videos found matching your videoId"));
    }

    return res.status(200).json(new ApiResponse(200, video, "Video found"));

});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const {title, description}  = req.body;
    if(!title.trim() === "" || !description.trim() === ""){
        throw new ApiError(400, "Title and description both are required")
    }

    const userId = req.user?._id;
   

    const thumbnailLocalPath = req.file?.path;
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }

    const thumbnail =  await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail.url) {
        throw new ApiError(400, "Error while uploading thumbnail");
    }

    const videoUpdate = await Video.findOneAndUpdate(
        {
            _id: videoId,
            owner: userId
        },
        {
            $set:{
                title: title,
                description: description,
                thumbnail: thumbnail.url
            }
        },{
            new: true
        }

    )

    if(!videoUpdate){
        throw new ApiError(500, "Video update failed")
    }

    return res.status(200).json(new ApiResponse(200, "Video successfully updated."))

});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
     if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const userId = req.user?._id;

    const deleteVideo = await Video.findOneAndDelete({
        _id: videoId,
    owner: req.user._id
    }) 

    if(!deleteVideo){
        throw new ApiError(500, "Video delete failed")
    }


    if (deleteVideo.videoFile){
        await deleteFromCloudinary(deleteVideo.videoFile, "video")
    }

    if(deleteVideo.thumbnail){
        await deleteFromCloudinary(deleteVideo.thumbnail, "image")
    }

    return res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully."))

    


  
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if(!isValidObjectId(videoId)){
    return res.status(400, "Invalid Video Id")
  }

  const userId = req.user?._id;

  const videoStatus = await Video.findOne(
    {  
        _id: videoId,
        owner: userId
    }
  )  

  if(!videoStatus){
    throw new ApiError(500, "Video toggle failed.")
  }

  
    videoStatus.isPublished = !videoStatus.isPublished;
    await videoStatus.save({validateBeforeSave: false});
 

  return res.status(200).json(new ApiResponse(200, videoStatus.isPublished , "Video Saved successfully."))

});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
