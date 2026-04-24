import express from "express";
import catchAsync from "../middlewares/catchAsyncError.js"
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


const paymentRouter = express.Router();
paymentRouter.post("/process", catchAsync(async (req, res, next) => {
    const myPayment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "inr", // as pakistan m stripe supported currency nahi hai to inr use krna hoga
      metadata: {
        company: "MuntahaCompany",
      },
    });
    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret,
    });
  })
);

 
paymentRouter.get("/stripeapikey", catchAsync(async (req, res, next) => {
    res.status(200).json({
      stripeApiKey: process.env.STRIPE_API_KEY,
    });
  } ));


export default paymentRouter;