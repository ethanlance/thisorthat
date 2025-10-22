'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PollsService } from '@/lib/services/polls';
import { VotesService } from '@/lib/services/votes';

interface Poll {
  id: string;
  creator_id: string;
  option_a_image_url: string;
  option_a_label: string | null;
  option_b_image_url: string;
  option_b_label: string | null;
  description: string | null;
  status: string;
  is_public: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export default function TestDatabasePage() {
  const [connectionStatus, setConnectionStatus] =
    useState<string>('Testing...');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const supabase = createClient();

      // Test basic connection
      const { data, error } = await supabase
        .from('polls')
        .select('count')
        .limit(1);

      if (error) {
        setConnectionStatus(`❌ Connection failed: ${error.message}`);
      } else {
        setConnectionStatus('✅ Database connection successful!');

        // Test fetching polls
        const publicPolls = await PollsService.getPublicPolls();
        setPolls(publicPolls);
      }
    } catch (err) {
      setConnectionStatus(
        `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testCreatePoll = async () => {
    try {
      setLoading(true);

      // Create a test poll
      const testPoll = {
        creatorId: '00000000-0000-0000-0000-000000000000', // Test UUID
        optionAImage:
          'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Option+A',
        optionALabel: 'Option A',
        optionBImage:
          'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Option+B',
        optionBLabel: 'Option B',
        description: 'Test poll created via database test',
        isPublic: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };

      const newPoll = await PollsService.createPoll(testPoll);
      setPolls(prev => [newPoll, ...prev]);

      alert('✅ Test poll created successfully!');
    } catch (err) {
      alert(
        `❌ Error creating poll: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Database Connection Test</h1>

      <div className="bg-muted p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        <p className="text-lg">{connectionStatus}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Database Operations Test</h2>

        <button
          onClick={testCreatePoll}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Create Test Poll'}
        </button>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Public Polls ({polls.length})
          </h3>
          {polls.length === 0 ? (
            <p className="text-muted-foreground">No polls found</p>
          ) : (
            <div className="grid gap-4">
              {polls.map(poll => (
                <div key={poll.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold">
                    {poll.option_a_label} vs {poll.option_b_label}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {poll.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {poll.status} | Public:{' '}
                    {poll.is_public ? 'Yes' : 'No'} | Expires:{' '}
                    {new Date(poll.expires_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
