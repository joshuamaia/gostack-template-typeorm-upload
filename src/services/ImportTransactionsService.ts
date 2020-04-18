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

class ImportTransactionsService {
  private transactions: Transaction[] = [];

  async execute({ fileName }: Request): Promise<Transaction[]> {
    const pathFile = path.join(uploadConfig.directory, fileName);

    const pathFileExists = await fs.promises.stat(pathFile);
    if (!pathFileExists) {
      throw new AppError('Arquivo não existe', 404);
    }

    const file = fs.readFileSync(pathFile, 'utf8');

    const fileCsvSplit = file.split('\n');
    const createTransactionService = new CreateTransactionService();

    let isFirst = true;

    for (const fileCsv of fileCsvSplit) {
      if (isFirst) {
        isFirst = false;
        continue;
      }
      const row = fileCsv.split(',');

      if (row.length === 4) {
        const title = row[0];
        const type = row[1];
        const valueString = row[2];
        const value = Number(valueString.trim());
        const category = row[3];
        const transaction = await createTransactionService.execute({
          title: title.trim(),
          value,
          type: type.trim() === 'income' ? 'income' : 'outcome',
          category: category.trim(),
        });

        this.transactions.push(transaction);
      }
    }

    return this.transactions;
  }

  async processCsv(pathFile: string): Promise<void> {
    let isFirst = true;
    const createTransactionService = new CreateTransactionService();

    fs.createReadStream(pathFile)
      .pipe(csv())
      .on('data', async row => {
        if (isFirst) {
          isFirst = false;
        } else {
          console.log(row);
          const title = row[0];
          const type = row[1];
          const valueString = row[2];
          const value = Number(valueString.trim());
          const category = row[3];
          const transaction = await createTransactionService.execute({
            title: title.trim(),
            value,
            type: type.trim() === 'income' ? 'income' : 'outcome',
            category: category.trim(),
          });

          this.transactions.push(transaction);

          console.log(this.transactions);
        }
      });
  }
}

export default ImportTransactionsService;
