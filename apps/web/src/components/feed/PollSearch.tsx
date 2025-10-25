'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Filter,
  SortAsc,
  TrendingUp,
  Clock,
  Star,
  Loader2,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { FeedService, SearchPoll, SearchFilters } from '@/lib/services/feed';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface PollSearchProps {
  onPollSelect?: (poll: SearchPoll) => void;
  className?: string;
}

export default function PollSearch({
  onPollSelect,
  className,
}: PollSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [polls, setPolls] = useState<SearchPoll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [availableTags, setAvailableTags] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<
    'relevance' | 'trending' | 'popular' | 'newest'
  >('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const limit = 20;

  // Load available categories and tags
  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      try {
        const [categoriesData, tagsData] = await Promise.all([
          FeedService.getPollCategories(),
          FeedService.getPollTags(),
        ]);

        setAvailableCategories(
          categoriesData.map(cat => ({ id: cat.id, name: cat.name }))
        );
        setAvailableTags(tagsData.map(tag => ({ id: tag.id, name: tag.name })));
      } catch (err) {
        console.error('Error loading categories and tags:', err);
      }
    };

    loadCategoriesAndTags();
  }, []);

  const searchPolls = useCallback(
    async (reset = false) => {
      if (!debouncedSearchTerm.trim() || debouncedSearchTerm.length < 2) {
        setPolls([]);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const currentOffset = reset ? 0 : offset;
        const filters: SearchFilters = {
          categories:
            selectedCategories.length > 0 ? selectedCategories : undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          sort_by: sortBy,
        };

        const results = await FeedService.searchPolls(
          debouncedSearchTerm,
          filters,
          limit,
          currentOffset
        );

        if (reset) {
          setPolls(results);
          setOffset(results.length);
        } else {
          setPolls(prev => [...prev, ...results]);
          setOffset(prev => prev + results.length);
        }

        setHasMore(results.length === limit);
      } catch (err) {
        console.error('Error searching polls:', err);
        setError('Failed to search polls');
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedSearchTerm,
      selectedCategories,
      selectedTags,
      sortBy,
      offset,
      limit,
    ]
  );

  const handleSearch = useCallback(() => {
    setOffset(0);
    searchPolls(true);
  }, [searchPolls]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      searchPolls(false);
    }
  }, [searchPolls, loading, hasMore]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSortBy('relevance');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSortIcon = (sortType: string) => {
    switch (sortType) {
      case 'trending':
        return <TrendingUp className="h-4 w-4" />;
      case 'popular':
        return <Star className="h-4 w-4" />;
      case 'newest':
        return <Clock className="h-4 w-4" />;
      default:
        return <SortAsc className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    if (debouncedSearchTerm.length >= 2) {
      handleSearch();
    } else {
      setPolls([]);
      setError(null);
    }
  }, [debouncedSearchTerm, selectedCategories, selectedTags, sortBy]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Polls</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search polls by keywords, topics, or tags..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <Select
                  value={sortBy}
                  onValueChange={(value: any) => setSortBy(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">
                      <div className="flex items-center space-x-2">
                        <SortAsc className="h-4 w-4" />
                        <span>Relevance</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="trending">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>Trending</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="popular">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4" />
                        <span>Popular</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="newest">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Newest</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableCategories.map(category => (
                    <div
                      key={category.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() =>
                          handleCategoryToggle(category.id)
                        }
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.slice(0, 10).map(tag => (
                    <Button
                      key={tag.id}
                      variant={
                        selectedTags.includes(tag.id) ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {selectedTags.includes(tag.id) && (
                        <Check className="h-3 w-3 mr-1" />
                      )}
                      {tag.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters */}
          {(selectedCategories.length > 0 || selectedTags.length > 0) && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">
                Active filters:
              </span>
              {selectedCategories.map(categoryId => {
                const category = availableCategories.find(
                  c => c.id === categoryId
                );
                return (
                  <Badge
                    key={categoryId}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{category?.name}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleCategoryToggle(categoryId)}
                    />
                  </Badge>
                );
              })}
              {selectedTags.map(tagId => {
                const tag = availableTags.find(t => t.id === tagId);
                return (
                  <Badge
                    key={tagId}
                    variant="secondary"
                    className="flex items-center space-x-1"
                  >
                    <span>{tag?.name}</span>
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleTagToggle(tagId)}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Searching polls...</span>
        </div>
      )}

      {/* Search Results */}
      {!loading && debouncedSearchTerm.length >= 2 && (
        <div className="space-y-4">
          {polls.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No polls found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Found {polls.length} poll{polls.length !== 1 ? 's' : ''}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Sorted by:
                  </span>
                  <Badge
                    variant="outline"
                    className="flex items-center space-x-1"
                  >
                    {getSortIcon(sortBy)}
                    <span className="capitalize">{sortBy}</span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                {polls.map(poll => (
                  <Card
                    key={poll.poll_id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="outline">
                              {formatDate(poll.created_at)}
                            </Badge>
                            {poll.trending_score > 0 && (
                              <Badge
                                variant="secondary"
                                className="bg-orange-100 text-orange-800"
                              >
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Trending
                              </Badge>
                            )}
                            {poll.engagement_score > 100 && (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>

                          {poll.description && (
                            <p className="text-muted-foreground mb-4">
                              {poll.description}
                            </p>
                          )}

                          {/* Poll Options */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-muted-foreground">
                                Option A
                              </div>
                              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                <img
                                  src={poll.option_a_image_url}
                                  alt={poll.option_a_label || 'Option A'}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                              {poll.option_a_label && (
                                <p className="text-sm font-medium">
                                  {poll.option_a_label}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="text-sm font-medium text-muted-foreground">
                                Option B
                              </div>
                              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                <img
                                  src={poll.option_b_image_url}
                                  alt={poll.option_b_label || 'Option B'}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                              {poll.option_b_label && (
                                <p className="text-sm font-medium">
                                  {poll.option_b_label}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Categories and Tags */}
                          {(poll.categories.length > 0 ||
                            poll.tags.length > 0) && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {poll.categories.map((category, idx) => (
                                <Badge key={idx} variant="outline">
                                  {category}
                                </Badge>
                              ))}
                              {poll.tags.map((tag, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Relevance Score */}
                          <div className="text-sm text-muted-foreground">
                            Relevance: {Math.round(poll.relevance_score * 100)}%
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPollSelect?.(poll)}
                          >
                            View Poll
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && debouncedSearchTerm.length < 2 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Search for Polls</h3>
            <p className="text-muted-foreground">
              Enter keywords to find polls that match your interests.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
