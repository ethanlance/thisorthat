'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Star,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { ErrorService } from '@/lib/error-handling/ErrorService';

interface FeedbackFormProps {
  onSuccess?: (feedbackId: string) => void;
  onCancel?: () => void;
  className?: string;
}

function FeedbackForm({ onSuccess, onCancel, className }: FeedbackFormProps) {
  const [formData, setFormData] = useState({
    type: 'general' as 'bug' | 'feature' | 'improvement' | 'general',
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: '',
    tags: [] as string[],
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newTag, setNewTag] = useState('');

  const errorService = ErrorService.getInstance();

  const feedbackTypes = [
    {
      value: 'bug',
      label: 'Bug Report',
      icon: Bug,
      description: 'Report a problem or error',
    },
    {
      value: 'feature',
      label: 'Feature Request',
      icon: Lightbulb,
      description: 'Suggest a new feature',
    },
    {
      value: 'improvement',
      label: 'Improvement',
      icon: Star,
      description: 'Suggest an improvement',
    },
    {
      value: 'general',
      label: 'General Feedback',
      icon: MessageSquare,
      description: 'General comments or questions',
    },
  ];

  const categories = [
    'User Interface',
    'Performance',
    'Functionality',
    'Mobile Experience',
    'Accessibility',
    'Content',
    'Navigation',
    'Search',
    'Other',
  ];

  const commonTags = [
    'urgent',
    'mobile',
    'desktop',
    'slow',
    'broken',
    'confusing',
    'missing',
    'duplicate',
    'enhancement',
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTagAdd = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleCommonTagToggle = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/pdf',
      ];

      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} has an unsupported type.`);
        return false;
      }

      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const handleFileRemove = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const feedbackId = await errorService.submitUserFeedback({
        userId: 'anonymous', // Would get from auth context
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        status: 'open',
        category: formData.category || 'General',
        tags: formData.tags,
        attachments: [], // Would upload files and get URLs
      });

      setSuccess(true);
      if (onSuccess) {
        onSuccess(feedbackId);
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = feedbackTypes.find(t => t.value === formData.type);

  if (success) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Feedback Submitted!</h3>
          <p className="text-muted-foreground mb-4">
            Thank you for your feedback. We&apos;ll review it and get back to
            you if needed.
          </p>
          <div className="flex space-x-2">
            <Button onClick={() => window.location.reload()}>
              Submit Another
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5" />
          <span>Submit Feedback</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-3">
            <Label>Feedback Type *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feedbackTypes.map(type => {
                const Icon = type.icon;
                return (
                  <div
                    key={type.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => handleInputChange('type', type.value)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">{type.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => handleInputChange('title', e.target.value)}
              placeholder="Brief description of your feedback"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="Please provide detailed information about your feedback..."
              rows={4}
              required
            />
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={value => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={value => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>

            {/* Common Tags */}
            <div className="flex flex-wrap gap-2">
              {commonTags.map(tag => (
                <Button
                  key={tag}
                  type="button"
                  variant={formData.tags.includes(tag) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCommonTagToggle(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>

            {/* Custom Tags */}
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add custom tag"
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAdd();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleTagAdd}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </div>

            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{tag}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleTagRemove(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <div className="space-y-2">
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                accept="image/*,.txt,.pdf"
              />
              <p className="text-xs text-muted-foreground">
                You can attach images, text files, or PDFs (max 10MB each)
              </p>

              {attachments.length > 0 && (
                <div className="space-y-1">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <span className="text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFileRemove(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export { FeedbackForm };
export default FeedbackForm;
