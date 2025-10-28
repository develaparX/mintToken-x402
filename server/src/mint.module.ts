import { Module } from '@nestjs/common';
import { MintController } from './mint.controller';
import { MintService } from './mint.service';
import { HealthController } from './health.controller';

@Module({
    controllers: [MintController, HealthController],
    providers: [MintService],
})
export class MintModule { }