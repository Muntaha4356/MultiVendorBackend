import express from "express";
import catchAsync from "../middlewares/catchAsyncError.js"
import Stripe from 'stripe';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment.");
}
const stripe = new Stripe(stripeSecretKey);


const paymentRouter = express.Router();
paymentRouter.post("/process", catchAsync(async (req, res, next) => {
  try {
    const amount = Number(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount.",
      });
    }

    const myPayment = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        company: "MuntahaCompany",
      },
    });
    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error?.message || "Stripe payment initialization failed.",
    });
  }
}));

paymentRouter.get("/stripeapikey", catchAsync(async (req, res, next) => {
  res.status(200).json({
    stripeApiKey: process.env.STRIPE_API_KEY?.trim() || process.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim(),
  });
}));


export default paymentRouter;