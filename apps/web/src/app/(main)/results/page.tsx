import { Metadata } from 'next';
import HistoricalResults from '@/components/poll/HistoricalResults';

export const metadata: Metadata = {
  title: 'Historical Results | ThisOrThat',
  description: 'View historical poll results and see how past decisions turned out.',
};

export default function ResultsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Historical Results</h1>
          <p className="text-muted-foreground">
            Explore past poll results and see how the community voted
          </p>
        </div>
        
        <HistoricalResults limit={20} />
      </div>
    </div>
  );
}
