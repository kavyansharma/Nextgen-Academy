import { google } from "googleapis";
import { Readable } from "stream";

/**
 * Searches for a folder by name inside a parent folder, or creates it if not found.
 * 
 * @param drive The Google Drive API client instance
 * @param name The name of the folder to search/create
 * @param parentId Optional parent folder ID to nest inside
 * @returns The folder ID
 */
async function getOrCreateFolder(drive: any, name: string, parentId?: string): Promise<string> {
  let query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const listResponse = await drive.files.list({
    q: query,
    fields: "files(id)",
    spaces: "drive",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = listResponse.data.files || [];
  if (files.length > 0 && files[0].id) {
    console.log(`Resolved existing folder "${name}" (ID: ${files[0].id})`);
    return files[0].id;
  }

  // Create the folder if it does not exist
  const folderMetadata: any = {
    name: name,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentId) {
    folderMetadata.parents = [parentId];
  }

  const createResponse = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
    supportsAllDrives: true,
  });

  const newFolderId = createResponse.data.id;
  if (!newFolderId) {
    throw new Error(`Failed to create Google Drive folder: ${name}`);
  }

  console.log(`Created new folder "${name}" (ID: ${newFolderId})`);
  return newFolderId;
}

/**
 * Uploads a file to Google Drive under a specific subfolder (e.g. "Job Seeker Resumes").
 * Makes the file shareable by setting its permissions to "anyone" with "reader" role.
 * 
 * @param file The File object to upload
 * @param subfolderName The target subfolder name to store the file inside
 * @returns Shareable public Google Drive webViewLink
 */
export async function uploadToGoogleDrive(file: File, subfolderName: string): Promise<string> {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!clientEmail || !privateKey || clientEmail.includes("placeholder") || privateKey.includes("placeholder")) {
    throw new Error("Google Drive Service Account credentials are not configured or are placeholders.");
  }

  // Authenticate with Google Drive via JWT
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  const drive = google.drive({ version: "v3", auth });

  // 1. Resolve parent subfolder ID
  let targetFolderId: string | undefined;
  try {
    const parentId = (parentFolderId && !parentFolderId.includes("placeholder")) ? parentFolderId : undefined;
    targetFolderId = await getOrCreateFolder(drive, subfolderName, parentId);
  } catch (err: any) {
    console.error(`Error resolving folder "${subfolderName}":`, err);
    throw new Error(`Folder resolution error: ${err.message}`);
  }

  // 2. Prepare file data and convert to stream
  const fileMetadata: any = {
    name: `${Date.now()}-${file.name.replace(/\s+/g, "_")}`,
  };
  if (targetFolderId) {
    fileMetadata.parents = [targetFolderId];
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const bodyStream = Readable.from(buffer);

  const media = {
    mimeType: file.type,
    body: bodyStream,
  };

  // 3. Upload file
  const uploadResponse = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });

  const fileId = uploadResponse.data.id;
  if (!fileId) {
    throw new Error(`Failed to upload file "${file.name}" to Google Drive.`);
  }

  // 4. Update file permissions to public ("anyone" reader)
  await drive.permissions.create({
    fileId: fileId,
    requestBody: {
      role: "reader",
      type: "anyone",
    },
    supportsAllDrives: true,
  });

  // 5. Retrieve shareable webViewLink
  const getResponse = await drive.files.get({
    fileId: fileId,
    fields: "webViewLink",
    supportsAllDrives: true,
  });

  const shareableUrl = getResponse.data.webViewLink;
  if (!shareableUrl) {
    throw new Error("Uploaded successfully, but failed to retrieve shareable link from Google Drive.");
  }

  return shareableUrl;
}
