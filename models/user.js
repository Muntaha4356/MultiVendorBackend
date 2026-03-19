import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({
  name:{
    type: String,
    required: [true, "Please enter your name!"],
  },
  email:{
    type: String,
    unique:true,
    required: [true, "Please enter your email!"],
  },
  password:{
    type: String,
    required: [true, "Please enter your password"],
    minLength: [4, "Password should be greater than 4 characters"],
    select: false, //means this field won’t be returned by default when querying users
  },
  phoneNumber:{
    type: Number,
  },
  addresses:[
    {
      country: {
        type: String,
      },
      city:{
        type: String,
      },
      address1:{
        type: String,
      },
      address2:{
        type: String,
      },
      zipCode:{
        type: Number,
      },
      addressType:{
        type: String,
      },
    }
  ],
  role:{
    type: String,
    default: "user",
  },
  avatar:{
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
 },
 createdAt:{
  type: Date,
  default: Date.now(),
 },
 resetPasswordToken: String,
 resetPasswordTime: Date,
});


//  Hash password
userSchema.pre("save", async function (next){ //This runs before saving a user.
  if(!this.isModified("password")){ //If the password field hasn’t been modified, skip hashing (next()).
    next();
  }

  this.password = await bcrypt.hash(this.password, 10); // If modified, hash the password using bcrypt.hash with a salt factor of 10 before storing it in mongodb
});

// jwt token

userSchema.methods.getJwtToken = function () { 
  //Adds a method to the schema (getJwtToken).
  return jwt.sign({ id: this._id}, process.env.JWT_SECRET,{
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// Creates a JWT token with:
// Payload → { id: this._id } (user’s ID).
// Secret key → from environment variable (JWT_SECRET_KEY).
// Expiry time → from environment variable (JWT_EXPIRES).

// compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User