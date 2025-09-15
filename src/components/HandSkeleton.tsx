import React, { useRef, useEffect } from 'react';
import { type NormalizedLandmark } from '../types';

interface HandSkeletonProps {
  landmarks: NormalizedLandmark[];
}

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Anular
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
];

const drawHand = (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], width: number, height: number, lineWidth: number, baseRadius: number) => {
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
  ctx.lineWidth = lineWidth;
  ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';

  // Find the range of z-coordinates to scale the depth effect
  const zValues = landmarks.map(l => l.z);
  const minZ = Math.min(...zValues);
  const maxZ = Math.max(...zValues);
  const zRange = maxZ - minZ;

  for (const [start, end] of HAND_CONNECTIONS) {
    const startPoint = landmarks[start];
    const endPoint = landmarks[end];
    if (startPoint && endPoint) {
      ctx.beginPath();
      ctx.moveTo(startPoint.x * width, startPoint.y * height);
      ctx.lineTo(endPoint.x * width, endPoint.y * height);
      ctx.stroke();
    }
  }

  landmarks.forEach(point => {
    // Scale radius based on depth (z-coordinate)
    // A smaller z is closer to the camera, so we make the radius larger.
    const zScale = zRange > 0 ? 1 - (point.z - minZ) / zRange : 1;
    const radius = baseRadius * (0.5 + zScale * 1.5); // Scale radius from 0.5x to 2x

    ctx.beginPath();
    ctx.arc(point.x * width, point.y * height, radius, 0, 2 * Math.PI);
    ctx.fill();
  });
};

const HandSkeleton: React.FC<HandSkeletonProps> = ({ landmarks }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && landmarks && landmarks.length > 0) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        const minX = Math.min(...landmarks.map(l => l.x));
        const maxX = Math.max(...landmarks.map(l => l.x));
        const handWidth = (maxX - minX) * canvas.width;

        // Base size on a reference hand width of 100 pixels
        const scale = handWidth / 100;
        const baseRadius = Math.max(1, 4 * scale);
        const lineWidth = Math.max(0.5, 2 * scale);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawHand(ctx, landmarks, canvas.width, canvas.height, lineWidth, baseRadius);
      }
    }
  }, [landmarks]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default HandSkeleton;
