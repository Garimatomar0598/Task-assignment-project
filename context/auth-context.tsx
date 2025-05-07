"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
} | null;

interface AuthContextType {
  user: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check for active session on initial load
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          const { user: authUser } = session;
          
          // Get user profile information from profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser?.id)
            .single();
            
          setUser({
            id: authUser?.id || '',
            email: authUser?.email || '',
            name: profileData?.name || '',
            role: profileData?.role || 'user',
          });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const { user: authUser } = session;
          
          // Get user profile information
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser?.id)
            .single();
            
          setUser({
            id: authUser?.id || '',
            email: authUser?.email || '',
            name: profileData?.name || '',
            role: profileData?.role || 'user',
          });
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Successfully signed in",
        description: "Welcome back!",
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in",
        variant: "destructive",
      });
      console.error('Error signing in:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      
      // Create user in auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, 
              email,
              name,
              role: 'user', // Default role
              created_at: new Date().toISOString(),
            }
          ]);
          
        if (profileError) throw profileError;
      }

      toast({
        title: "Account created",
        description: "You have successfully registered. Please check your email for verification.",
      });
      
      router.push('/login');
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
      console.error('Error signing up:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      router.push('/');
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message || "An error occurred during sign out",
        variant: "destructive",
      });
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};