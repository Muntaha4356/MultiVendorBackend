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
import paymentRouter from './controller/payment.js';
import conversationRouter from './controller/conversation.js';
import messageRouter from './controller/message.js';
const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://multi-vendor-frontend-hazel.vercel.app",
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Seller-Authorization"],
}));

app.use(express.json()); // automatically parse JSON bodies into req.body
app.use(express.urlencoded({ extended: true })); // parse URL-encoded bodies
app.use(cookieParser());

app.use("/", express.static("uploads"));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend API is running",
  });
});

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
app.use("/api/v2/payment", paymentRouter)
app.use("/api/v2/conversation", conversationRouter)
app.use("/api/v2/message", messageRouter)


app.use(errorMiddleware)
export default app
