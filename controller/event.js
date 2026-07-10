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
import {
    getCloudinaryPublicId,
    validateEventPayload,
} from '../utils/validateCatalog.js';
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
            }

            const files = req.files;
            const {
                discountPrice,
                stock,
                originalPrice,
                start_Date,
                Finish_Date,
            } = validateEventPayload(req.body, files);

            const imageUrls = await Promise.all(
                files.map((file) =>
                    new Promise((resolve, reject) => {
                        cloudinary.v2.uploader
                            .upload_stream({ folder: "events" }, (error, result) => {
                                if (error) reject(error);
                                else resolve(result.secure_url);
                            })
                            .end(file.buffer);
                    })
                )
            );

            const event = await Event.create({
                name: req.body.name,
                description: req.body.description,
                category: req.body.category,
                tags: req.body.tags,
                originalPrice,
                discountPrice,
                stock,
                start_Date,
                Finish_Date,
                images: imageUrls,
                shopId,
                shop,
            });

            res.status(201).json({
                success: true,
                event,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, error.statusCode || 500));
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
            return next(new ErrorHandler("Event not found with this id", 404));
        }

        if (event.shopId !== req.seller._id.toString()) {
            return next(new ErrorHandler("You are not allowed to delete this event", 403));
        }

        for (const imageUrl of event.images) {
            const publicId = getCloudinaryPublicId(imageUrl);
            if (publicId) {
                await cloudinary.v2.uploader.destroy(publicId);
            }
        }

        await Event.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Event deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
}))

export default eventRouter;
