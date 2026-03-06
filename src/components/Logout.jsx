//You can modify this component.

import { useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { Navigate } from "react-router-dom";

export default function Logout() {
  const { logout } = useUser();

  useEffect(()=>{
    void logout();
  }, [logout]);

  return (<Navigate to="/login" replace/>);
}
