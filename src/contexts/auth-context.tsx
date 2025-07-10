'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['mt_users']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, companyName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          
          const { data: profileData } = await supabase
            .from('mt_users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // If no profile exists, handle first-time login
          if (!profileData) {
            if (session.user.user_metadata?.is_employee) {
              await createEmployeeProfile(session.user);
            } else {
              await createCompanyAndProfile(session.user);
            }
            
            // Retry fetching the profile
            const { data: newProfileData } = await supabase
              .from('mt_users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            setProfile(newProfileData);
          } else {
            setProfile(profileData);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth: onAuthStateChange event:', event, 'session:', !!session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('Auth: Fetching profile for user:', session.user.id);
        
        try {
          // Add timeout to prevent hanging
          const profilePromise = supabase
            .from('mt_users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
          );
          
          const { data: profileData, error: profileError } = await Promise.race([
            profilePromise,
            timeoutPromise
          ]).catch(err => {
            console.error('Auth: Profile fetch failed:', err);
            return { data: null, error: err };
          });
          
          console.log('Auth: Profile fetch result:', { profileData, profileError });

          console.log('Auth Debug:', {
            userId: session.user.id,
            profileData,
            profileError,
            userMetadata: session.user.user_metadata,
            isAdmin: session.user.user_metadata?.is_admin,
            fullUserObject: session.user,
          });

          // If no profile exists, handle first-time login
          if (!profileData && !profileError?.message?.includes('timeout')) {
            console.log('Auth: First-time login detected');
            
            if (session.user.user_metadata?.is_employee) {
              console.log('Auth: Creating employee profile');
              await createEmployeeProfile(session.user);
            } else {
              console.log('Auth: Creating company and admin profile');
              await createCompanyAndProfile(session.user);
            }
            
            // Retry fetching the profile with timeout
            const retryPromise = supabase
              .from('mt_users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            const retryTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Retry timeout')), 3000)
            );
            
            const { data: newProfileData } = await Promise.race([
              retryPromise,
              retryTimeoutPromise
            ]).catch(() => ({ data: null }));
            
            console.log('Auth: New profile created:', newProfileData);
            setProfile(newProfileData);
          } else if (profileError?.message?.includes('timeout')) {
            console.warn('Auth: Profile fetch timed out, trying service role API');
            
            // Try fetching via service role API
            try {
              const response = await fetch(`/api/debug-profile?userId=${session.user.id}`);
              const result = await response.json();
              
              if (result.success && result.profile) {
                console.log('Auth: Profile fetched via service role:', result.profile);
                setProfile(result.profile);
              } else if (!result.userExists) {
                console.log('Auth: User does not exist, creating profile');
                // User doesn't exist, create it
                if (session.user.user_metadata?.is_employee) {
                  await createEmployeeProfile(session.user);
                } else {
                  await createCompanyAndProfile(session.user);
                }
                
                // Fetch again via service role
                const retryResponse = await fetch(`/api/debug-profile?userId=${session.user.id}`);
                const retryResult = await retryResponse.json();
                if (retryResult.success) {
                  setProfile(retryResult.profile);
                }
              } else {
                console.error('Auth: Failed to fetch profile via service role:', result);
                // Last resort - create minimal profile
                setProfile({
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.email!.split('@')[0],
                  role: 'admin',
                  company_id: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  phone: null
                } as any);
              }
            } catch (error) {
              console.error('Auth: Service role API failed:', error);
              // Create minimal profile as fallback
              setProfile({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.email!.split('@')[0],
                role: 'admin',
                company_id: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                phone: null
              } as any);
            }
          } else {
            setProfile(profileData);
          }
        } catch (error) {
          console.error('Auth: Unexpected error during profile fetch:', error);
          // Set loading to false even on error
          setLoading(false);
          return;
        }
      } else {
        console.log('Auth: No session, clearing profile');
        setProfile(null);
      }

      console.log('Auth: Setting loading to false');
      setLoading(false);
    });

    // Auto-login for demo mode
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
    const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD;

    if (isDemoMode && demoEmail && demoPassword) {
      // Check if already authenticated
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          // Auto-login with demo credentials
          signIn(demoEmail, demoPassword).catch(() => {
            // If demo login fails, continue normally
            setLoading(false);
          });
        }
      });
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const createCompanyAndProfile = async (user: any) => {
    try {
      console.log('Auth: Creating company and profile for user:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      });

      // Use metadata if available, otherwise defaults
      const companyName = user.user_metadata?.company_name || `${user.email}'s Company`;
      const userName = user.user_metadata?.name || user.email.split('@')[0];

      // Call API to create company and profile with service role
      const response = await fetch('/api/auth/setup-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          name: userName,
          companyName: companyName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to setup profile');
      }

      console.log('Auth: Company and profile created successfully via API');
    } catch (error) {
      console.error('Auth: Error creating company and profile:', error);
    }
  };

  const createEmployeeProfile = async (user: any) => {
    try {
      console.log('Auth: Creating employee profile for user:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      });

      const userName = user.user_metadata?.name || user.email.split('@')[0];
      const companyId = user.user_metadata?.company_id;

      if (!companyId) {
        throw new Error('No company ID found in user metadata');
      }

      // Create employee profile directly
      const { error: userError } = await supabase.from('mt_users').insert({
        id: user.id,
        email: user.email,
        name: userName,
        role: 'employee',
        company_id: companyId,
      });

      if (userError) throw userError;

      console.log('Auth: Employee profile created successfully');
    } catch (error) {
      console.error('Auth: Error creating employee profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Auth: Starting signIn with email:', email);
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Auth: signInWithPassword result:', { data, error });

    if (error) {
      console.error('Auth: signIn error:', error);
      setLoading(false);
      throw error;
    }
    
    console.log('Auth: signIn successful, waiting for auth state change...');
    // Don't set loading to false here - let the auth state change handler do it
  };

  const signUp = async (email: string, password: string, name: string, companyName: string) => {
    console.log('Auth context: Starting signup with email:', email);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    console.log('Auth context: Supabase auth result:', { authData, authError });

    if (authError) throw authError;

    if (authData.user) {
      console.log('Auth context: Creating company:', companyName);
      const { data: companyData, error: companyError } = await supabase
        .from('mt_companies')
        .insert({ name: companyName })
        .select()
        .single();

      console.log('Auth context: Company creation result:', { companyData, companyError });

      if (companyError) throw companyError;

      console.log('Auth context: Creating user record');
      const { error: userError } = await supabase.from('mt_users').insert({
        id: authData.user.id,
        email,
        name,
        role: 'admin',
        company_id: companyData.id,
      });

      console.log('Auth context: User creation result:', { userError });

      if (userError) throw userError;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const refreshProfile = async () => {
    if (!user) return;

    const { data: profileData, error: profileError } = await supabase
      .from('mt_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profileError) {
      setProfile(profileData);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
