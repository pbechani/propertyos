import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  InspectionRequestService,
  CreateInspectionRequestParams,
  InspectionRequestRow,
} from './inspection-request.service';
import { PrismaService } from '../database';

describe('InspectionRequestService', () => {
  let service: InspectionRequestService;
  let module: TestingModule;

  const mockPrisma = { $queryRaw: jest.fn() };

  const agentId   = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const propertyId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const otherId   = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  const baseParams: CreateInspectionRequestParams = {
    propertyId,
    requestedBy: agentId,
    inspectionTypes: ['general'],
    urgency: 'standard',
    preferredDate: '2026-04-01',
    preferredTime: '09:00',
    accessMethod: 'lockbox',
    notifyClient: true,
    sendReportTo: 'both',
  };

  const baseRow: InspectionRequestRow = {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    property_id: propertyId,
    requested_by: agentId,
    status: 'pending',
    inspection_types: ['general'],
    urgency: 'standard',
    preferred_date: '2026-04-01',
    preferred_time: '09:00',
    alternate_date: null,
    alternate_time: null,
    inspector_name: null,
    inspector_company: null,
    inspector_phone: null,
    inspector_email: null,
    access_method: 'lockbox',
    lockbox_code: null,
    contact_person: null,
    contact_phone: null,
    contact_email: null,
    areas_of_concern: null,
    special_instructions: null,
    notify_client: true,
    send_report_to: 'both',
    created_at: '2026-03-17T00:00:00.000Z',
    updated_at: '2026-03-17T00:00:00.000Z',
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        InspectionRequestService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(InspectionRequestService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ─── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('inserts and returns the new request when caller is the agent', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId, owner_id: null }]) // assertAccess
        .mockResolvedValueOnce([baseRow]);                               // INSERT

      const result = await service.create(baseParams);

      expect(result).toEqual(baseRow);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('inserts and returns the new request when caller is the owner', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: null, owner_id: agentId }])
        .mockResolvedValueOnce([baseRow]);

      const result = await service.create(baseParams);

      expect(result).toEqual(baseRow);
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // no property row

      await expect(service.create(baseParams)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException when caller has no access to the property', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
      ]);

      await expect(service.create(baseParams)).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('passes optional inspector fields through when provided', async () => {
      const params: CreateInspectionRequestParams = {
        ...baseParams,
        inspectorName: 'Jane Doe',
        inspectorCompany: 'Acme Inspections',
        inspectorPhone: '+27 11 000 0000',
        inspectorEmail: 'jane@acme.com',
        alternateDate: '2026-04-02',
        alternateTime: '10:00',
        areasOfConcern: 'Roof cracks',
        specialInstructions: 'Ring doorbell',
      };

      const enrichedRow: InspectionRequestRow = {
        ...baseRow,
        inspector_name: 'Jane Doe',
        inspector_company: 'Acme Inspections',
        inspector_phone: '+27 11 000 0000',
        inspector_email: 'jane@acme.com',
        alternate_date: '2026-04-02',
        alternate_time: '10:00',
        areas_of_concern: 'Roof cracks',
        special_instructions: 'Ring doorbell',
      };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId, owner_id: null }])
        .mockResolvedValueOnce([enrichedRow]);

      const result = await service.create(params);

      expect(result.inspector_name).toBe('Jane Doe');
      expect(result.inspector_company).toBe('Acme Inspections');
      expect(result.areas_of_concern).toBe('Roof cracks');
    });
  });

  // ─── list ──────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns all requests for the property', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId, owner_id: null }]) // assertAccess
        .mockResolvedValueOnce([baseRow]);                               // SELECT

      const result = await service.list(propertyId, agentId);

      expect(result).toEqual([baseRow]);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('returns an empty array when no requests exist', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: agentId, owner_id: null }])
        .mockResolvedValueOnce([]);

      const result = await service.list(propertyId, agentId);

      expect(result).toEqual([]);
    });

    it('throws NotFoundException for an unknown property', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.list(propertyId, agentId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when requester has no access', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { agent_id: otherId, owner_id: otherId },
      ]);

      await expect(service.list(propertyId, agentId)).rejects.toThrow(ForbiddenException);
    });
  });
});
