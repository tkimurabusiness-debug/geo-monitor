"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useMockAuth } from "./use-mock-auth";
import type { User, Organization } from "@geo-monitor/shared-types";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

/**
 * Main auth hook. Uses mock data when NEXT_PUBLIC_USE_MOCK=true,
 * otherwise connects to Supabase Auth.
 */
export function useAuth(): AuthState {
  const mock = useMockAuth();
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return;

    const supabase = createClient();

    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setIsLoading(false);
        return;
      }

      // Fetch user profile + organization
      const { data: profile } = await supabase
        .from("users")
        .select("*, organizations(*)")
        .eq("id", authUser.id)
        .single();

      if (profile) {
        const { organizations, ...userData } = profile as any;
        setUser(userData as User);
        setOrg(organizations as Organization);
      }
      setIsLoading(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setOrg(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (USE_MOCK) {
    return {
      ...mock,
      signOut: async () => {},
    };
  }

  return {
    user,
    organization: org,
    isLoading,
    isAuthenticated: !!user,
    signOut: async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
      setOrg(null);
    },
  };
}
