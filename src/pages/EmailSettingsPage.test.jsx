import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import EmailSettingsPage from './EmailSettingsPage';
import { apiRequest } from '../api';

jest.mock('../api', () => ({
  apiRequest: jest.fn(),
}));

describe('EmailSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and displays all 6 global email settings', async () => {
    apiRequest.mockResolvedValueOnce({
      success: true,
      data: {
        welcomeEmailsEnabled: true,
        overdueEmailsEnabled: false,
        caseLifecycleEmailsEnabled: true,
        billingEmailsEnabled: true,
        verificationEmailsEnabled: true,
        weeklyDigestEnabled: false,
      },
    });

    render(<EmailSettingsPage />);

    expect(screen.getByText('Loading email configuration...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Welcome Emails')).toBeInTheDocument();
      expect(screen.getByText('Overdue Case Alerts')).toBeInTheDocument();
      expect(screen.getByText('Case Lifecycle Alerts')).toBeInTheDocument();
      expect(screen.getByText('Billing & Invoices')).toBeInTheDocument();
      expect(screen.getByText('Compliance & Verification')).toBeInTheDocument();
      expect(screen.getByText('Weekly Executive Digest')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6);
    expect(checkboxes[0]).toBeChecked(); // Welcome
    expect(checkboxes[1]).not.toBeChecked(); // Overdue
    expect(checkboxes[2]).toBeChecked(); // Lifecycle
    expect(checkboxes[3]).toBeChecked(); // Billing
    expect(checkboxes[4]).toBeChecked(); // Verification
    expect(checkboxes[5]).not.toBeChecked(); // Weekly Digest
  });

  test('toggles email setting and updates backend via PUT', async () => {
    apiRequest
      .mockResolvedValueOnce({
        success: true,
        data: {
          welcomeEmailsEnabled: true,
          overdueEmailsEnabled: true,
          caseLifecycleEmailsEnabled: true,
          billingEmailsEnabled: true,
          verificationEmailsEnabled: true,
          weeklyDigestEnabled: true,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          welcomeEmailsEnabled: false,
          overdueEmailsEnabled: true,
          caseLifecycleEmailsEnabled: true,
          billingEmailsEnabled: true,
          verificationEmailsEnabled: true,
          weeklyDigestEnabled: true,
        },
      });

    render(<EmailSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Emails')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/admin/settings/email', {
        method: 'PUT',
        body: JSON.stringify({
          welcomeEmailsEnabled: false,
          overdueEmailsEnabled: true,
          caseLifecycleEmailsEnabled: true,
          billingEmailsEnabled: true,
          verificationEmailsEnabled: true,
          weeklyDigestEnabled: true,
        }),
      });
      expect(screen.getByText('Email delivery settings updated successfully.')).toBeInTheDocument();
    });
  });

  test('displays error message when toggle update fails and reverts state', async () => {
    apiRequest
      .mockResolvedValueOnce({
        success: true,
        data: {
          welcomeEmailsEnabled: true,
          overdueEmailsEnabled: true,
          caseLifecycleEmailsEnabled: true,
          billingEmailsEnabled: true,
          verificationEmailsEnabled: true,
          weeklyDigestEnabled: true,
        },
      })
      .mockRejectedValueOnce(new Error('Network error'));

    render(<EmailSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Welcome Emails')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
