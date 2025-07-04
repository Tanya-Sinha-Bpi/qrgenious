import { errors } from "../Utils/apiHelpers.js";
import { deleteFile, extractFileIdFromUrl, uploadFileFromStream } from "../Services/imageKit.js";
import { generateQRCodeBuffer, generateQRCodeStream } from "../Utils/qrHelper.js";
import QRData from "../Models/QRModel.js";

export const createQRCode = async function (req, res, next) {
    try {
        const { title, content, color } = req.body;
        const { userId } = req;
        console.log("DEBUG: USERID", req.userId)

        if (!userId) {
            return errors.badRequest(res, "Unautorize")
        }
        // INPUT VALIDATION
        if (!title || !content || !color) {
            return errors.badRequest(res, 'All Fields are required');
        }


        // First save minimal data to database
        const [newQR] = await QRData.create([{
            userId,
            title,
            content,
            color,
            scanCount: 0,
            generatedBy: 'admin'
        }]);

        const scanUrl = `${process.env.FRONTEND_BASE_URL}/public/qr/${newQR._id}`;

        // Generate QR code as stream
        const qrBuffer = await generateQRCodeStream(scanUrl, color);
        qrBuffer.on('error', (err) => {
            throw new Error(`QR generation failed: ${err.message}`);
        });

        if (!newQR) {
            return errors.serverError(res, 'Failed to create QR record');
        }

        const fileName = `qr_${newQR._id}_${Date.now()}.png`;
        const uploadResponse = await uploadFileFromStream(qrBuffer, fileName, {
            tags: ['qr_code', `user_${userId}`]
        });

        // Verify upload succeeded
        if (!uploadResponse.fileId) {
            throw new Error('ImageKit upload failed - no fileId returned');
        }



        // Update with image URLs
        const updatedQR = await QRData.findByIdAndUpdate(
            newQR._id,
            {
                qrImage: uploadResponse.url,
                downloadLink: uploadResponse.url,
                updatedAt: new Date(),
                imageKitFileId: uploadResponse.fileId,
            },
            { new: true }
        ).lean();

        return res.status(201).json({
            success: true,
            data: {
                qrImage: uploadResponse.url,
                slug: updatedQR.slug,
                content: updatedQR.content,
                downloadLink: uploadResponse.url,
                qrId: updatedQR._id,
                color: updatedQR.color,
                createdAt: updatedQR.createdAt,
                scanCount: updatedQR.scanCount,
                lastScannedAt: updatedQR.lastScannedAt,
            },
            message: "QR code created successfully"
        });

    } catch (error) {

        if (error.name === 'ValidationError') {
            return errors.unprocessable(res, 'Validation failed', error.errors);
        }

        console.error('[CREATE_QR_ERROR]', error.message);
        return errors.serverError(res,
            process.env.NODE_ENV === 'development' ? error.message : null
        );
    }
};

export const updateQRData = async function (req, res, next) {
    try {
        const { qrId } = req.params;
        const { title, content, color } = req.body;
        const { userId } = req;

        // Validate input
        if (!qrId) {
            return errors.notFound(res, "QR ID not found in request");
        }

        // Find existing QR code
        const existingQR = await QRData.findOne({ _id: qrId, userId });

        if (!existingQR) {
            return errors.notFound(res, "QR code not found or you don't have permission");
        }

        // Prepare update data
        const updateData = {
            updatedAt: new Date()
        };

        if (title) updateData.title = title;
        if (content) updateData.content = content;
        if (color) updateData.color = color;

        // Check if we need to regenerate QR image (if content or color changed)
        let uploadResponse = null;
        if (content || color) {
            // Generate new QR code
            const qrContent = content || existingQR.content;
            const qrColor = color || existingQR.color;
            const scanUrl = `${process.env.FRONTEND_BASE_URL}/public/qr/${qrId}`;

            const qrBuffer = await generateQRCodeStream(scanUrl, qrColor);
            qrBuffer.on('error', (err) => {
                throw new Error(`QR generation failed: ${err.message}`);
            });

            const fileName = `qr_${qrId}_${Date.now()}.png`;

            let oldFileDeleted = false;
            if (existingQR.imageKitFileId) {
                try {
                    await deleteFile(existingQR.imageKitFileId);
                    oldFileDeleted = true;
                } catch (deleteError) {
                    console.error("Old image deletion failed (proceeding):", {
                        error: deleteError.message,
                        fileId: existingQR.imageKitFileId,
                        qrId: qrId
                    });
                }
            }

            // Upload new QR image
            try {
                uploadResponse = await uploadFileFromStream(
                    qrBuffer,
                    fileName,
                    { tags: ['qr_code', `user_${userId}`] }
                );
                if (!uploadResponse.fileId) {
                    throw new Error('ImageKit upload failed - no fileId returned');
                }
                updateData.qrImage = uploadResponse.url;
                updateData.downloadLink = uploadResponse.url;
                updateData.imageKitFileId = uploadResponse.fileId;

                console.log('QR image updated:', {
                    oldFileDeleted,
                    newFileId: uploadResponse.fileId,
                    qrId: qrId
                });
            } catch (uploadError) {
                console.error("ImageKit upload failed:", uploadError);
                return errors.serverError(res, 'Failed to update QR image');
            }

        }

        // Update the QR code record
        const updatedQR = await QRData.findByIdAndUpdate(
            qrId,
            updateData,
            { new: true }
        ).lean();

        return res.status(200).json({
            success: true,
            data: {
                message: "QR updated successfully",
                qrId: updatedQR._id,
                title: updatedQR.title,
                content: updatedQR.content,
                color: updatedQR.color,
                qrImage: updatedQR.qrImage,
                downloadLink: updatedQR.downloadLink,
                updatedAt: updatedQR.updatedAt
            }
        });

    } catch (error) {

        if (error.name === 'CastError') {
            return errors.badRequest(res, "Invalid QR code ID format");
        }
        if (error.name === 'ValidationError') {
            return errors.unprocessable(res, 'Validation failed', error.errors);
        }

        console.error('[UPDATE_QR_ERROR]', error);
        return errors.serverError(res,
            process.env.NODE_ENV === 'development' ? error.message : null
        );
    }
};

