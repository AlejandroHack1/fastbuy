const qrcode = require('qrcode');

module.exports = {
  generateQr: async link => {
    const qrCodeDataUrl = await qrcode.toDataURL(link);
  }
};