import Message from "../models/messages.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsync from "../middlewares/catchAsyncError.js";
import express from "express";
import { isAuthenticated, isSellerAuthenticated } from "../middlewares/auth.js";
import cloudinary from "../utils/cloudinary.js";


const messageRouter = express.Router();

// create new message
messageRouter.post("/create-new-message", catchAsync(async (req, res, next) => {
    try {
        const messageData = req.body;

        if (req.body.images) {
            const myCloud = await cloudinary.v2.uploader.upload(req.body.images, {
                folder: "messages",
            });
            messageData.images = {
                public_id: myCloud.public_id,
                url: myCloud.url,
            }
        }

        messageData.conversationId = req.body.conversationId;
        messageData.sender = req.body.sender;
        messageData.text = req.body.text;


        const message = await Message.create({
            conversationId: messageData.conversationId,
            sender: messageData.sender,
            text: messageData.text,
            images: messageData.images ? messageData.images : undefined,
        });

        await message.save();

        res.status(201).json({
            success: true,
            message,
        })

    } catch (error) {
        return next(new ErrorHandler(error, 400))
    }}
))


// get all messages by conversation id
messageRouter.get("/get-all-messages/:id", catchAsync(async (req, res, next) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.id
        })

        res.status(201).json({
            success: true,
            messages,
        });
    }
    catch(error) {
        return next(new ErrorHandler(error.message, 500));
    }
    }))

export default messageRouter;
