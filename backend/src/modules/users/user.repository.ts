import prisma from "../../../framework/config/prisma.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";

const userSelect = {
  id: true,
  email: true,
  status: true,
  created_at: true,
  updated_at: true,
  profiles: {
    select: {
      id: true,
      first_name: true,
      last_name: true,
      phone: true,
      date_of_birth: true,
      gender: true,
      avatar: true,
      bio: true,
      location: true,
      created_at: true,
      updated_at: true,
    },
  },
  roles: {
    select: {
      id: true,
      name: true,
    },
  },
};

export const userSocialSelect = {
  id: true,
  platform_id: true,
  url: true,
  created_at: true,
  social_platforms: { select: { name: true } },
};

type UserSocialRow = {
  id: number;
  platform_id: number;
  url: string;
  created_at: Date | null;
  social_platforms: { name: string };
};

export const mapUserSocial = (row: UserSocialRow) => ({
  id: row.id,
  platform_id: row.platform_id,
  platform: row.social_platforms.name,
  url: row.url,
  created_at: row.created_at,
});

const profileSelect = {
  id: true,
  email: true,
  status: true,
  created_at: true,
  updated_at: true,
  profiles: {
    select: {
      id: true,
      first_name: true,
      last_name: true,
      phone: true,
      date_of_birth: true,
      gender: true,
      avatar: true,
      bio: true,
      location: true,
      created_at: true,
      updated_at: true,
    },
  },
  roles: {
    select: { id: true, name: true },
  },
  user_socials: {
    select: userSocialSelect,
    orderBy: { id: "asc" as const },
  },
};

