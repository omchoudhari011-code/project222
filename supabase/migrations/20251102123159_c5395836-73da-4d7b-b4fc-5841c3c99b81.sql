-- Smart AI Cafeteria - Complete Database Schema

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('student', 'admin')),
  student_id text,
  department text,
  staff_id text,
  cafeteria_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL CHECK (category IN ('Main Course', 'Fast Food', 'Breakfast', 'Dessert')),
  is_vegetarian boolean DEFAULT true,
  image_url text,
  is_available boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  student_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  tax numeric NOT NULL CHECK (tax >= 0),
  total numeric NOT NULL CHECK (total >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('upi', 'card', 'razorpay')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Create order_items table
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_order numeric NOT NULL CHECK (price_at_order >= 0),
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('order', 'offer', 'alert', 'system')),
  is_read boolean DEFAULT false,
  is_important boolean DEFAULT false,
  related_order_id uuid REFERENCES public.orders(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES public.menu_items(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, menu_item_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- RLS Policies for menu_items
CREATE POLICY "Anyone can view available menu items" ON public.menu_items FOR SELECT USING (is_available = true OR auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert menu items" ON public.menu_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update menu items" ON public.menu_items FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can delete menu items" ON public.menu_items FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for orders
CREATE POLICY "Students can view own orders" ON public.orders FOR SELECT USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Students can insert own orders" ON public.orders FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- RLS Policies for order_items
CREATE POLICY "Users can view order items for their orders" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')))
);
CREATE POLICY "Users can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND student_id = auth.uid())
);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for cart_items
CREATE POLICY "Students can view own cart" ON public.cart_items FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "Students can insert own cart items" ON public.cart_items FOR INSERT WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students can update own cart items" ON public.cart_items FOR UPDATE USING (student_id = auth.uid());
CREATE POLICY "Students can delete own cart items" ON public.cart_items FOR DELETE USING (student_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category, is_vegetarian, image_url, is_available) VALUES
  ('Chicken Biryani', 'Aromatic basmati rice cooked with tender chicken, spices, and herbs', 120, 'Main Course', false, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', true),
  ('Paneer Butter Masala', 'Cottage cheese cubes in rich tomato-based creamy gravy', 100, 'Main Course', true, 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400', true),
  ('Veg Sandwich', 'Fresh vegetables with cheese and mint chutney in grilled bread', 60, 'Breakfast', true, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400', true),
  ('Pizza Margherita', 'Classic Italian pizza with mozzarella cheese, tomatoes, and basil', 150, 'Fast Food', true, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', true),
  ('Chicken Burger', 'Juicy grilled chicken patty with lettuce, tomato, and special sauce', 110, 'Fast Food', false, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', true),
  ('Pasta Alfredo', 'Creamy fettuccine pasta with parmesan cheese and herbs', 130, 'Main Course', true, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', true),
  ('Chocolate Cake', 'Rich and moist chocolate cake with chocolate ganache', 80, 'Dessert', true, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400', true),
  ('Thali Special', 'Complete Indian meal with dal, vegetables, roti, rice, and dessert', 140, 'Main Course', true, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', true)
ON CONFLICT DO NOTHING;