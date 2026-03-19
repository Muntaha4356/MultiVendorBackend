import express from 'express';
import Product from '../models/product.js';
import asyncHandler from 'express-async-handler';
import cloudinary from '../utils/cloudinary.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import upload from '../utils/multer.js';
import Event from '../models/event.js';
import Shop from '../models/shop.js';
import catchAsync from '../middlewares/catchAsyncError.js';
import { isSellerAuthenticated } from '../middlewares/auth.js';
import fs from 'fs';
const eventRouter = express.Router();


eventRouter.post(
    '/create-event',
    upload.array("images"),
    asyncHandler(async (req, res, next) => {
        try {
            const shopId = req.body.shopId;
            const shop = await Shop.findById(shopId);
            if (!shop) {
                return next(new ErrorHandler("Shop not found with this id", 400));
            } else {
                console.log("Body:", req.body);
                console.log("Files:", req.files);
                const files = req.files;
                const imageUrls = await Promise.all(files.map(file => { return new Promise((resolve, reject) => { cloudinary.v2.uploader.upload_stream({ folder: "events" }, (error, result) => { if (error) reject(error); else resolve(result.secure_url); }).end(file.buffer); }); }));
                const eventData = req.body;
                eventData.images = imageUrls;
                eventData.shop = shop;
                const event = await Event.create(eventData);
                res.status(201).json({
                    success: true,
                    event,
                });
            }

        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    }))

// get all events
eventRouter.get("/get-all-events", async (req, res, next) => {
  try {
    const events = await Event.find();
    res.status(201).json({
      success: true,
      events,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});

//Get All Events of Shop


eventRouter.get("/get-all-events-shop/:id", catchAsync(async (req, res, next) => {
    try {
        const events = await Event.find({ shopId: req.params.id });

        res.status(200).json({
            success: true,
            events,
        });
    }
    catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}))

eventRouter.delete("/delete-shop-event/:id", isSellerAuthenticated, catchAsync(async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return next(new ErrorHandler("Event not found with this id", 500));
        }
        if (!req.file) {
            console.log("errror is here")
            return next(new ErrorHandler("Avatar is required", 400));
        }
        const filename = req.file.filename;
        const filePath = event.images; //Builds the local path to where Multer stored it (assuming your disk storage destination is uploads/).
        // fs = File System module in Node.js.
        // Tries to delete the newly uploaded file to avoid orphan files when the user already exists.

        //Tries to delete the newly uploaded file to avoid orphan files when the user already exists.
        // The callback only ever receives one argument → err.
        // null → if deletion succeeded.
        console.log(filePath, "lololololol")
        // fs.unlink(filePath, (err) => {
        //     if (err) {
        //     console.log(err, "Error deleting duplicate file");
        //     } else {
        //     console.log("File deleted successfully");
        //     }
        // });
        res.status(201).json({
            success: true,
            message: "Event deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}))

export default eventRouter;
