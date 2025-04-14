import React, { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile } from "lucide-react";
import toast from "react-hot-toast";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState("user");
  const [stream, setStream] = useState(null);
  const [filter, setFilter] = useState("none");
  const [cameraVisible, setCameraVisible] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [focusCircle, setFocusCircle] = useState({ visible: false, x: 0, y: 0 });

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
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasBackCamera = devices.some(
        (device) => device.kind === "videoinput" && device.label.toLowerCase().includes("back")
      );
      const constraints = {
        video: {
          facingMode: hasBackCamera ? cameraType : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      toast.error("Unable to access camera");
      console.error(error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    context.filter = filter;

    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, videoWidth, videoHeight);
    context.restore();

    const dataURL = canvas.toDataURL("image/jpeg");
    setImagePreview(dataURL);
    stopCamera();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({ text: text.trim(), image: imagePreview });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

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

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji.native);
  };

  useEffect(() => {
    if (showCamera) {
      setCameraVisible(true);
      startCamera();
    } else {
      stopCamera();
    }
  }, [showCamera, cameraType]);

  return (
    <div className="p-4 w-full relative">
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
        <div className="mb-3 flex flex-col items-center gap-3">
          <div className="relative w-full max-w-md">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              onClick={handleFocusTap}
              className="w-full h-auto rounded-lg border border-base-300"
              style={{
                aspectRatio: `${videoRef.current?.videoWidth || 4} / ${videoRef.current?.videoHeight || 3}`,
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
              ["HD", "contrast(140%) saturate(1.4) brightness(1.2)"],
            ].map(([name, value]) => (
              <button key={name} onClick={() => setFilter(value)} className="btn btn-xs">
                {name}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={capturePhoto} className="btn btn-sm btn-outline text-green-500">📸 Capture</button>
            <button onClick={stopCamera} className="btn btn-sm btn-outline text-red-500 border-red-500">Cancel</button>
          </div>

          <button onClick={switchCamera} className="btn btn-sm btn-outline text-blue-500 mt-2">
            Switch Camera
          </button>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 flex-wrap sm:flex-nowrap bg-base-200 p-2 rounded-lg"
      >
        <input
          type="text"
          className="flex-1 input input-bordered rounded-lg input-sm sm:input-md"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setShowEmojiPicker((prev) => !prev)} className="btn btn-circle btn-sm">
            <Smile size={20} />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 z-50">
              <div className="flex justify-end p-1">
                <button
                  className="text-xs text-red-400 hover:text-red-600 font-bold"
                  onClick={() => setShowEmojiPicker(false)}
                  type="button"
                >
                  ❌ Close
                </button>
              </div>
              <Picker data={data} onEmojiSelect={addEmoji} theme="dark" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`btn btn-circle btn-sm ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>

          <button type="button" className="btn btn-circle btn-sm" onClick={() => setShowCamera(true)}>
            📷
          </button>

          <button
            type="submit"
            className="btn btn-circle btn-sm"
            disabled={!text.trim() && !imagePreview}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
