import { useUser } from '../contexts/UserProvider';
import { Navigate } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const { user, isReady } = useUser();
  if (!isReady) {
    return <div>Checking session...</div>;
  }
  if (!user?.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
