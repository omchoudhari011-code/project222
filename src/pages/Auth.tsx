import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { signIn, signUp, getCurrentSession, type UserRole } from '@/lib/auth';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('student');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { session } = await getCurrentSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { data, error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      toast.success('Signed in successfully!');
      
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('full_name') as string;
    
    const additionalData: any = {};
    if (role === 'student') {
      additionalData.student_id = formData.get('student_id') as string;
      additionalData.department = formData.get('department') as string;
    } else {
      additionalData.staff_id = formData.get('staff_id') as string;
      additionalData.cafeteria_name = formData.get('cafeteria_name') as string;
    }

    const { data, error } = await signUp(email, password, fullName, role, additionalData);

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    if (data.user) {
      toast.success('Account created successfully!');
      
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="shadow-lg-primary">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary">
              <UtensilsCrossed className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Smart AI Cafeteria</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">I am a</Label>
                    <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      type="text"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  {role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="student_id">Student ID</Label>
                        <Input
                          id="student_id"
                          name="student_id"
                          type="text"
                          placeholder="ST12345"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          name="department"
                          type="text"
                          placeholder="Computer Science"
                          required
                        />
                      </div>
                    </>
                  )}

                  {role === 'admin' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="staff_id">Staff ID</Label>
                        <Input
                          id="staff_id"
                          name="staff_id"
                          type="text"
                          placeholder="STAFF001"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cafeteria_name">Cafeteria Name</Label>
                        <Input
                          id="cafeteria_name"
                          name="cafeteria_name"
                          type="text"
                          placeholder="Main Campus Cafeteria"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      minLength={6}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
