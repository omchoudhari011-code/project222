import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCurrentSession, getCurrentProfile } from '@/lib/auth';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  order_items: {
    quantity: number;
    price_at_order: number;
    menu_item: {
      name: string;
      is_vegetarian: boolean;
    };
  }[];
}

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAuthAndLoadOrders();
  }, []);

  const checkAuthAndLoadOrders = async () => {
    const { session } = await getCurrentSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const profile = await getCurrentProfile();
    setIsAdmin(profile?.role === 'admin');

    loadOrders(profile?.role === 'admin');
  };

  const loadOrders = async (isAdminUser: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total,
        created_at,
        order_items (
          quantity,
          price_at_order,
          menu_item:menu_items (
            name,
            is_vegetarian
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (!isAdminUser) {
      query = query.eq('student_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load orders');
      setLoading(false);
      return;
    }

    setOrders(data as any || []);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast.error('Failed to update order status');
      return;
    }

    toast.success('Order status updated');
    loadOrders(isAdmin);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'preparing':
        return 'bg-blue-500/10 text-blue-500';
      case 'ready':
        return 'bg-green-500/10 text-green-500';
      case 'completed':
        return 'bg-gray-500/10 text-gray-500';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading orders...</p>
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
          <h1 className="text-lg font-semibold">Orders</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
            <p className="mb-4 text-muted-foreground">No orders yet</p>
            {!isAdmin && (
              <Button onClick={() => navigate('/menu')}>Start Ordering</Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()} at{' '}
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">₹{order.total.toFixed(2)}</p>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    {order.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.menu_item.name} {item.menu_item.is_vegetarian && '🌱'} x{item.quantity}
                        </span>
                        <span>₹{(item.price_at_order * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {isAdmin && order.status !== 'completed' && order.status !== 'cancelled' && (
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                        >
                          Mark as Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                        >
                          Mark as Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(order.id, 'completed')}
                        >
                          Mark as Completed
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                      >
                        Cancel Order
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
