'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  DiscoveryService,
  PollFeedItem,
  SearchFilters,
} from '@/lib/services/discovery';
import PollCard from '@/components/poll/PollCard';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  X,
  TrendingUp,
  Users,
  Clock,
  Star,
} from 'lucide-react';

interface PollSearchProps {
  className?: string;
}

export default function PollSearch({ className = '' }: PollSearchProps) {
  const { user } = useAuth();
  const [polls, setPolls] = useState<PollFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    tags: [],
    dateRange: 'all',
    sortBy: 'relevance',
    minEngagement: 0,
    maxAge: 30,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Load categories and tags
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          DiscoveryService.getCategories(),
          DiscoveryService.getTags(),
        ]);
        setCategories(categoriesData);
        setTags(tagsData);
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    };

    loadMetadata();
  }, []);

  const searchPolls = useCallback(
    async (reset = false) => {
      if (!user) return;

      try {
        setIsLoading(true);
        if (reset) {
          setOffset(0);
          setPolls([]);
        }

        const currentOffset = reset ? 0 : offset;
        const newPolls = await DiscoveryService.searchPolls(
          filters,
          20,
          currentOffset
        );

        if (reset) {
          setPolls(newPolls);
        } else {
          setPolls(prev => [...prev, ...newPolls]);
        }

        setHasMore(newPolls.length === 20);
        setOffset(currentOffset + newPolls.length);
        setError(null);
      } catch (err) {
        console.error('Error searching polls:', err);
        setError('Failed to search polls');
      } finally {
        setIsLoading(false);
      }
    },
    [user, filters, offset]
  );

  const handleSearch = useCallback(() => {
    searchPolls(true);
  }, [searchPolls]);

  const handleFilterChange = useCallback(
    (key: keyof SearchFilters, value: unknown) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleCategoryToggle = useCallback((categoryName: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories?.includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...(prev.categories || []), categoryName],
    }));
  }, []);

  const handleTagToggle = useCallback((tagName: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags?.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...(prev.tags || []), tagName],
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      categories: [],
      tags: [],
      dateRange: 'all',
      sortBy: 'relevance',
      minEngagement: 0,
      maxAge: 30,
    });
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      searchPolls(false);
    }
  }, [isLoading, hasMore, searchPolls]);

  const handlePollInteraction = useCallback(
    async (pollId: string, interactionType: string) => {
      if (!user) return;

      try {
        await DiscoveryService.trackInteraction(
          user.id,
          pollId,
          interactionType as
            | 'view'
            | 'vote'
            | 'comment'
            | 'share'
            | 'save'
            | 'hide'
            | 'report',
          { timestamp: new Date().toISOString() }
        );
      } catch (err) {
        console.error('Error tracking interaction:', err);
      }
    },
    [user]
  );

  if (!user) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground">Please log in to search polls</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Search Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Search className="h-6 w-6 mr-2" />
          Search Polls
        </h2>

        {/* Search Bar */}
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Search polls by title or description..."
            value={filters.query || ''}
            onChange={e => handleFilterChange('query', e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-muted/50 p-4 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Advanced Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Sort By
                </label>
                <Select
                  value={filters.sortBy || 'relevance'}
                  onValueChange={value => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="recent">Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Date Range
                </label>
                <Select
                  value={filters.dateRange || 'all'}
                  onValueChange={value =>
                    handleFilterChange('dateRange', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Min Engagement */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Min Engagement
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={filters.minEngagement || 0}
                  onChange={e =>
                    handleFilterChange(
                      'minEngagement',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  placeholder="0.0"
                />
              </div>

              {/* Max Age */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Max Age (days)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={filters.maxAge || 30}
                  onChange={e =>
                    handleFilterChange('maxAge', parseInt(e.target.value) || 30)
                  }
                  placeholder="30"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Categories
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge
                    key={category.id}
                    variant={
                      filters.categories?.includes(category.name)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryToggle(category.name)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 10).map(tag => (
                  <Badge
                    key={tag.id}
                    variant={
                      filters.tags?.includes(tag.name) ? 'default' : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag.name)}
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(filters.categories?.length || filters.tags?.length) && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2">
              {filters.categories?.map(category => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="cursor-pointer"
                >
                  {category}
                  <X
                    className="h-3 w-3 ml-1"
                    onClick={() => handleCategoryToggle(category)}
                  />
                </Badge>
              ))}
              {filters.tags?.map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer">
                  #{tag}
                  <X
                    className="h-3 w-3 ml-1"
                    onClick={() => handleTagToggle(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {isLoading && polls.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner text="Searching polls..." />
        </div>
      ) : polls.length === 0 && !isLoading ? (
        <div className="text-center py-8">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            No polls found matching your criteria
          </p>
          <Button onClick={clearFilters} variant="outline">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {polls.map(poll => (
            <div key={poll.poll_id} className="relative">
              <PollCard
                poll={{
                  id: poll.poll_id,
                  creator_id: poll.user_id,
                  option_a_image_url: poll.option_a_image_url || '',
                  option_a_label: poll.option_a_label,
                  option_b_image_url: poll.option_b_image_url || '',
                  option_b_label: poll.option_b_label,
                  description: poll.poll_description,
                  expires_at: poll.expires_at || '',
                  is_public: true,
                  status: 'active' as const,
                  privacy_level: 'public' as const,
                  friend_group_id: null,
                  access_expires_at: null,
                  created_at: poll.created_at,
                  updated_at: poll.created_at,
                  vote_counts: {
                    option_a: Math.floor(poll.vote_count * 0.6), // Mock data
                    option_b: Math.floor(poll.vote_count * 0.4), // Mock data
                  },
                  user_vote: null,
                  share_count: 0,
                  last_activity: poll.created_at,
                }}
                onView={() => handlePollInteraction(poll.poll_id, 'view')}
                onShare={() => handlePollInteraction(poll.poll_id, 'share')}
              />

              {/* Search result metadata */}
              <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                {poll.categories.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span>Categories:</span>
                    <div className="flex space-x-1">
                      {poll.categories.slice(0, 2).map(category => (
                        <span
                          key={category}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {poll.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <span>Tags:</span>
                    <div className="flex space-x-1">
                      {poll.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{poll.trending_score.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>{poll.popularity_score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button
                onClick={handleLoadMore}
                disabled={isLoading}
                variant="outline"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
