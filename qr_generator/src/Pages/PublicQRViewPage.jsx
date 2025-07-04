import { useParams, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { getDetailsForPublic } from "../api/qr";
import verifySeal from "../assets/verify.png";

function PublicQRViewPage() {
  const { slugOrId } = useParams();
  const [qr, setQR] = useState(null);
  const [error, setError] = useState("");
  const [showSeal, setShowSeal] = useState(false);
  useEffect(() => {
    // GET details and bump scan count
    const fetchQR = async () => {
      try {
        // http://localhost:7000/api/v1/qr
        // const res = await axios.get(`${API_URL}/details/${slugOrId}?bumpScan=true`);
        const res = await getDetailsForPublic(slugOrId + "?bumpScan=true");
        // const res = await axios.get(`${API_URL}/details/${qrId}`, {
        //   params: { bumpScan: true },
        // });
        setQR(res.data.data);
        console.log("Successfully scanned and get data", res.data);
      } catch (err) {
        console.log("error after scanning", err);
        setError("QR not found or expired");
      }
    };
    fetchQR();
    const timer = setTimeout(() => setShowSeal(true), 1000);

    return () => clearTimeout(timer);
  }, [slugOrId]);

  // if (error)
  //   return <div className="text-red-600 text-center p-10">{error}</div>;

  // if (!qr)
  //   return (
  //     <div className="text-center py-20 text-gray-600">
  //       Loading QR Details...
  //     </div>
  //   );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-lg font-medium bg-white/80 backdrop-blur-lg px-6 py-4 rounded-xl shadow-2xl"
        >
          {error}
        </motion.div>
      </div>
    );

  if (!qr)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600 text-lg bg-white/80 backdrop-blur-lg px-6 py-4 rounded-xl shadow-lg"
        >
          Loading QR Details...
        </motion.div>
      </div>
    );

  return (
    // <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center px-4 py-12">
    //   <motion.div
    //     className="bg-white shadow-xl rounded-3xl p-8 max-w-xl w-full"
    //     initial={{ opacity: 0, scale: 0.9 }}
    //     animate={{ opacity: 1, scale: 1 }}
    //     transition={{ duration: 0.4 }}
    //   >
    //     <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
    //       QR Code Details
    //     </h2>

    //     <div className="space-y-5">
    //       <div>
    //         <span className="text-gray-700 text-sm">Title - </span>
    //         <span className="text-base text-gray-600">{qr.title}</span>
    //       </div>

    //       <div>
    //         <span className="text-gray-700 text-sm">Content - </span>
    //         <span className="text-base text-gray-600">{qr.content}</span>
    //       </div>

    //       {/* {createdAt && ( */}
    //       <div className="text-sm text-gray-500 mt-4">
    //         <p>
    //           Created At:{" "}
    //           <span className="font-medium">
    //             {new Date(qr.craetedAt).toLocaleString()}
    //           </span>
    //         </p>
    //       </div>
    //       {/* )} */}
    //       {/* {lastScanned && ( */}
    //       <div className="text-sm text-gray-500">
    //         <p>
    //           Last Scanned:{" "}
    //           <span className="font-medium">
    //             {qr.lastScannedAt
    //               ? new Date(qr.lastScannedAt).toLocaleString()
    //               : "Never"}
    //           </span>
    //         </p>
    //       </div>
    //       {/* //   )} */}
    //     </div>
    //   </motion.div>
    // </div>
    // <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-200 flex items-center justify-center px-4 py-12">
    //   <motion.div
    //     className="bg-white shadow-xl rounded-3xl p-8 max-w-xl w-full relative"
    //     initial={{ opacity: 0, scale: 0.9 }}
    //     animate={{ opacity: 1, scale: 1 }}
    //     transition={{ duration: 0.4 }}
    //   >
    //     <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">
    //       QR Code Details
    //     </h2>

    //     <div className="flex">
    //       {/* Left side - Content */}
    //       <div className="space-y-5 flex-1 pr-4">
    //         <div>
    //           <span className="text-gray-700 text-sm">Title - </span>
    //           <span className="text-base text-gray-600">{qr.title}</span>
    //         </div>

    //         <div>
    //           <span className="text-gray-700 text-sm">Content - </span>
    //           <span className="text-base text-gray-600">{qr.content}</span>
    //         </div>

    //         <div className="text-sm text-gray-500 mt-4">
    //           <p>
    //             Created At:{" "}
    //             <span className="font-medium">
    //               {new Date(qr.craetedAt).toLocaleString()}
    //             </span>
    //           </p>
    //         </div>

    //         <div className="text-sm text-gray-500">
    //           <p>
    //             Last Scanned:{" "}
    //             <span className="font-medium">
    //               {qr.lastScannedAt
    //                 ? new Date(qr.lastScannedAt).toLocaleString()
    //                 : "Never"}
    //             </span>
    //           </p>
    //         </div>
    //       </div>

    //       {/* Right side - Seal */}
    //       <div className="w-32 flex-shrink-0 flex items-center justify-center">
    //         <AnimatePresence>
    //           {showSeal && (
    //             <motion.div
    //               initial={{ opacity: 0, scale: 0.5 }}
    //               animate={{ opacity: 1, scale: 1 }}
    //               exit={{ opacity: 0, scale: 0.5 }}
    //               transition={{ duration: 0.5 }}
    //               className="relative"
    //             >
    //               <img
    //                 src={verifySeal}
    //                 alt="Verified Seal"
    //                 className="w-24 h-24 object-contain"
    //               />
    //               <motion.div
    //                 initial={{ opacity: 0 }}
    //                 animate={{ opacity: 1 }}
    //                 transition={{ delay: 0.5, duration: 0.5 }}
    //                 className="absolute inset-0 flex items-center justify-center"
    //               >
    //                 {/* <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-1 rounded-full">
    //                   VERIFIED
    //                 </span> */}
    //               </motion.div>
    //             </motion.div>
    //           )}
    //         </AnimatePresence>
    //       </div>
    //     </div>
    //   </motion.div>
    // </div>
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      {/* Floating background elements */}
      <motion.div
        className="absolute top-20 left-20 w-40 h-40 rounded-full bg-purple-400/20 blur-xl"
        animate={{
          y: [0, 20, 0],
          x: [0, 15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-60 h-60 rounded-full bg-pink-400/20 blur-xl"
        animate={{
          y: [0, -20, 0],
          x: [0, -15, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Main card */}
      <motion.div
        className="bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl shadow-2xl overflow-hidden w-full max-w-2xl relative"
        initial={{ opacity: 0, y: 30, rotateX: 5 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          transformStyle: "preserve-3d",
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(255, 255, 255, 0.3) inset",
        }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 to-pink-400/10 pointer-events-none" />

        {/* Card content */}
        <div className="p-8 relative z-10">
          <motion.h2
            className="text-3xl font-bold text-white mb-6 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            QR Code Details
          </motion.h2>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Left side - Content */}
            <motion.div
              className="space-y-5 flex-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <p className="text-sm text-white/80 mb-1">Title</p>
                <p className="text-lg font-medium text-white">{qr.title}</p>
              </div>

              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <p className="text-sm text-white/80 mb-1">Content</p>
                <p className="text-lg font-medium text-white">{qr.content}</p>
              </div>

              <div className="flex gap-4">
                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 flex-1">
                  <p className="text-sm text-white/80 mb-1">Created At</p>
                  <p className="text-sm font-medium text-white">
                    {new Date(qr.craetedAt).toLocaleString()}
                  </p>
                </div>

                <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 flex-1">
                  <p className="text-sm text-white/80 mb-1">Last Scanned</p>
                  <p className="text-sm font-medium text-white">
                    {qr.lastScannedAt
                      ? new Date(qr.lastScannedAt).toLocaleString()
                      : "Never"}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right side - Seal */}
            {/* <div className="flex items-center justify-center md:justify-end">
              <AnimatePresence>
                {showSeal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: 0,
                      boxShadow: "0 0 30px rgba(255, 255, 255, 0.5)",
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="relative"
                  >
                    <img
                      src={verifySeal}
                      alt="Verified Seal"
                      className="w-28 h-28 object-contain drop-shadow-lg"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -bottom-6 left-0 right-0 text-center"
                    >
                      <span className="inline-block text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1 rounded-full shadow-lg">
                        VERIFIED
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div> */}
            <div className="flex items-center justify-center md:justify-end">
              <AnimatePresence>
                {showSeal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: 0,
                      boxShadow: "0 0 30px rgba(255, 255, 255, 0.5)",
                    }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                    }}
                    className="relative"
                  >
                    {/* Circular background for the seal */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        className="w-32 h-32 rounded-full bg-gradient-to-br from-white/60 to-white/90 backdrop-blur-md border border-white/30"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      />
                    </div>

                    {/* Seal image with proper layering */}
                    <div className="relative z-10 p-4">
                      <img
                        src={verifySeal}
                        alt="Verified Seal"
                        className="w-28 h-28 object-contain drop-shadow-lg"
                      />
                    </div>

                    {/* Verified badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -bottom-6 left-0 right-0 text-center"
                    >
                      <span className="inline-block text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1 rounded-full shadow-lg">
                        VERIFIED
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Floating scan count badge */}
        <motion.div
          className="absolute -top-0 -right-0 bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
        >
          Scans: {qr.scanCount || 0}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default PublicQRViewPage;
