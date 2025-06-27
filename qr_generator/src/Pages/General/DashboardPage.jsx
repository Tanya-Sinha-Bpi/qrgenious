import { useState } from 'react';
import QRForm from '../../Components/Dashboard/QRForm';
import QRDisplay from '../../Components/Dashboard/QRDisplay';
import Navbar from '../../Components/Layout/Navbar';

function DashboardPage() {
  const [qrData, setQrData] = useState(null);
  const [formData, setFormData] = useState({
    qrId: null,
    title: '',
    content: '',
    color: '#000000'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Create New QR Code
            </h2>
            <QRForm 
              formData={formData} 
              setFormData={setFormData} 
              setQrData={setQrData} 
            />
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Your QR Code
            </h2>
            <QRDisplay qrData={qrData} />
          </div>
        </div>
      </div>
    </div>
  );

}
  export default DashboardPage;