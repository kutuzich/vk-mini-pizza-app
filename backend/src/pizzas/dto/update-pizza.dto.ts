import { PartialType } from '@nestjs/mapped-types';
import { CreatePizzaDto } from './create-pizza.dto.js';

export class UpdatePizzaDto extends PartialType(CreatePizzaDto) {}
