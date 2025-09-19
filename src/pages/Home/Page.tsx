import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import aImage from '../../images/a.png';
import eImage from '../../images/e.png';
import iImage from '../../images/i.png';
import oImage from '../../images/o.png';
import uImage from '../../images/u.png';

const HomePage = () => {
  const vocals = [
    { 
      vocal: 'A', 
      description: 'Nivel 1: vas iniciando chaval.',
      image: aImage 
    },
    { 
      vocal: 'E', 
      description: 'Nivel 2: ya estás cerca hijo.',
      image: eImage 
    },
    { 
      vocal: 'I', 
      description: 'Nivel 3: llegaste lejos.',
      image: iImage 
    },
    { 
      vocal: 'O', 
      description: 'Nivel 4: ya déjalo.',
      image: oImage 
    },
    { 
      vocal: 'U', 
      description: 'Nivel 5: ya vete.',
      image: uImage 
    },
  ];

  // Colors for each vowel card
  const vowelColors = {
    'A': 'from-red-400 to-red-500',
    'E': 'from-yellow-400 to-yellow-500',
    'I': 'from-blue-400 to-blue-500',
    'O': 'from-green-400 to-green-500',
    'U': 'from-purple-400 to-purple-500',
  };

  // Animation variants
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.5, 
        ease: 'easeOut'
      } 
    }
  };

  const fadeIn: Variants = {
    hidden: { opacity: 0 },
    show: { 
      opacity: 1,
      transition: { 
        duration: 0.8, 
        ease: 'easeOut'
      } 
    }
  };

  const scaleUp: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  return (
    <motion.section 
      initial="hidden"
      animate="show"
      className="p-4 sm:p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <motion.div 
        variants={fadeIn}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 bg-gradient-to-r from-[#F2994A] to-[#215C5C] p-6 rounded-2xl text-white shadow-lg"
      >
        <motion.div variants={item}>
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            ¡Bienvenido a SignLearn AI!
          </motion.h1>
          <motion.p 
            className="text-blue-100"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Aprende lenguaje de señas de manera fácil y divertida
          </motion.p>
        </motion.div>
        <motion.div 
          className="mt-4 sm:mt-0 flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
        >
          <span className="font-medium">Chaval</span>
          <motion.span 
            className="text-yellow-300 text-lg"
            animate={{ rotate: [0, 10, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 1 }}
          >
            ⭐
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Info Card */}
      <motion.div 
        variants={scaleUp}
        className="mb-10 p-6 bg-white rounded-2xl shadow-lg border-l-4 border-[#215C5C]"
      >
        <motion.h2 
          className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2"
          whileHover={{ x: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <motion.span 
            className="text-blue-500"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 2 }}
          >
            📚
          </motion.span> 
          Comienza tu aprendizaje
        </motion.h2>
        <motion.p 
          className="text-gray-700 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Explora las vocales en lenguaje de señas. Cada letra es un paso más en tu viaje de aprendizaje. 
          Selecciona una vocal para descubrir su seña y practica hasta dominarla.
        </motion.p>
      </motion.div>

      {/* Vowels Grid */}
      <motion.div variants={fadeIn}>
        <motion.h2 
          className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.span 
            className="text-[#215C5C]"
            whileHover={{ scale: 1.05 }}
          >
            Vocales
          </motion.span>
        </motion.h2>
      </motion.div>
      
      <AnimatePresence>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {vocals.map((vocal) => (
            <motion.div
              key={vocal.vocal}
              variants={item}
              whileHover={{ 
                y: -5,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={`/practice/${vocal.vocal.toLowerCase()}`}
                className="group block bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
              >
            {/* Card Header with Gradient */}
            <div className={`h-2 bg-gradient-to-r ${vowelColors[vocal.vocal as keyof typeof vowelColors]}`}></div>
            
            {/* Image Container */}
            <div className="p-4">
              <div className="w-full h-36 bg-gray-50 rounded-lg mb-4 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent z-10"></div>
                <img 
                  src={vocal.image} 
                  alt={`Señal de la letra ${vocal.vocal} en lenguaje de señas`}
                  className="h-24 w-auto object-contain z-20 transform group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text x='50%' y='50%' font-size='48' text-anchor='middle' dominant-baseline='middle'>${vocal.vocal}</text></svg>`;
                  }}
                />
              </div>
            </div>
              
              {/* Content */}
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-800 font-montserrat">
                    Vocal {vocal.vocal}
                  </h3>
                  <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    Nivel {vocals.findIndex(v => v.vocal === vocal.vocal) + 1}/5
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{vocal.description}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  </motion.section>
  );
};

export default HomePage;
