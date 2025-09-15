import { NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHandHoldingHeart,
  faHome,
  faBookOpen,
  faDumbbell,
  faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  return (
    <aside className="w-72 bg-[#215c5c] text-[#f4f4f4] flex flex-col p-8 shadow-lg flex-shrink-0">
      <div className="flex items-center gap-4 pb-8 border-b border-white border-opacity-10 mb-8">
        <FontAwesomeIcon icon={faHandHoldingHeart} className="text-4xl text-[#f2994a]" />
        <span className="font-montserrat text-2xl font-bold">SignLearn AI</span>
      </div>
      <nav className="flex-grow">
        <ul className="list-none p-0">
          <li className="mb-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-4 text-white text-lg p-4 rounded-xl transition-colors duration-300 ${
                  isActive ? 'bg-white bg-opacity-20 font-semibold' : 'hover:bg-white hover:bg-opacity-10'
                }`
              }
            >
              <FontAwesomeIcon icon={faHome} className="text-xl" />
              Inicio
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-4 text-white text-lg p-4 rounded-xl transition-colors duration-300 ${
                  isActive ? 'bg-white bg-opacity-20 font-semibold' : 'hover:bg-white hover:bg-opacity-10'
                }`
              }
            >
              <FontAwesomeIcon icon={faBookOpen} className="text-xl" />
              Lecciones
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="/training"
              className={({ isActive }) =>
                `flex items-center gap-4 text-white text-lg p-4 rounded-xl transition-colors duration-300 ${
                  isActive ? 'bg-white bg-opacity-20 font-semibold' : 'hover:bg-white hover:bg-opacity-10'
                }`
              }
            >
              <FontAwesomeIcon icon={faDumbbell} className="text-xl" />
              Entrenamiento
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="mt-auto pt-8 border-t border-white border-opacity-10">
        <button className="flex items-center gap-4 text-white text-lg p-4 rounded-xl transition-all duration-300 hover:bg-red-500 hover:text-white w-full text-left transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg">
          <FontAwesomeIcon icon={faSignOutAlt} className="text-xl" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;