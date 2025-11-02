import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Package, TrendingUp, Users, LogOut } from 'lucide-react';
import { getCurrentSession, getCurrentProfile, signOut, type Profile } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    menuItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadStats();
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
      if (userProfile.role !== 'admin') {
        navigate('/student');
      }
    }
  };

  const loadStats = async () => {
    // Load orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*');
    
    const totalOrders = orders?.length || 0;
    const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'preparing').length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

    // Load menu items
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('*');

    setStats({
      totalOrders,
      pendingOrders,
      totalRevenue,
      menuItems: menuItems?.length || 0,
    });

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
            <span className="text-lg font-semibold">Admin Dashboard</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Welcome, {profile?.full_name}</h1>
          <p className="text-muted-foreground">
            {profile?.cafeteria_name} • Staff ID: {profile?.staff_id}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Package className="h-6 w-6" />}
            title="Total Orders"
            value={stats.totalOrders}
            iconBg="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Pending Orders"
            value={stats.pendingOrders}
            iconBg="bg-warning/10 text-warning"
          />
          <StatCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="Revenue"
            value={`₹${stats.totalRevenue.toFixed(2)}`}
            iconBg="bg-success/10 text-success"
          />
          <StatCard
            icon={<UtensilsCrossed className="h-6 w-6" />}
            title="Menu Items"
            value={stats.menuItems}
            iconBg="bg-primary/10 text-primary"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card
            className="cursor-pointer transition-all hover:shadow-lg-primary"
            onClick={() => navigate('/orders')}
          >
            <CardHeader>
              <CardTitle>Manage Orders</CardTitle>
              <CardDescription>View and update order status</CardDescription>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-lg-primary"
            onClick={() => navigate('/menu')}
          >
            <CardHeader>
              <CardTitle>Manage Menu</CardTitle>
              <CardDescription>Add, edit, or remove items</CardDescription>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-lg-primary"
            onClick={() => navigate('/profile')}
          >
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>View sales and analytics</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  icon,
  title,
  value,
  iconBg,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  iconBg: string;
}) => (
  <Card>
    <CardContent className="flex items-center gap-4 p-6">
      <div className={`rounded-lg p-3 ${iconBg}`}>{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
