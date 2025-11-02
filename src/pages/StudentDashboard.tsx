import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, ShoppingCart, Package, User, LogOut, Bell } from 'lucide-react';
import { getCurrentSession, getCurrentProfile, signOut, type Profile } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadDashboardData();
  }, []);

  const checkAuth = async () => {
    const { session } = await getCurrentSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const userProfile = await getCurrentProfile();
    if (userProfile) {
      setProfile(userProfile);
      if (userProfile.role !== 'student') {
        navigate('/admin');
      }
    }
  };

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load cart count
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('*')
      .eq('student_id', user.id);
    setCartCount(cartItems?.length || 0);

    // Load recent orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    setRecentOrders(orders || []);

    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Smart Cafeteria</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Welcome back, {profile?.full_name}!</h1>
          <p className="text-muted-foreground">
            {profile?.student_id} • {profile?.department}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <QuickActionCard
            icon={<UtensilsCrossed className="h-6 w-6" />}
            title="Browse Menu"
            description="Explore available items"
            onClick={() => navigate('/menu')}
          />
          <QuickActionCard
            icon={<ShoppingCart className="h-6 w-6" />}
            title="My Cart"
            description={`${cartCount} items`}
            onClick={() => navigate('/cart')}
            badge={cartCount > 0 ? cartCount : undefined}
          />
          <QuickActionCard
            icon={<Package className="h-6 w-6" />}
            title="My Orders"
            description="Track your orders"
            onClick={() => navigate('/orders')}
          />
          <QuickActionCard
            icon={<User className="h-6 w-6" />}
            title="Profile"
            description="Manage account"
            onClick={() => navigate('/profile')}
          />
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Your order history</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                <p>No orders yet</p>
                <Button className="mt-4" onClick={() => navigate('/menu')}>
                  Start Ordering
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <p className="font-semibold">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{order.total} • {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={
                        order.status === 'completed'
                          ? 'default'
                          : order.status === 'cancelled'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const QuickActionCard = ({
  icon,
  title,
  description,
  onClick,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  badge?: number;
}) => (
  <Card
    className="cursor-pointer transition-all hover:shadow-lg-primary"
    onClick={onClick}
  >
    <CardContent className="flex items-center gap-4 p-6">
      <div className="relative">
        <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
        {badge !== undefined && badge > 0 && (
          <Badge className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 text-xs">
            {badge}
          </Badge>
        )}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </CardContent>
  </Card>
);

export default StudentDashboard;
