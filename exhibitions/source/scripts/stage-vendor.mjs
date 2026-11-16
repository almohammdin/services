import fs from 'node:fs';
for(const dir of ['public/vendor/ocr','public/vendor/qr'])fs.mkdirSync(dir,{recursive:true});
fs.copyFileSync('node_modules/tesseract.js/dist/worker.min.js','public/vendor/ocr/worker.min.js');
fs.copyFileSync('node_modules/zxing-wasm/dist/reader/zxing_reader.wasm','public/vendor/qr/zxing_reader.wasm');
