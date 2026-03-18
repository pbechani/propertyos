import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ViewingService } from './viewing.service';
import { PropertyAuditService } from './property-audit.service';
import { PrismaService } from '../database';
import { NotificationService } from '../identity/notification.service';

describe('ViewingService', () => {
  let service: ViewingService;
  let module: TestingModule;

  const mockPrisma = {
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  const mockAudit = { log: jest.fn() };
  const mockNotifications = { sendEmail: jest.fn().mockResolvedValue(undefined), sendSms: jest.fn().mockResolvedValue(undefined) };

  const buyerId = '11111111-1111-1111-1111-111111111111';
  const agentId = '22222222-2222-2222-2222-222222222222';
  const propertyId = '33333333-3333-3333-3333-333333333333';
  const viewingId = '44444444-4444-4444-4444-444444444444';
  const openHouseId = '55555555-5555-5555-5555-555555555555';

  const baseViewing = {
    id: viewingId,
    property_id: propertyId,
    buyer_id: buyerId,
    agent_id: agentId,
    status: 'requested',
    scheduled_at: new Date('2026-08-01T10:00:00Z'),
    viewing_type: 'physical',
    duration_minutes: 30,
    virtual_link: null,
    agent_notes: null,
    buyer_feedback: null,
    no_show_reason: null,
    cancel_reason: null,
    cancelled_by: null,
    rescheduled_at: null,
    rescheduled_reason: null,
    declined_at: null,
    confirmed_at: null,
    completed_at: null,
    created_at: new Date(),
  };

  const baseProperty = {
    id: propertyId,
    title: 'Test Property',
    agent_id: agentId,
    company_id: null,
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ViewingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PropertyAuditService, useValue: mockAudit },
        { provide: NotificationService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get(ViewingService);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(async () => { if (module) await module.close(); });

  it('should be defined', () => expect(service).toBeDefined());

  describe('request', () => {
    it('creates a viewing request and resolves agent from property', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseProperty]); // property lookup
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseViewing]);  // INSERT
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ email: 'agent@test.com', full_name: 'Agent Name' }]); // getUserContact(agentId)
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ title: 'Test Property' }]); // getPropertyTitle
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // createInAppNotification

      const result = await service.request(propertyId, buyerId, {
        scheduledAt: '2026-08-01T10:00:00Z',
        viewingType: 'physical',
        durationMinutes: 30,
      });

      expect(result).toMatchObject({ id: viewingId, status: 'requested' });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'viewing.requested' }),
      );
    });

    it('throws NotFoundException if property not found', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // no property

      await expect(
        service.request(propertyId, buyerId, {
          scheduledAt: '2026-08-01T10:00:00Z',
          viewingType: 'physical',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('confirm', () => {
    it('confirms a requested viewing', async () => {
      const requestedViewing = { ...baseViewing, status: 'requested' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([requestedViewing]); // findViewingOrThrow
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { ...requestedViewing, status: 'confirmed', confirmed_at: new Date() },
      ]); // UPDATE
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ email: 'buyer@test.com', full_name: 'Buyer Name' }]); // getUserContact(buyerId)
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ title: 'Test Property' }]); // getPropertyTitle
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // createInAppNotification

      const result = await service.confirm(viewingId, agentId, 'agent');

      expect(result).toMatchObject({ status: 'confirmed' });
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'viewing.confirmed' }),
      );
    });

    it('throws ForbiddenException if non-agent tries to confirm', async () => {
      const stranger = '99999999-9999-9999-9999-999999999999';
      const requestedViewing = { ...baseViewing, status: 'requested' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([requestedViewing]);

      await expect(service.confirm(viewingId, stranger, 'agent')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('submitFeedback', () => {
    it('allows buyer to submit feedback on a confirmed viewing', async () => {
      const confirmedViewing = { ...baseViewing, status: 'confirmed' };
      const updatedViewing = { ...confirmedViewing, buyer_feedback: { rating: 4, notes: 'Great!' } };
      mockPrisma.$queryRaw.mockResolvedValueOnce([confirmedViewing]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([updatedViewing]);

      const result = await service.submitFeedback(viewingId, buyerId, {
        rating: 4,
        interested: true,
        notes: 'Great property!',
      });

      expect(result).toMatchObject({ buyer_feedback: { rating: 4 } });
    });

    it('throws ForbiddenException if someone other than buyer submits feedback', async () => {
      const stranger = '99999999-9999-9999-9999-999999999999';
      const confirmedViewing = { ...baseViewing, status: 'confirmed' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([confirmedViewing]);

      await expect(
        service.submitFeedback(viewingId, stranger, { rating: 3, notes: 'ok' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if viewing is not confirmed or completed', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseViewing]); // status: 'pending'

      await expect(
        service.submitFeedback(viewingId, buyerId, { rating: 3, notes: 'early' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('registerForOpenHouse', () => {
    const baseOpenHouse = {
      id: openHouseId,
      property_id: propertyId,
      agent_id: agentId,
      status: 'scheduled',
      starts_at: new Date('2026-09-01T10:00:00Z'),
      ends_at: new Date('2026-09-01T12:00:00Z'),
      max_attendees: 20,
    };

    it('registers a buyer for an open house', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseOpenHouse]);             // open house exists
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ cnt: BigInt(5) }]);        // 5 of 20 taken
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        { id: 'reg-id', open_house_id: openHouseId, buyer_id: buyerId },
      ]);                                                                        // INSERT registration

      const result = await service.registerForOpenHouse(openHouseId, buyerId);

      expect(result).toMatchObject({ open_house_id: openHouseId });
    });

    it('throws ConflictException if buyer already registered (INSERT returns empty)', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([baseOpenHouse]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ cnt: BigInt(3) }]); // not full
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);                   // ON CONFLICT DO NOTHING

      await expect(
        service.registerForOpenHouse(openHouseId, buyerId),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException if open house is at capacity', async () => {
      const fullHouse = { ...baseOpenHouse, max_attendees: 5 };
      mockPrisma.$queryRaw.mockResolvedValueOnce([fullHouse]);
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ cnt: BigInt(5) }]); // exactly at capacity

      await expect(
        service.registerForOpenHouse(openHouseId, buyerId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('propertyOpenHouses', () => {
    it('returns open houses with marketing and preparation metadata', async () => {
      const rows = [
        {
          id: openHouseId,
          property_id: propertyId,
          property_title: 'Test Property',
          agent_id: agentId,
          scheduled_at: new Date('2026-09-01T10:00:00Z'),
          end_at: new Date('2026-09-01T12:00:00Z'),
          max_attendees: 25,
          description: 'Open viewing',
          status: 'scheduled',
          cancel_reason: null,
          rescheduled_at: null,
          rescheduled_reason: null,
          preparation_checklist: [{ task: 'Install directional signage', completed: true }],
          marketing_options: [{ channel: 'Website', enabled: true }],
          created_at: new Date('2026-08-20T08:00:00Z'),
        },
      ];
      mockPrisma.$queryRaw.mockResolvedValueOnce(rows);

      const result = await service.propertyOpenHouses(propertyId);

      expect(result).toEqual(rows);
      expect(result[0].preparation_checklist).toEqual([{ task: 'Install directional signage', completed: true }]);
      expect(result[0].marketing_options).toEqual([{ channel: 'Website', enabled: true }]);

      const queryTemplate = mockPrisma.$queryRaw.mock.calls[0]?.[0] as TemplateStringsArray;
      const sql = queryTemplate.join(' ');
      expect(sql).not.toContain("oh.status = 'scheduled'");
      expect(sql).not.toContain('oh.scheduled_at > NOW()');
    });
  });

  describe('cancelOpenHouse', () => {
    const scheduledOpenHouse = {
      id: openHouseId,
      property_id: propertyId,
      agent_id: agentId,
      status: 'scheduled',
      scheduled_at: new Date('2026-09-01T10:00:00Z'),
      end_at: new Date('2026-09-01T12:00:00Z'),
      max_attendees: null,
      cancel_reason: null,
      rescheduled_at: null,
      rescheduled_reason: null,
    };
    const cancelledOpenHouse = { ...scheduledOpenHouse, status: 'cancelled', cancel_reason: 'Venue unavailable' };

    it('cancels a scheduled open house and emails registered attendees', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([scheduledOpenHouse]); // fetch open house
      mockPrisma.$queryRaw.mockResolvedValueOnce([cancelledOpenHouse]); // UPDATE
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ buyer_id: buyerId }]); // registrations
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ title: 'Test Property' }]); // getPropertyTitle
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ email: 'buyer@test.com', full_name: 'Buyer Name' }]); // getUserContact
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // createInAppNotification

      const result = await service.cancelOpenHouse(
        openHouseId, agentId, 'agent', { reason: 'Venue unavailable' },
      );

      expect(result).toMatchObject({ status: 'cancelled', cancel_reason: 'Venue unavailable' });
      expect(mockNotifications.sendEmail).toHaveBeenCalledWith(
        'buyer@test.com',
        expect.stringContaining('Cancelled'),
        expect.stringContaining('Venue unavailable'),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'open_house.cancelled' }),
      );
    });

    it('throws NotFoundException if open house does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // not found

      await expect(
        service.cancelOpenHouse(openHouseId, agentId, 'agent', { reason: 'Venue unavailable' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if the caller does not own the open house', async () => {
      const othersHouse = { ...scheduledOpenHouse, agent_id: 'other-agent-id' };
      mockPrisma.$queryRaw.mockResolvedValueOnce([othersHouse]);

      await expect(
        service.cancelOpenHouse(openHouseId, agentId, 'agent', { reason: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if open house is already cancelled', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...scheduledOpenHouse, status: 'cancelled' }]);

      await expect(
        service.cancelOpenHouse(openHouseId, agentId, 'agent', { reason: 'Test reason' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rescheduleOpenHouse', () => {
    const scheduledOpenHouse = {
      id: openHouseId,
      property_id: propertyId,
      agent_id: agentId,
      status: 'scheduled',
      scheduled_at: new Date('2026-09-01T10:00:00Z'),
      end_at: new Date('2026-09-01T12:00:00Z'),
      max_attendees: null,
      cancel_reason: null,
      rescheduled_at: null,
      rescheduled_reason: null,
    };

    it('reschedules a scheduled open house and emails registered attendees', async () => {
      const rescheduledRow = {
        ...scheduledOpenHouse,
        scheduled_at: new Date('2026-09-08T10:00:00Z'),
        end_at: new Date('2026-09-08T12:00:00Z'),
        rescheduled_at: new Date(),
        rescheduled_reason: 'Hosting conflict',
      };
      mockPrisma.$queryRaw.mockResolvedValueOnce([scheduledOpenHouse]); // fetch
      mockPrisma.$queryRaw.mockResolvedValueOnce([rescheduledRow]);      // UPDATE
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ buyer_id: buyerId }]); // registrations
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ title: 'Test Property' }]); // getPropertyTitle
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ email: 'buyer@test.com', full_name: 'Buyer Name' }]); // getUserContact
      mockPrisma.$queryRaw.mockResolvedValueOnce([]); // createInAppNotification

      const result = await service.rescheduleOpenHouse(
        openHouseId, agentId, 'agent',
        { scheduledAt: '2026-09-08T10:00:00Z', endAt: '2026-09-08T12:00:00Z', reason: 'Hosting conflict' },
      );

      expect(result).toMatchObject({ rescheduled_reason: 'Hosting conflict' });
      expect(mockNotifications.sendEmail).toHaveBeenCalledWith(
        'buyer@test.com',
        expect.stringContaining('Rescheduled'),
        expect.stringContaining('Sept 2026'),
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'open_house.rescheduled' }),
      );
    });

    it('throws NotFoundException if open house does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(
        service.rescheduleOpenHouse(openHouseId, agentId, 'agent', {
          scheduledAt: '2026-09-08T10:00:00Z', endAt: '2026-09-08T12:00:00Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if caller does not own the open house', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...scheduledOpenHouse, agent_id: 'other-agent' }]);

      await expect(
        service.rescheduleOpenHouse(openHouseId, agentId, 'agent', {
          scheduledAt: '2026-09-08T10:00:00Z', endAt: '2026-09-08T12:00:00Z',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException if open house has already been cancelled', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ ...scheduledOpenHouse, status: 'cancelled' }]);

      await expect(
        service.rescheduleOpenHouse(openHouseId, agentId, 'agent', {
          scheduledAt: '2026-09-08T10:00:00Z', endAt: '2026-09-08T12:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getNotifications', () => {
    const userId = 'user-uuid-1';
    const companyId = 'company-uuid-1';
    const companyNotification = { id: 'n1', user_id: userId, company_id: companyId, type: 'viewing_confirmed' };
    const personalNotification = { id: 'n2', user_id: userId, company_id: null, type: 'viewing_declined' };

    it('returns notifications scoped to the provided companyId', async () => {
      // Buyer notifications are stored with the buyer's self-company ID so that
      // strict company_id equality is used and notifications appear in the right context.
      mockPrisma.$queryRaw.mockResolvedValueOnce([companyNotification]);

      const result = await service.getNotifications(userId, companyId);

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toEqual([companyNotification]);
    });

    it('returns only null-company notifications when no companyId is provided', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([personalNotification]);

      const result = await service.getNotifications(userId);

      expect(result).toEqual([personalNotification]);
    });

    it('returns empty array when user has no notifications', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      const result = await service.getNotifications(userId, companyId);

      expect(result).toEqual([]);
    });
  });

  describe('bookForBuyer', () => {
    const bookedViewing = {
      ...baseViewing,
      id: viewingId,
      status: 'confirmed',
      agent_notes: JSON.stringify({ bookedByAgent: true, name: 'Jane Doe', email: 'jane@example.com', phone: null, notes: null }),
    };

    const baseDto = {
      viewingType: 'physical' as const,
      scheduledAt: '2026-09-01T10:00:00Z',
      durationMinutes: 30,
      buyerContactName: 'Jane Doe',
      buyerContactEmail: 'jane@example.com',
    };

    it('inserts a confirmed viewing and returns it', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId }])   // property lookup
        .mockResolvedValueOnce([bookedViewing]);         // INSERT RETURNING

      const result = await service.bookForBuyer(propertyId, agentId, baseDto);

      expect(result).toEqual(bookedViewing);
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'viewing.agent_booked' }),
      );
    });

    it('throws NotFoundException when property does not exist', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([]);

      await expect(
        service.bookForBuyer(propertyId, agentId, baseDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('stores reminder_send_at when sendReminder is true', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId }])   // property lookup
        .mockResolvedValueOnce([bookedViewing])         // INSERT RETURNING
        .mockResolvedValueOnce(undefined);              // reminder UPDATE

      await service.bookForBuyer(propertyId, agentId, {
        ...baseDto,
        sendReminder: true,
        reminderMinutesBefore: 60,
      });

      // Third queryRaw call is the reminder UPDATE
      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(3);
    });

    it('does not update reminder_send_at when sendReminder is false', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId }])
        .mockResolvedValueOnce([bookedViewing]);

      await service.bookForBuyer(propertyId, agentId, {
        ...baseDto,
        sendReminder: false,
      });

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('sends confirmation email when sendConfirmation is true and email is provided', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId }])   // property lookup
        .mockResolvedValueOnce([bookedViewing])         // INSERT RETURNING
        .mockResolvedValueOnce([{ title: 'Sandton Villa' }]) // getPropertyTitle
        .mockResolvedValueOnce([{ email: 'agent@co.za', full_name: 'Bob Agent' }]); // getUserContact

      await service.bookForBuyer(propertyId, agentId, {
        ...baseDto,
        sendConfirmation: true,
      });

      expect(mockNotifications.sendEmail).toHaveBeenCalledWith(
        'jane@example.com',
        expect.stringContaining('confirmed'),
        expect.stringContaining('Sandton Villa'),
        undefined, // no ICS
      );
    });

    it('includes ICS attachment when addCalendarInvite is true', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId }])
        .mockResolvedValueOnce([bookedViewing])
        .mockResolvedValueOnce([{ title: 'Sandton Villa' }])
        .mockResolvedValueOnce([{ email: 'agent@co.za', full_name: 'Bob Agent' }]);

      await service.bookForBuyer(propertyId, agentId, {
        ...baseDto,
        sendConfirmation: true,
        addCalendarInvite: true,
      });

      expect(mockNotifications.sendEmail).toHaveBeenCalledWith(
        'jane@example.com',
        expect.any(String),
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ filename: 'viewing.ics', contentType: 'text/calendar' }),
        ]),
      );
    });

    it('does not send email when sendConfirmation is false', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId }])
        .mockResolvedValueOnce([bookedViewing]);

      await service.bookForBuyer(propertyId, agentId, {
        ...baseDto,
        sendConfirmation: false,
      });

      expect(mockNotifications.sendEmail).not.toHaveBeenCalled();
    });

    it('does not send email when buyerContactEmail is missing', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ id: propertyId }])
        .mockResolvedValueOnce([bookedViewing]);

      await service.bookForBuyer(propertyId, agentId, {
        ...baseDto,
        buyerContactEmail: undefined,
        sendConfirmation: true,
      });

      expect(mockNotifications.sendEmail).not.toHaveBeenCalled();
    });
  });
});
