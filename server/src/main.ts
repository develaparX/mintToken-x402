import { NestFactory } from '@nestjs/core';
import { MintModule } from './mint.module';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(MintModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3001);
  console.log(`Backend running on http://localhost:${process.env.PORT || 3001}`);
}

bootstrap();