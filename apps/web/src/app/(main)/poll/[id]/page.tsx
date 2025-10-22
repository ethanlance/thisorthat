import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { PollsService } from '@/lib/services/polls';
import { generatePollMetaTags } from '@/lib/utils/meta-helpers';
import PollViewClient from './PollViewClient';

interface PollPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PollPageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const poll = await PollsService.getPollById(id);

    if (!poll) {
      return {
        title: 'Poll Not Found | ThisOrThat',
        description: 'The requested poll could not be found.',
      };
    }

    const metaTags = generatePollMetaTags(poll);

    return {
      title: metaTags.title,
      description: metaTags.description,
      openGraph: {
        title: metaTags.openGraph.title,
        description: metaTags.openGraph.description,
        url: metaTags.openGraph.url,
        siteName: metaTags.openGraph.siteName,
        type: metaTags.openGraph.type,
        images: metaTags.openGraph.images,
      },
      twitter: {
        card: metaTags.twitter.card,
        title: metaTags.twitter.title,
        description: metaTags.twitter.description,
        images: [metaTags.twitter.image],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Poll | ThisOrThat',
      description: 'Vote on this poll and see the results!',
    };
  }
}

export default async function PollPage({ params }: PollPageProps) {
  try {
    const { id } = await params;
    const poll = await PollsService.getPollById(id);

    if (!poll) {
      notFound();
    }

    return <PollViewClient poll={poll} />;
  } catch (error) {
    console.error('Error fetching poll:', error);
    notFound();
  }
}
