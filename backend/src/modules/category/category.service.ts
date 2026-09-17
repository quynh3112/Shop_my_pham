import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entity/category.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { uniqueSlug } from 'src/until/slug';
export interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  productCount: number;
  children: CategoryNode[];
}
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}
  private async slugIsTaken(slug: string, exceptId?: number) {
    const found = await this.categoryRepo.findOne({
      where: { slug },
      select: ['id'],
    });
    return found !== null && found.id !== exceptId;
  }
  async descendantCategoryIds(rootId: number): Promise<number[]> {
    const rows = await this.categoryRepo.find({ select: ['id', 'parentId'] });

    const childrenOf = new Map<number, number[]>();
    for (const row of rows) {
      if (row.parentId !== null) {
        const siblings = childrenOf.get(row.parentId) ?? [];
        siblings.push(row.id);
        childrenOf.set(row.parentId, siblings);
      }
    }

    const collected: number[] = [];
    const stack = [rootId];
    while (stack.length > 0) {
      const id = stack.pop()!;
      collected.push(id);
      stack.push(...(childrenOf.get(id) ?? []));
    }
    return collected;
  }
  private async assertParentIsValid(parentId: number, selfId?: number) {
    const parent = await this.categoryRepo.findOne({
      where: { id: parentId },
      select: ['id'],
    });
    if (!parent) {
      throw new BadRequestException('Danh mục cha không tồn tại');
    }
    if (selfId !== undefined) {
      const forbidden = await this.descendantCategoryIds(selfId);
      if (forbidden.includes(parentId)) {
        throw new BadRequestException(
          'Không thể đặt danh mục này nằm dưới chính nó hoặc dưới danh mục con của nó.',
        );
      }
    }
  }
  async create(data: CreateCategoryDto) {
    if (data.parentId != null) {
      await this.assertParentIsValid(data.parentId);
    }
    const category = this.categoryRepo.create({
      name: data.name,
      slug: await uniqueSlug(data.name, (slug) => this.slugIsTaken(slug)),
      parentId: data.parentId ?? null,
      sortOrder: data.sortOrder ?? 0,
    });
    return this.categoryRepo.save(category);
  }
  async updateCategory(id: number, data: UpdateCategoryDto) {
    const existing = await this.categoryRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('Không tìm thấy danh mục.');
    if (data.parentId != null) {
      await this.assertParentIsValid(data.parentId, id);
    }
    if (data.name !== undefined) {
      existing.name = data.name;
      existing.slug =
        data.name === existing.name
          ? existing.slug
          : await uniqueSlug(data.name, (slug) => this.slugIsTaken(slug, id));
    }
    if (data.parentId !== undefined) {
      existing.parentId = data.parentId;
    }
    if (data.sortOrder !== undefined) {
      existing.sortOrder = data.sortOrder;
    }
    return this.categoryRepo.save(existing);
  }
  async listCategoryTree(): Promise<CategoryNode[]> {
    const rows = await this.categoryRepo
      .createQueryBuilder('category')
      .loadRelationCountAndMap('category.productCount', 'category.products')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getMany();
    const nodes = new Map<number, CategoryNode>(
      rows.map((row) => [
        row.id,
        {
          id: row.id,
          name: row.name,
          slug: row.slug,
          sortOrder: row.sortOrder,
          productCount: (row as any).productCount,
          children: [],
        },
      ]),
    );
    const roots:CategoryNode[]=[]
    for(const row of rows){
        const node=nodes.get(row.id)!;
        if(row.parentId==null){
            roots.push(node);

        }
        else{
            nodes.get(row.parentId)?.children.push(node)
        }
    }
    return roots
  }
}
