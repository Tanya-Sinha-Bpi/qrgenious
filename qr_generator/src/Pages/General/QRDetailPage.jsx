import { useEffect, useState } from "react";
import QRForm from "../../Components/Dashboard/QRForm";
import QRDisplay from "../../Components/Dashboard/QRDisplay";
import Navbar from "../../Components/Layout/Navbar";
import { useLocation, useParams } from "react-router-dom";

function QRDetailPage() {
  const { qrId } = useParams();
  const [qrData, setQrData] = useState(null);
  const location = useLocation();
  const qrFromState = location.state?.qr || null;
  const isEditMode = location.pathname.startsWith("/edit");
  const isViewMode = location.pathname.startsWith("/qr");
  const [formData, setFormData] = useState({
    qrId:null,
    title: "",
    content: "",
    color: "#000000",
  });

  // const [qrData, setQrData] = useState(null);

  useEffect(() => {
    if (qrFromState) {
      setFormData({
        qrId: qrFromState.qrId || "",
        title: qrFromState.title || "",
        content: qrFromState.content || "",
        color: qrFromState.color || "#000000",
      });

      setQrData({
        qrId: qrFromState.qrId,
        qrImage: qrFromState.qrImage || "",
        downloadLink: qrFromState.downloadLink || "",
        slugName: qrFromState.slugName || "",
        generated: qrFromState.generated || "user",
        title: qrFromState.title,
        content: qrFromState.content,
        createdAt: qrFromState.createdAt,
      });
    }
  }, [qrFromState]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEditMode ? "Edit QR Code" : "QR Code Details Can only View"}
              </h2>
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
            </div>
            <QRForm
              formData={formData}
              setFormData={setFormData}
              setQrData={setQrData}
              isViewMode={isViewMode}
              isEditMode={isEditMode}
              qrData={qrData}
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Your QR Code</h2>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
            </div>
            <QRDisplay qrData={qrData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRDetailPage;
