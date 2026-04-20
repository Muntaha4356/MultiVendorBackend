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

        if (isCouponCodeExists) {
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

// // get all Coupon codes of a shop
// couponCodeRouter.get("/get-coupon/:id", isSellerAuthenticated, catchAsync(async (req, res, next) => {
//     try {
//         // const shop = await Shop.findOne({ seller: req.seller._id });
//         const couponCodes = await CouponCode.find({
//             shopId: {
//                 _id: req.params.id
//             }
//         });

//         res.status(201).json({
//             success: true,
//             couponCodes
//         })
//     } catch (error) {
//         return next(new ErrorHandler(error, 400))
//     }
// }))

//delete coupon code
couponCodeRouter.delete("/delete-coupon/:id", isSellerAuthenticated, catchAsync(async (req, res, next) => {
    try {
        const couponCode = await CouponCode.findById(req.params.id);

        if (!couponCode) {
            return next(new ErrorHandler("Coupon code not found", 404));
        }

        await CouponCode.findByIdAndDelete(req.params.id);

        res.status(201).json({
            success: true,
            message: "Coupon code deleted successfully"
        })
    } catch (error) {
        return next(new ErrorHandler(error, 400))
    }
}))

// get coupon code value by its name
couponCodeRouter.get(
  "/get-coupon-value/:name",
  catchAsync(async (req, res, next) => {
    try {
      const couponCode = await CouponCode.findOne({ name: req.params.name });
      console.log("Cutie patootie")

      res.status(200).json({
        success: true,
        couponCode,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

export default couponCodeRouter;

