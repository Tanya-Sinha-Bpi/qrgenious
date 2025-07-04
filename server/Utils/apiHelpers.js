import OtpGenerator from 'otp-generator';
import jwt from "jsonwebtoken";


export const generateSecureOtp = () => {
    return OtpGenerator.generate(6, {
        digits: true,
        specialChars: false,
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false
    });
};

export const apiResponse = (res, status, message, data = null, error = null) => {
    const response = {
        success: status >= 200 && status < 300,
        message,
        ...(data && { data }),
        ...(error && process.env.NODE_ENV === 'development' && { error })
    };

    return res.status(status).json(response);
};

export const errors = {
    notFound: (res, resource = 'Resource') =>
        apiResponse(res, 404, `${resource} not found`),
    conflict: (res, message = 'Conflict occurred') =>
        apiResponse(res, 409, message),
    badRequest: (res, message = 'Invalid request', errors = null) =>
        apiResponse(res, 400, message, null, errors),
    serverError: (res, error = null) =>
        apiResponse(res, 500, 'Internal server error', null, error),
    unprocessable: (res, message = 'Validation failed', errors = null) =>
        apiResponse(res, 422, message, null, errors),
    tooManyRequests: (res, message, data = {}) => {
        return res.status(429).json({
            status: 'error',
            message,
            ...data
        });
    }
};

export const tokenGenerator = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });
};

export const getClientIP = (req) => {
    return req.headers['cf-connecting-ip'] ||
        req.headers['x-real-ip'] ||
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-forwarded'] || 
        req.headers['x-client-ip'] ||
        req.headers['forwarded-for'] ||
        req.headers['forwarded'] ||
        req.socket?.remoteAddress ||
        req.ip;
};
