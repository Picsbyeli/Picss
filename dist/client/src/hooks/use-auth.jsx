import { createContext, useContext, useState } from "react";
import { useQuery, useMutation, } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
export const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const { toast } = useToast();
    const [isGuest, setIsGuest] = useState(false);
    const { data: user, error, isLoading, } = useQuery({
        queryKey: ["/api/user"],
        queryFn: getQueryFn({ on401: "returnNull" }),
        enabled: !isGuest, // Don't fetch user data if in guest mode
    });
    const loginMutation = useMutation({
        mutationFn: async (credentials) => {
            const res = await apiRequest("POST", "/api/login", credentials);
            return await res.json();
        },
        onSuccess: (user) => {
            setIsGuest(false); // Exit guest mode on login
            queryClient.setQueryData(["/api/user"], user);
            toast({
                title: "Login successful",
                description: `Welcome back, ${user.username}!`,
                variant: "default",
            });
        },
        onError: (error) => {
            toast({
                title: "Login failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const registerMutation = useMutation({
        mutationFn: async (credentials) => {
            const res = await apiRequest("POST", "/api/register", credentials);
            return await res.json();
        },
        onSuccess: (user) => {
            setIsGuest(false); // Exit guest mode on registration
            queryClient.setQueryData(["/api/user"], user);
            toast({
                title: "Registration successful",
                description: "Your account has been created and your progress will now be saved!",
                variant: "default",
            });
        },
        onError: (error) => {
            toast({
                title: "Registration failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const logoutMutation = useMutation({
        mutationFn: async () => {
            await apiRequest("POST", "/api/logout");
        },
        onSuccess: () => {
            queryClient.setQueryData(["/api/user"], null);
            setIsGuest(false); // Exit guest mode on logout
            toast({
                title: "Logged out",
                description: "You have been logged out successfully.",
                variant: "default",
            });
        },
        onError: (error) => {
            toast({
                title: "Logout failed",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    const playAsGuest = async () => {
        // First clear any existing session
        try {
            await apiRequest("POST", "/api/logout");
        }
        catch (error) {
            // Ignore logout errors, continue with guest setup
        }
        // Set guest mode and clear all user data
        setIsGuest(true);
        queryClient.clear(); // Clear all queries
        queryClient.setQueryData(["/api/user"], null); // Explicitly set user to null
        console.log('🎮 Guest mode activated - clearing all auth state');
        toast({
            title: "Playing as guest",
            description: "You can now play riddles! Create an account to save your progress.",
            variant: "default",
        });
    };
    return (<AuthContext.Provider value={{
            user: user ?? null,
            isGuest,
            isLoading: isLoading && !isGuest,
            error,
            loginMutation,
            logoutMutation,
            registerMutation,
            playAsGuest,
        }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
