import type { User } from '@repo/database';
import { prisma } from '@repo/database';
import type { IUserRepository } from '../interfaces/repositories/IUserRepository';

export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }
}
