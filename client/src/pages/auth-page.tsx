import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useFirebase } from "@/hooks/use-firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Redirect } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Brain } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Login form validation schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

// Registration form validation schema with password confirmation
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, isGuest, loginMutation, registerMutation, playAsGuest } = useAuth();
  const { firebaseUser, userProfile, signInWithGoogle } = useFirebase();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");

  // Login form
  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = (values: LoginValues) => {
    loginMutation.mutate(values);
  };

  const onRegisterSubmit = (values: RegisterValues) => {
    // Extract confirmPassword before sending to API
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome!",
        description: "You've successfully signed in with Google. Your progress will be saved to the cloud!",
      });
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "There was an error signing in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Redirect if the user is already logged in or in guest mode
  if (user || isGuest || firebaseUser) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-cyan-50">
      {/* Left side - Hero section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-6 md:p-8 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="max-w-lg text-white relative">
          <div className="mb-6 md:mb-8 flex items-center justify-center md:justify-start">
            <div className="bg-white/20 p-3 rounded-full mr-4">
              <Brain size={40} className="text-yellow-200" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text text-transparent">Burble</h1>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-center md:text-left">
            🧠 Train Your Brain with Challenging Puzzles! 🚀
          </h2>
          <p className="text-base md:text-lg mb-6 md:mb-8 text-center md:text-left text-white/95">
            🎯 Join thousands of users who are improving their cognitive skills with our collection of brain teasers, riddles, and word games.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white/30 backdrop-blur-sm p-6 rounded-3xl border-2 border-white/20 hover:bg-white/40 transition-all duration-300 transform hover:scale-105 min-h-[160px] flex flex-col justify-center">
              <h3 className="font-bold text-lg md:text-xl mb-3 text-center">🎮 Multiple Game Modes</h3>
              <p className="text-sm md:text-base text-center text-white/95">From word puzzles to logic challenges, we have games for every type of thinker.</p>
            </div>
            <div className="bg-white/30 backdrop-blur-sm p-6 rounded-3xl border-2 border-white/20 hover:bg-white/40 transition-all duration-300 transform hover:scale-105 min-h-[160px] flex flex-col justify-center">
              <h3 className="font-bold text-lg md:text-xl mb-3 text-center">📊 Track Progress</h3>
              <p className="text-sm md:text-base text-center text-white/95">See your improvement over time with detailed statistics and achievements.</p>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 left-4 text-2xl opacity-20 animate-bounce">⭐</div>
        <div className="absolute top-4 right-4 text-2xl opacity-20 animate-bounce delay-500">💫</div>
        <div className="absolute bottom-4 left-1/4 text-xl opacity-20 animate-bounce delay-1000">✨</div>
      </div>

      {/* Right side - Auth forms */}
      <div className="w-full md:w-1/2 p-6 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl border-2 border-purple-200 rounded-3xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-full w-fit">
              <span className="text-2xl">🎮</span>
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome to Burble! 🎯
            </CardTitle>
            <CardDescription className="text-center text-gray-600 text-base md:text-lg">
              🚀 Sign in to your account or create a new one to start your brain training journey!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Firebase Google Sign In */}
            <div className="space-y-4 mb-6">
              <Button 
                onClick={handleGoogleSignIn}
                className="w-full bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                variant="outline"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign in with Google (Cloud Save)
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or use local account
                  </span>
                </div>
              </div>
            </div>

            <Tabs 
              defaultValue="login" 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={playAsGuest}
            >
              Play as Guest
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {activeTab === "login" ? (
                "Don't have an account? Click Register above."
              ) : (
                "Already have an account? Click Login above."
              )}
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}