import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import { useProgress } from "@/hooks/use-progress";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, Award, Star, Save, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNow, formatDistance } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProfilePictureUpload } from "@/components/profile/profile-picture-upload";
import CustomAvatarDisplay from "@/components/avatar/custom-avatar-display";

// Define the form schema for account settings
const settingsFormSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(20, { message: 'Username cannot be longer than 20 characters' }),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
  email: z.string().email({ message: 'Please enter a valid email address' }).optional(),
  theme: z.enum(['light', 'dark', 'system']),
  notificationsEnabled: z.boolean(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
}).refine(data => {
  // If a new password is provided, ensure confirmation matches
  if (data.newPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function ProfilePage() {
  const { user, isLoading } = useAuth();
  const { favorites, isLoadingFavorites } = useFavorites();
  const { solvedRiddles, attemptedRiddles, isLoading: isLoadingProgress } = useProgress();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get tab from URL query parameter if present
  const getTabFromUrl = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get('tab');
    return ['favorites', 'history', 'picture', 'settings'].includes(tab || '') ? (tab || 'favorites') : 'favorites';
  };
  
  // Tabs
  const [activeTab, setActiveTab] = useState<string>(getTabFromUrl());
  
  // Form setup
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      username: user?.username || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      email: '', // User email isn't currently stored in the schema
      theme: 'light',
      notificationsEnabled: true,
      difficulty: 'medium',
    },
  });
  
  // Handle settings form submission
  const onSubmit = (values: SettingsFormValues) => {
    console.log('Settings form submitted', values);
    
    // Show success toast
    toast({
      title: 'Settings updated',
      description: 'Your account settings have been saved successfully.',
    });

    // Here you would typically make an API call to update the user's settings
    // apiRequest('PATCH', '/api/user/settings', values);
  };
  
  // Update URL when tab changes
  useEffect(() => {
    // Check if we need to update from URL
    const tabFromUrl = getTabFromUrl();
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [location]);
  
  // Redirect to auth page if not logged in
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    setLocation("/auth");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleRiddleClick = (riddleId: number) => {
    // For now, navigate to home since we don't have a specific riddle detail page
    setLocation("/");
  };
  
  // Format category styles
  const getCategoryStyles = (colorClass: string) => {
    switch (colorClass) {
      case 'blue': return 'bg-blue-100 text-blue-700';
      case 'green': return 'bg-green-100 text-green-700';
      case 'purple': return 'bg-purple-100 text-purple-700';
      case 'orange': return 'bg-orange-100 text-orange-700';
      case 'red': return 'bg-red-100 text-red-700';
      case 'yellow': return 'bg-yellow-100 text-yellow-700';
      case 'indigo': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <div className="container max-w-5xl px-4 md:px-6 py-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {user.username}'s Profile
        </h1>
      </div>
      
      {/* User Profile Picture */}
      <div className="flex justify-center mb-8">
        <CustomAvatarDisplay
          config={user.avatarConfig ? JSON.parse(user.avatarConfig) : null}
          username={user.username}
          profileImageUrl={user.profileImageUrl}
          size={120}
          className="shadow-lg"
        />
      </div>
      
      {/* Tabs for Favorites, History, Picture, Settings */}
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => {
          setActiveTab(value);
          // Update URL with tab parameter
          const newUrl = new URL(window.location.href);
          if (value === 'favorites') {
            newUrl.searchParams.delete('tab');
          } else {
            newUrl.searchParams.set('tab', value);
          }
          window.history.pushState({}, '', newUrl.toString());
        }} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="picture">Picture</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Favorites Tab */}
        <TabsContent value="favorites">
          {/* User Stats */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Award className="h-5 w-5 inline-block mr-2 text-yellow-500" />
                  Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.score}</p>
                <p className="text-sm text-muted-foreground">Points earned</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Star className="h-5 w-5 inline-block mr-2 text-blue-500" />
                  Solved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.solvedCount}</p>
                <p className="text-sm text-muted-foreground">Riddles completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Clock className="h-5 w-5 inline-block mr-2 text-green-500" />
                  Avg. Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.avgTimeSeconds}s</p>
                <p className="text-sm text-muted-foreground">Average solve time</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Your Favorites</h2>
            
            {isLoadingFavorites ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !favorites || favorites.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>You haven't favorited any riddles yet!</p>
                <p className="mt-2">Browse riddles and click the heart icon to add them here.</p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.isArray(favorites) && favorites.map((favorite) => (
                  <Card key={favorite.id} className="cursor-pointer hover:shadow-md transition-shadow"
                       onClick={() => handleRiddleClick(favorite.riddle.id)}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between">
                        <Badge className={getCategoryStyles(favorite.riddle.category.colorClass)}>
                          {favorite.riddle.category.name}
                        </Badge>
                        <Badge variant="outline">
                          {favorite.riddle.difficulty.charAt(0).toUpperCase() + favorite.riddle.difficulty.slice(1)}
                        </Badge>
                      </div>
                      <CardTitle className="text-md mt-2 line-clamp-1">
                        {favorite.riddle.question}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Added {formatDistanceToNow(new Date(favorite.addedAt || Date.now()), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* History Tab */}
        <TabsContent value="history">
          {/* User Stats */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Award className="h-5 w-5 inline-block mr-2 text-yellow-500" />
                  Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.score}</p>
                <p className="text-sm text-muted-foreground">Points earned</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Star className="h-5 w-5 inline-block mr-2 text-blue-500" />
                  Solved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.solvedCount}</p>
                <p className="text-sm text-muted-foreground">Riddles completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Clock className="h-5 w-5 inline-block mr-2 text-green-500" />
                  Avg. Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.avgTimeSeconds}s</p>
                <p className="text-sm text-muted-foreground">Average solve time</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-bold mb-4">Your Activity History</h2>
            
            {isLoadingProgress ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (!solvedRiddles.length && !attemptedRiddles.length) ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>You haven't solved or attempted any riddles yet!</p>
                <p className="mt-2">Start playing to see your activity here.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Solved Riddles Section */}
                {solvedRiddles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                      Solved Riddles
                    </h3>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {solvedRiddles.map((progress) => (
                        <Card key={progress.id} className="cursor-pointer hover:shadow-md transition-shadow"
                             onClick={() => handleRiddleClick(progress.riddleId)}>
                          <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between">
                              <Badge className={getCategoryStyles(progress.riddle.category.colorClass)}>
                                {progress.riddle.category.name}
                              </Badge>
                              <Badge variant="outline">
                                {progress.riddle.difficulty.charAt(0).toUpperCase() + progress.riddle.difficulty.slice(1)}
                              </Badge>
                            </div>
                            <CardTitle className="text-md mt-2 line-clamp-1">
                              {progress.riddle.question}
                            </CardTitle>
                            <CardDescription className="text-xs flex justify-between items-center">
                              <span>Solved {progress.solvedAt ? formatDistanceToNow(new Date(progress.solvedAt), { addSuffix: true }) : 'recently'}</span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {progress.timeToSolveSeconds ? `${progress.timeToSolveSeconds}s` : 'N/A'}
                              </span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0 pb-4 px-4">
                            {progress.hintsUsed && progress.hintsUsed > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Used {progress.hintsUsed} hint{progress.hintsUsed > 1 ? 's' : ''}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Attempted Riddles Section */}
                {attemptedRiddles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <XCircle className="h-5 w-5 mr-2 text-amber-500" />
                      Attempted Riddles
                    </h3>
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {attemptedRiddles.map((progress) => (
                        <Card key={progress.id} className="cursor-pointer hover:shadow-md transition-shadow"
                             onClick={() => handleRiddleClick(progress.riddleId)}>
                          <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between">
                              <Badge className={getCategoryStyles(progress.riddle.category.colorClass)}>
                                {progress.riddle.category.name}
                              </Badge>
                              <Badge variant="outline">
                                {progress.riddle.difficulty.charAt(0).toUpperCase() + progress.riddle.difficulty.slice(1)}
                              </Badge>
                            </div>
                            <CardTitle className="text-md mt-2 line-clamp-1">
                              {progress.riddle.question}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0 pb-4 px-4">
                            {progress.hintsUsed && progress.hintsUsed > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Used {progress.hintsUsed} hint{progress.hintsUsed > 1 ? 's' : ''}
                              </div>
                            )}
                            <div className="mt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRiddleClick(progress.riddleId);
                                }}
                              >
                                Continue Solving
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Profile Picture Tab */}
        <TabsContent value="picture">
          {/* User Stats */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Award className="h-5 w-5 inline-block mr-2 text-yellow-500" />
                  Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.score}</p>
                <p className="text-sm text-muted-foreground">Points earned</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Star className="h-5 w-5 inline-block mr-2 text-blue-500" />
                  Solved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.solvedCount}</p>
                <p className="text-sm text-muted-foreground">Riddles completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Clock className="h-5 w-5 inline-block mr-2 text-green-500" />
                  Avg. Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.avgTimeSeconds}s</p>
                <p className="text-sm text-muted-foreground">Average solve time</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Change Profile Picture</h2>
            <ProfilePictureUpload
              currentImageUrl={user.profileImageUrl}
              username={user.username}
              onUploadComplete={(imageUrl) => {
                // The mutation will handle cache invalidation and update the main profile picture
                console.log('Profile picture uploaded:', imageUrl);
              }}
            />
          </div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings">
          {/* User Stats */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Award className="h-5 w-5 inline-block mr-2 text-yellow-500" />
                  Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.score}</p>
                <p className="text-sm text-muted-foreground">Points earned</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Star className="h-5 w-5 inline-block mr-2 text-blue-500" />
                  Solved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.solvedCount}</p>
                <p className="text-sm text-muted-foreground">Riddles completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Clock className="h-5 w-5 inline-block mr-2 text-green-500" />
                  Avg. Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{user.avgTimeSeconds}s</p>
                <p className="text-sm text-muted-foreground">Average solve time</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Account Settings</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                  {/* Profile Information Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Information</CardTitle>
                      <CardDescription>
                        Update your account profile details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Your username" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is your public display name
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Your email" {...field} />
                            </FormControl>
                            <FormDescription>
                              We'll use this for notifications
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Password Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Change Password</CardTitle>
                      <CardDescription>
                        Update your password to keep your account secure
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Preferences Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Game Preferences</CardTitle>
                    <CardDescription>
                      Customize your gaming experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Choose how Burble looks for you
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Difficulty</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a difficulty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Set your preferred challenge level
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notificationsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Notifications</FormLabel>
                            <FormDescription>
                              Receive updates about new riddles and features
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full md:w-auto">
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}