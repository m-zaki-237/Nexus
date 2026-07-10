import React, { createContext, useState, useContext, useEffect } from "react";
import { User, UserRole, AuthContextType } from "../types";
import toast from "react-hot-toast";
import api from "../api/axios";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile");
        setUser(res.data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post("/auth/register", { name, email, password, role });
      const res = await api.get("/auth/profile");
      setUser(res.data.user);
      toast.success("Account created successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    _role: UserRole
  ): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post("/auth/login", { email, password });
      const res = await api.get("/auth/profile");
      setUser(res.data.user);
      toast.success("Successfully logged in!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Logout failed");
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      await api.patch("/user/update-profile", updates);
      const res = await api.get("/auth/profile");
      setUser(res.data.user);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
