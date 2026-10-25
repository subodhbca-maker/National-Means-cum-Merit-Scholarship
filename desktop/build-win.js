/* Builds the Windows app: copies the web app into ./app, packages with Electron, then makes
   an NSIS installer (needs `makensis`) and a portable zip. Run: npm run build:win */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { packager } = require('@electron/packager');

const ROOT = path.resolve(__dirname, '..');
const APP = path.join(__dirname, 'app');
const OUT = path.join(__dirname, 'out');
const pkg = require('./package.json');
const WEB = ['index.html', 'manifest.json', 'css', 'js', 'data', 'lib', 'icons'];

(async () => {
  fs.rmSync(APP, { recursive: true, force: true });
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(APP);
  for (const f of WEB) fs.cpSync(path.join(ROOT, f), path.join(APP, f), { recursive: true });

  const [dir] = await packager({
    dir: __dirname,
    out: OUT,
    platform: 'win32',
    arch: 'x64',
    icon: path.join(__dirname, 'icon.ico'),
    overwrite: true,
    asar: true,
    prune: true,
    ignore: [/^\/node_modules($|\/)/, /^\/\.gitignore$/, /^\/out($|\/)/, /^\/build-win\.js$/, /^\/installer\.nsi$/, /\.bmp$/, /^\/README/],
    appCopyright: '© Basic Pathshala — Concept & Development: Subodh Maurya',
    win32metadata: { CompanyName: 'Basic Pathshala', FileDescription: 'Basic Pathshala - NMMS', ProductName: 'Basic Pathshala - NMMS', InternalName: 'BasicPathshalaNMMS', OriginalFilename: 'Basic Pathshala NMMS.exe' }
  });
  console.log('packaged:', dir);

  const zipName = `BasicPathshala-NMMS-Portable-${pkg.version}.zip`;
  execFileSync('zip', ['-qr9', path.join(OUT, zipName), path.basename(dir)], { cwd: OUT, stdio: 'inherit' });
  console.log('portable:', zipName);

  execFileSync('makensis', ['-V2', `-DVERSION=${pkg.version}`, `-DSRCDIR=${path.relative(__dirname, dir).replace(/\//g, '\\')}`, 'installer.nsi'], { cwd: __dirname, stdio: 'inherit' });
  console.log('installer: out/BasicPathshala-NMMS-Setup-' + pkg.version + '.exe');
})().catch((e) => { console.error(e); process.exit(1); });
