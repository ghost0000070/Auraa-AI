import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">404 - Not Found</h1>
      <p className="mb-8">The page you are looking for does not exist.</p>
      <Link to="/" className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFound;
