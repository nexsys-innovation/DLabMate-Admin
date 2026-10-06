import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentRecordModal from './PaymentRecordModal';
test('admin reviews the precise submission loaded in the payment record', async () => {
  const order = { _id: 'order-1', orderNumber: 'ORD-1', status: 'payment_submitted', paymentMethod: 'bank_transfer', currentPaymentSubmissionId: 'submission-2', totalAmountPaisa: 99900 };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, order, submissions: [], lab: { labName: 'Test Lab' } }) });
  const approve = jest.fn().mockResolvedValue();
  render(<PaymentRecordModal orderId="order-1" apiBase="" token="admin-token" admin onClose={() => {}} onApprove={approve} onReject={jest.fn()} />);
  fireEvent.click(await screen.findByText('Approve & fulfill'));
  await waitFor(() => expect(approve).toHaveBeenCalledWith(expect.objectContaining({ currentPaymentSubmissionId: 'submission-2' })));
  expect(screen.getByText('Lab: Test Lab')).toBeInTheDocument();
});
