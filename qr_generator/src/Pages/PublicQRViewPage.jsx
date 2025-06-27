import { useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { API_URL } from "../api/qr";
// const API_URL = "http://localhost:7000/api/qr";

function PublicQRViewPage() {
  const { slug } = useParams();
  const [qr, setQR] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // GET details and bump scan count
    const fetchQR = async () => {
      try {
        const res = await axios.get(`${API_URL}/details/${slug}`, {
          params: { bumpScan: true },
        });
        setQR(res.data);
        console.log("Successfully scanned and get data");
      } catch (err) {
        console.log("error after scanning", err);
        setError("QR not found or expired");
      }
    };
    fetchQR();
  }, [slug]);

  if (error)
    return <div className="text-red-600 text-center p-10">{error}</div>;

  if (!qr)
    return (
      <div className="text-center py-20 text-gray-600">
        Loading QR Details...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center px-4 py-12">
      <motion.div
        className="bg-white shadow-xl rounded-3xl p-8 max-w-xl w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
          QR Code Details
        </h2>

        <div className="space-y-5">
          <div>
            <p className="text-gray-600 text-sm">Title</p>
            <h3 className="text-xl font-semibold text-gray-800">{qr.title}</h3>
          </div>

          <div>
            <p className="text-gray-600 text-sm">Content</p>
            <p className="text-base text-gray-700">{qr.content}</p>
          </div>

          {/* {createdAt && ( */}
          <div className="text-sm text-gray-500 mt-4">
            <p>
              Created At:{" "}
              <span className="font-medium">
                {new Date(qr.createdAt).toLocaleString()}
              </span>
            </p>
          </div>
          {/* )} */}
          {/* {lastScanned && ( */}
          <div className="text-sm text-gray-500">
            <p>
              Last Scanned:{" "}
              <span className="font-medium">
                {qr.lastScanned
                  ? new Date(qr.lastScanned).toLocaleString()
                  : "Never"}
              </span>
            </p>
          </div>
          {/* //   )} */}
        </div>
      </motion.div>
    </div>
  );
}

export default PublicQRViewPage;
