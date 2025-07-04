import crypto from 'crypto';
import {UAParser} from 'ua-parser-js';

/**
 * Gets the real client IP address, handling proxy headers
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getClientIp(req) {
    // Cloudflare
    if (req.headers['cf-connecting-ip']) {
        return req.headers['cf-connecting-ip'];
    }

    // AWS ELB/ALB
    if (req.headers['x-forwarded-for']) {
        const ips = req.headers['x-forwarded-for'].split(',');
        return ips[0].trim();
    }

    // Nginx
    if (req.headers['x-real-ip']) {
        return req.headers['x-real-ip'];
    }

    // Default to connection remote address
    return req.connection?.remoteAddress || req.ip || 'unknown';
}

/**
 * Creates a consistent device fingerprint
 * @param {Object} req - Express request object
 * @returns {string} SHA-256 hash of the device fingerprint
 */
export function createDeviceFingerprint(req) {
    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();
    const clientIp = getClientIp(req);

    // Parse client-side fingerprint if available
    const clientFingerprint = req.headers['x-device-fingerprint']
        ? JSON.parse(req.headers['x-device-fingerprint'])
        : {};

    // Core fingerprint components (always available)
    const components = {
        // User Agent
        browser: `${ua.browser.name || 'unknown'}:${ua.browser.version || '0'}`,
        os: `${ua.os.name || 'unknown'}:${ua.os.version || '0'}`,
        deviceType: ua.device.type || 'desktop',

        // Network
        ip: clientIp,

        // Language
        language: req.headers['accept-language'] || 'unknown',

        // Client-side components
        screen: clientFingerprint.screen || 'unknown',
        timezone: clientFingerprint.timezone || 'unknown',
        hardware: clientFingerprint.hardwareConcurrency || 'unknown',
        memory: clientFingerprint.deviceMemory || 'unknown',
        canvas: clientFingerprint.canvas || 'none',
        webgl: clientFingerprint.webgl || 'none',

        // Security headers
        secHeaders: {
            dnt: req.headers['dnt'] || '0',
            secChUa: req.headers['sec-ch-ua'] || 'none',
            secChUaMobile: req.headers['sec-ch-ua-mobile'] || '?0'
        }
    };

    // Enhanced components (if available)
    try {
        if (req.headers['x-device-fingerprint']) {
            const clientFingerprint = JSON.parse(req.headers['x-device-fingerprint']);
            components.enhanced = {
                screen: clientFingerprint.screen || 'unknown',
                timezone: clientFingerprint.timezone || 'unknown',
                hardware: clientFingerprint.hardwareConcurrency || 'unknown',
                deviceMemory: clientFingerprint.deviceMemory || 'unknown'
            };
        }
    } catch (e) {
        console.warn('Failed to parse client fingerprint', e);
    }

    // Generate consistent hash
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(components))
        .digest('hex');
}

export async function sendNewDeviceNotification(email, deviceInfo) {
    // Implementation depends on your email service
    await sendMail({
        to: email,
        subject: 'New Device Login Detected',
        html: `A login was detected from a new device:<br><br>
               IP: ${deviceInfo.ip}<br>
               Device ID: ${deviceInfo.deviceId}<br>
               Time: ${deviceInfo.time}`
    });
}

// For the delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}