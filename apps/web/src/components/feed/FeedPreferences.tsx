'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DiscoveryService } from '@/lib/services/discovery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { Save, RefreshCw } from 'lucide-react';

interface FeedPreferencesProps {
  className?: string;
}

export default function FeedPreferences({
  className = '',
}: FeedPreferencesProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<{
    feed_type?: 'personalized' | 'trending' | 'recent' | 'following';
    show_categories?: string[];
    hide_categories?: string[];
    show_tags?: string[];
    hide_tags?: string[];
    min_engagement_score?: number;
    max_poll_age_days?: number;
    include_private_polls?: boolean;
  } | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preferences and metadata
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const [prefs, cats, tagsData] = await Promise.all([
          DiscoveryService.getUserFeedPreferences(user.id),
          DiscoveryService.getCategories(),
          DiscoveryService.getTags(),
        ]);

        setPreferences(
          prefs || {
            feed_type: 'personalized',
            show_categories: [],
            hide_categories: [],
            show_tags: [],
            hide_tags: [],
            min_engagement_score: 0,
            max_poll_age_days: 30,
            include_private_polls: false,
          }
        );
        setCategories(cats);
        setTags(tagsData);
      } catch (err) {
        console.error('Error loading preferences:', err);
        setError('Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user || !preferences) return;

    try {
      setIsSaving(true);
      const success = await DiscoveryService.updateUserFeedPreferences(
        user.id,
        preferences
      );

      if (success) {
        setError(null);
      } else {
        setError('Failed to save preferences');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  }, [user, preferences]);

  const handlePreferenceChange = useCallback((key: string, value: unknown) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCategoryToggle = useCallback(
    (categoryName: string, type: 'show' | 'hide') => {
      const key = type === 'show' ? 'show_categories' : 'hide_categories';
      const current = preferences?.[key] || [];
      const updated = current.includes(categoryName)
        ? current.filter((c: string) => c !== categoryName)
        : [...current, categoryName];

      handlePreferenceChange(key, updated);
    },
    [preferences, handlePreferenceChange]
  );

  const handleTagToggle = useCallback(
    (tagName: string, type: 'show' | 'hide') => {
      const key = type === 'show' ? 'show_tags' : 'hide_tags';
      const current = preferences?.[key] || [];
      const updated = current.includes(tagName)
        ? current.filter((t: string) => t !== tagName)
        : [...current, tagName];

      handlePreferenceChange(key, updated);
    },
    [preferences, handlePreferenceChange]
  );

  if (!user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">
          Please log in to manage your feed preferences
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingSpinner text="Loading preferences..." />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-destructive">Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Feed Preferences</h2>
        <p className="text-muted-foreground">
          Customize your feed to see the polls that interest you most
        </p>
      </div>

      <div className="space-y-6">
        {/* Feed Type */}
        <Card>
          <CardHeader>
            <CardTitle>Feed Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="feed-type">
                How would you like your feed to be organized?
              </Label>
              <Select
                value={preferences.feed_type}
                onValueChange={value =>
                  handlePreferenceChange('feed_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personalized">
                    Personalized (Recommended)
                  </SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="following">Following</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Content Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Categories to Show */}
            <div>
              <Label className="text-base font-medium">
                Categories to Show
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select categories you want to see more of in your feed
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge
                    key={category.id}
                    variant={
                      preferences.show_categories?.includes(category.name)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryToggle(category.name, 'show')}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Categories to Hide */}
            <div>
              <Label className="text-base font-medium">
                Categories to Hide
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select categories you want to see less of in your feed
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge
                    key={category.id}
                    variant={
                      preferences.hide_categories?.includes(category.name)
                        ? 'destructive'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryToggle(category.name, 'hide')}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags to Show */}
            <div>
              <Label className="text-base font-medium">Tags to Show</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select tags you want to see more of in your feed
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 15).map(tag => (
                  <Badge
                    key={tag.id}
                    variant={
                      preferences.show_tags?.includes(tag.name)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag.name, 'show')}
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags to Hide */}
            <div>
              <Label className="text-base font-medium">Tags to Hide</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select tags you want to see less of in your feed
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 15).map(tag => (
                  <Badge
                    key={tag.id}
                    variant={
                      preferences.hide_tags?.includes(tag.name)
                        ? 'destructive'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag.name, 'hide')}
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Minimum Engagement Score */}
            <div>
              <Label htmlFor="min-engagement">Minimum Engagement Score</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Only show polls with at least this engagement score
              </p>
              <Input
                id="min-engagement"
                type="number"
                min="0"
                step="0.1"
                value={preferences.min_engagement_score || 0}
                onChange={e =>
                  handlePreferenceChange(
                    'min_engagement_score',
                    parseFloat(e.target.value) || 0
                  )
                }
              />
            </div>

            {/* Maximum Poll Age */}
            <div>
              <Label htmlFor="max-age">Maximum Poll Age (days)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Only show polls created within this many days
              </p>
              <Input
                id="max-age"
                type="number"
                min="1"
                value={preferences.max_poll_age_days || 30}
                onChange={e =>
                  handlePreferenceChange(
                    'max_poll_age_days',
                    parseInt(e.target.value) || 30
                  )
                }
              />
            </div>

            {/* Include Private Polls */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="private-polls">Include Private Polls</Label>
                <p className="text-sm text-muted-foreground">
                  Show polls that are shared with you privately
                </p>
              </div>
              <Switch
                id="private-polls"
                checked={preferences.include_private_polls || false}
                onCheckedChange={checked =>
                  handlePreferenceChange('include_private_polls', checked)
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>

        {/* Error Message */}
        {error && <div className="text-destructive text-sm">{error}</div>}
      </div>
    </div>
  );
}
