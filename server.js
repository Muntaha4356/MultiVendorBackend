import express from "express";
import dotenv from "dotenv";
import app from "./app.js";
import connectDb from "./db/Database.js";

const port = process.env.PORT || 3000;

// Handling uncaught Exception: An exception is basically an error that happens while your program is running (runtime error).
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log(`shutting down the server for handling uncaught exception`);
  process.exit(1);
});

//Config

if (process.env.NODE_ENV !== "PRODUCTION") {
  dotenv.config({
    path: "config/.env",
  });
}

//Connect DB
connectDb();

//Creating the server
const server = app.listen(port, () => {
  console.log(`Server is running on the port ${port}`);
});

//UnhandlePromise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log(`shutting down the server for unhandle promise rejection`);

  server.close(() => {
    process.exit(1);
  });
});
