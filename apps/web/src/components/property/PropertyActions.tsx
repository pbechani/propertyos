'use client';

import { useState } from 'react';
import { getAccessToken } from '@/lib/auth-session';
import { ApiError, propertiesApi } from '@/lib/api-client';

type PropertyActionsProps = {
  propertyId: string;
};

export function PropertyActions({ propertyId }: PropertyActionsProps) {
  const [busyAction, setBusyAction] = useState<null | 'save' | 'inquiry' | 'fraud'>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const withAuth = (): string | null => {
    const token = getAccessToken();
    if (!token) {
      setError('Please log in to perform this action.');
      return null;
    }
    return token;
  };

  const handleSave = async () => {
    const token = withAuth();
    if (!token) return;

    setBusyAction('save');
    setError('');
    setMessage('');

    try {
      await propertiesApi.save(token, propertyId);
      setMessage('Property saved to your shortlist.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save property.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleInquiry = async () => {
    const token = withAuth();
    if (!token) return;

    const promptMessage = window.prompt('Optional inquiry message', 'I would like to schedule a viewing.');

    setBusyAction('inquiry');
    setError('');
    setMessage('');

    try {
      await propertiesApi.createInquiry(token, propertyId, {
        inquiryType: 'viewing',
        message: promptMessage ?? undefined,
      });
      setMessage('Inquiry submitted successfully.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to submit inquiry.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleFraudReport = async () => {
    const token = withAuth();
    if (!token) return;

    const description = window.prompt(
      'Describe the issue you want to report',
      'Potential listing issue requiring review.',
    );

    if (!description || !description.trim()) {
      return;
    }

    setBusyAction('fraud');
    setError('');
    setMessage('');

    try {
      await propertiesApi.submitFraudReport(token, propertyId, {
        reportType: 'other',
        description: description.trim(),
      });
      setMessage('Fraud report submitted for admin review.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to submit fraud report.');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={() => void handleSave()}
          disabled={busyAction !== null}
          className="w-full text-xs font-semibold bg-[#0A1628] text-white py-2 rounded-lg hover:bg-[#0F2040] transition-colors disabled:opacity-50"
        >
          {busyAction === 'save' ? 'Saving...' : 'Save Property'}
        </button>
        <button
          onClick={() => void handleInquiry()}
          disabled={busyAction !== null}
          className="w-full text-xs font-semibold border border-[#0A1628] text-[#0A1628] py-2 rounded-lg hover:bg-[#F8F9FA] transition-colors disabled:opacity-50"
        >
          {busyAction === 'inquiry' ? 'Submitting...' : 'Inquire / Schedule Viewing'}
        </button>
        <button
          onClick={() => void handleFraudReport()}
          disabled={busyAction !== null}
          className="w-full text-xs text-[#EF4444] hover:underline transition-colors disabled:opacity-50"
        >
          {busyAction === 'fraud' ? 'Submitting...' : '⚠ Report This Listing'}
        </button>
      </div>

      {message && <p className="text-[11px] text-green-600">{message}</p>}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
