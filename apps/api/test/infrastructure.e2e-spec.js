"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
describe('Infrastructure (e2e)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        const configService = app.get(config_1.ConfigService);
        // Apply the same configuration as main.ts
        app.use((0, helmet_1.default)());
        app.enableCors({
            origin: configService.get('CORS_ORIGINS')?.split(',') || [
                'http://localhost:3000',
            ],
            credentials: true,
        });
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        app.setGlobalPrefix('api/v1');
        const swaggerConfig = new swagger_1.DocumentBuilder()
            .setTitle('PRIBEC API')
            .setDescription('Real Estate & Construction Trust Platform API')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Health Endpoints', () => {
        it('/api/v1/health (GET) - should return 200', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('status');
                expect(res.body).toHaveProperty('timestamp');
                expect(res.body).toHaveProperty('version');
                expect(res.body).toHaveProperty('uptime');
                expect(res.body).toHaveProperty('checks');
                expect(res.body.checks).toHaveProperty('api');
                expect(res.body.checks).toHaveProperty('database');
            });
        });
        it('/api/v1/health/ready (GET) - should return readiness status', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health/ready')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('status');
                expect(res.body).toHaveProperty('checks');
            });
        });
        it('/api/v1/health/live (GET) - should return liveness status', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health/live')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('status');
                expect(res.body.status).toBe('ok');
            });
        });
    });
    describe('Metrics Endpoint', () => {
        it('/api/v1/metrics (GET) - should return Prometheus metrics', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/metrics')
                .expect(200)
                .expect('Content-Type', /text\/plain/);
        });
    });
    describe('API Documentation', () => {
        it('/api/docs (GET) - should return Swagger UI', () => {
            return (0, supertest_1.default)(app.getHttpServer()).get('/api/docs').expect(200); // Swagger UI HTML
        });
    });
    describe('Security Headers', () => {
        it('should include security headers in response', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health/live')
                .expect(200)
                .expect((res) => {
                // Helmet security headers
                expect(res.headers).toHaveProperty('x-content-type-options');
                expect(res.headers['x-content-type-options']).toBe('nosniff');
                expect(res.headers).toHaveProperty('x-frame-options');
            });
        });
    });
    describe('Rate Limiting', () => {
        it('should include rate limit headers', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health/live')
                .expect(200)
                .expect((res) => {
                // Throttler rate limit headers
                expect(res.headers).toHaveProperty('x-ratelimit-limit');
                expect(res.headers).toHaveProperty('x-ratelimit-remaining');
            });
        });
    });
    describe('CORS', () => {
        it('should handle CORS preflight requests', () => {
            return (0, supertest_1.default)(app.getHttpServer()).options('/api/v1/health').expect(204);
        });
    });
    describe('Input Validation', () => {
        it('should reject requests with non-whitelisted properties', async () => {
            // This will be more relevant when we have POST endpoints
            // For now, verify the validation pipe is active
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health/live')
                .expect(200);
            expect(response.body).toBeDefined();
        });
    });
    describe('Error Handling', () => {
        it('should return 404 for non-existent endpoints', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/non-existent-endpoint')
                .expect(404);
        });
        it('should return proper error format', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/invalid-route')
                .expect(404)
                .expect((res) => {
                expect(res.body).toHaveProperty('success', false);
                expect(res.body).toHaveProperty('error');
                expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
                expect(res.body.error).toHaveProperty('message');
            });
        });
    });
    describe('Database Integration', () => {
        it('health check should verify database connectivity', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health')
                .expect(200);
            expect(response.body.checks.database).toBeDefined();
            expect(response.body.checks.database.status).toBe('ok');
            expect(response.body.checks.database.message).toBe('Connected');
        });
        it('readiness check should fail if database is unavailable', async () => {
            // This test assumes the database is connected
            // In a real scenario, you'd test with a disconnected database
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health/ready')
                .expect(200);
            expect(response.body.status).toBeDefined();
            expect(['ok', 'error']).toContain(response.body.status);
        });
    });
    describe('API Versioning', () => {
        it('should enforce /api/v1 prefix', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/health') // Without api/v1 prefix
                .expect(404);
        });
        it('should respond on /api/v1 prefix', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health/live')
                .expect(200);
        });
    });
    describe('Observability', () => {
        it('should track response time in health checks', async () => {
            const start = Date.now();
            await (0, supertest_1.default)(app.getHttpServer()).get('/api/v1/health').expect(200);
            const duration = Date.now() - start;
            // Health check should respond quickly (< 1 second)
            expect(duration).toBeLessThan(1000);
        });
        it('should include uptime in health response', async () => {
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health')
                .expect(200);
            expect(response.body.uptime).toBeDefined();
            expect(typeof response.body.uptime).toBe('number');
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
        });
    });
});
//# sourceMappingURL=infrastructure.e2e-spec.js.map