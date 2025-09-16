import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  const [scores, setScores] = useState<Record<string, string>>({
    a: '0.0',
    e: '0.0',
    i: '0.0',
    o: '0.0',
    u: '0.0'
  });
  const { vocal: selectedVocalParam } = useParams();
  const selectedVocal = selectedVocalParam || 'a';
  const [detectedVocal, setDetectedVocal] = useState('');
  const [highestScore, setHighestScore] = useState(0);

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

            window.drawConnectors(canvasCtx, handLandmarks, window.HAND_CONNECTIONS, { color: '#f2994a', lineWidth: 2 });
            window.drawLandmarks(canvasCtx, handLandmarks, { color: '#215c5c', lineWidth: 1 });

            let normalizedHand = normalizeLandmarks(handLandmarks);
            if (handedness === 'Left') {
              normalizedHand = normalizedHand.map(p => ({ ...p, x: -p.x }));
            }

            const newScores: Record<string, string> = {};
            let maxScore = 0;
            let detected = '';

            // Calculate similarity scores for all vowels
            for (const vowel of ['a', 'e', 'i', 'o', 'u']) {
              const vocalBase = vocalModels.find((v: VocalModel) => v.vocal === vowel);
              if (vocalBase) {
                const baseLandmarks = normalizeLandmarks(vocalBase.landmarks);
                const score = parseFloat(compareHands(normalizedHand, baseLandmarks));
                newScores[vowel] = score.toFixed(1);
                
                if (score > maxScore) {
                  maxScore = score;
                  detected = vowel;
                }
              } else {
                newScores[vowel] = '0.0';
              }
            }

            setScores(newScores);
            setDetectedVocal(detected);
            setHighestScore(maxScore);
          } else {
            // Reset scores when no hand is detected
            setScores({
              a: '0.0',
              e: '0.0',
              i: '0.0',
              o: '0.0',
              u: '0.0'
            });
            setDetectedVocal('');
            setHighestScore(0);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 font-montserrat">
            Entrenando vocal <span className="text-[#f2994a]">{selectedVocal.toUpperCase()}</span>
          </h1>
          <p className="text-gray-600">Coloca tu mano frente a la cámara</p>
        </div>
        <Link
          to="/"
          className="px-4 py-2 text-sm font-semibold text-[#f2994a] hover:text-white hover:bg-[#f2994a] rounded-lg transition-all duration-300 border border-[#f2994a]"
        >
          Volver al Inicio
        </Link>
      </div>

      <div className="my-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium text-gray-700">Precisión:</span>
          <span className="font-bold">{scores[detectedVocal] || '0.0'}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${detectedVocal === selectedVocal ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${highestScore}%` }}
          />
        </div>
      </div>

      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden mx-auto mb-6 shadow-lg" style={{ maxWidth: '640px' }}>
        <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay playsInline muted />
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]" width="640" height="480" />
      </div>

      <div className="text-center">
        <div className="grid grid-cols-5 gap-2 mb-4">
          {['a', 'e', 'i', 'o', 'u'].map((vowel) => (
            <div key={vowel} className="text-center">
              <div className={`text-lg font-medium ${vowel === detectedVocal ? (vowel === selectedVocal ? 'text-green-600' : 'text-black') : 'text-gray-400'}`}>
                {vowel.toUpperCase()}
              </div>
              <div className={`text-sm font-bold ${vowel === detectedVocal ? (vowel === selectedVocal ? 'text-green-600' : 'text-black') : 'text-gray-400'}`}>
                {scores[vowel] || '0.0'}%
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <p className="text-lg font-medium text-gray-700 mb-1">Vocal detectada:</p>
          <div className={`text-4xl font-bold ${detectedVocal === selectedVocal ? 'text-green-600' : 'text-black'}`}>
            {detectedVocal ? detectedVocal.toUpperCase() : '—'}
          </div>
          {detectedVocal && (
            <p className={`mt-2 font-medium ${detectedVocal === selectedVocal ? 'text-green-600' : 'text-red-600'}`}>
              {detectedVocal === selectedVocal ? '¡Correcto! Sigue practicando.' : 'Intenta hacer la vocal seleccionada'}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default PracticePage;
