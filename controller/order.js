import express from "express";
import catchAsync from '../middlewares/catchAsyncError.js';
import Order from "../models/order.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { isAuthenticated, isSellerAuthenticated, isAdminAuthenticated } from "../middlewares/auth.js";
import Shop from "../models/shop.js";
import Product from "../models/product.js";
const orderRouter = express.Router();
// create order
orderRouter.post("/create-order", catchAsync(async (req, res, next) => {
    //Multi-Vendor Order system. Its main job is to take a single checkout (one cart) and split it into multiple separate orders—one for every shop the user bought from
    try {
        const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;
        //   group cart items by shopId
        const shopItemsMap = new Map(); // a Map (kinda hashmap) to put the item in corresponsing shop bin
        for (const item of cart) {// pushing in the map based on shop Id of the item
            const shopId = item.shopId;
            if (!shopItemsMap.has(shopId)) {
                shopItemsMap.set(shopId, []);
            }
            shopItemsMap.get(shopId).push(item);
        }
        // create an order for each shop
        const orders = [];

        for (const [shopId, items] of shopItemsMap) { // it looops through the map and creates an order for each shop with the corresponding items
            const order = await Order.create({
                cart: items,
                shippingAddress,
                user,
                totalPrice,
                paymentInfo,
            });
            orders.push(order);
        }

        res.status(201).json({
            success: true,
            orders,
        });

    } catch (error) {
        return next(new ErrorHandler(error.message, 500));
    }
}))


// get all orders of user
orderRouter.get(
    "/get-all-orders/:userId",
    catchAsync(async (req, res, next) => {
        try {
            const orders = await Order.find({ "user._id": req.params.userId }).sort({
                createdAt: -1,
            });

            res.status(200).json({
                success: true,
                orders,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// get all orders of seller
orderRouter.get(
    "/get-seller-all-orders/:shopId",
    catchAsync(async (req, res, next) => {
        try {
            const orders = await Order.find({
                "cart.shopId": req.params.shopId,
            }).sort({
                createdAt: -1,
            });

            res.status(200).json({
                success: true,
                orders,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);


// update order status for seller
orderRouter.put(
    "/update-order-status/:id",
    isSellerAuthenticated,
    catchAsync(async (req, res, next) => {
        try {
            const order = await Order.findById(req.params.id);

            if (!order) {
                return next(new ErrorHandler("Order not found with this id", 400));
            }
            if (req.body.status === "Transferred to delivery partner") {
                order.cart.forEach(async (o) => {
                    await updateOrder(o._id, o.qty);
                });
            }

            order.status = req.body.status;

            if (req.body.status === "Delivered") {
                order.deliveredAt = Date.now();
                order.paymentInfo.status = "Succeeded";
                const serviceCharge = order.totalPrice * .10;
                await updateSellerInfo(order.totalPrice - serviceCharge);
            }

            await order.save({ validateBeforeSave: false });

            res.status(200).json({
                success: true,
                order,
            });

            async function updateOrder(id, qty) {
                const product = await Product.findById(id);

                product.stock -= qty;
                product.sold_out += qty;

                await product.save({ validateBeforeSave: false });
            }

            async function updateSellerInfo(amount) {
                const seller = await Shop.findById(req.seller.id);

                seller.availableBalance = amount;

                await seller.save();
            }
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);


// give a refund ----- user
orderRouter.put(
    "/order-refund/:id",
    catchAsync(async (req, res, next) => {
        try {
            const order = await Order.findById(req.params.id);

            if (!order) {
                return next(new ErrorHandler("Order not found with this id", 400));
            }

            order.status = req.body.status;

            await order.save({ validateBeforeSave: false });

            res.status(200).json({
                success: true,
                order,
                message: "Order Refund Request successfully!",
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// accept the refund ---- seller
orderRouter.put(
    "/order-refund-success/:id",
    isSellerAuthenticated,
    catchAsync(async (req, res, next) => {
        try {
            const order = await Order.findById(req.params.id);

            if (!order) {
                return next(new ErrorHandler("Order not found with this id", 400));
            }

            order.status = req.body.status;

            await order.save();

            res.status(200).json({
                success: true,
                message: "Order Refund successfull!",
            });

            if (req.body.status === "Refund Success") {
                order.cart.forEach(async (o) => {
                    await updateOrder(o._id, o.qty);
                });
            }

            async function updateOrder(id, qty) {
                const product = await Product.findById(id);

                product.stock += qty;
                product.sold_out -= qty;

                await product.save({ validateBeforeSave: false });
            }
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);

// all orders --- for admin
orderRouter.get(
    "/admin-all-orders",
    isAuthenticated,
    isAdminAuthenticated("Admin"),
    catchAsync(async (req, res, next) => {
        try {
            const orders = await Order.find().sort({
                deliveredAt: -1,
                createdAt: -1,
            });
            res.status(201).json({
                success: true,
                orders,
            });
        } catch (error) {
            return next(new ErrorHandler(error.message, 500));
        }
    })
);


export default orderRouter;