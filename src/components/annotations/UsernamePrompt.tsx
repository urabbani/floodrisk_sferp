/**
 * Username Prompt Component
 *
 * Simple dialog that asks for a username on first visit.
 * Stores the username in localStorage for future sessions.
 */

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const STORAGE_KEY = 'floodrisk_username';

interface UsernamePromptProps {
  onUsernameSet: (username: string) => void;
}

export function UsernamePrompt({ onUsernameSet }: UsernamePromptProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  // Check if username is already stored
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      onUsernameSet(stored);
    } else {
      // No username stored, show prompt
      setIsOpen(true);
    }
  }, [onUsernameSet]);

  const handleSubmit = () => {
    const trimmed = username.trim();

    if (!trimmed) {
      setError('Please enter your name');
      return;
    }

    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    localStorage.setItem(STORAGE_KEY, trimmed);
    onUsernameSet(trimmed);
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'Anonymous');
    onUsernameSet('Anonymous');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Welcome!</DialogTitle>
              <DialogDescription>
                Enter your name to identify your annotations
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Your Name</Label>
            <Input
              id="username"
              placeholder="Enter your name or nickname"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <p className="text-xs text-slate-500">
              This helps identify who created each annotation. You can always change it later.
            </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
          >
            Skip
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!username.trim()}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
