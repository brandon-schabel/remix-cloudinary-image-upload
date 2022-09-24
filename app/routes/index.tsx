import type { ActionArgs } from "@remix-run/node";
import { unstable_parseMultipartFormData as parseMultipartFormData } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import type { UploadApiResponse } from "cloudinary";
import { getCloudinaryImage, getUploadHandler } from "~/utils/cloudinary";

const ERROR_MESSAGE = "image-upload-error";

type ImageWithUrl = UploadApiResponse & {
  imageUrl: string;
};

export const action = async ({ request }: ActionArgs) => {
  // returns a function that is passed to parseMultipartFormData,
  // then that data is parsed/uploaded to cloudinary
  const uploadHandler = getUploadHandler({
    folderId: `remix-upload-test`,
  });

  try {
    const formData = await parseMultipartFormData(request, uploadHandler);

    // contains the image(s) uploaded as stringified cloudinary responses
    const imageDataArray = formData.getAll("img");

    // for simplicity we are just grabbing the first image
    const imageDataString = imageDataArray[0] as string;

    // the response will be the cloudinary api response
    const imageData = JSON.parse(imageDataString) as ImageWithUrl;

    const imageUrl = getCloudinaryImage(imageData);

    imageData.imageUrl = imageUrl || "";

    return imageData;
  } catch (error) {
    console.error(error);
    return ERROR_MESSAGE;
  }
};

export default function Index() {
  const data = useActionData<typeof action>();

  // needed for proper type inference
  const image = typeof data === "string" ? null : data;

  return (
    <div>
      {data === ERROR_MESSAGE ? "Error uploading image" : null}

      <Form encType="multipart/form-data" method="post">
        <input
          type="file"
          name="img"
          src={image?.imageUrl || ""}
          placeholder="Select Image"
        />

        <button type="submit">Upload</button>
      </Form>

      {/* Uploaded cloudinary image from action data */}
      {image ? <img src={image?.imageUrl} /> : null}
    </div>
  );
}
