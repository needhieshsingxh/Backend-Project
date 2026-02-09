import { Router } from "express";
import { getVideoComments, addComment, updateComment, deleteComment } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Get all comments for a video (public)
router.route("/:videoId").get(getVideoComments);

// Add comment to a video (protected)
router.route("/:videoId").post(verifyJWT, addComment);

// Update a comment (protected)
router.route("/:videoId/:commentId").patch(verifyJWT, updateComment);

// Delete a comment (protected)
router.route("/:videoId/:commentId").delete(verifyJWT, deleteComment);

export default router;