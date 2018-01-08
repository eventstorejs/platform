const targz = require('tar.gz');
const fs = require('fs-extra');
const request = require('request')
const exec = require('child-process-promise').exec;
const path = require('path')

const tempPath = './.tmp'

const memoryLimit = 10000000

const PACKAGES_TO_INSTALL = [
  'fancyhdr',
  'geometry',
  // 'tabularx',
  'pbox',
  // 'longtable',
  'lastpage',
  'carlito',
  'xkeyval',
  'fontaxes',
  'tcolorbox',
  'multirow',
  'caption',
  'pgf',
  'xcolor',
  'environ',
  'trimspaces',
  'etoolbox',
  'hyperref',
  'zapfding',
  'symbol',
  'ltablex'

]

fs.remove('./.tmp')
  .then(() => fs.remove('./installation.profile'))
  .then(() => fs.remove('./vendor'))
  .then(() => fs.mkdir('./.tmp/'))
  .then(() =>
    new Promise((resolve, reject) => {
      request('http://mirrors.rit.edu/CTAN/systems/texlive/tlnet/install-tl-unx.tar.gz')
        .pipe(fs.createWriteStream(`${tempPath}/installer.tar.gz`))
        .on('close', () => {
          console.log('Installer loaded');
          resolve()
        })
        .on('error', (err) => {
          reject(err)
        })
    }))
  .then(() => targz().extract(`${tempPath}/installer.tar.gz`, tempPath))
  .then(() => console.log('Installer unzipped'))
  .then(() => exec(`${tempPath}/install-tl*/install-tl --profile=./texlive.profile`))
  .then(() => console.log('Latex install finished'))
  .then(() => console.log('Increasing memory limit'))
  .then(() => fs.appendFile('./vendor/texmf.cnf', `\
main_memory = ${memoryLimit}
save_size  = ${memoryLimit}`))
  .then(() => exec(`./vendor/bin/x86_64-linux/fmtutil-sys --all`))
  .then(() => console.log(`Memory Limit increased to: ${memoryLimit}`))
  .then(() => exec(`./vendor/bin/x86_64-linux/tlmgr install ${PACKAGES_TO_INSTALL.join(' ')}`))
  .then(() => console.log('Packages installed'))
  .then(() => fs.copy('./vendor/bin/x86_64-linux/pdftex', './vendor/bin/x86_64-linux/pdflatex'))
  .then(() => new Promise((resolve, reject) => {
    const directory = `./vendor/bin/x86_64-linux/`;
    fs.readdir(directory, (err, files) => {
      if (err) throw error;

      for (const file of files) {
        if (['pdflatex', 'tlmgr', 'luatex'].indexOf(file) === -1) {
          fs.unlinkSync(path.join(directory, file), err => {
            if (err) throw error;
          });
        }
      }
      resolve()
    });
  }))
  .then(() => fs.remove('./texmf-dist/doc'))
  .then(() => fs.remove('./texmf-local/doc'))
  .then(() => fs.remove('./texmf-var/doc'))
  .then(() => fs.remove('./.tmp'))
  .then(() => console.log('Everything done'))
  .catch((err) => {
    console.log(err)
    process.exit(1)
  });






// `./adsfasdf --profile=texlive.profile`
