import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bug, Lightbulb } from 'lucide-react';

export default function FeedbackPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Share Your Feedback</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Help us improve ThisOrThat by sharing your thoughts, reporting bugs,
            or suggesting new features. Your feedback is valuable to us!
          </p>
        </div>

        {/* Feedback Types Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Bug className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-lg">Bug Report</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Found something that&apos;s not working? Let us know so we can
                fix it.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                <Lightbulb className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Feature Request</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Have an idea for a new feature? We&apos;d love to hear your
                suggestions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">General Feedback</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Share your overall experience and thoughts about the platform.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Feedback Form */}
        <FeedbackForm />
      </div>
    </div>
  );
}
