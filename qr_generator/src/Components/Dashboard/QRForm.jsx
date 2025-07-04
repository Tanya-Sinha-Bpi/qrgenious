import React, { useState } from "react";
import { useAuth } from "../../Context/AuthContext";
import { createQR, updateQR } from "../../api/qr";
import { toast } from "react-toastify";

const QRForm = ({
  formData,
  setFormData,
  setQrData,
  isViewMode,
  isEditMode,
  qrData,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isViewMode) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate inputs
      if (!formData.title.trim()) {
        toast.error("Title is required");
        setLoading(false);
        return;
      }

      if (!formData.content.trim()) {
        toast.error("Content is required");
        setLoading(false);
        return;
      }

      let response;

      if (isEditMode) {
        try {
          // 🔄 EDIT MODE
          response = await updateQR(formData.qrId, {
            title: formData.title,
            content: formData.content,
            color: formData.color,
          });
          toast.success(
            response.data?.message || "QR Code updated successfully!"
          );
        } catch (error) {
          console.log("Error found when updateing", error);
          toast.error(
            error?.response?.data?.message ||
              "Something when updating Error" + error.message
          );
        }
      } else {
        try {
          // 🆕 CREATE MODE
          response = await createQR({
            title: formData.title,
            content: formData.content,
            color: formData.color,
          });
          toast.success(
            response.data?.message || "QR code updated successfully!"
          );
        } catch (error) {
          console.log("Error found when creating", error);
          toast.error(
            error?.response?.data?.message ||
              "Something when creating Error" + error.message
          );
        }
      }

      // Save or update QR
      const qrDataFromBackend = response.data?.data || {};
      const qr = {
        qrId: qrDataFromBackend.qrId || formData.qrId,
        qrImage: qrDataFromBackend.qrImage || "",
        downloadLink: qrDataFromBackend.downloadLink || "",
        slugName: qrDataFromBackend.slug || "",
        generated: qrDataFromBackend.generatedBy || "admin",
        title: formData.title,
        content: qrDataFromBackend.content || formData.content,
        createdAt: qrDataFromBackend.createdAt || new Date().toISOString(),
      };
      // const qr = {
      //   qrId: response.data?.id ||response.data?.qrId || formData.qrId ,
      //   qrImage: response.data.qrImage || "",
      //   downloadLink: response.data.downloadLink || "",
      //   slugName: response.data.slug || "",
      //   generated: response.data.generatedBy || "admin",
      //   title: response.data.title || formData.title,
      //   content: response.data.content || formData.content,
      //   createdAt: response.data.createdAt || new Date().toISOString(),
      // };

      setQrData(qr);
      // setSuccess("Saved successfully!");

      setSuccess("QR code generated successfully!");
      toast.success(
        response?.data?.message || "QR code generated successfully!"
      );

      try {
        const existing = JSON.parse(localStorage.getItem("qr_history")) || [];

        let updated;

        if (isEditMode) {
          // 🔁 Edit Mode: Replace existing QR entry
          updated = existing.map((item) => (item.qrId === qr.qrId ? qr : item));
          // toast.success("Local history updated");
        } else {
          // 🆕 Create Mode: Add new QR on top
          updated = [qr, ...existing].slice(0, 10);
          // toast.success("Saved to local history");
        }

        localStorage.setItem("qr_history", JSON.stringify(updated));
        toast.success("Data saved in Local History");
      } catch (error) {
        toast.error("Something wrong to save data in history" + error.message);
      }

      // Reset form after successful creation
      setFormData({
        title: "",
        content: "",
        color: "#000000",
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.message ||
        "Failed to generate QR code";
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          readOnly={isViewMode}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          placeholder="Enter a title for your QR"
          required
        />
      </div>

      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Content
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          readOnly={isViewMode}
          onChange={handleChange}
          rows="4"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
          placeholder="Enter the content for your QR code"
          required
        ></textarea>
      </div>

      {/* <div>
        <label
          htmlFor="color"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          QR Color
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
          <span className="text-gray-600">{formData.color}</span>
        </div>
      </div> */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* === QR Color Picker === */}
        <div>
          <label
            htmlFor="color"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            QR Color
          </label>
          <div className="flex items-center space-x-4">
            <input
              type="color"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
            />
            <span className="text-gray-600">{formData.color}</span>
          </div>
        </div>

        {/* === Extra Info (only in Edit Mode) === */}
        {isViewMode && qrData && (
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Created By:</strong> {qrData.generatedBy || "Admin"}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {new Date(qrData.createdAt).toLocaleString()}
            </p>
            {qrData.lastScanned && (
              <p>
                <strong>Last Scanned:</strong>{" "}
                {new Date(qrData.lastScanned).toLocaleString()}
              </p>
            )}
            {qrData.scanCount !== undefined && (
              <p>
                <strong>Scan Count:</strong> {qrData.scanCount}
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 px-4 rounded-xl text-white font-medium transition-all flex justify-center items-center
          ${
            loading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
          }`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating...
          </>
        ) : (
          "Generate QR Code"
        )}
      </button>
    </form>
  );
};

export default QRForm;
