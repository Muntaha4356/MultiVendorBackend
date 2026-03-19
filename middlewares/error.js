import ErrorHandler from "../utils/ErrorHandler.js";

export const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";
  // When MongoDB, JWT, or other libraries throw an error, they don’t give you a proper HTTP status code.
  // They only give you raw info like:
  // err.name = "CastError"
  // err.code = 11000
  // err.name = "JsonWebTokenError"
  //so we send such errors to error handler to get a status code plus associate message 

  //Wrong Mongodb Id
  if (err.name === "CastError") {
    const message = `Resources not found with this id.. Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }
  // Duplicate key error
  // It happens when you try to insert a document into a collection where a field must be unique, but the value you’re inserting already exists.
  if (err.code === 11000) {
    const message = `Duplicate key ${Object.keys(err.keyValue)} Entered`;
    err = new ErrorHandler(message, 400);
  }
  // wrong jwt error
  if (err.name === "JsonWebTokenError") {
    const message = `Your url is invalid please try again later`;
    err = new ErrorHandler(message, 400);
  }

  // jwt expired
  if (err.name === "TokenExpiredError") {
    const message = `Your Url is expired please try again letter!`;
    err = new ErrorHandler(message, 400);
  }
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
