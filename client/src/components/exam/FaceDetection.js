'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import { ShieldAlert, User, Users, AlertCircle, Loader2, CameraOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

const FaceDetection = ({ 
  mode = 'floating', 
  onVerificationComplete, 
  onViolation, 
  isActive = true 
}) => {
  const videoRef = useRef(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectionState, setDetectionState] = useState({
    facePresent: false,
    multipleFaces: false,
    lookingAway: false
  });
  const [missingFaceTimer, setMissingFaceTimer] = useState(0);

  // 1. Initial Model Loading (Only once)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setModelLoaded(true);
      } catch (err) {
        console.error('Proctoring models fail:', err);
      }
    };
    loadModels();
  }, []);

  // 2. Camera Management (Stable Management)
  useEffect(() => {
    let stream = null;

    const startVideo = async () => {
      if (!modelLoaded || !isActive || isCameraActive) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 320, height: 240, frameRate: { ideal: 10 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } catch (err) {
        toast.error('Camera access denied!');
      }
    };

    startVideo();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
        setIsCameraActive(false);
      }
    };
  }, [modelLoaded, isActive]); // Only restart if models load or component active state changes

  // 3. Main Proctoring Engine
  const runProctoring = useCallback(async () => {
    if (!videoRef.current || !modelLoaded || !isCameraActive) return;

    try {
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      const faceCount = detections.length;
      let isLookingAway = false;

      if (faceCount === 1) {
        const landmarks = detections[0].landmarks;
        const nose = landmarks.getNose()[0];
        const leftEye = landmarks.getLeftEye()[0];
        const rightEye = landmarks.getRightEye()[0];
        const eyeCenter = (leftEye.x + rightEye.x) / 2;
        const turnRatio = Math.abs(nose.x - eyeCenter) / Math.abs(leftEye.x - rightEye.x);
        if (turnRatio > 0.6) isLookingAway = true;
      }

      setDetectionState({
        facePresent: faceCount > 0,
        multipleFaces: faceCount > 1,
        lookingAway: isLookingAway
      });

      if (faceCount > 1) onViolation?.('Multiple faces detected', 'severe');
      else if (isLookingAway) onViolation?.('Maintain focus on screen', 'warning');

      if (faceCount === 0) {
        setMissingFaceTimer(prev => prev + 2);
        if (missingFaceTimer >= 5) onViolation?.('Face presence required', 'severe');
      } else {
        setMissingFaceTimer(0);
      }
    } catch (err) { /* Skip frames silently */ }
  }, [modelLoaded, isCameraActive, missingFaceTimer, onViolation]);

  useEffect(() => {
    let interval;
    if (isCameraActive) interval = setInterval(runProctoring, 2000);
    return () => clearInterval(interval);
  }, [isCameraActive, runProctoring]);

  const hasViolation = !detectionState.facePresent || detectionState.multipleFaces || detectionState.lookingAway;

  if (mode === 'gate') {
    return (
      <div className="space-y-6">
        <div className="relative w-72 aspect-video mx-auto bg-black rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <AnimatePresence>
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 gap-2">
                <Loader2 className="animate-spin text-blue-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enabling AI Proctor...</span>
              </div>
            )}
          </AnimatePresence>
          {isCameraActive && (
             <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md border ${detectionState.facePresent ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'}`}>
                {detectionState.facePresent ? 'IDENTITY READY' : 'POSITION FACE'}
             </div>
          )}
        </div>
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold transition-all ${detectionState.facePresent ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
          {detectionState.facePresent ? <ShieldAlert size={20} /> : <Loader2 size={18} className="animate-spin" />}
          <span>{detectionState.facePresent ? 'Biometric Signature Verified' : 'Searching for biometric signature...'}</span>
        </div>
        {detectionState.facePresent && onVerificationComplete?.(true)}
      </div>
    );
  }

  return (
    <motion.div drag dragConstraints={{ left: -1000, right: 0, top: -1000, bottom: 0 }} className="fixed bottom-6 right-6 z-[100]">
      <div className={`relative w-40 h-52 bg-slate-950 rounded-[32px] overflow-hidden border-2 shadow-2xl transition-all duration-500 ${hasViolation ? 'border-red-500 ring-4 ring-red-500/20 scale-105' : 'border-emerald-500/30 border-white/10'}`}>
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        <AnimatePresence>
          {hasViolation && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-end p-4 text-center pb-8">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity }} className="bg-red-600 text-white p-2 rounded-full mb-2"><ShieldAlert size={16} /></motion.div>
              <span className="text-[10px] font-black text-white uppercase tracking-tighter drop-shadow-lg">{detectionState.multipleFaces ? 'Multiple People' : detectionState.lookingAway ? 'Eyes on Screen' : 'Face Missing'}</span>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute top-4 right-4 group-hover:opacity-100 transition-opacity">
           <div className={`px-2 py-1 rounded-full text-[7px] font-black uppercase tracking-widest text-white border backdrop-blur-md ${hasViolation ? 'bg-red-600 border-red-500' : 'bg-emerald-600/40 border-emerald-500/30'}`}>
              {hasViolation ? 'Violation' : 'Secured'}
           </div>
        </div>
        {!isCameraActive && <div className="absolute inset-0 flex items-center justify-center bg-slate-900"><CameraOff className="text-slate-700" size={32} /></div>}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-20"><div className="w-8 h-1 bg-white rounded-full" /></div>
      </div>
    </motion.div>
  );
};

export default FaceDetection;
