const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'assets', 'js', 'data.js');
let code = fs.readFileSync(dataFilePath, 'utf8');

const dests = [
  'dest-pgr-01', 'dest-prt-02', 'dest-kta-03', 'dest-rja-04', 'dest-blt-05',
  'dest-ppd-06', 'dest-brm-07', 'dest-rnj-08', 'dest-dng-09', 'dest-krc-10',
  'dest-bbd-11', 'dest-pbn-12', 'dest-krt-13', 'dest-pgl-14', 'dest-trj-15',
  'dest-blr-16', 'dest-kmd-17', 'dest-clt-18', 'dest-tba-19', 'dest-bnk-20'
];

let updatedCount = 0;
for (const id of dests) {
  const reg = new RegExp('(id:\\s*"' + id + '"[\\s\\S]*?photo_url:\\s*")[^"]+(")', 'g');
  if (reg.test(code)) {
    code = code.replace(reg, '$1assets/img/destinations/' + id + '.jpg$2');
    updatedCount++;
  }
}

fs.writeFileSync(dataFilePath, code, 'utf8');
console.log(`Berhasil memperbarui ${updatedCount} destinasi di data.js ke aset foto lokal.`);
