import fs from 'fs';
import { google } from 'googleapis';
import { dataStore, store } from '../../store';

export const getAuthUrl = () => {
  const clientId = store.get('sync.googleDrive.clientId');
  const clientSecret = store.get('sync.googleDrive.clientSecret');

  const oAuth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'urn:ietf:wg:oauth:2.0:oob'
  );

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
};

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(showMsgBox: (m: string) => void) {
  const oAuth2Client = new google.auth.OAuth2(
    store.get('sync.googleDrive.clientId'),
    store.get('sync.googleDrive.clientSecret'),
    'urn:ietf:wg:oauth:2.0:oob'
  );

  // Check if we have previously stored a token.
  const token = store.get('sync.googleDrive.token');
  try {
    if (!token) return await getAccessToken(oAuth2Client);

    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } catch (err) {
    showMsgBox(err.message);
    return null;
  }
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function getAccessToken(oAuth2Client: google.auth.OAuth2) {
  const code = store.get('sync.googleDrive.code') as string;
  if (code) {
    oAuth2Client.getToken(code, (err, token) => {
      if (err) throw Error('Error retrieving access token');
      oAuth2Client.setCredentials(token);
      store.set('sync.googleDrive.token', token);
      return oAuth2Client;
    });
  } else {
    throw Error(
      'API code for Google Drive not found. Please go to Preferences to update.'
    );
  }
}

async function getFolderId(auth: google.auth.OAuth2) {
  const drive = google.drive({ version: 'v3', auth });
  const folderId = store.get('sync.googleDrive.folderId');
  if (folderId) return folderId;
  return new Promise((resolve, reject) =>
    drive.files.create(
      {
        requestBody: {
          name: 'PaperShelf',
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      },
      function (err, folder) {
        if (err) {
          reject(err);
        } else {
          store.set('sync.googleDrive.folderId', folder?.data.id);
          resolve(folder?.data.id);
        }
      }
    )
  );
}

async function updateFile(
  auth: google.auth.OAuth2,
  fileName: string,
  localPath: string,
  showMsgBox: (m: string) => void
) {
  const drive = google.drive({ version: 'v3', auth });
  drive.files.list(
    {
      spaces: 'appDataFolder',
      q: `name='${fileName}'`,
      fields: 'files(id,name)',
    },
    (err, res) => {
      if (err) showMsgBox(err.message);
      if (!res?.data.files || res?.data.files.length === 0) {
        drive.files.create(
          {
            requestBody: {
              name: fileName,
              parents: ['appDataFolder'],
            },
            media: {
              body: fs.createReadStream(store.path),
              mimeType: 'text/plain',
            },
            fields: 'id',
          },
          (err2, _) => {
            if (err2) showMsgBox(err2);
            store.set('sync.googleDrive.lastUpdated', new Date());
          }
        );
      } else {
        drive.files.update(
          {
            fileId: res.data.files[0].id,
            media: {
              body: fs.createReadStream(localPath),
              mimeType: 'text/plain',
            },
            fields: 'id',
          },
          (err2, _) => {
            if (err2) throw err2;
            store.set('sync.googleDrive.lastUpdated', new Date());
            showMsgBox(`File ${fileName} succesfully synced.`);
          }
        );
      }
    }
  );
}

export default async (showMsgBox: (m: string) => void) => {
  try {
    const auth = await authorize(showMsgBox);
    // const folderId = await getFolderId(auth);
    await updateFile(auth, 'config.yaml', store.path, showMsgBox);
    await updateFile(auth, 'data.yaml', dataStore.path, showMsgBox);
  } catch (err) {
    showMsgBox('Error loading client secret file:');
  }
};
