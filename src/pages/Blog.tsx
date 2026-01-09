import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  Clock, 
  Eye, 
  Heart, 
  MessageCircle,
  ChevronRight,
  Tag,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { blogService } from '@/lib/blog-engine';
import type { BlogPost, BlogCategory } from '@/types/blog';

const Blog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [totalPosts, setTotalPosts] = useState(0);
  
  const currentCategory = searchParams.get('category') || 'all';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const postsPerPage = 9;

  useEffect(() => {
    loadData();
  }, [currentCategory, currentPage, searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load categories
      const cats = await blogService.getCategories();
      setCategories(cats);

      // Load posts
      const { posts: loadedPosts, total } = await blogService.getPosts({
        category: currentCategory === 'all' ? undefined : currentCategory,
        search: searchParams.get('search') || undefined,
        page: currentPage,
        limit: postsPerPage,
      });
      setPosts(loadedPosts);
      setTotalPosts(total);

      // Load featured posts (only on first page with no filters)
      if (currentPage === 1 && currentCategory === 'all' && !searchParams.get('search')) {
        const featured = await blogService.getFeaturedPosts(3);
        setFeaturedPosts(featured);
      } else {
        setFeaturedPosts([]);
      }
    } catch (error) {
      console.error('Error loading blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery) {
      newParams.set('search', searchQuery);
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleCategoryChange = (category: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Draft';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCategoryColor = (slug: string) => {
    const cat = categories.find(c => c.slug === slug);
    return cat?.color || '#8B5CF6';
  };

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300">AI-Powered Insights</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Auraa AI Blog
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Discover insights on AI employees, automation, and the future of work. 
              Written by our AI team, for your business success.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-24 py-6 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                <Button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="container mx-auto px-4 -mt-8 mb-12">
          <div className="grid md:grid-cols-3 gap-6">
            {featuredPosts.map((post, index) => (
              <Link 
                key={post.id} 
                to={`/blog/${post.slug}`}
                className={`group ${index === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <Card className="h-full overflow-hidden bg-gradient-to-br from-purple-900/40 to-slate-900/60 border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/10">
                  {post.cover_image && (
                    <div className={`overflow-hidden ${index === 0 ? 'h-64' : 'h-40'}`}>
                      <img 
                        src={post.cover_image} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <Badge 
                      variant="outline" 
                      className="mb-3"
                      style={{ borderColor: getCategoryColor(post.category), color: getCategoryColor(post.category) }}
                    >
                      {post.category}
                    </Badge>
                    <h3 className={`font-bold text-white mb-2 group-hover:text-purple-400 transition-colors ${index === 0 ? 'text-2xl' : 'text-lg'}`}>
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className={`text-gray-400 ${index === 0 ? '' : 'line-clamp-2'}`}>
                        {post.excerpt}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.like_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comment_count}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category Tabs */}
      <section className="container mx-auto px-4 mb-8">
        <Tabs value={currentCategory} onValueChange={handleCategoryChange}>
          <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex-wrap">
            <TabsTrigger 
              value="all"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              All Posts
            </TabsTrigger>
            {categories.map(category => (
              <TabsTrigger 
                key={category.slug}
                value={category.slug}
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                {category.name}
                <Badge variant="secondary" className="ml-2 bg-white/10 text-xs">
                  {category.post_count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </section>

      {/* Posts Grid */}
      <section className="container mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                <div className="h-48 bg-white/10" />
                <CardContent className="p-6 space-y-4">
                  <div className="h-4 bg-white/10 rounded w-20" />
                  <div className="h-6 bg-white/10 rounded w-full" />
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No posts found.</p>
            {searchParams.get('search') && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setSearchParams(new URLSearchParams());
                }}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <Card className="h-full overflow-hidden bg-white/5 border-white/10 hover:border-purple-500/40 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/10">
                    {post.cover_image && (
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={post.cover_image} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline"
                          style={{ borderColor: getCategoryColor(post.category), color: getCategoryColor(post.category) }}
                        >
                          {post.category}
                        </Badge>
                        {post.is_ai_generated && (
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {post.excerpt && (
                        <p className="text-gray-400 line-clamp-3">{post.excerpt}</p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(post.published_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {post.reading_time_minutes} min
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {post.view_count}
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {currentPage > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('page', String(currentPage - 1));
                      setSearchParams(newParams);
                    }}
                  >
                    Previous
                  </Button>
                )}
                
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  // Show first, last, current, and adjacent pages
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set('page', String(page));
                          setSearchParams(newParams);
                        }}
                        className={page === currentPage ? 'bg-purple-600' : ''}
                      >
                        {page}
                      </Button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-500">...</span>;
                  }
                  return null;
                })}
                
                {currentPage < totalPages && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('page', String(currentPage + 1));
                      setSearchParams(newParams);
                    }}
                  >
                    Next
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="border-t border-white/10 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Stay Updated with AI Insights
            </h2>
            <p className="text-gray-400 mb-6">
              Get the latest articles on AI employees and automation delivered to your inbox.
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="Enter your email"
                className="bg-white/5 border-white/10 text-white"
              />
              <Button className="bg-purple-600 hover:bg-purple-700 whitespace-nowrap">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
