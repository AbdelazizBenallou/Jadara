import prisma from "../../../framework/config/prisma.js";

export const dashboardRepository = {
  async getSummary() {
    const [
      totalUsers,
      totalDemandsPending,
      totalProjectsSubmitted,
      totalActivitiesPending,
      totalOrganizations,
      totalApplications,
      usersByRoleRaw,
      recentUsers,
      pendingRegistrationDemands,
      pendingActivities,
      pendingProjects,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.demands.count({ where: { status: "pending" } }),
      prisma.projects.count({ where: { status: "submitted" } }),
      prisma.volunteering_activities.count({ where: { status: "pending_review" } }),
      prisma.organizations.count(),
      prisma.volunteer_applications.count(),
      prisma.roles.findMany({
        select: {
          name: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.users.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          email: true,
          created_at: true,
          roles: { select: { name: true } },
          profiles: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
      prisma.demands.findMany({
        where: { status: "pending" },
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          applicant_email: true,
          applicant_first_name: true,
          applicant_last_name: true,
          created_at: true,
          roles: { select: { name: true } },
          applicant: {
            select: {
              email: true,
              profiles: {
                select: { first_name: true, last_name: true },
              },
            },
          },
        },
      }),
      prisma.volunteering_activities.findMany({
        where: { status: "pending_review" },
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          title: true,
          created_at: true,
          organization: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.projects.findMany({
        where: { status: "submitted" },
        take: 5,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          created_at: true,
          users: {
            select: {
              email: true,
              profiles: {
                select: { first_name: true, last_name: true },
              },
            },
          },
        },
      }),
    ]);

    return {
      counts: {
        totalUsers,
        totalDemandsPending,
        totalProjectsSubmitted,
        totalActivitiesPending,
        totalOrganizations,
        totalApplications,
      },
      usersByRole: usersByRoleRaw.map((r) => ({
        role: r.name,
        count: r._count.users,
      })),
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.roles.name,
        fullName:
          u.profiles?.first_name || u.profiles?.last_name
            ? `${u.profiles?.first_name || ""} ${u.profiles?.last_name || ""}`.trim()
            : null,
        createdAt: u.created_at,
      })),
      pendingRegistrationDemands: pendingRegistrationDemands.map((d) => {
        const firstName = d.applicant?.profiles?.first_name || d.applicant_first_name || "";
        const lastName = d.applicant?.profiles?.last_name || d.applicant_last_name || "";
        const name = `${firstName} ${lastName}`.trim();
        return {
          id: d.id,
          applicant: {
            name: name || null,
            email: d.applicant?.email || d.applicant_email || null,
          },
          requestedRole: d.roles.name,
          createdAt: d.created_at,
        };
      }),
      pendingActivities: pendingActivities.map((a: any) => ({
        id: a.id,
        title: a.title,
        organization: a.organization?.name || null,
        createdAt: a.created_at,
      })),
      pendingProjects: pendingProjects.map((p) => ({
        id: p.id,
        title: p.title,
        owner: (() => {
          const f = p.users?.profiles?.first_name || "";
          const l = p.users?.profiles?.last_name || "";
          const n = `${f} ${l}`.trim();
          return n || p.users?.email || null;
        })(),
        status: p.status,
        createdAt: p.created_at,
      })),
    };
  },
};
