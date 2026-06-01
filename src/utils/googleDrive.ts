import { google } from "googleapis";
import { Readable } from "stream";

/**
 * Uploads a File object to Google Drive using a Service Account.
 * Generates a shareable URL by setting permissions to "anyone" with "reader" role.
 * 
 * @param file The File object to upload
 * @returns The shareable Google Drive webViewLink
 */
export async function uploadToGoogleDrive(file: File): Promise<string> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  // Replace escaped newlines if the key was provided as a single-line env variable
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientEmail || !privateKey || clientEmail.includes("placeholder") || privateKey.includes("placeholder")) {
    throw new Error("Google Drive Service Account credentials are not configured or are placeholders.");
  }

  // Initialize JWT Auth
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"]
  });

  const drive = google.drive({ version: "v3", auth });

  const fileMetadata: any = {
    name: `${Date.now()}-${file.name.replace(/\s+/g, "_")}`,
  };

  // If a parent folder ID is specified, upload inside it
  if (folderId && !folderId.includes("placeholder")) {
    fileMetadata.parents = [folderId];
  }

  // Convert File object to stream
  const buffer = Buffer.from(await file.arrayBuffer());
  const bodyStream = Readable.from(buffer);

  const media = {
    mimeType: file.type,
    body: bodyStream,
  };

  // 1. Upload File
  const uploadResponse = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, webViewLink",
  });

  const fileId = uploadResponse.data.id;
  if (!fileId) {
    throw new Error("Failed to upload file to Google Drive (no file ID returned).");
  }

  // 2. Set permission to 'anyone' to make the link public/shareable
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
  });

  // 3. Fetch the metadata to retrieve the shareable webViewLink
  const getResponse = await drive.files.get({
    fileId: fileId,
    fields: "webViewLink",
  });

  const shareableUrl = getResponse.data.webViewLink;
  if (!shareableUrl) {
    throw new Error("Failed to retrieve shareable link from Google Drive.");
  }

  return shareableUrl;
}
