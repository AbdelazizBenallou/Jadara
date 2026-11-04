import { AppError } from "../../../framework/utils/AppError.js";
import { organizationRepository } from "./organizations.repository.js";
import type { UpdateOrganizationInput } from "./organizations.validation.js";
import { storage } from "../../../framework/utils/storage.js";
import { BUCKETS } from "../../../framework/config/minio.js";

async function avatarUrl(avatar: string | null): Promise<string | null> {
  if (!avatar) return null;
  return storage.getPresignedUrl(BUCKETS.avatars, avatar);
}

export const organizationService = {
  async getMine(userId: number) {
    const organization = await organizationRepository.findByOwner(userId);
    if (!organization) {
      throw new AppError("No organization found for this account", 404);
    }
    const logoUrl = await avatarUrl(organization.user?.profiles?.avatar ?? null);
    return {
      ...organization,
      logo_url: logoUrl,
    };
  },

  async getById(id: number) {
    const org = await organizationRepository.findById(id);
    if (!org) {
      throw new AppError("Organization not found", 404);
    }

    const logoUrl = await avatarUrl(org.user?.profiles?.avatar ?? null);
    const coverUrl = org.user?.profiles?.cover
      ? await storage.getPresignedUrl(BUCKETS.avatars, org.user.profiles.cover)
      : null;

    const mappedActivities = (org.activities || []).map((act: any) => ({
      id: act.id,
      title: act.title,
      description: act.description,
      location: act.location,
      start_date: act.start_date,
      end_date: act.end_date,
      required_volunteers: act.required_volunteers,
      capacity: act.required_volunteers,
      accepted_count: act._count?.applications ?? 0,
      available_places: Math.max(0, act.required_volunteers - (act._count?.applications ?? 0)),
      status: act.status,
      is_active: act.is_active,
      category: act.category ? { id: act.category.id, name: act.category.name } : null,
      required_skills: (act.required_skills || []).map((s: any) => ({
        id: s.skill?.id,
        name: s.skill?.name,
      })),
      created_at: act.created_at,
    }));

    return {
      id: org.id,
      name: org.name,
      description: org.description,
      website: org.website,
      email: org.email,
      phone: org.phone,
      location: org.location,
      created_at: org.created_at,
      logo_url: logoUrl,
      cover_url: coverUrl,
      socials: org.user?.user_socials || [],
      stats: {
        total_activities: org._count?.activities ?? 0,
        completed_volunteers: org._count?.user_completed_volunteering ?? 0,
      },
      activities: mappedActivities,
    };
  },

  async list(query: { page?: number; limit?: number; q?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    const { items, total } = await organizationRepository.list({
      page,
      limit,
      q: query.q,
    });
    const totalPages = Math.ceil(total / limit);

    const mapped = await Promise.all(
      items.map(async (org: any) => {
        const logoUrl = await avatarUrl(org.user?.profiles?.avatar ?? null);
        return {
          id: org.id,
          name: org.name,
          description: org.description,
          website: org.website,
          email: org.email,
          phone: org.phone,
          location: org.location,
          logo_url: logoUrl,
          total_published_activities: org._count?.activities ?? 0,
          created_at: org.created_at,
        };
      }),
    );

    return {
      items: mapped,
      meta: { total, page, limit, totalPages, nextCursor: page < totalPages ? page + 1 : null },
    };
  },

  async updateMine(userId: number, data: UpdateOrganizationInput) {
    const updated = await organizationRepository.updateOwned(userId, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.website !== undefined ? { website: data.website } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.location !== undefined ? { location: data.location } : {}),
    });

    if (!updated) {
      throw new AppError("No organization found for this account", 404);
    }
    return updated;
  },

  async removeMine(userId: number) {
    const deleted = await organizationRepository.deleteOwned(userId);
    if (!deleted) {
      throw new AppError("No organization found for this account", 404);
    }
    return { deleted: true };
  },
};
