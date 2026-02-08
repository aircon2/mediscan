import { useRef, useEffect, useState } from 'react'; 



export default function CameraScanner() {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)

    const [mode, setMode] = useState("environment"); 
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        async function startCamera() {
            try {

                const currentStream = videoRef.current?.srcObject

                if (currentStream instanceof MediaStream) {
                    const tracks = currentStream.getTracks()
                    tracks.forEach(track => track.stop()) 
                }
                // browser API that triggers the permission prompt asking the user for camera access  
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } })
                // live data stream  
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
                
            } catch (error) {
                console.error('Error accessing camera:', error)
            }
        }

        startCamera() 

        return () => {
            const finalStream = videoRef.current?.srcObject

            if (finalStream instanceof MediaStream) {
                const tracks = finalStream.getTracks()
                tracks.forEach(track => track.stop()) 
            }
        }
    }, [mode])

    function handleCapture() {
        if (!videoRef.current || !canvasRef.current) return; 

        const video = videoRef.current; 
        const canvas = canvasRef.current; 
        const context = canvas.getContext('2d'); 
        if (!context) return; 

        canvas.width = video.videoWidth; 
        canvas.height = video.videoHeight; 
        context.drawImage(video, 0, 0, canvas.width, canvas.height); 

        const image = canvas.toDataURL('image/png'); 

        setCapturedImage(image);
        setIsAnalyzing(true);

        if (video.srcObject instanceof MediaStream) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }

        analyzeMedicine(image).then(() => {
            setIsAnalyzing(false);
        });
    }

    async function analyzeMedicine(image: string) {
        // Placeholder for AI analysis logic
        // You would send the image to your backend or an AI service here
        console.log("Analyzing medicine with image:", image);
        // Simulate analysis delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("Analysis complete!");
    }

    return (
            <div>
                {capturedImage ? (
                    <img src={capturedImage} alt="Captured medicine" />
                ) : (
                    <video ref={videoRef} autoPlay playsInline />
                )}
    
                <canvas ref={canvasRef} style={{ display: 'none'}} />
    
                <button onClick={handleCapture} disabled={isAnalyzing}>
                    {isAnalyzing ? "Analyzing..." : "Scan"}
                </button>
    
                {isAnalyzing && <p>Analyzing your medicine...</p>}
            </div>
        )
}