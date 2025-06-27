import QRCode from 'qrcode';

export const generateQRImage = async (data) => {
  try {
    return await QRCode.toDataURL(data, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000',
        light: '#fff'
      }
    });
  } catch (err) {
    throw new Error('QR generation failed');
  }
};