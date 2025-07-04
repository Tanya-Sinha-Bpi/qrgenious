import mongoose from "mongoose";

const qrSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
    },
    content: {
        type: String,
    },
    slug: {
        type: String,
        unique: [true, "Slug name will be unique"],
        sparse: true  // in case not all QRs use slug
    },
    scanCount: {
        type: Number,
        default: 0
    },
    generatedBy: {
        type: String,
        enum: ['admin', 'Admin'], // if you might allow more types in future
        default: 'admin'
    },
    qrImage: String,       // <-- Store base64 string here
    downloadLink: String,
    imageKitFileId:String,
    lastScannedAt: {
        type: Date,
    },
    craetedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

const QRData = mongoose.model("QRData", qrSchema);

export default QRData;

