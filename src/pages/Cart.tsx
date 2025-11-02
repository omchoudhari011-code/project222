import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Minus, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getCurrentSession } from '@/lib/auth';

interface CartItem {
  id: string;
  quantity: number;
  menu_item: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    is_vegetarian: boolean;
  };
}

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'razorpay'>('upi');

  useEffect(() => {
    checkAuthAndLoadCart();
  }, []);

  const checkAuthAndLoadCart = async () => {
    const { session } = await getCurrentSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    loadCart();
  };

  const loadCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        menu_item:menu_items (
          id,
          name,
          price,
          image_url,
          is_vegetarian
        )
      `)
      .eq('student_id', user.id);

    if (error) {
      toast.error('Failed to load cart');
      setLoading(false);
      return;
    }

    setCartItems(data as any || []);
    setLoading(false);
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to update quantity');
      return;
    }

    loadCart();
  };

  const removeItem = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to remove item');
      return;
    }

    toast.success('Item removed from cart');
    loadCart();
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.menu_item.price * item.quantity), 0);
    const tax = subtotal * 0.05; // 5% tax
    return { subtotal, tax, total: subtotal + tax };
  };

  const handleCheckout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    const { subtotal, tax, total } = calculateTotal();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        student_id: user.id,
        status: 'pending',
        subtotal,
        tax,
        total,
        payment_method: paymentMethod,
        payment_status: 'completed',
      })
      .select()
      .single();

    if (orderError) {
      toast.error('Failed to create order');
      return;
    }

    // Create order items
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item.id,
      quantity: item.quantity,
      price_at_order: item.menu_item.price,
      subtotal: item.menu_item.price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      toast.error('Failed to create order items');
      return;
    }

    // Clear cart
    const { error: clearError } = await supabase
      .from('cart_items')
      .delete()
      .eq('student_id', user.id);

    if (clearError) {
      console.error('Failed to clear cart', clearError);
    }

    toast.success('Order placed successfully!');
    navigate('/orders');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading cart...</p>
        </div>
      </div>
    );
  }

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">My Cart</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {cartItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">Your cart is empty</p>
            <Button onClick={() => navigate('/menu')}>Browse Menu</Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="space-y-4 lg:col-span-2">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex gap-4 p-4">
                    <img
                      src={item.menu_item.image_url}
                      alt={item.menu_item.name}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{item.menu_item.name}</h3>
                          {item.menu_item.is_vegetarian && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              🌱 Veg
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <p className="mb-2 font-semibold text-primary">
                        ₹{item.menu_item.price * item.quantity}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (5%)</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-primary">₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="razorpay">Razorpay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button className="w-full" size="lg" onClick={handleCheckout}>
                    Place Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
