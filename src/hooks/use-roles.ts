import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export function useRoles() {
  const query = useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return { email: null as string | null, roles: [] as string[] };
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      if (error) throw error;
      return {
        email: userData.user.email ?? null,
        roles: (data ?? []).map((row) => row.role as string),
      };
    },
  });

  const roles = query.data?.roles ?? [];

  return {
    ...query,
    email: query.data?.email ?? null,
    roles,
    isAdmin: roles.includes("admin"),
    isGerant: roles.includes("gerant") || roles.includes("admin"),
    isStaff: roles.length > 0,
  };
}
