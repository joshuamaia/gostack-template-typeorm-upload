import path from 'path';
import fs from 'fs';
import csv from 'csv-parse';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  fileName: string;
}

interface TransactionCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  async execute({ fileName }: Request): Promise<Transaction[]> {
    const pathFile = path.join(uploadConfig.directory, fileName);
    const transactions: Transaction[] = [];
    const csvTransactions: TransactionCSV[] = [];
    const pathFileExists = await fs.promises.stat(pathFile);
    if (!pathFileExists) {
      throw new AppError('Arquivo não existe', 404);
    }

    const stream = fs
      .createReadStream(pathFile)
      .on('error', () => {
        throw new AppError('Error import File');
      })

      .pipe(csv({ columns: true, trim: true }))
      .on('data', async row => {
        csvTransactions.push(row);
      });

    await new Promise(resolver => {
      fs.promises.unlink(pathFile);
      stream.on('end', resolver);
    });

    const createTransactionService = new CreateTransactionService();

    for (const item of csvTransactions) {
      const transaction = await createTransactionService.execute(item);

      transactions.push(transaction);
    }

    return transactions;
  }
}

export default ImportTransactionsService;
