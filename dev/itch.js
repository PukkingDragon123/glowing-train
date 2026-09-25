/* ============================================================
   SHELL & DEBT — dev/itch.js
   THE ITCH.IO UPLOAD.

   itch.io runs an HTML5 game out of a zip, and it wants exactly
   one thing from it: an index.html at the top level. The game is
   already a single file -- dev/bundle.js inlines every script and
   the stylesheet, and nothing loads from anywhere at runtime -- so
   the upload is that file, renamed, zipped on its own.

     dist/itch/index.html          what goes in the zip
     dist/shell-and-debt-itch.zip  what you upload

   On itch: Kind of project -> HTML. Upload the zip, tick "This
   file will be played in the browser". Viewport 1280 x 720 with
   the fullscreen button on; it plays on a phone as well.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');

execFileSync(process.execPath, [path.join(__dirname, 'bundle.js')], { stdio: 'inherit' });
const src = path.join(ROOT, 'dist', 'shell-and-debt.html');
const dir = path.join(ROOT, 'dist', 'itch');
fs.mkdirSync(dir, { recursive: true });
fs.copyFileSync(src, path.join(dir, 'index.html'));
const zip = path.join(ROOT, 'dist', 'shell-and-debt-itch.zip');
if (fs.existsSync(zip)) fs.unlinkSync(zip);
execFileSync('zip', ['-j', '-9', '-X', zip, path.join(dir, 'index.html')], { stdio: 'ignore' });
const kb = (f) => Math.round(fs.statSync(f).size / 1024) + ' KB';
console.log('itch.io zip -> dist/shell-and-debt-itch.zip (' + kb(zip) + ', index.html ' + kb(path.join(dir, 'index.html')) + ')');
