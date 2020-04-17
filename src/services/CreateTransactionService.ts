import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError('Valor de saída maior que o saldo total', 400);
    }

    const categoryRepository = getRepository(Category);

    const categorySearch = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!categorySearch) {
      const categoryCreate = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(categoryCreate);

      const transaction = transactionsRepository.create({
        title,
        value,
        type,
        category_id: categoryCreate.id,
      });

      await transactionsRepository.save(transaction);

      return transaction;
    }
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categorySearch.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
