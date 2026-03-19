import multer from "multer";

const storage = multer.diskStorage({ //diskStorage: file stored in server ... Alternatively, wehave: memory storage: keeps filesin memory: RAM... You have to handle it 
  destination: function (req, res, cb) {
    cb(null, "uploads/"); //cb is the callback
    //The first argument is error (we pass null because no error).
    // The second argument is the path to save files → "uploads/".
  },
  //👉 This defines how the uploaded file should be named before saving.
  filename: function (req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = file.originalname.split(".")[0];
    const ext = file.originalname.split(".").pop();
    cb(null, `${filename}-${uniqueSuffix}.${ext}`);
  },
});
export const upload = multer({ storage });
