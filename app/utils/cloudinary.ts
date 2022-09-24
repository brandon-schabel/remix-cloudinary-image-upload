import { composeUploadHandlers } from "@remix-run/server-runtime/dist/formData";
import { createMemoryUploadHandler } from "@remix-run/server-runtime/dist/upload/memoryUploadHandler";
import type { UploadApiResponse } from "cloudinary";
import cloudinary from "cloudinary";
import { Readable } from "stream";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// iPhones commonly take photos in heic for live mode, so by default  we want to return a jpeg
export const getImageFormat = (image: UploadApiResponse) => {
  if (image.format === "heic") {
    return "jpg";
  }

  if (image.format === "png" || "jpg") {
    return image.format;
  }

  return "jpg";
};


// cloudinary uploader that takes a readable stream and returns a promise with the final upload image
export const uploadCloudinaryImage = async (
  dataStream: AsyncIterable<Uint8Array>,
  options: { folder: string }
): Promise<cloudinary.UploadApiResponse | undefined> => {
  const fileStream = Readable.from(dataStream);
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder: options.folder,
      },
      (error, result) => {
        if (error) {
          console.error(error);
          reject(error);
        }
        resolve(result);
      }
    );

    fileStream.pipe(uploadStream);
  });
};

// returns upload handler so we can specify which folder to store the image in
export const getUploadHandler = ({ folderId }: { folderId: string }) => {
  return composeUploadHandlers(async ({ name, data }) => {
    if (name !== "img") {
      return undefined;
    }

    // pass data, and folderId to cloudinary upload function
    const uploadedImage = await uploadCloudinaryImage(data, {
      folder: folderId,
    });

    return JSON.stringify(uploadedImage);
  }, createMemoryUploadHandler());
};

// retrieve a public url with width/format set
export const getCloudinaryImage = (image: UploadApiResponse) => {
  if (!image.public_id) return null;

  return cloudinary.v2.url(image.public_id || "", {
    fetch_format: getImageFormat(image),
  });
};
