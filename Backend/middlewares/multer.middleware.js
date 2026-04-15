import multer from "multer";
import path from "path";
import fs from "fs";

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(process.cwd(), "public", "temp");
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        } catch (e) {
            return cb(e);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
    // Allow all image types by checking if the mimetype starts with "image/"
    // or if the file extension is a common image format.
    const isImageMime = file.mimetype.startsWith("image/");
    const commonImageExts = /jpeg|jpg|png|gif|webp|bmp|tiff|svg|avif|heic|heif|jfif|ico/;
    const isImageExt = commonImageExts.test(path.extname(file.originalname).toLowerCase());

    if (isImageMime || isImageExt) {
        return cb(null, true);
    } else {
        cb(new Error("Only image files are allowed."));
    }
};

// Multer upload configuration
export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit to accommodate high-res photos
    },
    fileFilter: fileFilter
});
