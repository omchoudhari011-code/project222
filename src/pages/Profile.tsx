import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, User, Mail, Hash, Building } from 'lucide-react';
import { getCurrentSession, getCurrentProfile, signOut, type Profile } from '@/lib/auth';
import { toast } from 'sonner';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, []);

  const checkAuthAndLoadProfile = async () => {
    const { session } = await getCurrentSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    const userProfile = await getCurrentProfile();
    setProfile(userProfile);
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
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Profile not found</p>
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
          <h1 className="text-lg font-semibold">Profile</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-primary text-white">
              <User className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl">{profile.full_name}</CardTitle>
            <p className="text-muted-foreground capitalize">{profile.role}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>

            {profile.role === 'student' && (
              <>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium">{profile.student_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{profile.department}</p>
                  </div>
                </div>
              </>
            )}

            {profile.role === 'admin' && (
              <>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Staff ID</p>
                    <p className="font-medium">{profile.staff_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-4">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cafeteria</p>
                    <p className="font-medium">{profile.cafeteria_name}</p>
                  </div>
                </div>
              </>
            )}

            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
