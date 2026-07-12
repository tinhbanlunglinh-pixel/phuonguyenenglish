const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (['.ts', '.tsx', '.html', '.json'].includes(path.extname(file))) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const dirPath = 'e:\\\\2026\\\\App\\\\28. Ms Phượng Uyên Copy';
const files = walkSync(dirPath);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/TRUNG TÂM ANH NGỮ ENGLISH MS TRANG/g, 'TRUNG TÂM NGOẠI NGỮ CÔ PHƯỢNG UYÊN')
    .replace(/Trung tâm Ngoại Ngữ English Ms Trang/g, 'Trung tâm Ngoại ngữ Cô Phượng Uyên')
    .replace(/Trung Tâm English Ms Trang/g, 'Trung tâm Ngoại ngữ Cô Phượng Uyên')
    .replace(/ENGLISH MS TRANG/g, 'CÔ PHƯỢNG UYÊN')
    .replace(/English Ms Trang/g, 'Cô Phượng Uyên')
    .replace(/Ms Trang/g, 'Cô Phượng Uyên')
    .replace(/Xây nền từ móng, chinh phục đỉnh cao/g, 'Learn today, better tomorrow')
    .replace(/XÂY NỀN TỪ MÓNG, CHINH PHỤC ĐỈNH CAO/g, 'LEARN TODAY, BETTER TOMORROW')
    .replace(/0979\.2222\.10/g, '0985.846.325')
    .replace(/0979222210/g, '0985846325')
    .replace(/MsTrangLogo/g, 'CoPhuongUyenLogo');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
