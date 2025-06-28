import mongoose from 'mongoose';


const qrDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt:{type:Date},
  generatedBy: {
  type: String,
  enum: ['admin','Admin'], // if you might allow more types in future
  default: 'admin'
},
slug: {
  type: String,
  unique: true,
  sparse: true // in case not all QRs use slug
},
scanCount: {
  type: Number,
  default: 0
},
lastScannedAt: {
  type: Date
},
  qrImage: String,       // <-- Store base64 string here
  downloadLink: String 
});

export default mongoose.model('QRData', qrDataSchema);