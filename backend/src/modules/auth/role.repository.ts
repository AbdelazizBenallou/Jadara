import prisma from "../../../framework/config/prisma.js";

export const roleRepository = {
  async findByName(name: string) {
    return prisma.roles.findUnique({ where: { name } });
  },

  async findById(id: number) {
    return prisma.roles.findUnique({ where: { id } });
  },

  async findAll() {
    return prisma.roles.findMany({
      include: { role_permissions: { include: { permissions: true } } },
    });
  },
};
