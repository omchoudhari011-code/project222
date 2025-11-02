import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Search, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCurrentSession } from '@/lib/auth';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_vegetarian: boolean;
  image_url: string;
  is_available: boolean;
}

const Menu = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const categories = ['All', 'Main Course', 'Fast Food', 'Breakfast', 'Dessert'];

  useEffect(() => {
    checkAuth();
    loadMenuItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, selectedCategory, menuItems]);

  const checkAuth = async () => {
    const { session } = await getCurrentSession();
    setIsAuthenticated(!!session);
  };

  const loadMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .order('category');

    if (error) {
      toast.error('Failed to load menu');
      setLoading(false);
      return;
    }

    setMenuItems(data || []);
    setFilteredItems(data || []);
    setLoading(false);
  };

  const filterItems = () => {
    let filtered = menuItems;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const handleAddToCart = async (item: MenuItem) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('student_id', user.id)
      .eq('menu_item_id', item.id)
      .single();

    if (existingItem) {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('id', existingItem.id);

      if (error) {
        toast.error('Failed to update cart');
        return;
      }
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          student_id: user.id,
          menu_item_id: item.id,
          quantity: 1,
        });

      if (error) {
        toast.error('Failed to add to cart');
        return;
      }
    }

    toast.success('Added to cart!');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Menu</h1>
          {isAuthenticated && (
            <Button variant="ghost" size="icon" onClick={() => navigate('/cart')}>
              <ShoppingCart className="h-5 w-5" />
            </Button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Menu Items Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden shadow-card transition-all hover:shadow-lg-primary">
              <div className="aspect-video overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    {item.is_vegetarian && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        🌱 Veg
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg font-bold text-primary">₹{item.price}</p>
                </div>
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(item)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>No items found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;
