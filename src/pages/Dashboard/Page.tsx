import { useEffect, useState } from 'react';

const ProgressRing = ({ percent }: { percent: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          className="text-gray-200"
          strokeWidth="8"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="48"
          cy="48"
        />
        <circle
          className="text-orange-400 transition-all duration-700 ease-in-out"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="48"
          cy="48"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold text-lg text-gray-700">{`${percent}%`}</span>
    </div>
  );
};

const DashboardPage = () => {
  const [lessonsCompleted, setLessonsCompleted] = useState('1/5');
  const [accuracy, setAccuracy] = useState('78%');
  const [practiceTime, setPracticeTime] = useState('30s');
  const [vocalADominance, setVocalADominance] = useState(85);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLessonsCompleted('2/5');
      setAccuracy('88%');
      setPracticeTime('50s');
      setVocalADominance(90);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="p-6">
      <h1 className="text-3xl font-bold text-gray-700 font-montserrat mb-6">Tu Progreso</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
          <span className="text-4xl font-bold text-[#215c5c]">{lessonsCompleted}</span>
          <p className="text-gray-600 mt-2">Lecciones Completadas</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
          <span className="text-4xl font-bold text-[#215c5c]">{accuracy}</span>
          <p className="text-gray-600 mt-2">Precisión Promedio</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
          <span className="text-4xl font-bold text-[#215c5c]">{practiceTime}</span>
          <p className="text-gray-600 mt-2">Tiempo de Práctica</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-6">Dominancia de Vocales</h2>
          <div className="flex justify-around items-center space-x-4">
            <div className="flex flex-col items-center">
              <ProgressRing percent={vocalADominance} />
              <span className="mt-2 font-semibold">Vocal A</span>
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing percent={70} />
              <span className="mt-2 font-semibold">Vocal E</span>
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing percent={92} />
              <span className="mt-2 font-semibold">Vocal I</span>
            </div>
            <div className="flex flex-col items-center">
              <ProgressRing percent={60} />
              <span className="mt-2 font-semibold">Vocal O</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Sesiones Recientes</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
              <span className="font-semibold text-gray-800">Vocal A</span>
              <span className="text-gray-600">200 intentos • Precisión: 85%</span>
              <span className="text-green-500 font-bold">85%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
              <span className="font-semibold text-gray-800">Vocal E</span>
              <span className="text-gray-600">150 intentos • Precisión: 70%</span>
              <span className="text-yellow-500 font-bold">70%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
              <span className="font-semibold text-gray-800">Vocal I</span>
              <span className="text-gray-600">300 intentos • Precisión: 92%</span>
              <span className="text-green-600 font-bold">92%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPage;