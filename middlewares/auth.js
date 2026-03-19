import ErrorHandler from "../utils/ErrorHandler.js";
import catchAsync from "./catchAsyncError.js";
import jwt from "jsonwebtoken"
import User from "../models/user.js";
import Shop from "../models/shop.js";


export const isAuthenticated = catchAsync(async(req, res,next) => {
    const {token} = req.cookies;
    if(!token){
        return next(new ErrorHandler("Please Login to continue", 401))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = await User.findById(decoded.id);
    next();

})



// Checking for the Seller Authentication
export const isSellerAuthenticated = catchAsync(async(req, res,next) => {
    console.log(req.cookies)
    const {seller_token} = req.cookies;
    if(!seller_token){
        return next(new ErrorHandler("Please Login to continue", 401))
    }

    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET)

    req.seller = await Shop.findById(decoded.id);
    next();

})