import { useState, useRef, useEffect } from 'react';
import HandSkeleton from '../../components/HandSkeleton';
import { useVocalContext } from '../../hooks/useVocalContext';
import { type NormalizedLandmark, type Results, type MediaPipeHandsInstance } from '../../types';

const TrainingPage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { updateVocalModel } = useVocalContext();
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[]>([]);
  const [selectedVocal, setSelectedVocal] = useState('');
  const [apiResponse, setApiResponse] = useState<string>('');

  useEffect(() => {
    let hands: MediaPipeHandsInstance | null = null;

    const setupMediaPipe = () => {
      hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results: Results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          setLandmarks(results.multiHandLandmarks[0]);
        } else {
          setLandmarks([]);
        }
      });

      if (videoRef.current) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await hands!.send({ image: videoRef.current });
            }
          },
          width: 320,
          height: 240,
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
  }, []);

    const handleSaveModel = async () => {
    if (!selectedVocal) {
      alert('Por favor, selecciona una vocal.');
      return;
    }
    if (landmarks.length === 0) {
      alert('No se detectó ninguna mano para capturar el modelo.');
      return;
    }

        updateVocalModel(selectedVocal, landmarks);
    alert(`Modelo para la vocal '${selectedVocal}' ha sido actualizado.`);

    // Capturar y enviar la foto al backend
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (!blob) {
            setApiResponse('Error: No se pudo crear el blob de la imagen.');
            return;
          }

          const formData = new FormData();
          formData.append('nombre', selectedVocal.toLowerCase());
          formData.append('foto', blob, 'foto.jpg');

          try {
            const response = await fetch('/vocales/procesar', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const text = await response.text();
              setApiResponse(`Error: ${text}`);
              return;
            }

            const data = await response.json();
            setApiResponse(JSON.stringify(data, null, 2));
          } catch (err) {
            if (err instanceof Error) {
              setApiResponse(`Error: ${err.message}`);
            } else {
              setApiResponse('Ocurrió un error desconocido.');
            }
          }
        }, 'image/jpeg', 0.7);
      }
    }
  };

  return (
    <section className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-700 font-montserrat mb-6">
        Entrenamiento de Modelos de Gestos
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Cámara en Vivo</h2>
          <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover transform scale-x-[-1]" autoPlay playsInline />
                        <div className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]">
              <HandSkeleton landmarks={landmarks} />
            </div>
            <canvas ref={canvasRef} width="320" height="240" className="hidden"></canvas>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Panel de Control</h2>
          <div className="w-full">
            <label htmlFor="vocal-select" className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona la vocal para entrenar:
            </label>
            <select
              id="vocal-select"
              value={selectedVocal}
              onChange={(e) => setSelectedVocal(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">--Selecciona--</option>
              <option value="a">A</option>
              <option value="e">E</option>
              <option value="i">I</option>
              <option value="o">O</option>
              <option value="u">U</option>
            </select>
          </div>
          <button
            onClick={handleSaveModel}
            className="mt-6 w-full py-3 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all duration-300"
          >
            Guardar Modelo de Gesto
          </button>
          {apiResponse && (
            <div className="mt-4 w-full">
              <h3 className="text-lg font-semibold text-gray-800">Respuesta del Servidor:</h3>
              <pre className="bg-gray-100 p-2 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                {apiResponse}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TrainingPage;