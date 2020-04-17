import path from 'path';
import fs from 'fs';
// import csv from 'csv-parse';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import AppError from '../errors/AppError';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  fileName: string;
}

class ImportTransactionsService {
  private transactions: Transaction[] = [];

  private isFirst = true;

  async execute({ fileName }: Request): Promise<Transaction[]> {
    const pathFile = path.join(uploadConfig.directory, fileName);

    const pathFileExists = await fs.promises.stat(pathFile);
    if (!pathFileExists) {
      throw new AppError('Arquivo não existe', 404);
    }

    const csvFile = fs.readFileSync(pathFile, 'utf-8');
    const csvFileSplit = csvFile.split('\n');

    await this.processCsv(csvFileSplit);
    await this.sleep(2000);

    return this.transactions;
  }

  private async sleep(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async processCsv(csvSplit: string[]): Promise<void> {
    const createTransactionService = new CreateTransactionService();

    csvSplit.map(async r => {
      if (this.isFirst) {
        this.isFirst = false;
      } else {
        const row = r.split(',');

        if (row.length === 4) {
          const title = row[0];
          const type = row[1];
          const value = Number(row[2]);
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
    });
  }
}

export default ImportTransactionsService;
