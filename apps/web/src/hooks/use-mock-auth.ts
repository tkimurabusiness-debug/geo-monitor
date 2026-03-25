import type { User, Organization } from "@geo-monitor/shared-types";

/** Mock auth data for development. Replaced with Supabase Auth in Step 2. */
const mockUser: User = {
  id: "usr_mock_001",
  email: "kimura@stockvalue.co.jp",
  full_name: "木村",
  organization_id: "org_mock_001",
  role: "owner",
  created_at: "2026-01-15T00:00:00Z",
};

const mockOrg: Organization = {
  id: "org_mock_001",
  name: "Stock Value",
  slug: "stock-value",
  plan: "pro",
  stripe_customer_id: null,
  created_at: "2026-01-15T00:00:00Z",
};

export function useMockAuth() {
  return {
    user: mockUser,
    organization: mockOrg,
    isLoading: false,
    isAuthenticated: true,
  };
}
