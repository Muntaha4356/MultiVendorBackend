import express from 'express';
import Product from '../models/product.js';
import asyncHandler from 'express-async-handler';
import cloudinary from '../utils/cloudinary.js';
import Shop from '../models/shop.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import upload from '../utils/multer.js';
import catchAsync from '../middlewares/catchAsyncError.js';
import { isSellerAuthenticated } from '../middlewares/auth.js';
const productRouter = express.Router();

// create product
productRouter.post(
    '/create-product',
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
                const imageUrls = await Promise.all(files.map(file => { return new Promise((resolve, reject) => { cloudinary.v2.uploader.upload_stream({ folder: "products" }, (error, result) => { if (error) reject(error); else resolve(result.secure_url); }).end(file.buffer); }); }));
                const productData = req.body;
                productData.images = imageUrls;
                productData.shop = shop;
                const product = await Product.create(productData);
                res.status(201).json({
                    success: true,
                    product,
                });
            }

        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    }))


//  get all Products of a shop
productRouter.get("/get-all-products-shop/:id", catchAsync(async (req, res, next) => {
    try {
        const products = await Product.find({ shopId: req.params.id });

        res.status(201).json({
            success: true,
            products,
        });
    }
    catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}))

// get all products
productRouter.get("/get-all-products", catchAsync(async (req, res, next) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });

        res.status(201).json({
            success: true,
            products,
        });
    }
    catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}))

//delete product
productRouter.delete("/delete-shop-product/:id", isSellerAuthenticated, catchAsync(async (req, res, next) => {
    try {
        const productId = req.params.id;
        const productData = await Product.findById(productId);

        if (!productData) {
            return next(new ErrorHandler("Product not found with this id", 404));
        }

        for (let i = 0; i < productData.images.length; i++) {
            const imageUrl = productData.images[i];
            const urlParts = imageUrl.split('/');
            const filenameExt = urlParts[urlParts.length - 1]; // "filename.jpg"
            const filename = filenameExt.split('.')[0];
            const publicId = `products/${filename}`;
            await cloudinary.v2.uploader.destroy(publicId);
        }

        await Product.findByIdAndDelete(productId);

        res.status(201).json({
            success: true,
            message: "Product deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler(error, 400));
    }
}))


export default productRouter;


