import prisma from "../../../framework/config/prisma.js";

const documentSelect = {
  id: true,
  user_id: true,
  name: true,
  type: true,
  file_url: true,
  file_size: true,
  mime_type: true,
  status: true,
  created_at: true,
  updated_at: true,
};

export const documentRepository = {
  async findAll(userId: number, page: number, limit: number, type?: string) {
    const skip = (page - 1) * limit;
    const where = { user_id: userId, ...(type ? { type } : {}) };

    const [documents, total] = await Promise.all([
      prisma.documents.findMany({
        where,
        select: documentSelect,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      prisma.documents.count({ where }),
    ]);

    return { documents, total };
  },

  async findById(id: number) {
    return prisma.documents.findUnique({
      where: { id },
      select: documentSelect,
    });
  },

  async create(
    userId: number,
    data: {
      name: string;
      type: string;
      file_url: string;
      file_size: number;
      mime_type: string;
    },
  ) {
    return prisma.documents.create({
      data: {
        user_id: userId,
        name: data.name,
        type: data.type,
        file_url: data.file_url,
        file_size: data.file_size,
        mime_type: data.mime_type,
      },
      select: documentSelect,
    });
  },

  async delete(id: number) {
    await prisma.documents.delete({ where: { id } });
  },

  async countByUserId(userId: number) {
    return prisma.documents.count({ where: { user_id: userId } });
  },
};
