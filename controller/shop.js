import express from "express";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";
import catchAsync from "../middlewares/catchAsyncError.js";
import sendToken from "../utils/jwtToken.js";
import { isAuthenticated, isSellerAuthenticated } from "../middlewares/auth.js";
import fs from "fs";
import { upload } from "../multer.js"
import Shop from "../models/shop.js";
import ErrorHandler from "../utils/errorHandler.js";
import path from "path";
import sendShopToken from "../utils/ShopToken.js";

const createActivationToken = (seller) => {
  return jwt.sign(seller, process.env.ACTIVATION_SECRET, {
    expiresIn: "1d",
  });
};

const shopRouter = express.Router();
shopRouter.post('/create', upload.single("file"), async (req, res, next) => {
  try {
    const { name, email, password, address, phoneNumber, zipCode } = req.body;
    const emailExist = await Shop.findOne({ email });
    if (emailExist) {
      const filename = req.file.filename;
      const filePath = `uploads/${filename}`;
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(err, "Error deleting duplicate file");
        } else {
          console.log("File deleted successfully");
        }
      });
      return next(new ErrorHandler ("Shop already exists", 400));
    }
    const filename = req.file.filename;
    const fileUrl = path.join(filename);

    const seller = {
      name: name,
      email: email,
      password: password,
      avatar: {
        url: `/uploads/${filename}`, // serve it statically
        public_id: filename, // or generate unique id
      },
      address: address,
      phoneNumber: phoneNumber,
      zipCode: zipCode,

    };
    const activationToken = createActivationToken(seller);

    const activationUrl = `http://localhost:5173/shop/activation/${activationToken}`;

    try {
      await sendMail({
        email: seller.email,
        subject: "Activate your shop",
        message: `Hello ${seller.name}, please click on the link to activate your account: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${seller.email} to activate your account!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }


  } catch (error) {
    console.log(error.message);
    return next(new ErrorHandler(error.message, 500));
  }
});

shopRouter.post("/activation", catchAsync(async (req, res, next) => {
  try {
    const { activation_token } = req.body;
    const newSeller = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);

    if (!newSeller) {
      return next(new ErrorHandler("Invalid token", 400));
    }
    const { name, email, password, avatar, zipCode, address, phoneNumber } = newSeller;

    let seller = await Shop.findOne({ email }).select("+password");
    if (seller) {
      return next(new ErrorHandler("Shop already exists", 400));
    }
    seller = await Shop.create({
      name,
      email,
      avatar,
      password,
      address,
      zipCode,
      phoneNumber
    });

    sendShopToken(seller, 201, res); //File created in utils
    
  } catch (error) {
    console.log(error.message);
    return next(new ErrorHandler(error.message, 500));
  }
}));

// login shop
shopRouter.post("/login-shop", (async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler("Please provide all the fields", 400))
    }
    const shop = await Shop.findOne({ email }).select("+password");
    if (!shop) {
      console.log("shop email not found bruh")
      return next(new ErrorHandler("Shop doesn't exists!", 400));
    }
    const isMatch = await shop.comparePassword(password);
    if (!isMatch) {
      console.log("password not matching")
      return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
    }
    sendShopToken(shop, 201, res);
  } catch (error) {
    console.log(error.message);
    return next(new ErrorHandler(error.message, 500));
  }
}));

//Load Shop
shopRouter.get("/getshop", isSellerAuthenticated, async(req, res, next) => {
  try {
    const seller = await Shop.findById(req.seller._id);
    if(!seller){
      console.log("Seller is not authenticated")
      return next(new ErrorHandler("Seller is not authenticated", 400));
    }
    res.status(200).json({
      success: true, 
      seller
    })
  } catch (error) {
    console.log(error.message)
    return next(new ErrorHandler(error.message, 500));
  }
})


//logout shop
shopRouter.get("/logout", isAuthenticated, async(req,  res, next)=>{
  try {
    res.cookie("seller_token", null, {
      expires: new Date(Date.now()),
      httpOnly: true
    });
    res.status(201).json({
      success: true,
      message:"LOGOUT Successfully"
    })
  } catch (error) {
    console.log(error.message)
    return next(new ErrorHandler(error.message, 500));
  }
})



//getting shop info with the id ..
// get shop info
shopRouter.get(
  "/get-shop-info/:id",
  catchAsync(async (req, res, next) => {
    try {
      const shop = await Shop.findById(req.params.id);
      res.status(201).json({
        success: true,
        shop,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);







export default shopRouter

