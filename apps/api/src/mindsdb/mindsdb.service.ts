import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ContractorRiskResult,
  MaterialForecastRow,
  ProjectDelayResult,
  PropertyValuationQueryDto,
  PropertyValuationResult,
} from './dto/prediction-query.dto';

// ─────────────────────────────────────────────────────────────────────────────
// MindsDB Service
//
// Thin wrapper over the MindsDB HTTP REST API (POST /api/sql/query).
// MindsDB exposes a SQL interface over HTTP — we build safe parameterised-style
// queries using validated, typed inputs rather than raw user strings.
//
// All prediction methods:
//   1. Accept strongly-typed DTOs (no raw strings from callers)
//   2. Validate / sanitise each parameter before interpolating
//   3. Return structured result interfaces
//
// The service degrades gracefully when MindsDB is unavailable — callers can
// catch ServiceUnavailableException and fall back to rule-based logic.
//
// Configuration:
//   MINDSDB_URL          Base URL, default http://localhost:47334
//   MINDSDB_TIMEOUT_MS   Request timeout in ms, default 30000
// ─────────────────────────────────────────────────────────────────────────────

/** Allowlist of entity types accepted by scoreContractorRisk */
const ALLOWED_RISK_LEVELS = new Set(['low', 'medium', 'high', 'critical']);

