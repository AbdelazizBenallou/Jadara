import type { Role } from "@/constants/roles";
import type { User, UserPayload } from "@/types/user";

export function normalizeUser(data: UserPayload): User {
  const profileData = (data.profiles ||
    data.profile ||
    null) as User["profile"];

  const name = profileData?.first_name
    ? `${profileData.first_name} ${profileData.last_name || ""}`.trim()
    : data.email.split("@")[0];

  return {
    id: data.id,
    email: data.email,
    role: (data.role || "beneficiary").toLowerCase() as Role,
    status: data.status,
    profile: profileData,
    user_socials: data.user_socials || [],
    name,
  };
}
