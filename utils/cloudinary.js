// backend/utils/cloudinary.js
import dotenv from "dotenv";
import cloudinary from "cloudinary";

// Load env variables immediately
dotenv.config({ path: "config/.env" });
console.log("hi i m in cloudinary ");
console.log(process.env.CLOUDINARY_CLOUD_NAME);
console.log(process.env.CLOUDINARY_API_KEY)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
