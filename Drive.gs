const SUPPORTEDMIMETYPES = [
  "application/vnd.google-apps.drawing",
  "application/vnd.google-apps.presentation",
  "application/vnd.google-apps.spreadsheet",
  "application/vnd.google-apps.document"
];
//Maximum filesize that can be exported with the export command. 
const DRIVE_MAX_EXPORT_BYTES = 10000000;

//----------------------------------------------------------//
function driveGetDestinations() {
  let rv = [
    { title: 'My Drive', id: 'root' },
    { title: 'Shared With Me', id: 'sharedWithMe' }
  ];

  let pageToken = null;
  do {
    try {
      driveItems = Drive.Drives.list({
        maxResults: 100,
        pageToken: pageToken
      });
      pageToken = driveItems.nextPageToken;
      for (let drive of driveItems.items) {
        rv.push({ id: drive.id, title: drive.name });
      }
    } catch (err) {
      // TODO (developer) - Handle exception
      Logger.log('Failed with error %s', err.message);
    }
  } while (pageToken);
  return rv;
}
//----------------------------------------------------------//
/*Calling with no parameters or "root" as the dir id gives you all the folders in My Drive
Calling with "sharedWithMe" as the dirID gives you all folders shared with you
Calling with a shared drive ID as the dir ID and Shared Drive ID gives you all the folders in the root of the shared drive
*/
function driveGetFoldersInDir(dirId = "root", sharedDriveId) {
  if (sharedDriveId == "root" || sharedDriveId == "sharedWithMe") {
    sharedDriveId = null;
  }
  let rv = [];
  let pageToken = null;
  let listObject = {
    q: "trashed = false and mimeType = 'application/vnd.google-apps.folder' and ",
    maxResults: 100,
    pageToken: pageToken,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    driveId: null,
    corpora: 'allDrives',
    orderBy: "title"
  }
  if (dirId == "sharedWithMe" && !sharedDriveId) {
    listObject.q += dirId;
  }
  else if (dirId && !sharedDriveId) {
    listObject.q += `'${dirId}' in parents`;
  }
  else {
    listObject.supportsAllDrives = true;
    listObject.includeItemsFromAllDrives = true;
    listObject.driveId = sharedDriveId;
    listObject.corpora = "drive";
    listObject.q += `"${dirId}" in parents`;
  }
  do {
    try {
      driveItems = Drive.Files.list(listObject);
      pageToken = driveItems.nextPageToken;

      for (let folder of driveItems.items) {
        rv.push({ id: folder.id, title: folder.title });
      }
    } catch (err) {
      // TODO (developer) - Handle exception
      Logger.log('Failed with error %s', err.message);
    }
  } while (pageToken);
  return rv;
}
//----------------------------------------------------------//
function driveGetName(id) {
  let teamDrive = Drive.Drives.get(id);
  return teamDrive.name;
}
//----------------------------------------------------------//
function driveConvertFile(options) {
  var pdfFileBlob = DriveApp.getFileById(options.srcId).getAs('application/pdf');
  try {
    let newFile = Drive.Files.insert({
      mimeType: "application/pdf",
      parents: [{ id: options.destDir }],
      driveId: options.sharedDiveId,
      title: options.srcTitle + ".pdf"
    }, pdfFileBlob, { supportsAllDrives: true });
    options.status = 1;
    options.destId = newFile.id;
    options.expire = Date.now() + JOB_EXPIRE_MS;
  }
  catch (e) {
    options.status = 2;
    options.error = e;
  }
  return options;
}
//----------------------------------------------------------//
function driveGetSize(id) {
  let rv = null;
  if (!id) {
    Logger.log("No file ID specified");
    return null;
  }
  try {
    let file = Drive.Files.get(id, { supportsAllDrives: true });
    rv = file.fileSize;
  }
  catch (e) {
    Logger.log("Exception in drive.get error is " + e);
  }
  return rv;
}
