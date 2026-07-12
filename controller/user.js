import express from "express";
import upload from "../utils/multer.js";
import User from "../models/user.js";
import ErrorHandler from "../utils/ErrorHandler.js";
const userRouter = express.Router();
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";
import catchAsync from "../middlewares/catchAsyncError.js";
import sendToken from "../utils/jwtToken.js";
import { isAuthenticated } from "../middlewares/auth.js";
import cloudinary from "../utils/cloudinary.js";
import { getClearCookieOptions } from "../utils/cookieOptions.js";

const uploadAvatarToCloudinary = (file) =>
  new Promise((resolve, reject) => {
    cloudinary.v2.uploader
      .upload_stream({ folder: "avatars" }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(file.buffer);
  });

userRouter.post(
  "/create-user",
  upload.single("file"),
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      if (!req.file) {
        return next(new ErrorHandler("Avatar is required", 400));
      }

      const userExist = await User.findOne({ email });
      if (userExist) {
        return next(new ErrorHandler("User already exists", 400));
      }

      const avatarUpload = await uploadAvatarToCloudinary(req.file);

      const user = {
        name: name,
        email: email,
        password: password,
        avatar: {
          url: avatarUpload.secure_url,
          public_id: avatarUpload.public_id,
        },
      };

      const activationToken = createActivationToken(user);

      const activationUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/activation/${activationToken}`;
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${user.email} to activate your account!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// create activation user

const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "1d",
  });
};

// Activate User


userRouter.post("/activation", catchAsync(async (req, res, next) => {
  try {
    const { activation_token } = req.body;
    const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
    if (!newUser) {
      return next(new ErrorHandler("Invalid token", 400));
    }
    const { name, email, password, avatar } = newUser;

    let user = await User.findOne({ email }).select("+password");;
    if (user) {
      return next(new ErrorHandler("User already exists", 400));
    }

    user = await User.create({
      name,
      email,
      avatar,
      password,
    });


    sendToken(user, 201, res); //File created in utils
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));

// login user

userRouter.post("/login-user", (async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ErrorHandler("Please provide all the fields", 400))
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorHandler("User doesn't exists!", 400));
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
    }
    sendToken(user, 201, res);
  } catch (error) {
    console.log(error.message);
    return next(new ErrorHandler(error.message, 500));
  }
}));

//Load user from token (if he/she authenticated)
userRouter.get("/getuser", isAuthenticated, async(req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if(!user){
      return next(new ErrorHandler("User is not authenticated", 400));
    }
    res.status(200).json({
      success: true, 
      user
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
})


// Logout user
userRouter.get("/logout", isAuthenticated, async(req,  res, next)=>{
  try {
    res.cookie("token", null, getClearCookieOptions());
    res.status(201).json({
      success: true,
      message:"LOGOUT Successfully"
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
})


// update user info controller
userRouter.put("/update-user-info", isAuthenticated, catchAsync(async(req, res, next) => {
  try {
    const {email, password, phoneNumber, name } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    if(!user){
      return next(new ErrorHandler("User not found", 400));

    }

    const existingUser = await User.findOne({ email });

    if (
      existingUser &&
      existingUser._id.toString() !== user._id.toString()
    ) {
      return next(new ErrorHandler("Email already in use", 400));
    }

    const isPasswordValid = await user.comparePassword(password);

    if(!isPasswordValid){
      return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
    }

    user.name = name;
    user.email = email;
    user.phoneNumber = phoneNumber;

    await user.save();

    res.status(200).json({
      success: true,
      user,
    })

  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}))


// update user avatar
userRouter.put("/update-avatar", isAuthenticated, upload.single("avatar"), catchAsync(async (req, res, next) => {
  try {
    let existsUser = await User.findById(req.user.id);

    if(!existsUser){
      return next(new ErrorHandler("User not found", 400));
    }

    if(!req.file){
      return next(new ErrorHandler("Avatar file is required", 400));
    }

    const imageId = existsUser.avatar?.public_id;
    if (imageId) {
      await cloudinary.v2.uploader.destroy(imageId);
    }


    const myCloud = await uploadAvatarToCloudinary(req.file);

    existsUser.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };

    await existsUser.save();

    res.status(200).json({
      success: true,
      user:existsUser
    })
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}));


// update user Address 
userRouter.put(
  "/update-user-addresses", isAuthenticated, catchAsync(async(req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );

      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body); // merging the new Adress in existing address
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);


// delete user address
userRouter.delete(
  "/delete-user-address/:id", isAuthenticated,
  catchAsync(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      await User.updateOne(
        {
          _id: userId,
        },
        {$pull : {addresses: {_id: addressId}}}
        
      );
      const user = await User.findById(userId);
      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
)

// find user info with use of userId
userRouter.get(
  "/user-info/:id",
  catchAsync(async(req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      res.status(201).json({
        success: true,
        user
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
)

//UPdate the user password

userRouter.put("/update-user-password", isAuthenticated, 
  catchAsync(async(req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword
      );

      if(!isPasswordMatched) {
        return next(new ErrorHandler("Old Password is incorrect!", 400));
      }


      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(
          new ErrorHandler("Password doesn't match" , 400)
        );
      }
      user.password = req.body.newPassword; //it will automatically hash cuz part of the schema
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });

    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
)
export default userRouter;
