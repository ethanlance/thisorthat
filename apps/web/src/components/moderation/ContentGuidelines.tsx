'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
  FileText,
  Users,
  AlertTriangle,
} from 'lucide-react';

interface ContentGuidelinesProps {
  className?: string;
}

interface Guidelines {
  guidelines: string;
  examples: {
    appropriate: string[];
    inappropriate: string[];
  };
  consequences: string;
}

export default function ContentGuidelines({
  className,
}: ContentGuidelinesProps) {
  const [guidelines, setGuidelines] = useState<Guidelines | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGuidelines();
  }, []);

  const loadGuidelines = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/content/guidelines');

      if (!response.ok) {
        throw new Error('Failed to load guidelines');
      }

      const data = await response.json();
      setGuidelines(data);
    } catch (err) {
      console.error('Error loading guidelines:', err);
      setError('Failed to load content guidelines');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading guidelines...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!guidelines) {
    return null;
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Community Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These guidelines help maintain a safe and welcoming environment
              for all users. Please review them before creating content.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Guidelines Text */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Content Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {guidelines.guidelines}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appropriate Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>Appropriate Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guidelines.examples.appropriate.map((example, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{example}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inappropriate Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span>Inappropriate Content</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guidelines.examples.inappropriate.map((example, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{example}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consequences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>Consequences</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {guidelines.consequences}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Need Help?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you have questions about our guidelines or need to report
              inappropriate content:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Report Content
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
