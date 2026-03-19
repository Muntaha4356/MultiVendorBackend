import express from 'express';
import Product from '../models/product.js';
import asyncHandler from 'express-async-handler';
import ErrorHandler from '../utils/ErrorHandler.js';
import Shop from '../models/shop.js';
import catchAsync from '../middlewares/catchAsyncError.js';
import { isSellerAuthenticated } from '../middlewares/auth.js';
import CouponCode from '../models/couponCode.js';

const couponCodeRouter = express.Router();

// create Coupon code
couponCodeRouter.post("/create-Coupon-code", isSellerAuthenticated, catchAsync(async (req, res, next) => {
    try {
        const isCouponCodeExists = await CouponCode.findOne({
            name: req.body.name
        });

        console.log(isCouponCodeExists, "isCouponCodeExists")

        if (isCouponCodeExists.length !== 0) {
            return next(new ErrorHandler("Coupon code already exists with this name", 400));
        }



        const couponCode = await CouponCode.create(req.body);

        res.status(201).json({
            success: true,
            couponCode
        })
    } catch (error) {
        return next(new ErrorHandler(error, 400))
    }
}))

// get all Coupon codes of a shop
couponCodeRouter.get("/get-coupon/:id", isSellerAuthenticated, catchAsync(async (req, res, next) => {
    try {
        // const shop = await Shop.findOne({ seller: req.seller._id });
        const couponCodes = await CouponCode.find({
            shop: {
                _id: req.params.id
            }
        });

        res.status(200).json({
            success: true,
            couponCodes
        })
    } catch (error) {
        return next(new ErrorHandler(error, 400))
    }
}))


export default couponCodeRouter;

