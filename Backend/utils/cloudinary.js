import { v2 as cloudinary } from "cloudinary";

// Configure cloudinary lazily - only when first used
let isConfigured = false;

function ensureConfigured() {
  if (!isConfigured) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        "Cloudinary configuration missing. Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file"
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    isConfigured = true;
  }
}

export async function uploadToCloudinary(filePath, { folder } = {}) {
  if (!filePath) return null;

  ensureConfigured();

  const result = await cloudinary.uploader.upload(filePath, {
    folder: folder || "eventhub",
    resource_type: "image",
  });

  return result;
}

export { cloudinary };

