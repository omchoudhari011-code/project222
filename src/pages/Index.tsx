import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UtensilsCrossed, ShoppingBag, Clock, Bell } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-16 text-center">
        <div className="mb-8 inline-block rounded-full bg-primary/10 px-6 py-2">
          <p className="text-sm font-semibold text-primary">Smart Cafeteria System</p>
        </div>
        
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl">
          Order Food,
          <br />
          <span className="bg-gradient-primary bg-clip-text text-transparent">Skip the Line</span>
        </h1>
        
        <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
          Browse menu, place orders, and track your food in real-time. 
          The smartest way to manage your campus cafeteria experience.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button 
            size="lg" 
            className="bg-gradient-primary text-lg shadow-lg-primary hover:opacity-90"
            onClick={() => navigate('/auth')}
          >
            Get Started
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/menu')}
          >
            View Menu
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<UtensilsCrossed className="h-8 w-8" />}
            title="Browse Menu"
            description="Explore delicious meals from Main Course, Fast Food, Breakfast to Desserts"
          />
          <FeatureCard
            icon={<ShoppingBag className="h-8 w-8" />}
            title="Easy Ordering"
            description="Add items to cart and checkout with multiple payment options"
          />
          <FeatureCard
            icon={<Clock className="h-8 w-8" />}
            title="Track Orders"
            description="Real-time updates from order placed to ready for pickup"
          />
          <FeatureCard
            icon={<Bell className="h-8 w-8" />}
            title="Notifications"
            description="Get instant alerts about your order status and special offers"
          />
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="rounded-2xl bg-gradient-primary p-12 text-center text-white">
          <h2 className="mb-4 text-3xl font-bold">Ready to Experience Smart Dining?</h2>
          <p className="mb-8 text-lg text-white/90">
            Join thousands of students and staff enjoying hassle-free cafeteria service
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/auth')}
          >
            Sign Up Now
          </Button>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="rounded-xl border bg-card p-6 shadow-card transition-all hover:shadow-lg-primary">
    <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-semibold text-card-foreground">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
