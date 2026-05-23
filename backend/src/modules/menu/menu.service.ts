import { prisma } from "../../lib/prisma";

export class MenuError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "MenuError";
  }
}

type CreateMenuItemInput = {
  name: string;
  price: number;
  category: string;
};

type UpdateMenuItemInput = Partial<CreateMenuItemInput>;

const findDuplicateByName = async (name: string, excludeId?: string) => {
  const normalizedName = name.trim().toLowerCase();
  const menuItems = await prisma.menuItem.findMany({
    select: {
      id: true,
      name: true
    }
  });

  return menuItems.find((item) => {
    if (excludeId && item.id === excludeId) {
      return false;
    }

    return item.name.trim().toLowerCase() === normalizedName;
  });
};

export const menuService = {
  async listMenuItems() {
    return prisma.menuItem.findMany({
      orderBy: {
        name: "asc"
      }
    });
  },

  async createMenuItem(input: CreateMenuItemInput) {
    const duplicate = await findDuplicateByName(input.name);

    if (duplicate) {
      throw new MenuError("Menu item name already exists", 400);
    }

    return prisma.menuItem.create({
      data: input
    });
  },

  async updateMenuItem(id: string, input: UpdateMenuItemInput) {
    const existingItem = await prisma.menuItem.findUnique({
      where: { id }
    });

    if (!existingItem) {
      throw new MenuError("Menu item not found", 404);
    }

    if (input.name) {
      const duplicate = await findDuplicateByName(input.name, id);

      if (duplicate) {
        throw new MenuError("Menu item name already exists", 400);
      }
    }

    return prisma.menuItem.update({
      where: { id },
      data: input
    });
  },

  async deleteMenuItem(id: string) {
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        orders: {
          take: 1
        }
      }
    });

    if (!existingItem) {
      throw new MenuError("Menu item not found", 404);
    }

    if (existingItem.orders.length > 0) {
      throw new MenuError("Menu item cannot be deleted because it is used by orders", 400);
    }

    await prisma.menuItem.delete({
      where: { id }
    });
  }
};
