/* ============================================================
   SHELL & DEBT — dev/artifact.js

   The one-file build, repacked for a hosted Artifact page.

   The host wraps whatever it is handed in its own
   <!doctype html><head>…</head><body>, so this strips our own
   shell and hands back the head's <title>/<style> plus the whole
   body — everything the game needs, in the order it needs it.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'dist', 'shell-and-debt.html'), 'utf8');

const head = src.slice(src.indexOf('<head>') + 6, src.indexOf('</head>'));
const body = src.slice(src.indexOf('<body>') + 6, src.lastIndexOf('</body>'));

/* the title the tab and the gallery card use, and the stylesheet */
const title = (head.match(/<title>[\s\S]*?<\/title>/) || ['<title>SHELL &amp; DEBT</title>'])[0];
const styles = (head.match(/<style[\s\S]*?<\/style>/g) || []).join('\n');

/* the host paints its own ground behind the page: a transparent body
   would borrow the viewer's theme and wash the whole night out */
const ground = `<style>
  html, body { background: #12101d; margin: 0; padding: 0; }
</style>`;

const out = [title, ground, styles, body].join('\n');
const dest = path.join(ROOT, 'dist', 'artifact.html');
fs.writeFileSync(dest, out);
console.log('artifact page -> dist/artifact.html (' +
  Math.round(out.length / 1024) + ' KB)');
