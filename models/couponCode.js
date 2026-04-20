import mongoose from 'mongoose'


const CouponCodeSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your Coupon code name!"],
        unique: true,
    },
    value:{
        type: Number, //how much discount the Coupon code will give
        required: [true, "Please enter your Coupon code discount value!"],
    },
    
    minAmount:{
        type: Number, //minimum amount required to spend the Coupon code
    },
    maxAmount:{
        type: Number, //maximum amount up to which the Coupon code can be applied
    },
    shop: {
        type: Object,
        required: true,
    },
    selectedProducts: {
        type: [String], //array of product ids to which the Coupon code can be applied
        
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

const CouponCode = mongoose.model('CouponCode', CouponCodeSchema);
export default CouponCode