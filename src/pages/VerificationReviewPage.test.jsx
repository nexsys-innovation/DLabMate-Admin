import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VerificationReviewPage from './VerificationReviewPage';
import { apiRequest } from '../api';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useParams: () => ({ submissionId: 'submission-1' }) }), { virtual: true });
jest.mock('../api', () => ({ apiRequest: jest.fn() }));

const review = {
  id: 'submission-1', ownerType: 'Lab', version: 1, panVatNumber: 'PAN-123', status: 'Under Review', submittedAt: '2026-09-12T00:00:00.000Z',
  owner: { labName: 'Alpha Lab', email: 'lab@example.com', location: 'Kathmandu', contactNumber: '9800000000' },
  documents: [
    { id: 'doc-1', documentType: 'CompanyRegistrationCertificate', originalFileName: 'registration.pdf' },
    { id: 'doc-2', documentType: 'PanVatDocument', originalFileName: 'pan.pdf' },
  ],
};

describe('VerificationReviewPage', () => {
  beforeEach(() => { jest.clearAllMocks(); apiRequest.mockResolvedValue({ review }); });

  test('requires a rejection reason before calling the review API', async () => {
    render(<VerificationReviewPage />);
    expect(await screen.findByRole('heading', { name: 'Alpha Lab' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reject submission' }));
    expect(await screen.findByText('Enter a rejection reason.')).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledTimes(1);
  });

  test('approves the current submission and returns to the queue', async () => {
    apiRequest.mockResolvedValueOnce({ review }).mockResolvedValueOnce({ success: true });
    render(<VerificationReviewPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Approve verification' }));
    await waitFor(() => expect(apiRequest).toHaveBeenLastCalledWith('/api/admin/verification-submissions/submission-1/approve', expect.objectContaining({ method: 'PATCH' })));
    expect(mockNavigate).toHaveBeenCalledWith('/verification');
  });

  test('opens an R2 document preview without sending a referrer', async () => {
    apiRequest
      .mockResolvedValueOnce({ review: { ...review, documents: [{ ...review.documents[0], mimeType: 'application/pdf' }] } })
      .mockResolvedValueOnce({ url: 'https://account.r2.cloudflarestorage.com/signed', expiresAt: '2026-09-12T01:00:00.000Z' });
    render(<VerificationReviewPage />);

    fireEvent.click(await screen.findByRole('button', { name: /Company registration certificate/i }));
    const preview = await screen.findByTitle('registration.pdf');

    expect(apiRequest).toHaveBeenLastCalledWith('/api/admin/verification-documents/doc-1/access', { method: 'POST' });
    expect(preview).toHaveAttribute('referrerPolicy', 'no-referrer');
  });
});
