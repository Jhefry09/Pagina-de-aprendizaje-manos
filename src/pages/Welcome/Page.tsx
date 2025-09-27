// Las rutas de importación son correctas si la estructura es:
// src/pages/Welcome/Page.tsx y src/assets/img/*
import logo from "../../assets/img/logo_2.png"; 
import abecedario from "../../assets/img/abedecedario.png"; 
import numero from "../../assets/img/numero.png"; 
import vocales from "../../assets/img/vocales.png"; 
import { useNavigate } from "react-router-dom";

export default function App() {
  const navigate = useNavigate();
  return (
    <main className="w-full text-white antialiased">
      {/* HERO */}
      <section className="min-h-screen flex items-center justify-center text-center p-8">
        <div className="max-w-4xl mx-auto">
          <img
            src={logo} 
            alt="Logo SeeTalk"
            className="mx-auto w-[600px] max-w-[90%] drop-shadow-[0_8px_20px_RGBA(0,0,0,0.6)]"
          />
          {/*  MARCA ACTUALIZADA: SignLearn AI → SeeTalk */}
          <h1 className="mt-8 font-extrabold text-6xl md:text-8xl">
            <span className="text-amber-400">See</span>
            <span className="text-blue-400">Talk</span>
          </h1>
          <p className="mt-6 global-large-text max-w-[800px] mx-auto">
            Nuestra aplicación de lengua de señas es un entrenador personal que se
            adapta a tu ritmo de aprendizaje. Aprende y practica de forma simple
            mientras la app se vuelve más inteligente y útil contigo.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-20 px-6 space-y-24">
        <article className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-16">
          <div className="flex-1 min-w-[300px] md:flex-[0_0_40%] lg:flex-[0_0_30%] order-2 md:order-1">
            <img
              src={vocales} 
              alt="Vocales"
              className="w-full transition-transform duration-200 ease-in-out hover:scale-[1.05]" 
            />
          </div>
          <div className="flex-1 min-w-[300px] order-1 md:order-2">
            <h2 className="global-title mb-4 text-center md:text-left">VOCALES</h2>
            <p className="global-large-text text-center md:text-left">
              Descubre cómo se representan las cinco vocales con señas. Cada gesto
              explicado paso a paso.
            </p>
          </div>
        </article>

        <article className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-16 flex-row-reverse">
          <div className="flex-1 min-w-[300px] md:flex-[0_0_40%] lg:flex-[0_0_30%]">
            <img
              src={abecedario} 
              alt="Abecedario"
              className="w-full transition-transform duration-200 ease-in-out hover:scale-[1.05]" 
            />
          </div>
          <div className="flex-1 min-w-[300px]">
            <h2 className="global-title mb-4 text-center md:text-left">ABECEDARIO</h2>
            <p className="global-large-text text-center md:text-left">
              Recorre el abecedario completo y aprende la seña de cada letra desde
              la A hasta la Z.
            </p>
          </div>
        </article>

        <article className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-16 flex-row">
          <div className="flex-1 min-w-[300px] md:flex-[0_0_40%] lg:flex-[0_0_30%]">
            <img
              src={numero} 
              alt="Números"
              className="w-full transition-transform duration-200 ease-in-out hover:scale-[1.05]" 
            />
          </div>
          <div className="flex-1 min-w-[300px]">
            <h2 className="global-title mb-4 text-center md:text-left">NÚMEROS</h2>
            <p className="global-large-text text-center md:text-left">
              Aprende a expresar números con señas, desde el 0 hasta el 9 y más allá.
            </p>
          </div>
        </article>
      </section>

      {/* FOOTER - Botón con estilo modificado */}
      <footer className="py-16 text-center">
        <button onClick={() => navigate('/login')} className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-12 py-5 rounded-3xl global-large-text font-semibold transition-transform transform hover:-translate-y-1 shadow-lg">
          Iniciar
        </button>
      </footer>
    </main>
  );
}