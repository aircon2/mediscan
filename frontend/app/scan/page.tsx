"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import BackButton from "../components/BackButton";
import { scanMedication } from "../../utils/api";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasScannedRef = useRef<boolean>(false); // Prevent duplicate scans in dev mode
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>(
    "Analyzing your medication...",
  );
  const [error, setError] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const router = useRouter();

  const sendToGemini = async (imageDataUrl: string, retries = 0) => {
    setIsAnalyzing(true);
    setStatusText("Analyzing your medication...");

    try {
      const result = await scanMedication(imageDataUrl);
      console.log("[scan] Gemini result:", result);

      // Validate that we actually got medications
      const medNames = result.data?.medications
        ? Object.keys(result.data.medications)
        : [];

      if (medNames.length === 0) {
        console.log(
          "[scan] Backend returned success but no medications found",
        );
        setScanError(
          "No medication could be identified. Please try again with a clearer medication label.",
        );
        setIsAnalyzing(false);
        return;
      }

      setStatusText("Medication identified!");
      const firstMed = result.data.medications![medNames[0]];

      // Navigate to graph page for the scanned medication
      setTimeout(() => {
        router.push(`/newGraph?med=${encodeURIComponent(firstMed.name)}`);
      }, 1500);
    } catch (err: any) {
      console.error("[scan] Error object:", err);
      console.error("[scan] Error message:", err.message);

      // Check if the error is a not-a-medication error
      if (
        err.message?.includes("not_a_medication") ||
        err.message?.includes("does not appear to be a medication") ||
        err.message?.includes("No medication could be identified") ||
        err.message?.includes("Please try again with a medication label") ||
        err.message?.includes(
          "Please try again with a clearer medication label",
        )
      ) {
        console.log("[scan] Detected not-a-medication error");
        setScanError(
          "The scanned item is not a medication. Please try again with a valid medication label.",
        );
        setIsAnalyzing(false);
        return;
      }

      // Retry on 429 with exponential backoff (max 3 retries)
      if (err.message?.includes("429") && retries < 3) {
        const delay = Math.pow(2, retries) * 5000; // 5s, 10s, 20s
        setStatusText(`Rate limited. Retrying in ${delay / 1000}s...`);
        console.log(
          `[scan] Retrying after ${delay}ms (attempt ${retries + 1}/3)`,
        );

        setTimeout(() => {
          sendToGemini(imageDataUrl, retries + 1);
        }, delay);
      } else {
        // Show generic scan error with retry
        setScanError("An error occurred. Please try again.");
        setIsAnalyzing(false);
      }
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        // Downscale to max 800px wide to keep payload small for tunnel
        const maxWidth = 800;
        const scale = Math.min(1, maxWidth / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);

        // Draw video frame to canvas (scaled down)
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to base64 image with lower quality for smaller size
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.6);
        setCapturedImage(imageDataUrl);
        setCameraReady(false);

        // Stop the camera stream
        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track: MediaStreamTrack) => track.stop());
          streamRef.current = null;
        }

        // Send image to Gemini via backend (with duplicate prevention)
        if (!hasScannedRef.current) {
          hasScannedRef.current = true;
          sendToGemini(imageDataUrl);
        }
      }
    }
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError(
            "Camera not supported. Please use HTTPS or allow permissions.",
          );
          return;
        }

        // Try with back camera first, fallback to any camera
        let mediaStream: MediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              aspectRatio: { ideal: 16 / 9 },
            },
            audio: false,
          });
        } catch (err) {
          // Fallback to any available camera with basic HD
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });
          } catch (err2) {
            // Final fallback to any camera
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }

        streamRef.current = mediaStream;

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        setCameraReady(true);
      } catch (err: any) {
        console.error("Error accessing camera:", err);
        let errorMessage = "Unable to access camera.";

        if (err.name === "NotAllowedError") {
          errorMessage =
            "Camera permission denied. Please allow camera access.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found on this device.";
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another app.";
        } else if (
          window.location.protocol !== "https:" &&
          window.location.hostname !== "localhost"
        ) {
          errorMessage =
            "Camera requires HTTPS. Please use a secure connection.";
        }

        setError(errorMessage);
      }
    };

    startCamera();

    return () => {
      // Cleanup
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-purple-50 font-sans overflow-hidden">
      {/* Gradient Blur Circles */}
      <div className="absolute -top-20 -right-20 w-96 h-96 opacity-30 bg-gradient-to-bl from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 opacity-30 bg-gradient-to-tr from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>

      <BackButton />

      {/* Top Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex justify-center pt-6 mb-8"
      >
        <h1
          className="text-xl font-semibold tracking-wide text-gray-500"
          style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 500,
          }}
        >
          Scanning Page
        </h1>
      </motion.div>

      <main className="flex flex-col items-center justify-center flex-1 px-6 pb-20">
        {/* Camera Preview Area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md h-96 rounded-3xl overflow-hidden mb-8"
          style={{
            background: "rgba(255, 255, 255, 0.3)",
            backdropFilter: "blur(20px)",
            boxShadow:
              "10px 10px 20px 0px rgba(174, 174, 205, 0.3), -10px -10px 20px 0px rgba(255, 255, 255, 0.7)",
          }}
        >
          {/* Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Hidden canvas for capturing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Translucent overlay with text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/10 to-purple-100/10"></div>

            {error ? (
              <p className="relative z-10 text-xl font-medium text-red-500 px-4 text-center">
                {error}
              </p>
            ) : !cameraReady && !capturedImage ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-10 text-xl font-medium text-gray-400"
                style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                }}
              >
                Starting camera...
              </motion.p>
            ) : cameraReady ? (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="relative z-10 text-3xl font-medium text-blue-500"
                style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 500,
                }}
              >
                Align label here
              </motion.p>
            ) : null}
          </div>
        </motion.div>

        {/* Capture Button */}
        {cameraReady && !isAnalyzing && !scanError && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
            whileTap={{ scale: 0.98 }}
            onClick={captureImage}
            className="mb-8 w-full max-w-md py-2 px-6 rounded-full bg-blue-50 text-blue-600 font-medium text-lg shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)] hover:scale-[0.98] active:shadow-[0.3rem_0.3rem_0.5rem_0_rgb(225,226,228),-0.3rem_-0.3rem_0.5rem_0_rgb(255,255,255)] transition-all duration-200 cursor-pointer text-center"
          >
            Capture
          </motion.button>
        )}

        {/* Scan Error with Try Again */}
        {scanError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-5 w-full max-w-md"
          >
            <div
              className="flex flex-col items-center gap-3 px-8 py-6 rounded-3xl w-full"
              style={{
                background: "rgba(255, 255, 255, 0.5)",
                backdropFilter: "blur(10px)",
                boxShadow:
                  "10px 10px 15px 0px rgba(174, 174, 205, 0.2), -10px -10px 15px 0px rgba(255, 255, 255, 0.7)",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <p
                className="text-lg font-medium text-red-500 text-center"
                style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 500,
                }}
              >
                {scanError}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // Reset all state and restart camera
                setScanError(null);
                setCapturedImage(null);
                setIsAnalyzing(false);
                setStatusText("Analyzing your medication...");
                hasScannedRef.current = false;
                setError(null);
                setCameraReady(false);

                // Restart camera
                const restartCamera = async () => {
                  try {
                    let mediaStream: MediaStream;
                    try {
                      mediaStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                          facingMode: { ideal: "environment" },
                          width: { ideal: 1920 },
                          height: { ideal: 1080 },
                          aspectRatio: { ideal: 16 / 9 },
                        },
                        audio: false,
                      });
                    } catch {
                      try {
                        mediaStream = await navigator.mediaDevices.getUserMedia(
                          {
                            video: {
                              width: { ideal: 1280 },
                              height: { ideal: 720 },
                            },
                            audio: false,
                          },
                        );
                      } catch {
                        mediaStream = await navigator.mediaDevices.getUserMedia(
                          {
                            video: true,
                            audio: false,
                          },
                        );
                      }
                    }
                    streamRef.current = mediaStream;
                    if (videoRef.current) {
                      videoRef.current.srcObject = mediaStream;
                    }
                    setCameraReady(true);
                  } catch (err: any) {
                    setError("Unable to restart camera.");
                  }
                };
                restartCamera();
              }}
              className="w-full py-2 px-6 rounded-full bg-blue-50 text-blue-600 font-medium text-lg shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)] hover:scale-[0.98] active:shadow-[0.3rem_0.3rem_0.5rem_0_rgb(225,226,228),-0.3rem_-0.3rem_0.5rem_0_rgb(255,255,255)] transition-all duration-200 cursor-pointer text-center"
            >
              Try Again
            </motion.button>
          </motion.div>
        )}

        {/* Analyzing Status */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 px-8 py-6 rounded-3xl"
            style={{
              background: "rgba(255, 255, 255, 0.5)",
              backdropFilter: "blur(10px)",
              boxShadow:
                "10px 10px 15px 0px rgba(174, 174, 205, 0.2), -10px -10px 15px 0px rgba(255, 255, 255, 0.7)",
            }}
          >
            {/* Loading Dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-blue-500"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <p
              className="text-lg font-medium text-blue-500"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                fontWeight: 500,
              }}
            >
              {statusText}
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
