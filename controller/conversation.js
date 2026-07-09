import Conversation from "../models/conversation.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsync from "../middlewares/catchAsyncError.js";
import express from "express";
import { isAuthenticated, isSellerAuthenticated } from "../middlewares/auth.js";

const conversationRouter = express.Router();

// Create the conversation
conversationRouter.post("/create-new-conversation", isAuthenticated, catchAsync(async (req, res, next) => {
    try {
        const { groupTitle, userId, sellerId } = req.body;
        const isConversationExists = await Conversation.findOne({
            groupTitle
        });

        if (isConversationExists) {
            const conversation = isConversationExists;
            res.status(201).json({
            success: true,
            conversation,
            });
        }
        else {
            const conversation = await Conversation.create({
                members: [userId, sellerId],
                groupTitle: groupTitle,
            })
            res.status(201).json({
            success: true,
            conversation,
            });
        }
    } catch (error) {
        return next(new ErrorHandler(error, 400))
    }
}));

// get Seller Conversation
conversationRouter.get("/get-seller-conversation/:id", catchAsync(async (req, res, next) => {
    try {
        const conversations = await Conversation.find({
            members: { $in: [req.params.id] }
        }).sort({ updatedAt: -1, createdAt: -1 });
        res.status(201).json({
        success: true,
        conversations,
      });
    } catch (error) {
        return next(new ErrorHandler(error, 500))
    }
}));

// get User Conversation
conversationRouter.get("/get-user-conversation/:id", isAuthenticated, catchAsync(async (req, res, next) => {
    try {
        const conversations = await Conversation.find({
            members: { $in: [req.params.id] }
        }).sort({ updatedAt: -1, createdAt: -1 });
        res.status(201).json({
        success: true,
        conversations,
      });
    } catch (error) {
        return next(new ErrorHandler(error, 500))
    }
}));

// get single conversation by id
conversationRouter.get("/get-conversation/:id", catchAsync(async (req, res, next) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        if (!conversation) {
            return next(new ErrorHandler("Conversation not found", 404));
        }
        res.status(200).json({ success: true, conversation });
    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
}));

// get all seller conversations
conversationRouter.get("/get-all-conversation-seller/:id", catchAsync(async (req, res, next) => {
    try {
        const conversations = await Conversation.find({
            members: { $in: [req.params.id] }
        }).sort({ updatedAt: -1, createdAt: -1 });
        res.status(200).json({
            success: true,
            conversations,
        });
    } catch (error) {
        return next(new ErrorHandler(error, 500))
    }
}));

// update last message of a conversation
conversationRouter.put("/update-last-message/:id", isAuthenticated, catchAsync(async (req, res, next) => {
    try {
        const { lastMessage, lastMessageId } = req.body;

        const conversation = await Conversation.findByIdAndUpdate(
            req.params.id,
            { lastMessage, lastMessageId },
            { new: true }
        );

        res.status(200).json({
            success: true,
            conversation,
        });
    } catch (error) {
        return next(new ErrorHandler(error, 500))
    }
}));


export default conversationRouter;

