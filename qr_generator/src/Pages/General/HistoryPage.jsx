import React, { useState, useEffect } from "react";
import { getQRHistory } from "../../api/qr";
import { useAuth } from "../../Context/AuthContext";
import Navbar from "../../Components/Layout/Navbar";
import HistoryItem from "../../Components/Dashboard/HistoryItem"; // Named import

function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();
  const [qrHistory, setQrHistory] = useState(() => {
    const saved = localStorage.getItem("qr_history");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await getQRHistory();
        const serverData = res.data;

        const localData = JSON.parse(localStorage.getItem("qr_history")) || [];

        // Convert local data to Map for easy comparison by qrId or _id
        const existingIds = new Set(
          localData.map((item) => item.qrId || item._id)
        );
        console.log("history in history page from localstorage", qrHistory);
        const merged = [
          ...localData,
          ...serverData
            .filter((item) => !existingIds.has(item._id))
            .map((item) => ({
              qrId: item._id,
              title: item.title,
              content: item.content || "",
              qrImage: "", // Optional: get from base64 if needed
              slugName: item.slug || "",
              downloadLink: `/api/qr/download-qr/${item._id}`,
              generated: item.generatedBy || "user",
              createdAt: item.createdAt,
            })),
        ];

        localStorage.setItem(
          "qr_history",
          JSON.stringify(merged.slice(0, 1000))
        );
        setQrHistory(merged.slice(0, 1000));
        setHistory(res.data);
      } catch (err) {
        toast.error(
          "Failed to load QR history. Please try again." + err.message
        );
        setError("Failed to load QR history. Please try again.");
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user.token]);

const handleDelete = (id) => {
  // Remove from UI state
  setHistory(prev => prev.filter(item => item.qrId !== id));
  setQrHistory(prev => prev.filter(item => item.qrId !== id));

  // Remove from localStorage
  const existing = JSON.parse(localStorage.getItem("qr_history")) || [];
  const updated = existing.filter(item => item.qrId !== id);
  localStorage.setItem("qr_history", JSON.stringify(updated));
};

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">QR History</h1>
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="p-5 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="mx-auto w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              No QR Codes Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Your generated QR codes will appear here once you create them.
            </p>
            <a
              href="/dashboard"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              Create Your First QR
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrHistory.map((item) => (
              <HistoryItem key={item.qrId} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
