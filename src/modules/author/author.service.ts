import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, count, ilike, and, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider.js';
import type { DrizzleDB } from '../../database/drizzle.provider.js';
import { authors } from '../../database/schema/authors.js';
import { researchAuthors } from '../../database/schema/research-authors.js';
import { researches } from '../../database/schema/researches.js';

@Injectable()
export class AuthorService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async findAll(page: number, limit: number, search?: string) {
    const offset = (page - 1) * limit;
    const conditions = search ? ilike(authors.name, `%${search}%`) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: authors.id,
          name: authors.name,
          email: authors.email,
          paperCount: count(researchAuthors.researchId),
        })
        .from(authors)
        .leftJoin(researchAuthors, eq(authors.id, researchAuthors.authorId))
        .where(conditions)
        .groupBy(authors.id)
        .orderBy(authors.name)
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(authors).where(conditions),
    ]);

    return {
      data,
      meta: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const [author] = await this.db
      .select({
        id: authors.id,
        name: authors.name,
        email: authors.email,
        paperCount: count(researchAuthors.researchId),
      })
      .from(authors)
      .leftJoin(researchAuthors, eq(authors.id, researchAuthors.authorId))
      .where(eq(authors.id, id))
      .groupBy(authors.id);

    if (!author) throw new NotFoundException('Author not found');
    return author;
  }

  async findPapers(id: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    const author = await this.db.query.authors.findFirst({
      where: eq(authors.id, id),
    });
    if (!author) throw new NotFoundException('Author not found');

    // Get IDs of approved papers this author is linked to
    const linked = await this.db
      .select({ researchId: researchAuthors.researchId })
      .from(researchAuthors)
      .innerJoin(researches, eq(researchAuthors.researchId, researches.id))
      .where(
        and(
          eq(researchAuthors.authorId, id),
          eq(researches.status, 'approved'),
        ),
      );

    const total = linked.length;
    if (!total) return { data: [], meta: { total, page, totalPages: 0 } };

    const ids = linked.map((r) => r.researchId);

    const data = await this.db.query.researches.findMany({
      where: inArray(researches.id, ids),
      with: {
        researchAuthors: { with: { author: true } },
        researchCategories: { with: { category: true } },
      },
      limit,
      offset,
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });

    return {
      data: data.map((r) => ({
        ...r,
        authors: r.researchAuthors.map((ra) => ra.author),
        categories: r.researchCategories.map((rc) => rc.category),
        researchAuthors: undefined,
        researchCategories: undefined,
      })),
      meta: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }
}