export const downloadQR = async (req, res) => {
    try {
        const qrData = await QRData.findById(req.params.id);
        if (!qrData) return res.status(404).json({ error: 'QR not found' });

        const downloadLink = qrData.downloadLink; // Get the download link from the database

        if (!downloadLink) {
            return res.status(404).json({ error: 'Download link not available' });
        }

        // Redirect the client to the image URL from ImageKit for download
        res.redirect(downloadLink); // This will trigger the file download from ImageKit
    } catch (error) {
        console.log("Error in downloading QR", error);
        return res.status(500).json({ error: 'Failed to retrieve QR image for download' });
    }
};

export const handleQRScan = async function (req, res, next) {
    try {
        const { qrId } = req.params;

        // Increment scan count and update last scanned
        const qrCode = await QRData.findOneAndUpdate(
            { _id: qrId },
            {
                $inc: { scanCount: 1 },
                $set: { lastScannedAt: new Date() }
            },
            { new: true }
        ).lean();

        if (!qrCode) {
            return errors.notFound(res, 'QR code not found');
        }

        // Redirect user to frontend page showing QR details (public page)
        return res.redirect(`/public/qr/${qrCode.slug || qrCode._id}`);

    } catch (error) {
        console.error('[QR_SCAN_ERROR]', error);
        return errors.serverError(res, 'Failed to process QR scan');
    }
};


export const getQRDetails = async function (req, res, next) {
    try {
        const { slugOrId } = req.params;

        const qrCode = await QRData.findOne({
            $or: [
                { _id: slugOrId },
                { slug: slugOrId }
            ]
        }).lean();

        if (!qrCode) {
            return errors.notFound(res, 'QR code not found');
        }

        // Render HTML page for web visitors
        return res.status(200).json({
            success: true,
            data: {
                qrId: qrCode._id,
                title: qrCode.title,
                content: qrCode.content,
                scanCount: qrCode.scanCount,
                createdAt: qrCode.craetedAt,
                qrImage: qrCode.qrImage,
                downloadLink: qrCode.downloadLink,
                qrImage: qrCode.qrImage
            }

        });

    } catch (error) {
        console.error('[QR_DETAILS_ERROR]', error);
        return errors.serverError(res, 'Failed to get QR details');
    }
};

export const deleteQRData = async function (req, res, next) {
    try {
        const { qrID } = req.params;
        const { userId } = req;
        if (!userId) {
            return errors.badRequest(res, "Unauthorise")
        }
        // Validate input
        if (!qrID) {
            return errors.notFound(res, "QR ID not found in request");
        }

        // Find the QR code data
        const qrData = await QRData.findOne({ _id: qrID, userId });

        if (!qrData) {
            return errors.notFound(res, "QR code not found or access denied");
        }

        await QRData.deleteOne({ _id: qrID });

        let deletionResult = { success: false };
        if (qrData.imageKitFileId) {
            try {
                await deleteFile(qrData.imageKitFileId);
                deletionResult = { success: true };
            } catch (error) {
                console.error('ImageKit deletion error:', {
                    error: error.message,
                    qrId: qrID,
                    fileId: qrData.imageKitFileId,
                    url: qrData.qrImage
                });
                deletionResult = {
                    success: false,
                    error: error.message
                };
            }
        }

        return res.status(200).json({
            success: true,
            message: deletionResult.success
                ? "QR code completely deleted"
                : "QR data deleted (image may still exist)",
            data: {
                qrId: qrID,
                deletedAt: new Date()
            }
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return errors.badRequest(res, "Invalid QR code ID format");
        }

        console.error('[DELETE_QR_ERROR]', error);
        return errors.serverError(res,
            process.env.NODE_ENV === 'development' ? error.message : null
        );
    }
}

export const getAllQRHistory = async (req, res) => {
    try {
        if (!req.userId) {
            return res.badRequest(res, "Unauthorise");
        }
        const qrData = await QRData.find({ userId: req.userId })
            .sort({ craetedAt: -1 })
            .select('_id title craetedAt updatedAt slug scanCount lastScannedAt content qrImage downloadLink');
        // console.log("qt history in controller", qrData);
        return res.status(200).json(qrData);
    } catch (error) {
        console.log("error in getQRHistory", error);
        return res.status(500).json({ error: 'Failed to fetch history' });
    }
};

export const getPublicQRDetails = async (req, res) => {
    try {
        const { slugOrId } = req.params;

        const query = slugOrId.length === 24
            ? { _id: slugOrId }
            : { slug: slugOrId };

        const qr = await QRData.findOne(query).select('title content craetedAt scanCount lastScannedAt');

        if (!qr) {
            return res.status(404).json({ message: 'QR not found' });
        }

        // Optional bump scan count
        if (req.query.bumpScan === 'true') {
            await QRData.findOneAndUpdate(query, {
                $inc: { scanCount: 1 },
                lastScannedAt: new Date(),
            });
        }

        res.status(200).json({
            success: true,
            data: qr,
        });
    } catch (err) {
        console.error('Error in public QR fetch:', err);
        res.status(500).json({ message: 'Server error' });
    }
};



