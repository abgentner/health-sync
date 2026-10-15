/**
 * Health Sync — copy emailed Lose It (and Garmin) reports into Google Drive.
 *
 * Every hour this looks in your Gmail for new emails from Lose It or Garmin
 * that have a PDF, CSV or ZIP attached, and saves the attachments into
 * Google Drive › Health Sync › Inbox. The Health Sync app imports them the
 * next time you open it.
 *
 * Each email is labelled "health-sync-saved" in Gmail once its attachments
 * are saved, so nothing is copied twice. Your emails are not changed or deleted.
 *
 * Setup: see README.md, "Send Lose It emails straight to Google Drive".
 */

// Which emails to look for. If your reports come from a different address,
// add it here, e.g. 'from:(loseit.com OR garmin.com OR reports@example.com)'.
const SEARCH = 'from:(loseit.com OR garmin.com) has:attachment newer_than:30d -label:health-sync-saved';

const LABEL = 'health-sync-saved';
const FOLDER_PATH = ['Health Sync', 'Inbox'];
const FILE_TYPES = /\.(pdf|csv|zip)$/i;

/** Run this once. It saves anything waiting now and turns on the hourly check. */
function setup() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'saveHealthReports')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('saveHealthReports').timeBased().everyHours(1).create();
  saveHealthReports();
}

/** Saves attachments from matching emails into Health Sync › Inbox. */
function saveHealthReports() {
  const folder = inboxFolder_();
  const label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
  const threads = GmailApp.search(SEARCH, 0, 50);
  let saved = 0;
  threads.forEach(thread => {
    thread.getMessages().forEach(msg => {
      const stamp = Utilities.formatDate(msg.getDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
      msg.getAttachments({ includeInlineImages: false }).forEach(att => {
        if (!FILE_TYPES.test(att.getName())) return;
        folder.createFile(att.copyBlob()).setName(`${stamp} ${att.getName()}`);
        saved++;
      });
    });
    thread.addLabel(label);
  });
  console.log(`Saved ${saved} attachment(s) from ${threads.length} email(s).`);
}

/** Turns the hourly check off. */
function stop() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'saveHealthReports')
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function inboxFolder_() {
  let folder = DriveApp.getRootFolder();
  FOLDER_PATH.forEach(name => {
    const it = folder.getFoldersByName(name);
    folder = it.hasNext() ? it.next() : folder.createFolder(name);
  });
  return folder;
}