@Injectable()
export class MindsDBService implements OnModuleInit {
  private readonly logger = new Logger(MindsDBService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private available = false;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = config.get<string>('MINDSDB_URL', 'http://localhost:47334');
    this.timeoutMs = config.get<number>('MINDSDB_TIMEOUT_MS', 30_000);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    try {
      await this.checkHealth();
      await this.ensureDataSource();
      this.available = true;
      this.logger.log('MindsDB connected — predictive ML layer active');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`MindsDB unavailable at startup (${msg}) — predictions disabled`);
    }
  }

  // ── Internal HTTP helpers ─────────────────────────────────────────────────

  /**
   * Execute a SQL statement against MindsDB over HTTP.
   * Returns the rows array from MindsDB response.
   * Throws on non-2xx or MindsDB-level errors.
   */
  private async query<T extends Record<string, unknown>>(sql: string): Promise<T[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/sql/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`MindsDB HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      type?: string;
      data?: T[];
      error_code?: number;
      error_message?: string;
    };

    if (json.error_code) {
      throw new Error(`MindsDB SQL error ${json.error_code}: ${json.error_message ?? ''}`);
    }

    return json.data ?? [];
  }

  /** Check MindsDB /api/status — throws if service is down. */
  private async checkHealth(): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5_000);
    try {
      const res = await fetch(`${this.baseUrl}/api/status`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Ensure the pribec_postgres data source is registered in MindsDB.
   * Uses CREATE DATABASE IF NOT EXISTS — idempotent.
   */
  private async ensureDataSource(): Promise<void> {
    const dbHost = 'postgres'; // internal docker network hostname
    await this.query(`
      CREATE DATABASE IF NOT EXISTS pribec_postgres
      WITH ENGINE = 'postgres',
      PARAMETERS = {
        "host":     "${dbHost}",
        "port":     5432,
        "database": "pribec_dev",
        "user":     "pribec",
        "password": "pribec_dev_password",
        "schema":   "analytics"
      }
    `);
  }

  /** Guard used by public methods — throws ServiceUnavailableException if MindsDB is down. */
  private assertAvailable(): void {
    if (!this.available) {
      throw new ServiceUnavailableException(
        'MindsDB predictive layer is not available',
      );
    }
  }

  // ── Sanitisation helpers ──────────────────────────────────────────────────

  /** Reject strings that could break out of a SQL literal context. */
  private sanitiseString(value: string, fieldName: string): string {
    if (typeof value !== 'string' || value.length > 200) {
      throw new Error(`MindsDB: invalid ${fieldName}`);
    }
    // Only allow alphanumeric, space, hyphen, underscore, dot
    if (!/^[\w\s.\-]+$/.test(value)) {
      throw new Error(`MindsDB: ${fieldName} contains disallowed characters`);
    }
    return value.replace(/'/g, "''"); // SQL single-quote escape
  }

  private sanitiseUuid(value: string, fieldName: string): string {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      throw new Error(`MindsDB: ${fieldName} must be a valid UUID`);
    }
    return value;
  }

  private sanitiseNumber(value: number, fieldName: string): number {
    if (typeof value !== 'number' || !isFinite(value)) {
      throw new Error(`MindsDB: ${fieldName} must be a finite number`);
    }
    return value;
  }

  // ── Public prediction methods ─────────────────────────────────────────────

  /**
   * Predict the market value of a property given its attributes.
   * Backed by mindsdb.property_valuation (LightWood regression).
   */
  async predictPropertyValue(
    params: PropertyValuationQueryDto,
  ): Promise<PropertyValuationResult> {
    this.assertAvailable();

    const propType = this.sanitiseString(params.propertyType, 'propertyType');
    const bedrooms = this.sanitiseNumber(params.bedrooms, 'bedrooms');
    const bathrooms = this.sanitiseNumber(params.bathrooms, 'bathrooms');
    const floorArea = this.sanitiseNumber(params.floorAreaSqm, 'floorAreaSqm');
    const lat = this.sanitiseNumber(params.latitude, 'latitude');
    const lng = this.sanitiseNumber(params.longitude, 'longitude');

    const rows = await this.query<{
      asking_price: number;
      asking_price_explain: string;
    }>(`
      SELECT asking_price, asking_price_explain
      FROM mindsdb.property_valuation
      WHERE property_type  = '${propType}'
        AND bedrooms        = ${bedrooms}
        AND bathrooms       = ${bathrooms}
        AND floor_area_sqm  = ${floorArea}
        AND latitude        = ${lat}
        AND longitude       = ${lng}
    `);

    if (!rows.length) {
      throw new ServiceUnavailableException('MindsDB returned no prediction');
    }

    const row = rows[0];
    let confidence = 0;
    try {
      const explain = JSON.parse(row.asking_price_explain ?? '{}') as {
        confidence?: number;
      };
      confidence = explain.confidence ?? 0;
    } catch {
      /* ignore parse errors — confidence stays 0 */
    }

    return { predictedPrice: Number(row.asking_price), confidence };
  }

  /**
   * Classify a contractor's risk level based on their performance features.
   * Reads the analytics feature view then joins through the MindDB model.
   */
  async scoreContractorRisk(contractorId: string): Promise<ContractorRiskResult> {
    this.assertAvailable();
    const id = this.sanitiseUuid(contractorId, 'contractorId');

    const rows = await this.query<{
      risk_level: string;
      risk_level_explain: string;
    }>(`
      SELECT cr.risk_level, cr.risk_level_explain
      FROM mindsdb.contractor_risk AS cr
      JOIN pribec_postgres.contractor_risk_features AS f
        ON f.contractor_id = '${id}'
      LIMIT 1
    `);

    if (!rows.length) {
      throw new ServiceUnavailableException(
        `No contractor risk features found for ${id}`,
      );
    }

    const row = rows[0];
    const level = row.risk_level?.toLowerCase() ?? 'medium';
    const riskLevel = ALLOWED_RISK_LEVELS.has(level)
      ? (level as ContractorRiskResult['riskLevel'])
      : 'medium';

    let confidence = 0;
    try {
      const explain = JSON.parse(row.risk_level_explain ?? '{}') as {
        confidence?: number;
      };
      confidence = explain.confidence ?? 0;
    } catch {
      /* ignore */
    }

    return { riskLevel, confidence };
  }

  /**
   * Forecast material unit price for the next 7 periods.
   * Backed by mindsdb.material_price_forecast (statsforecast time-series).
   */
  async forecastMaterialPrice(
    materialId: string,
    region: string,
  ): Promise<MaterialForecastRow[]> {
    this.assertAvailable();
    const id = this.sanitiseUuid(materialId, 'materialId');
    const safeRegion = this.sanitiseString(region, 'region');

    const rows = await this.query<{
      recorded_at: string;
      unit_price: number;
    }>(`
      SELECT recorded_at, unit_price
      FROM mindsdb.material_price_forecast
      WHERE material_id = '${id}'
        AND region       = '${safeRegion}'
    `);

    return rows.map((r) => ({
      recordedAt: r.recorded_at,
      unitPrice: Number(r.unit_price),
    }));
  }

  /**
   * Predict whether the given construction project is at risk of delay.
   * Backed by mindsdb.project_delay_risk (LightWood binary classification).
   */
  async predictProjectDelay(projectId: string): Promise<ProjectDelayResult> {
    this.assertAvailable();
    const id = this.sanitiseUuid(projectId, 'projectId');

    const rows = await this.query<{
      delayed: number;
      delayed_explain: string;
    }>(`
      SELECT d.delayed, d.delayed_explain
      FROM mindsdb.project_delay_risk AS d
      JOIN pribec_postgres.project_health_features AS f
        ON f.project_id = '${id}'
      LIMIT 1
    `);

    if (!rows.length) {
      throw new ServiceUnavailableException(
        `No project health features found for ${id}`,
      );
    }

    const row = rows[0];
    let confidence = 0;
    try {
      const explain = JSON.parse(row.delayed_explain ?? '{}') as {
        confidence?: number;
      };
      confidence = explain.confidence ?? 0;
    } catch {
      /* ignore */
    }

    return { delayed: row.delayed === 1, confidence };
  }

  // ── Status helper for health endpoint ────────────────────────────────────

  isAvailable(): boolean {
    return this.available;
  }
}
