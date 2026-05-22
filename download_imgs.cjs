const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const https = require('https');

const dir = path.join(__dirname, 'public', 'images', 'login');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const urls = [
  "https://lh3.googleusercontent.com/pw/AP1GczM0GuSeqOIu4HjXaxiFY1gk_DLyU6Aa7YA52_xQmRMYonbemhhUSB91x3mCAG9zvL8BimBdC2ydwiQ-weQzy3axW97QF96HYbWmlmepbSe4z7PNXw43k543nd3jVBJIwEmUNuLSipOGjJi1SHW4Qqk=w1000-h667-s-no-gm?authuser=0",
  "https://lh3.googleusercontent.com/pw/AP1GczM9oE1KF28-A07sotiA8OeP-9g7Yqyh6RD2O8wliqyhfuIU7BLIhOxX28SNvRv2sssSz54P7bO_eXeqnbCiZxATEBsw6R4F6zzIM45gAH1gL-lZTij1ProIIgmAIvRyWVG0-d1BjaB0MfLsUW-TTrc=w1000-h667-s-no-gm?authuser=0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC3v04XZdR-wrr-yl9jm1TwqSzZh1tB2Q_b2seHi78Pot77MsMKUR_IfLse_SOAchzoJnl9_QyxHYtsxc5wu26u4ADOAzYFgqR8gRymImjjvvT-bDPHvCmLBkeobQG0AcqNGd6vHpntlBztJ221uKcrlHe0ThJ4WLglF7F8BkpxNeqIax36ScCmlka5P905m6gshhHSbmcp0nBeSVUvuNGqULHF4tyOFKqEbn_cMXOMT09UhVajKnS6za7T-T9mTkBJ2In2H4Gg4-4",
  "https://lh3.googleusercontent.com/pw/AP1GczPdQagS-b6DS31MBTO5A9U4U2LFfXQftpPnDU7RlZUnxdrC5diIftYLgPS55MXCU1P1v9SnBrdUt2ZYr5vUwjl6x-rSzkFvf9tvtH0dhZ2VLAEs3yJNfEFSzJ7hvv-Iq8qVB3GOXYb6c679HsRe2Hc=w1000-h667-s-no-gm?authuser=0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDPFGMsi61n29fUlKz-g9O3v3RDqIUPJA-Hd-3Eu1vZT6fsKe2dpWiZ7MV1j0aH8pGMUtKYujyGg7yo14gbULLD8FmKF7ag0U5RHVEmXsc0-SeQNOp9JnqjZbQQBPm2DpU7SYOV219H8rSwcmew0izuW-mE8sbqaY5a5URddDsyPQSPBpaQ6Jo9iOTwSDEdGfgCNZQHKxaiBQCz14goom5XhB_lg9h57mvcwYPBjAvGFjRkoFxUUx7K_wexj5aaQKzt7e0fzITXWS8",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBuu21W2NVmM2_12ChkPiiiSFralvib0a8U_lpsxVaAOqbHci_xBeb_JzUYm5XLunM43cDfllelPvxX21ruhld2KlTUw8FSodp75yDnZJzIIlbv6blmsbjAaJu19MR8mfi4mkJ-073-m-tswkhO1H2z5du4QRJq_lTCwpirBx8j-3zaZds9KBDsILc4gumE1CcSVNFpmJ0c6dju6Es6rRVo4hqT49j8sgYAEeY1qdkH9a0CkPRigO2YkJrX33Zkvautpubi87g-m7Y"
];

async function downloadImages() {
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const fileStream = fs.createWriteStream(path.join(dir, `lab_${i+1}.jpg`));
    
    await new Promise((resolve, reject) => {
      https.get(url, (response) => {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      }).on('error', (err) => {
        fs.unlink(path.join(dir, `lab_${i+1}.jpg`));
        reject(err);
      });
    });
    console.log(`Downloaded lab_${i+1}.jpg`);
  }
}

downloadImages();
