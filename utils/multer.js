import express from 'express';
import multer from 'multer'

// Use memory storage so we can upload buffers directly to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;