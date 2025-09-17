import { useLocation, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTransition } from '../hooks/useTransition';
import {
  faHandHoldingHeart,
  faHome,
  faDumbbell,
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  const location = useLocation();
  const { triggerTransition } = useTransition();

  const handleNavigation = (e: React.MouseEvent, to: string) => {
    e.preventDefault();
    if (location.pathname !== to) {
      triggerTransition(to);
    }
  };

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
              onClick={(e) => handleNavigation(e, '/')}
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
              to="/training"
              onClick={(e) => handleNavigation(e, '/training')}
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
    </aside>
  );
};

export default Sidebar;