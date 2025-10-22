import { notFound } from 'next/navigation';
import { PollsService } from '@/lib/services/polls';
import PollViewClient from './PollViewClient';

interface PollPageProps {
  params: { id: string };
}

export default async function PollPage({ params }: PollPageProps) {
  try {
    const poll = await PollsService.getPollById(params.id);
    
    if (!poll) {
      notFound();
    }
    
    return <PollViewClient poll={poll} />;
  } catch (error) {
    console.error('Error fetching poll:', error);
    notFound();
  }
}
