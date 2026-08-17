import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-32">
      <div className="text-center">
        <h1 className="text-9xl font-black gradient-text">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
          Island Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 mb-8">
          This page seems to have drifted away...
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <FaHome /> Go Home
        </Link>
      </div>
    </div>
  );
}
