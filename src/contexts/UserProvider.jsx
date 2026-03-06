//UserProvider.jsx

import { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";

export function UserProvider ({children}) {

  const initialUser = {
    isLoggedIn: false,
    name: '',
    email: '',
    role: '',
    id: '',
  };

  const API_URL = import.meta.env.VITE_API_URL;

  const [user, setUser] = useState(initialUser);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const sessionRaw = localStorage.getItem("session");
    if (sessionRaw) {
      try {
        const parsed = JSON.parse(sessionRaw);
        setUser(parsed);
      } catch (_) {
        localStorage.removeItem("session");
      }
    }
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      const result = await fetch(`${API_URL}/api/user/profile`, {
        method: "GET",
        credentials: "include",
      });
      if (!result.ok) {
        setUser(initialUser);
        localStorage.setItem("session", JSON.stringify(initialUser));
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
    } catch (_) {
      setUser(initialUser);
      localStorage.setItem("session", JSON.stringify(initialUser));
    } finally {
      setIsReady(true);
    }
  };

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
    } catch (_) {
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

export function useUser () {
  return useContext(UserContext);
}
