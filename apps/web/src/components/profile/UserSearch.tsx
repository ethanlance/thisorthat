'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, User, Users, Calendar } from 'lucide-react';
import { ProfileService, UserSearchResult } from '@/lib/services/profile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface UserSearchProps {
  onUserSelect?: (user: UserSearchResult) => void;
  placeholder?: string;
}

export default function UserSearch({ onUserSelect, placeholder = 'Search users...' }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchUsers = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      setIsLoading(true);
      const searchResults = await ProfileService.searchUsers(term, 20, 0);
      setResults(searchResults);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching users:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    searchUsers(debouncedSearchTerm);
  }, [debouncedSearchTerm, searchUsers]);

  const handleUserClick = (user: UserSearchResult) => {
    onUserSelect?.(user);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Search Results */}
      {!isLoading && hasSearched && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
              <p className="text-sm text-muted-foreground">
                Try a different search term
              </p>
            </div>
          ) : (
            results.map((user) => (
              <Card key={user.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4" onClick={() => handleUserClick(user)}>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || ''} alt={user.display_name || 'User'} />
                      <AvatarFallback>
                        {user.display_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium truncate">
                          {user.display_name || 'Anonymous User'}
                        </h3>
                        <Badge variant={user.privacy_level === 'public' ? 'default' : 'secondary'}>
                          {user.privacy_level}
                        </Badge>
                      </div>
                      
                      {user.bio && (
                        <p className="text-sm text-muted-foreground truncate">
                          {user.bio}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Active {formatDistanceToNow(new Date(user.last_active_at))} ago
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{user.polls_created} polls</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{user.followers_count} followers</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Interests */}
                  {user.interests && user.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.interests.slice(0, 3).map((interest, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {user.interests.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.interests.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Empty State */}
      {!hasSearched && !isLoading && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Search for users to discover</p>
          <p className="text-sm text-muted-foreground">
            Enter a name, interest, or keyword to find users
          </p>
        </div>
      )}
    </div>
  );
}
