import express from 'express'
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import userRouter from './controller/user.js';
import cors from "cors"
import shopRouter from './controller/shop.js'
import productRouter from './controller/product.js'
import { errorMiddleware } from './middlewares/error.js';
import eventRouter from './controller/event.js';
import couponCodeRouter from './controller/couponCode.js';
import orderRouter from './controller/order.js';
const app = express();
app.use(express.json()) //automatically parse that JSON into a normal JavaScript object and put it in req.body.
app.use(cookieParser())
app.use(cors({
  origin: "http://localhost:5173", // frontend origin
  credentials: true,               // allow cookies
}));
app.use("/", express.static("uploads"))
app.use(express.urlencoded({ extended: true })); 

//Parses incoming requests with URL-encoded payloads (e.g., data sent from an HTML form with method="POST").
// Example: name=Muntaha&age=20 gets turned into { name: "Muntaha", age: "20" } in req.body.
// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({
    path: "config/.env",
  });
}

// import routes
app.use("/api/v2/user", userRouter)
app.use("/api/v2/shop", shopRouter)
app.use("/api/v2/product", productRouter)
app.use("/api/v2/event", eventRouter)
app.use("/api/v2/coupon-code", couponCodeRouter )
app.use("/api/v2/order", orderRouter)


app.use(errorMiddleware)
export default app