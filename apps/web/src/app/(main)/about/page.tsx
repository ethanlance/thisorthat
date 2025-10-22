import {
  ArrowRight,
  BarChart3,
  Users,
  Zap,
  Heart,
  Shield,
  Globe,
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          About <span className="text-primary">ThisOrThat</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We believe that the best decisions come from community input.
          ThisOrThat makes it easy to create quick polls, gather instant
          feedback, and make informed decisions with your community.
        </p>
      </section>

      {/* Mission Section */}
      <section className="text-center space-y-6 bg-muted/50 rounded-lg p-8">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Heart className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Our Mission</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          To democratize decision-making by making it simple, fast, and engaging
          for communities to share their opinions and reach consensus on
          important choices.
        </p>
      </section>

      {/* How It Works Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Creating and participating in polls is simple and intuitive.
            Here&apos;s how you can get started:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold">Create Your Poll</h3>
            <p className="text-muted-foreground">
              Upload two images, add labels and descriptions, then set your poll
              to public or private.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold">Share & Vote</h3>
            <p className="text-muted-foreground">
              Share your poll with friends or the community. People can vote
              instantly and see real-time results.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold">Make Decisions</h3>
            <p className="text-muted-foreground">
              Review the results, see the community&apos;s choice, and make
              informed decisions based on collective input.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Why Choose ThisOrThat?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We&apos;ve built ThisOrThat with the community in mind, focusing on
            simplicity, speed, and engagement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Create polls in seconds and get instant results. No complicated
              setup or lengthy forms.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Community Driven</h3>
            <p className="text-muted-foreground">
              Get insights from real people. Whether it&apos;s friends,
              colleagues, or the broader community.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Real-time Results</h3>
            <p className="text-muted-foreground">
              See results update live as people vote. Watch the community&apos;s
              opinion form in real-time.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Privacy First</h3>
            <p className="text-muted-foreground">
              Choose between public and private polls. Control who can see and
              participate in your polls.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Accessible Everywhere</h3>
            <p className="text-muted-foreground">
              Works perfectly on desktop, tablet, and mobile. Vote and create
              polls from anywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Perfect For</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Whether you&apos;re making personal decisions or gathering team
            input, ThisOrThat adapts to your needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Personal Decisions</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Choosing between two outfits</li>
              <li>• Deciding on vacation destinations</li>
              <li>• Picking restaurant options</li>
              <li>• Selecting gift ideas</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Team & Community</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Product feature prioritization</li>
              <li>• Event planning decisions</li>
              <li>• Brand and design choices</li>
              <li>• Community preference polls</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 bg-muted/50 rounded-lg p-8">
        <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Join thousands of people who use ThisOrThat to make better decisions
          every day.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/poll/create">
            <button className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Create Your First Poll
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </Link>
          <Link href="/polls">
            <button className="inline-flex items-center px-8 py-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
              Browse Community Polls
            </button>
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="text-center space-y-6">
        <h2 className="text-2xl font-bold">Have Questions?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          We&apos;re here to help! If you have any questions, feedback, or
          suggestions, we&apos;d love to hear from you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/polls">
            <button className="inline-flex items-center px-6 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
              Browse Polls
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
