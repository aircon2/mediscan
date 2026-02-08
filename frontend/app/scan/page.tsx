"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import BackButton from "../components/BackButton";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    let captureTimeout: NodeJS.Timeout;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // Use back camera on mobile
          audio: false,
        });

        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Start 3-second countdown
        setIsCapturing(true);
        let timeLeft = 3;

        countdownInterval = setInterval(() => {
          timeLeft -= 1;
          setCountdown(timeLeft);
        }, 1000);

        // Capture image after 3 seconds
        captureTimeout = setTimeout(() => {
          captureImage();
          clearInterval(countdownInterval);
        }, 3000);
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Unable to access camera. Please allow camera permissions.");
      }
    };

    const captureImage = () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        if (context) {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert canvas to base64 image
          const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
          setCapturedImage(imageDataUrl);
          setIsCapturing(false);

          // Stop the camera stream
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }

          // TODO: Send imageDataUrl to API
          console.log(
            "Image captured and ready to send:",
            imageDataUrl.substring(0, 50) + "...",
          );
        }
      }
    };

    startCamera();

    return () => {
      // Cleanup
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (countdownInterval) clearInterval(countdownInterval);
      if (captureTimeout) clearTimeout(captureTimeout);
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 backdrop-blur-[2px]"></div>

            {error ? (
              <p className="relative z-10 text-xl font-medium text-red-500 px-4 text-center">
                {error}
              </p>
            ) : isCapturing && countdown > 0 ? (
              <motion.p
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="relative z-10 text-6xl font-bold text-blue-500"
                style={{
                  fontFamily: '"Space Grotesk", sans-serif',
                }}
              >
                {countdown}
              </motion.p>
            ) : (
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
            )}
          </div>
        </motion.div>

        {/* Analyzing Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
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
            {capturedImage ? "Image captured!" : "Analyzing your medication..."}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
