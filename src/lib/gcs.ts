import { Storage } from "@google-cloud/storage";

const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const isConfigured = 
  clientEmail && 
  privateKey && 
  !clientEmail.includes("placeholder") && 
  !privateKey.includes("placeholder");

export const gcs = isConfigured
  ? new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    })
  : null;

export default gcs;
