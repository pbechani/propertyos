"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
describe('Health Endpoints (e2e)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        // Apply same configuration as main.ts
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('/api/v1/health (GET)', () => {
        it('should return 200 and health status', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('status');
                expect(res.body).toHaveProperty('timestamp');
                expect(res.body).toHaveProperty('uptime');
                expect(res.body).toHaveProperty('version');
                expect(res.body).toHaveProperty('checks');
                expect(res.body.checks).toHaveProperty('api');
                expect(res.body.checks).toHaveProperty('database');
            });
        });
        it('should have healthy API status', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health')
                .expect((res) => {
                expect(res.body.checks.api.status).toBe('ok');
            });
        });
    });
    describe('/api/v1/health/ready (GET)', () => {
        it('should return 200 when ready', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health/ready')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('status');
                expect(res.body).toHaveProperty('checks');
            });
        });
    });
    describe('/api/v1/health/live (GET)', () => {
        it('should return 200 when alive', () => {
            return (0, supertest_1.default)(app.getHttpServer())
                .get('/api/v1/health/live')
                .expect(200)
                .expect((res) => {
                expect(res.body).toHaveProperty('status', 'ok');
            });
        });
    });
});
//# sourceMappingURL=health.e2e-spec.js.map