import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import {
  NoteService,
  CreateNoteParams,
  NoteRow,
} from './note.service';
import { PrismaService } from '../database';

describe('NoteService', () => {
  let service: NoteService;
  let module: TestingModule;

  const mockPrisma = { $queryRaw: jest.fn() };

  const userId     = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const propertyId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const otherId    = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const noteId     = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  const baseCreateParams: CreateNoteParams = {
    propertyId,
    createdBy: userId,
    title: 'Seller Motivation',
    content: 'Seller is motivated to close quickly due to relocation.',
    category: 'important',
    isPinned: false,
    visibility: 'private',
    tags: ['motivated-seller'],
    reminder: null,
  };

  const baseRow: NoteRow = {
    id: noteId,
    property_id: propertyId,
    created_by: userId,
    title: 'Seller Motivation',
    content: 'Seller is motivated to close quickly due to relocation.',
    category: 'important',
    is_pinned: false,
    visibility: 'private',
    tags: ['motivated-seller'],
    reminder: null,
    created_at: '2026-03-17T00:00:00.000Z',
    updated_at: '2026-03-17T00:00:00.000Z',
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        NoteService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(NoteService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('inserts and returns the row when caller is the agent', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }]) // assertAccess
        .mockResolvedValueOnce([baseRow]);                              // INSERT

      const result = await service.create(baseCreateParams);

      expect(result).toEqual(baseRow);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('inserts and returns the row when caller is the owner', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: null, owner_id: userId }])
        .mockResolvedValueOnce([baseRow]);

      const result = await service.create(baseCreateParams);

      expect(result).toEqual(baseRow);
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.create(baseCreateParams)).rejects.toThrow(NotFoundException);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException when caller has no access to the property', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
      ]);

      await expect(service.create(baseCreateParams)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── list ─────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns notes for the property when caller has access', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }])
        .mockResolvedValueOnce([baseRow]);

      const result = await service.list(propertyId, userId);

      expect(result).toEqual([baseRow]);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('returns empty array when no notes exist', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }])
        .mockResolvedValueOnce([]);

      const result = await service.list(propertyId, userId);

      expect(result).toEqual([]);
    });

    it('throws ForbiddenException when caller has no access', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
      ]);

      await expect(service.list(propertyId, userId)).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates and returns the updated row', async () => {
      const updatedRow = { ...baseRow, title: 'Updated Title', is_pinned: true };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseRow])                                           // SELECT existing
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }])             // assertAccess
        .mockResolvedValueOnce([updatedRow]);                                       // UPDATE

      const result = await service.update(noteId, userId, { title: 'Updated Title', isPinned: true });

      expect(result).toEqual(updatedRow);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('throws NotFoundException when note does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.update(noteId, userId, { title: 'X' })).rejects.toThrow(NotFoundException);
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('throws ForbiddenException when caller has no access to the property', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseRow])
        .mockResolvedValueOnce([
          { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
        ]);

      await expect(service.update(noteId, userId, { title: 'X' }))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ─── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes the note when caller has access', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseRow])                                // SELECT existing
        .mockResolvedValueOnce([{ agent_id: userId, owner_id: null }])  // assertAccess
        .mockResolvedValueOnce([]);                                      // DELETE

      await expect(service.delete(noteId, userId)).resolves.toBeUndefined();
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('throws NotFoundException when note does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(service.delete(noteId, userId)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when caller has no access to the property', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([baseRow])
        .mockResolvedValueOnce([
          { agent_id: otherId, owner_id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee' },
        ]);

      await expect(service.delete(noteId, userId)).rejects.toThrow(ForbiddenException);
    });
  });
});
