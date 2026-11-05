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
      cover: true,
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
      cover: true,
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
    select: {
      id: true,
      platform_id: true,
      url: true,
      created_at: true,
      social_platforms: {
        select: {
          id: true,
          name: true,
        },
      },
    },
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

    const users = await Promise.all(
      rawUsers.map(async ({ roles, ...rest }) => {
        const avatarUrl = rest.profiles?.avatar
          ? await storage.getPresignedUrl(BUCKETS.avatars, rest.profiles.avatar)
          : null;
        return {
          ...rest,
          role: roles.name,
          profiles: rest.profiles
            ? { ...rest.profiles, avatar_url: avatarUrl }
            : null,
        };
      })
    );

    return { users, total };
  },

  async findById(id: number) {
    const user = await prisma.users.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) return null;
    const avatarUrl = user.profiles?.avatar
      ? await storage.getPresignedUrl(BUCKETS.avatars, user.profiles.avatar)
      : null;
    const { roles, ...rest } = user;
    return {
      ...rest,
      role: roles.name,
      profiles: user.profiles
        ? { ...user.profiles, avatar_url: avatarUrl }
        : null,
    };
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
        email: true,
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
            cover: true,
            bio: true,
            location: true,
            gender: true,
            created_at: true,
            updated_at: true,
          },
        },
        roles: { select: { id: true, name: true } },
        user_socials: {
          select: {
            id: true,
            platform_id: true,
            url: true,
            created_at: true,
            social_platforms: {
              select: {
                id: true,
                name: true,
              },
            },
          },
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
            sub_domain: { select: { id: true, name: true } },
          },
          orderBy: { created_at: "desc" as const },
        },
        volunteer_applications: {
          select: {
            id: true,
            status: true,
            application_date: true,
            activity: {
              select: {
                id: true,
                title: true,
                description: true,
                location: true,
                start_date: true,
                end_date: true,
                status: true,
                organization: {
                  select: { id: true, name: true, location: true },
                },
                category: {
                  select: { id: true, name: true },
                },
              },
            },
          },
          orderBy: { application_date: "desc" as const },
        },
        completed_volunteering: {
          select: {
            id: true,
            completed_at: true,
            activity: {
              select: {
                id: true,
                title: true,
                description: true,
                location: true,
                start_date: true,
                end_date: true,
              },
            },
            organization: {
              select: { id: true, name: true },
            },
          },
          orderBy: { completed_at: "desc" as const },
        },
        organizations: {
          select: {
            id: true,
            name: true,
            description: true,
            website: true,
            email: true,
            phone: true,
            location: true,
            activities: {
              select: {
                id: true,
                title: true,
                description: true,
                location: true,
                start_date: true,
                end_date: true,
                status: true,
                is_active: true,
                required_volunteers: true,
                category: {
                  select: { id: true, name: true },
                },
                _count: {
                  select: {
                    applications: true,
                    completed: true,
                  },
                },
              },
              orderBy: { created_at: "desc" as const },
            },
          },
        },
      },
    });

    if (!user) return null;

    const avatarUrl = user.profiles?.avatar
      ? await storage.getPresignedUrl(BUCKETS.avatars, user.profiles.avatar)
      : null;
    const coverUrl = (user.profiles as any)?.cover
      ? await storage.getPresignedUrl(BUCKETS.covers, (user.profiles as any).cover)
      : null;

    const { roles, user_socials, ...rest } = user;
    return {
      ...rest,
      role: roles.name,
      user_socials: user_socials.map(mapUserSocial),
      profiles: user.profiles ? { ...(user.profiles as any), avatar_url: avatarUrl, cover_url: coverUrl } : null,
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
    const coverUrl = (user.profiles as any)?.cover
      ? await storage.getPresignedUrl(BUCKETS.covers, (user.profiles as any).cover)
      : null;

    const { roles, user_socials, ...rest } = user;
    return {
      ...rest,
      role: roles.name,
      user_socials: user_socials.map(mapUserSocial),
      profiles: {
        ...(user.profiles as any),
        avatar_url: avatarUrl,
        cover_url: coverUrl,
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
    const existing = await prisma.user_socials.findFirst({
      where: { user_id: userId, platform_id: platformId },
      select: { id: true },
    });
    if (existing) {
      const updated = await prisma.user_socials.update({
        where: { id: existing.id },
        data: { url },
        select: {
          id: true,
          url: true,
          created_at: true,
          social_platforms: { select: { id: true, name: true } },
        },
      });
      return {
        id: updated.id,
        platform: updated.social_platforms.name,
        url: updated.url,
        created_at: updated.created_at,
      };
    }
    const created = await prisma.user_socials.create({
      data: { user_id: userId, platform_id: platformId, url },
      select: {
        id: true,
        url: true,
        created_at: true,
        social_platforms: { select: { id: true, name: true } },
      },
    });
    return {
      id: created.id,
      platform: created.social_platforms.name,
      url: created.url,
      created_at: created.created_at,
    };
  },

  async removeSocial(userId: number, socialId: number) {
    const result = await prisma.user_socials.deleteMany({
      where: { id: socialId, user_id: userId },
    });
    return result.count;
  },

  async getUserAnalytics() {
    const [
      totalUsers,
      totalSocialLinks,
      usersWithSocial,
      usersWithoutSocial,
      platforms,
      usersWithAvatar,
      usersWithBio,
      usersWithPhone,
      usersWithEducation,
      usersWithSkills,
      usersWithLanguages,
      allUsersForCompleteness,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.user_socials.count(),
      prisma.users.count({ where: { user_socials: { some: {} } } }),
      prisma.users.count({ where: { user_socials: { none: {} } } }),
      prisma.social_platforms.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: { user_socials: true },
          },
        },
        orderBy: {
          user_socials: {
            _count: "desc",
          },
        },
      }),
      prisma.profiles.count({ where: { avatar: { not: null } } }),
      prisma.profiles.count({ where: { AND: [{ bio: { not: null } }, { bio: { not: "" } }] } }),
      prisma.profiles.count({ where: { AND: [{ phone: { not: null } }, { phone: { not: "" } }] } }),
      prisma.users.count({ where: { educations: { some: {} } } }),
      prisma.users.count({ where: { user_skills: { some: {} } } }),
      prisma.users.count({ where: { user_languages: { some: {} } } }),
      prisma.users.findMany({
        select: {
          id: true,
          roles: { select: { name: true } },
          profiles: { select: { avatar: true, bio: true, phone: true } },
          _count: {
            select: {
              educations: true,
              user_skills: true,
              user_languages: true,
              user_socials: true,
            },
          },
        },
      }),
    ]);

    const distribution = platforms.map((p) => ({
      id: p.id,
      platform: p.name,
      count: p._count.user_socials,
      percentage: totalSocialLinks > 0 ? Math.round((p._count.user_socials / totalSocialLinks) * 100) : 0,
    }));

    const mostUsedPlatforms = distribution
      .filter((p) => p.count > 0)
      .slice(0, 5);

    const calcUserPercentage = (u: (typeof allUsersForCompleteness)[0]) => {
      let score = 0;
      const maxScore = 7;
      if (u.profiles?.avatar) score++;
      if (u.profiles?.bio && u.profiles.bio.trim().length > 0) score++;
      if (u.profiles?.phone && u.profiles.phone.trim().length > 0) score++;
      if (u._count.educations > 0) score++;
      if (u._count.user_skills > 0) score++;
      if (u._count.user_languages > 0) score++;
      if (u._count.user_socials > 0) score++;
      return Math.round((score / maxScore) * 100);
    };

    let totalScore = 0;
    let beneficiaryScore = 0;
    let beneficiaryCount = 0;

    for (const u of allUsersForCompleteness) {
      const pct = calcUserPercentage(u);
      totalScore += pct;
      if (u.roles.name?.toLowerCase() === "beneficiary") {
        beneficiaryCount++;
        beneficiaryScore += pct;
      }
    }

    const averagePercentage =
      allUsersForCompleteness.length > 0
        ? Math.round(totalScore / allUsersForCompleteness.length)
        : 0;

    const beneficiaryAveragePercentage =
      beneficiaryCount > 0
        ? Math.round(beneficiaryScore / beneficiaryCount)
        : 0;

    return {
      socialMedia: {
        totalLinks: totalSocialLinks,
        usersWithSocial,
        usersWithoutSocial,
        distribution,
        mostUsedPlatforms,
      },
      profileCompleteness: {
        totalUsers,
        withProfilePicture: usersWithAvatar,
        withBio: usersWithBio,
        withContactInfo: usersWithPhone,
        withEducation: usersWithEducation,
        withSkills: usersWithSkills,
        withLanguages: usersWithLanguages,
        withSocialLinks: usersWithSocial,
        averagePercentage,
        beneficiaryCompleteness: {
          totalBeneficiaries: beneficiaryCount,
          averagePercentage: beneficiaryAveragePercentage,
        },
      },
    };
  },
};
