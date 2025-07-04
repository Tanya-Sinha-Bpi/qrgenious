import { PassThrough } from 'stream';
import QRCode from 'qrcode';

/**
 * Generates QR code as a readable stream
 * @param {String} content - Data to encode in QR code
 * @param {String} color - Color of the QR code (hex format)
 * @param {Object} [options] - Additional QR code options
 * @returns {Promise<Readable>} Readable stream of PNG image data
 */
export const generateQRCodeStream = (content, color = '#000000', options = {}) => {
    const stream = new PassThrough();

    QRCode.toFileStream(stream, content, {
        type: 'png',
        color: {
            dark: color,
            light: '#ffffff'
        },
        width: 300,
        margin: 1,
        ...options
    });

    return stream;
};


/**
 * Generates QR code as buffer (alternative)
 * @param {String} content - Data to encode
 * @param {String} color - QR code color
 * @returns {Promise<Buffer>} PNG image buffer
 */
export const generateQRCodeBuffer = async (content, color = '#000000', options = {}) => {
    return QRCode.toBuffer(content, {
        type: 'png',
        color: {
            dark: color,
            light: '#ffffff'
        },
        width: options.width || 300,
        margin: options.margin || 1,
        ...options
    });
};
