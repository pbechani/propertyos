'use client';

import { FormEvent, useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ApiError, authExtApi } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-session';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordRequirements = [
    { met: newPassword.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(newPassword), text: 'One uppercase letter' },
    { met: /[a-z]/.test(newPassword), text: 'One lowercase letter' },
    { met: /[0-9]/.test(newPassword), text: 'One number' },
    { met: /[^A-Za-z0-9]/.test(newPassword), text: 'One special character' },
  ];

  const allRequirementsMet = passwordRequirements.every((item) => item.met);
  const passwordsMatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    if (!allRequirementsMet || !passwordsMatch) {
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from your current password.');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      await authExtApi.changePassword(token, {
        currentPassword,
        newPassword,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/profile-dashboard');
      }, 1400);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to change password right now. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <Card className="p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-2">Change Password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Update your account password securely.
          </p>

          {isSuccess && (
            <div className="mb-4 p-3 rounded-lg border border-green-200 bg-green-50 text-sm text-green-800">
              Password updated successfully.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-input rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-input rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="New password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-input rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {newPassword.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm space-y-1">
                {passwordRequirements.map((item) => (
                  <div key={item.text} className={item.met ? 'text-green-700' : 'text-muted-foreground'}>
                    {item.met ? '✓' : '•'} {item.text}
                  </div>
                ))}
                {confirmPassword.length > 0 && (
                  <div className={passwordsMatch ? 'text-green-700' : 'text-red-700'}>
                    {passwordsMatch ? '✓' : '•'} Passwords match
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/profile-dashboard')}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSaving || !allRequirementsMet || !passwordsMatch}
              >
                {isSaving ? 'Saving...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
