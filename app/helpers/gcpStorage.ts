import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  keyFilename: "./bucket.json",
});

require("dotenv").config();
const bucketName = process.env.GCP_BUCKET_NAME;

const bucket = storage.bucket(bucketName);
const retentionPeriodSeconds = 100 * 365 * 24 * 60 * 60;

export const uploadFileToGCP = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
) => {
  try {
    const gcpFile = bucket.file(fileName);
    await gcpFile.save(fileBuffer, {
      resumable: false,
      contentType: mimeType,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    return publicUrl;
  } catch (error) {
    throw new Error("Failed to upload file to GCP bucket");
  }
};

export const deleteFileFromGCP = async (fileName: string) => {
  try {
    const file = bucket.file(fileName);
    await file.delete();
  } catch (error) {
    throw new Error("Failed to delete media file from GCP bucket");
  }
};

// export const setAndLockRetentionPolicy = async () => {
//   try {
//     const [metadata] = await storage.bucket(bucketName).setRetentionPeriod(retentionPeriodSeconds);
//     console.log(`Retention period for bucket ${bucketName} set to ${metadata.retentionPolicy.retentionPeriod} seconds.`);

//     await storage.bucket(bucketName).lock(metadata.metageneration);
//     console.log(`Retention policy for bucket ${bucketName} is now locked.`);
//   } catch (error) {
//     console.error('Error setting or locking retention policy:', error);
//   }
// }

// export const getMedia = async (fileName: string) =>{
//     try {
//       const file = bucket.file(fileName);
//      if(!file){
//       throw new Error("File not found: " + fileName);
//      }
//      return file;
//     } catch (error) {
//       throw new Error("Failed to get metadata from GCP bucket");
//     }
//   }
