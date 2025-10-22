import { ArrowRight, BarChart3, Users, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Make Decisions <span className="text-primary">Easier</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create quick polls, get instant feedback, and make better decisions
          with your community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/poll/create"
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Create Poll
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <Link
            href="/polls"
            className="inline-flex items-center px-6 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
          >
            Browse Polls
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Quick & Easy</h3>
          <p className="text-muted-foreground">
            Create polls in seconds and get instant results from your community.
          </p>
        </div>
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Community Driven</h3>
          <p className="text-muted-foreground">
            Get insights from real people to make informed decisions together.
          </p>
        </div>
        <div className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Real-time Results</h3>
          <p className="text-muted-foreground">
            See results update live as people vote and participate in
            discussions.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 bg-muted/50 rounded-lg p-8">
        <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Join thousands of people who use ThisOrThat to make better decisions
          every day.
        </p>
        <Link
          href="/poll/create"
          className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Create Your First Poll
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
