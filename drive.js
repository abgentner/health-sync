'use strict';
// Health Sync · Google Drive and this-computer storage, and the problems log.
// One of the app's screen files: classic scripts that share one global scope, loaded in order by index.html.

/* ================= storage backends ================= */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const DATA_NAME = 'health-data.json';
const CLIENT_ID = (window.HEALTH_SYNC_CONFIG && window.HEALTH_SYNC_CONFIG.clientId || '').trim() || LS.get('hs-client-id', '');

const LocalStore = {
  kind: 'local',
  async init() {},
  async load() { return normalize(LS.get('hs-local-data', null)); },
  async save(obj) { LS.set('hs-local-data', obj); },
};

const Drive = {
  kind: 'drive', token: null, exp: 0, client: null, ids: {},
  ready() {
    return new Promise((res, rej) => {
      let n = 0;
      const t = setInterval(() => {
        if (window.google?.accounts?.oauth2) { clearInterval(t); res(); }
        else if (++n > 150) { clearInterval(t); rej(new Error('Could not load Google sign-in. Check your internet connection and reload.')); }
      }, 100);
    });
  },
  initClient() {
    if (this.client) return;
    this.client = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: DRIVE_SCOPE, callback: () => {} });
    // Kept for its full hour (about) so reopening the app within that time needs no click.
    const saved = LS.get('hs-token', null);
    if (saved && saved.exp > Date.now()) { this.token = saved.token; this.exp = saved.exp; }
  },
  valid() { return !!this.token && Date.now() < this.exp; },
  // Must be called directly from a click (no await before it) so the Google popup isn't blocked.
  signIn() {
    return new Promise((res, rej) => {
      this.client.callback = r => {
        if (r.error) return rej(new Error(r.error_description || r.error));
        if (!google.accounts.oauth2.hasGrantedAllScopes(r, DRIVE_SCOPE)) return rej(new Error('Google Drive access was not allowed. Click Connect again and tick the box that lets Health Sync see and edit your Drive files.'));
        this.token = r.access_token; this.exp = Date.now() + (Number(r.expires_in || 3600) - 60) * 1000;
        LS.set('hs-token', { token: this.token, exp: this.exp });
        res();
      };
      this.client.error_callback = e => rej(new Error(e?.type === 'popup_closed' ? 'Sign-in window was closed.' : e?.type === 'popup_failed_to_open' ? 'The sign-in window was blocked. Allow pop-ups for this site and try again.' : (e?.message || 'Sign-in failed.')));
      // Naming the remembered account lets Google skip the account chooser.
      const email = LS.get('hs-email', '');
      this.client.requestAccessToken(email ? { prompt: '', login_hint: email } : { prompt: '' });
    });
  },
  async api(url, opts = {}) {
    if (!this.valid()) await this.signIn();
    const full = url.startsWith('http') ? url : 'https://www.googleapis.com/drive/v3/' + url;
    const r = await fetch(full, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + this.token } });
    if (!r.ok) {
      let msg = 'error ' + r.status;
      try { const j = await r.json(); msg = j.error?.message || msg; } catch {}
      if (r.status === 401) { this.token = null; LS.del('hs-token'); msg = 'your Google session expired. Click Sync to sign in again.'; }
      throw new Error('Google Drive: ' + msg);
    }
    return r;
  },
  async list(q) {
    const out = []; let page = '';
    do {
      const r = await this.api('files?pageSize=200&orderBy=createdTime&fields=' + encodeURIComponent('nextPageToken,files(id,name,mimeType,modifiedTime,size)') + '&q=' + encodeURIComponent(q) + (page ? '&pageToken=' + page : ''));
      const j = await r.json(); out.push(...(j.files || [])); page = j.nextPageToken || '';
    } while (page);
    return out;
  },
  async folder(name, parent) {
    const f = await this.list(`name='${name}' and mimeType='${FOLDER_MIME}' and '${parent}' in parents and trashed=false`);
    if (f.length) return f[0].id;
    const r = await this.api('files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parent] }) });
    return (await r.json()).id;
  },
  async init() {
    try {
      const about = await (await this.api('about?fields=user(emailAddress)')).json();
      this.email = about.user?.emailAddress || '';
      if (this.email) LS.set('hs-email', this.email);
    } catch {}
    this.ids.root = await this.folder('Health Sync', 'root');
    [this.ids.inbox, this.ids.processed, this.ids.plan] = await Promise.all([this.folder('Inbox', this.ids.root), this.folder('Processed', this.ids.root), this.folder('Plan', this.ids.root)]);
    const f = await this.list(`name='${DATA_NAME}' and '${this.ids.root}' in parents and trashed=false`);
    this.ids.data = f[0]?.id || null;
  },
  async load() {
    if (!this.ids.data) return emptyData();
    const r = await this.api(`files/${this.ids.data}?alt=media`);
    return normalize(await r.json());
  },
  async save(obj) {
    const body = JSON.stringify(obj);
    if (this.ids.data) {
      await this.api(`https://www.googleapis.com/upload/drive/v3/files/${this.ids.data}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
      return;
    }
    const b = 'hs' + uid();
    const meta = { name: DATA_NAME, parents: [this.ids.root], mimeType: 'application/json' };
    const mp = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${b}--`;
    const r = await this.api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body: mp });
    this.ids.data = (await r.json()).id;
  },
  // Backups (v3.9): the script saves one copy a day in Health Sync › Backups; a restore saves a "before restore" copy there.
  async backupsFolder() { return this.ids.backups ||= await this.folder('Backups', this.ids.root); },
  async backups() {
    const id = await this.backupsFolder();
    return (await this.list(`'${id}' in parents and trashed=false and name contains 'health-data '`)).filter(f => /\.json$/.test(f.name))
      .sort((a, b) => backupStamp(b.name).localeCompare(backupStamp(a.name)));
  },
  async readJson(id) { return (await this.api(`files/${id}?alt=media`)).json(); },
  async saveBackup(name, obj) {
    const parent = await this.backupsFolder(), b = 'hs' + uid(), meta = { name, parents: [parent], mimeType: 'application/json' };
    const mp = `--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(obj)}\r\n--${b}--`;
    await this.api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + b }, body: mp });
  },
  inbox() { return this.list(`'${this.ids.inbox}' in parents and trashed=false and mimeType!='${FOLDER_MIME}'`); },
  // Health Auto Export can only write into a folder it created itself, so watch that folder as well.
  async watchedFiles() {
    const roots = await this.list(`name contains 'Auto Export' and mimeType='${FOLDER_MIME}' and trashed=false`);
    const out = [];
    const walk = async (id, path, depth) => {
      for (const it of await this.list(`'${id}' in parents and trashed=false`)) {
        if (it.mimeType === FOLDER_MIME) { if (depth < 3) await walk(it.id, path + ' › ' + it.name, depth + 1); }
        else out.push({ ...it, folder: path });
      }
    };
    for (const r of roots) await walk(r.id, r.name, 1);
    return out.filter(f => /\.(json|csv|zip|txt)$/i.test(f.name) || /json|csv|zip|text/.test(f.mimeType));
  },
  // The script (v2.12+) saves Garmin files in Health Sync › Garmin › days|activities › <year>.
  async garminFiles(kind, since) {
    const sub = async (name, parent) => (await this.list(`name='${name}' and mimeType='${FOLDER_MIME}' and '${parent}' in parents and trashed=false`))[0]?.id;
    const g = await sub('Garmin', this.ids.root), top = g && await sub(kind, g);
    if (!top) return [];
    const years = await this.list(`mimeType='${FOLDER_MIME}' and '${top}' in parents and trashed=false`);
    const newer = since ? ` and modifiedTime > '${since}'` : '';
    return (await Promise.all(years.map(y => this.list(`'${y.id}' in parents and trashed=false and name contains 'garmin-'${newer}`)))).flat().map(f => ({ ...f, kind }));
  },
  async fetchFile(f) {
    if (f.mimeType === 'application/vnd.google-apps.spreadsheet') {
      const r = await this.api(`files/${f.id}/export?mimeType=text%2Fcsv`);
      return { name: f.name + '.csv', buf: await r.arrayBuffer() };
    }
    if (f.mimeType.startsWith('application/vnd.google-apps')) throw new Error('is a Google Doc/Slides file, not a spreadsheet export');
    const r = await this.api(`files/${f.id}?alt=media`);
    return { name: f.name, buf: await r.arrayBuffer() };
  },
  async scriptStatus() {
    const f = await this.list(`name='health-sync-status.json' and '${this.ids.root}' in parents and trashed=false`);
    if (!f.length) return null;
    try { return await (await this.api(`files/${f[0].id}?alt=media`)).json(); } catch { return null; }
  },
  async moveToProcessed(f) {
    await this.api(`files/${f.id}?addParents=${this.ids.processed}&removeParents=${this.ids.inbox}&fields=id`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  },
};

