import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface Request {
  categoryTitle: string;
}

export default class CategoryService {
  public async execute({ categoryTitle }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);

    const categorySearch = await categoryRepository.findOne({
      where: {
        title: categoryTitle,
      },
    });

    if (!categorySearch) {
      const categoryCreate = categoryRepository.create({
        title: categoryTitle,
      });

      await categoryRepository.save(categoryCreate);

      return categoryCreate;
    }

    return categorySearch;
  }
}
