import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [filter, setFilter] = useState("none");
  const [cameraVisible, setCameraVisible] = useState(false);
  const [focusCircle, setFocusCircle] = useState({ visible: false, x: 0, y: 0 });
  const [cameraType, setCameraType] = useState("user"); // "user" for front camera, "environment" for rear camera

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraType },
      });
      videoRef.current.srcObject = stream;
    } catch (error) {
      toast.error("Error accessing camera");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext("2d");
    context.filter = filter;

    context.save();
    context.translate(canvasRef.current.width, 0);
    context.scale(-1, 1);
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    context.restore();

    const dataURL = canvasRef.current.toDataURL("image/jpeg");
    setImagePreview(dataURL);
    stopCamera();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Touch-to-focus simulation
  const handleFocusTap = (e) => {
    const rect = videoRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setFocusCircle({ visible: true, x, y });
    setTimeout(() => setFocusCircle({ visible: false, x: 0, y: 0 }), 500);
  };

  const switchCamera = () => {
    setCameraType((prev) => (prev === "user" ? "environment" : "user"));
  };

  useEffect(() => {
    if (showCamera) {
      setCameraVisible(true);
      startCamera();
    } else {
      setCameraVisible(false);
    }
  }, [showCamera, cameraType]);

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {showCamera && (
        <div
          className={`mb-3 flex flex-col items-center gap-3 transition-all duration-500 ease-in-out ${
            cameraVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="relative">
            <video
              ref={videoRef}
              width="640"
              height="480"
              autoPlay
              onClick={handleFocusTap}
              className="max-w-full rounded-lg border border-base-300 transition-all duration-500"
              style={{
                filter,
                transform: "scaleX(-1)",
              }}
            />
            {focusCircle.visible && (
              <div
                className="absolute border border-white rounded-full animate-ping"
                style={{
                  top: `${focusCircle.y - 25}px`,
                  left: `${focusCircle.x - 25}px`,
                  width: "50px",
                  height: "50px",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>

          <div className="flex gap-2 flex-wrap justify-center text-xs sm:text-sm">
            {[
              ["Normal", "none"],
              ["Sepia", "sepia(1)"],
              ["Grayscale", "grayscale(100%)"],
              ["Bright", "brightness(150%) contrast(120%)"],
              ["Blur", "blur(2px)"],
              ["Warm", "hue-rotate(30deg) saturate(1.5)"],
              ["Cool", "hue-rotate(180deg) saturate(1.2)"],
              ["Contrast", "contrast(150%) saturate(1.4)"],
              ["Pinky", "hue-rotate(300deg) brightness(120%)"],
              ["Vintage", "sepia(0.6) contrast(1.2)"],
              ["Soft Glow", "brightness(1.3) blur(1px)"],
            ].map(([name, value]) => (
              <button key={name} onClick={() => setFilter(value)} className="btn btn-xs">
                {name}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={capturePhoto} className="btn btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>

            <button onClick={stopCamera} className="btn btn-sm btn-outline text-red-500 border-red-500">
              Cancel
            </button>
          </div>

          <button onClick={switchCamera} className="btn btn-sm btn-outline text-blue-500 mt-2">
            Switch Camera
          </button>

          <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap"
      >
        <div className="flex-1 flex gap-2 items-center">
          <input
            type="text"
            className="flex-grow input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle btn-sm ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>

          <button
            type="button"
            className="btn btn-circle btn-sm"
            onClick={() => setShowCamera(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg"
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