/* ---- problems log: errors are kept with the data, so a failure while you weren't looking is still there later ---- */
function logError(where, e) {
  const msg = String(e?.message || e || 'unknown error').slice(0, 400), list = (data.errors ||= []), last = list[list.length - 1];
  // The same error again within a minute is counted, not repeated.
  if (last && last.where === where && last.msg === msg && Date.now() - Date.parse(last.at) < 60e3) { last.n = (last.n || 1) + 1; last.at = new Date().toISOString(); }
  else list.push({ id: uid(), at: new Date().toISOString(), where, msg, device: (navigator.userAgent.match(/iPhone|iPad|Android|Macintosh|Windows/) || [''])[0].replace('Macintosh', 'Mac') });
  if (list.length > 200) list.splice(0, list.length - 200);
  errorsDirty = true;
  renderErrors();
}
function renderErrors() {
  const el = $('#er-list'); if (!el) return;
  const list = [...(data.errors || [])].reverse();
  el.innerHTML = list.length ? list.slice(0, 50).map(x => `<div class="li"><span class="n"><b>${esc(x.where)}</b>${x.n > 1 ? ` <span class="tag">×${x.n}</span>` : ''}${x.device ? ` <span class="tag">${esc(x.device)}</span>` : ''}<div class="muted small">${esc(x.msg)}</div></span><span class="x small">${esc(new Date(x.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</span></div>`).join('')
    : '<p class="muted small" style="margin:0">No problems recorded.</p>';
}
window.addEventListener('error', e => { if (e.message && !/ResizeObserver/.test(e.message)) logError('App', `${e.message}${e.filename ? ` (${e.filename.split('/').pop()}:${e.lineno})` : ''}`); });
window.addEventListener('unhandledrejection', e => logError('App', e.reason));

let busy = false;
