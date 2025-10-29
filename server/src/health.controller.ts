import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
    @Get('health')
    health() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'token-mint-backend',
            version: '1.0.0'
        };
    }

    @Get('healthz')
    healthz() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}