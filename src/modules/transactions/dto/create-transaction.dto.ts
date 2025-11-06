import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional } from 'class-validator';
import { TransactionType } from 'src/modules/schemas/transaction.schema';

export class CreateTransactionDto {
  @IsMongoId()
  @IsNotEmpty()
  billId: string;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}