import {
  IsString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNumber()
  pizzaId: number;

  @IsNumber()
  size: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  price: number;
}

export class CreateOrderDto {
  @IsString()
  customerName: string;

  @IsString()
  customerPhone: string;

  @IsString()
  address: string;

  @IsNumber()
  @IsOptional()
  vkUserId?: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  deliveryDate?: string;

  @IsString()
  @IsOptional()
  timeSlot?: string;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
