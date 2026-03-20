import express from "express";
import path from "path";
import { upload } from "../multer.js";
import User from "../models/user.js";
import ErrorHandler from "../utils/ErrorHandler.js";
const userRouter = express.Router();
import fs from "fs";
import jwt from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";
import catchAsync from "../middlewares/catchAsyncError.js";
import sendToken from "../utils/jwtToken.js";
import { isAuthenticated } from "../middlewares/auth.js";

userRouter.post(
  "/create-user",
  upload.single("file"),
  async (req, res, next) => {
    const { name, email, password } = req.body;
    const userExist = await User.findOne({ email });
    if (userExist) {
      if (!req.file) {
        return next(new ErrorHandler("Avatar is required", 400));
      }
      const filename = req.file.filename;
      const filePath = `uploads/${filename}`; //Builds the local path to where Multer stored it (assuming your disk storage destination is uploads/).
      // fs = File System module in Node.js.
      // Tries to delete the newly uploaded file to avoid orphan files when the user already exists.

      //Tries to delete the newly uploaded file to avoid orphan files when the user already exists.
      // The callback only ever receives one argument → err.
      // null → if deletion succeeded.
      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(err, "Error deleting duplicate file");
        } else {
          console.log("File deleted successfully");
        }
      });
      return next(new ErrorHandler("User already exists", 400));
    }
    const filename = req.file.filename;
    const fileUrl = path.join(filename);

    const user = {
      name: name,
      email: email,
      password: password,
      avatar: {
        url: `/uploads/${filename}`, // serve it statically
        public_id: filename, // or generate unique id
      },
    };

    const activationToken = createActivationToken(user);

    const activationUrl = `http://localhost:5173/activation/${activationToken}`;
    try {
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
      return next(new ErrorHandler(error.message, 400));
    }

    // const newUser = await User.create(user);
    // res.status(201).json({
    //   success: true,
    //   newUser,
    // });

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
    console.log("activation started");
    const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
    console.log("we verified bruh");
    console.log("achaaaa lol")
    if (!newUser) {
      return next(new ErrorHandler("Invalid token", 400));
    }
    const { name, email, password, avatar } = newUser;

    let user = await User.findOne({ email }).select("+password");;
    console.log("hey user is trying to find");
    if (user) {
      return next(new ErrorHandler("User already exists", 400));
    }
    console.log("user was not already found buh");
    user = await User.create({
      name,
      email,
      avatar,
      password,
    });
    console.log("we created user bruh");

    sendToken(user, 201, res); //File created in utils
  } catch (error) {
    console.log(error.message);
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
      console.log("user email not found bruh")
      return next(new ErrorHandler("User doesn't exists!", 400));
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("password not matching")
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
      console.log("user is not authenticated")
      return next(new ErrorHandler("User is not authenticated", 400));
    }
    res.status(200).json({
      success: true, 
      user
    })
  } catch (error) {
    console.log(error.message)
    return next(new ErrorHandler(error.message, 500));
  }
})


// Logout user
userRouter.get("/logout", isAuthenticated, async(req,  res, next)=>{
  try {
    res.cookie("token", null, {
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


// update user info controller
userRouter.put("/update-user-info", isAuthenticated, catchAsync(async(req, res, next) => {
  try {
    const {email, password, phoneNumber, name } = req.body;

    const user = await User.findOne({email}).select("+password");

    if(!user){
      return next(new ErrorHandler("User not found", 400));

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

    res.status(201).json({
      success: true,
      user,
    })

  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
}))


// update user avatar
userRouter.put("/update-avatar", isAuthenticated, catchAsync(async (req, res, next) => {
  try {
    let existsUser = await User.findById(req.user.id);
    if(req.body.avatar !== ""){
      const imageId = existsUser.avatar.public_id;
      await cloudinary.v2.uploader.destroy(imageId);


      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
      })

      existsUser.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };

      await existsUser.save();

      res.status(200).json({
        success: true,
        user:existsUser
      })
    }
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

export default userRouter;
