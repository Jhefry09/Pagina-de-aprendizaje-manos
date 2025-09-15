import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useVocalContext } from '../../hooks/useVocalContext';
import { type VocalModel, type NormalizedLandmark, type Results, type MediaPipeHandsInstance } from '../../types';

// Helper functions translated from the HTML file
const normalizeLandmarks = (landmarks: NormalizedLandmark[]) => {
  if (!landmarks || landmarks.length === 0) return [];
  const cx = landmarks.reduce((sum, p) => sum + p.x, 0) / landmarks.length;
  const cy = landmarks.reduce((sum, p) => sum + p.y, 0) / landmarks.length;
  const cz = landmarks.reduce((sum, p) => sum + p.z, 0) / landmarks.length;
  let normalized = landmarks.map(p => ({ x: p.x - cx, y: p.y - cy, z: p.z - cz }));
  const maxDist = Math.max(...normalized.map(p => Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z)));
  if (maxDist === 0) return normalized; // Avoid division by zero
  normalized = normalized.map(p => ({ x: p.x / maxDist, y: p.y / maxDist, z: p.z / maxDist }));
  return normalized;
};

const compareHands = (landmarks1: NormalizedLandmark[], landmarks2: NormalizedLandmark[]) => {
  if (!landmarks1 || !landmarks2 || landmarks1.length === 0 || landmarks2.length === 0) return '0.0';
  const n = Math.min(landmarks1.length, landmarks2.length);
  let totalDist = 0;
  for (let i = 0; i < n; i++) {
    const p1 = landmarks1[i];
    const p2 = landmarks2[i];
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    totalDist += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
  const similarity = Math.max(0, Math.min(1, 1 - (totalDist / n)));
  return (similarity * 100).toFixed(1);
};

const PracticePage = () => {
  const { vocalModels } = useVocalContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState('0.0');
  const [selectedVocal, setSelectedVocal] = useState('a');

  useEffect(() => {
    let hands: MediaPipeHandsInstance | null = null;

    const setupMediaPipe = () => {
      hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: Results) => {
        const canvasCtx = canvasRef.current?.getContext('2d');
        if (canvasCtx && canvasRef.current) {
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const handLandmarks = results.multiHandLandmarks[0];
            const handedness = results.multiHandedness[0]?.label || 'Right';

            window.drawConnectors(canvasCtx, handLandmarks, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
            window.drawLandmarks(canvasCtx, handLandmarks, { color: '#FF0000', lineWidth: 1 });

            let normalizedHand = normalizeLandmarks(handLandmarks);
            if (handedness === 'Left') {
              normalizedHand = normalizedHand.map(p => ({ ...p, x: -p.x }));
            }

            const vocalBase = vocalModels.find((v: VocalModel) => v.vocal === selectedVocal);
            if (vocalBase) {
              const baseLandmarks = normalizeLandmarks(vocalBase.landmarks);
              const newScore = compareHands(normalizedHand, baseLandmarks);
              setScore(newScore);
            } else {
              setScore('0.0');
            }
          } else {
            setScore('0.0');
          }
        }
      });

      if (videoRef.current) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await hands!.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
      }
    };

    const intervalId = setInterval(() => {
      if (window.Hands && window.Camera) {
        clearInterval(intervalId);
        setupMediaPipe();
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      if (hands) {
        hands.close();
      }
    };
  }, [selectedVocal, vocalModels]);

  return (
    <section className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-700 font-montserrat">
          Reconocimiento de Vocales por Mano
        </h1>
        <Link
          to="/"
          className="px-4 py-2 text-sm font-semibold text-[#f2994a] hover:text-white hover:bg-[#f2994a] rounded-lg transition-all duration-300 border border-[#f2994a]"
        >
          Volver al Inicio
        </Link>
      </div>

      <div>
        <label htmlFor="vocalSelect" className="mr-2 font-semibold">Selecciona una vocal:</label>
        <select id="vocalSelect" value={selectedVocal} onChange={(e) => setSelectedVocal(e.target.value)} className="p-2 rounded-lg border">
          <option value="a">A</option>
          <option value="e">E</option>
          <option value="i">I</option>
          <option value="o">O</option>
          <option value="u">U</option>
        </select>
      </div>

      <div className="my-4 bg-gray-200 rounded-full h-8 overflow-hidden">
        <div
          className="bg-green-500 h-full flex items-center justify-center text-white font-bold transition-all duration-100"
          style={{ width: `${score}%` }}
        >
          {score}%
        </div>
      </div>

      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mx-auto" style={{ maxWidth: '640px' }}>
        <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" width="640" height="480" />
      </div>
    </section>
  );
};

export default PracticePage;