export const userRepository = {
  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [rawUsers, total] = await Promise.all([
      prisma.users.findMany({
        select: userSelect,
        skip,
        take: limit,
        orderBy: { id: "asc" },
      }),
      prisma.users.count(),
    ]);

    const users = rawUsers.map(({ roles, ...rest }) => ({ ...rest, role: roles.name }));

    return { users, total };
  },

  async findById(id: number) {
    const user = await prisma.users.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) return null;
    const { roles, ...rest } = user;
    return { ...rest, role: roles.name };
  },

  async findByEmail(email: string) {
    return prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
  },

  async findRoleById(id: number) {
    return prisma.roles.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  },

  async update(
    id: number,
    data: {
      status?: "active" | "inactive" | "locked" | "pending";
      first_name?: string;
      last_name?: string;
      phone?: string | null;
      date_of_birth?: Date | null;
      gender?: string | null;
      bio?: string | null;
      location?: string | null;
      role_id?: number;
    },
  ) {
    const updateData: Record<string, unknown> = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.role_id !== undefined) {
      updateData.role_id = data.role_id;
    }

    const hasProfileFields =
      data.first_name !== undefined ||
      data.last_name !== undefined ||
      data.phone !== undefined ||
      data.date_of_birth !== undefined ||
      data.gender !== undefined ||
      data.bio !== undefined ||
      data.location !== undefined;

    if (hasProfileFields) {
      updateData.profiles = {
        update: {
          ...(data.first_name !== undefined && { first_name: data.first_name }),
          ...(data.last_name !== undefined && { last_name: data.last_name }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.date_of_birth !== undefined && { date_of_birth: data.date_of_birth }),
          ...(data.gender !== undefined && { gender: data.gender }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.location !== undefined && { location: data.location }),
        },
      };
    }

    const updated = await prisma.users.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });
    const { roles, ...rest } = updated;
    return { ...rest, role: roles.name };
  },

  async delete(id: number) {
    await prisma.users.delete({ where: { id } });
  },

  async updateAvatar(userId: number, avatarUrl: string) {
    const updated = await prisma.users.update({
      where: { id: userId },
      data: {
        profiles: {
          update: { avatar: avatarUrl },
        },
      },
      select: userSelect,
    });
    const { roles, ...rest } = updated;
    return { ...rest, role: roles.name };
  },

  // ─── Public profile (any authenticated user can view) ────
  async findPublicProfileById(id: number) {
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        created_at: true,
        profiles: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true,
            date_of_birth: true,
            avatar: true,
            bio: true,
            location: true,
            gender: true,
            created_at: true,
            updated_at: true,
          },
        },
        roles: { select: { id: true, name: true } },
        user_socials: {
          select: userSocialSelect,
          orderBy: { id: "asc" as const },
        },
        work_experiences: {
          select: {
            id: true,
            company: true,
            job_title: true,
            description: true,
            start_date: true,
            end_date: true,
            is_current: true,
          },
          orderBy: { start_date: "desc" as const },
        },
        educations: {
          select: {
            id: true,
            school: true,
            degree: true,
            field_of_study: true,
            description: true,
            start_date: true,
            end_date: true,
            is_current: true,
          },
          orderBy: { start_date: "desc" as const },
        },
        certifications: {
          select: {
            id: true,
            name: true,
            issuer: true,
            issue_date: true,
            expiry_date: true,
            credential_url: true,
            file_url: true,
          },
          orderBy: { issue_date: "desc" as const },
        },
        user_languages: {
          select: {
            id: true,
            proficiency: true,
            languages: { select: { id: true, name: true, code: true } },
          },
          orderBy: { id: "asc" as const },
        },
        user_skills: {
          select: {
            id: true,
            level: true,
            skills: {
              select: { id: true, name: true, description: true, status: true },
            },
          },
          orderBy: { id: "asc" as const },
        },
        projects: {
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            github_url: true,
            live_url: true,
            figma_url: true,
            created_at: true,
            domains: { select: { id: true, name: true } },
          },
          orderBy: { created_at: "desc" as const },
        },
      },
    });

    if (!user) return null;

    const avatarUrl = user.profiles?.avatar
      ? await storage.getPresignedUrl(BUCKETS.avatars, user.profiles.avatar)
      : null;

    const { roles, ...rest } = user;
    return {
      ...rest,
      role: roles.name,
      user_socials: user.user_socials.map(mapUserSocial),
      profiles: user.profiles ? { ...user.profiles, avatar_url: avatarUrl } : null,
    };
  },

  // ─── Profile with avatar URL + socials ───────────────────
  async findProfileById(id: number) {
    const user = await prisma.users.findUnique({
      where: { id },
      select: profileSelect,
    });

    if (!user) return null;

    const avatarUrl = user.profiles?.avatar
      ? await storage.getPresignedUrl(BUCKETS.avatars, user.profiles.avatar)
      : null;

    const { roles, ...rest } = user;
    return {
      ...rest,
      role: roles.name,
      user_socials: user.user_socials.map(mapUserSocial),
      profiles: {
        ...user.profiles,
        avatar_url: avatarUrl,
      },
    };
  },

  // ─── Activity (login history + devices + stats) ───────────
  async getActivity(userId: number) {
    const [loginHistory, devices, totalSuccess, totalFailed] = await Promise.all([
      prisma.login_history.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          ip_address: true,
          user_agent: true,
          login_at: true,
          success: true,
        },
        orderBy: { login_at: "desc" },
        take: 50,
      }),
      prisma.devices.findMany({
        where: { user_id: userId },
        select: {
          id: true,
          device_fingerprint: true,
          device_name: true,
          last_active: true,
          created_at: true,
        },
        orderBy: { last_active: "desc" },
      }),
      prisma.login_history.count({ where: { user_id: userId, success: true } }),
      prisma.login_history.count({ where: { user_id: userId, success: false } }),
    ]);

    return {
      loginHistory,
      devices,
      statistics: {
        totalLogins: totalSuccess + totalFailed,
        successfulLogins: totalSuccess,
        failedLogins: totalFailed,
      },
    };
  },

  // ─── Socials ─────────────────────────────────────────────
  async findAllPlatforms() {
    return prisma.social_platforms.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },

  async findPlatformById(id: number) {
    return prisma.social_platforms.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
  },

  async addSocial(userId: number, platformId: number, url: string) {
    const social = await prisma.user_socials.upsert({
      where: { user_id_platform_id: { user_id: userId, platform_id: platformId } },
      update: { url },
      create: { user_id: userId, platform_id: platformId, url },
      select: userSocialSelect,
    });
    return mapUserSocial(social);
  },

  async removeSocial(userId: number, socialId: number) {
    const result = await prisma.user_socials.deleteMany({
      where: { id: socialId, user_id: userId },
    });
    return result.count;
  },
};
