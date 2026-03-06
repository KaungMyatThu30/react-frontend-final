//UserProvider.jsx

import { useCallback, useEffect, useState } from "react";
import { UserContext } from "./UserContext";

const INITIAL_USER = {
  isLoggedIn: false,
  name: '',
  email: '',
  role: '',
  id: '',
};

export function UserProvider ({children}) {

  const API_URL = import.meta.env.VITE_API_URL;

  const [user, setUser] = useState(INITIAL_USER);
  const [isReady, setIsReady] = useState(false);

  const checkProfile = useCallback(async () => {
    try {
      const result = await fetch(`${API_URL}/api/user/profile`, {
        method: "GET",
        credentials: "include",
      });
      if (!result.ok) {
        setUser(INITIAL_USER);
        localStorage.setItem("session", JSON.stringify(INITIAL_USER));
        return;
      }
      const profile = await result.json();
      const profileUser = {
        isLoggedIn: true,
        name: profile.username || profile.firstname || "",
        email: profile.email || "",
        role: profile.role || "",
        id: profile._id || "",
      };
      setUser(profileUser);
      localStorage.setItem("session", JSON.stringify(profileUser));
    } catch {
      setUser(INITIAL_USER);
      localStorage.setItem("session", JSON.stringify(INITIAL_USER));
    } finally {
      setIsReady(true);
    }
  }, [API_URL]);

  useEffect(() => {
    const sessionRaw = localStorage.getItem("session");
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw);
        setUser(parsed);
      } catch {
        localStorage.removeItem("session");
      }
    }
    void checkProfile();
  }, [checkProfile]);

  const login = async (email, password) => {
    try {
      const result = await fetch(`${API_URL}/api/user/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!result.ok) {
        return false;
      }

      const payload = await result.json();
      const loggedInUser = {
        isLoggedIn: true,
        name: payload.user?.username || "",
        email: payload.user?.email || email,
        role: payload.user?.role || "",
        id: payload.user?.id || "",
      };
      setUser(loggedInUser);
      localStorage.setItem("session", JSON.stringify(loggedInUser));
      return true;
    } catch {
      return false;
    }
  }

  const logout = async () => {
    await fetch(`${API_URL}/api/user/logout`, {
      method: "POST",
      credentials: "include"
    });
    const newUser = { isLoggedIn: false, name: '', email: '', role: '', id: '' };
    setUser(newUser);
    localStorage.setItem("session", JSON.stringify(newUser));
  }

  return (
    <UserContext.Provider value={{user, login, logout, isReady, checkProfile}}>
      {children}
    </UserContext.Provider>
  );
}
