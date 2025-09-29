import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Define the form schema
const submitRiddleSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters").max(500, "Question cannot exceed 500 characters"),
  answer: z.string().min(1, "Answer is required").max(100, "Answer cannot exceed 100 characters"),
  explanation: z.string().optional().nullable(),
  hint: z.string().optional().nullable(),
  categoryId: z.string().refine(val => !isNaN(parseInt(val, 10)), { message: "Category is required" }),
  difficulty: z.enum(["easy", "medium", "hard", "extreme"]),
  // Making imageUrl completely optional - accepts empty string, valid URL or null
  imageUrl: z.union([
    z.string().url("If provided, must be a valid URL"),
    z.string().max(0),  // Empty string is valid
    z.null()
  ]).optional(),
  creatorName: z.string().min(2, "Creator name must be at least 2 characters").max(30, "Creator name cannot exceed 30 characters"),
});

type FormValues = z.infer<typeof submitRiddleSchema>;

export default function SubmitRiddleForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery<{id: number, name: string}[]>({
    queryKey: ['/api/categories'],
  });

  // Define form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(submitRiddleSchema),
    defaultValues: {
      question: "",
      answer: "",
      explanation: "",
      hint: "",
      categoryId: "",
      difficulty: "medium",
      imageUrl: "",
      creatorName: "",
    },
  });
  
  // Type-safe field value extractor
  const getFieldProps = (field: any) => {
    const { onChange, onBlur, name, ref } = field;
    return {
      onChange,
      onBlur,
      name,
      ref,
      // Convert null/undefined to empty string for form inputs
      value: field.value === null || field.value === undefined ? "" : field.value
    };
  };

  // Submit mutation
  const submitRiddleMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Process imageUrl - if empty string, set to null
      const imageUrl = values.imageUrl === "" ? null : values.imageUrl;
      
      const parsedValues = {
        ...values,
        imageUrl,
        categoryId: parseInt(values.categoryId, 10),
      };
      
      const response = await apiRequest(
        "POST",
        "/api/riddles/submit",
        parsedValues
      );
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Riddle Submitted!",
          description: data.message || "Your riddle has been submitted successfully.",
          duration: 5000,
        });
        
        // Reset form
        form.reset();
        
        // Refresh riddles list
        queryClient.invalidateQueries({ queryKey: ['/api/riddles'] });
        queryClient.invalidateQueries({ queryKey: ['/api/riddles/with-categories'] });
        queryClient.invalidateQueries({ queryKey: ['/api/user/1/stats'] });
      } else {
        toast({
          title: "Submission Failed",
          description: data.message || "There was an error submitting your riddle.",
          variant: "destructive",
        });
      }
      
      setIsSubmitting(false);
    },
    onError: (error) => {
      toast({
        title: "Submission Error",
        description: "There was a problem connecting to the server. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    submitRiddleMutation.mutate(values);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Submit Your Riddle</h2>
      <p className="text-center text-muted-foreground mb-6">
        Create your own riddle and earn 10 points! Be creative and challenge other players.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Question */}
          <FormField
            control={form.control}
            name="question"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Riddle Question</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Write your riddle question here..."
                    className="min-h-[100px]"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Be clear but clever. A good riddle should be challenging but solvable.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Answer */}
          <FormField
            control={form.control}
            name="answer"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Answer</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="The solution to your riddle"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  The correct answer to your riddle. Be specific.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Category and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Category</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Difficulty</FormLabel>
                  <Select
                    disabled={isSubmitting}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="extreme">Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Hint */}
          <FormField
            control={form.control}
            name="hint"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Hint (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...getFieldProps(field)}
                    placeholder="Provide a helpful hint"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  A clue to help players solve your riddle.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Explanation */}
          <FormField
            control={form.control}
            name="explanation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Explanation (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...getFieldProps(field)}
                    placeholder="Explain the answer..."
                    className="min-h-[80px]"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Explain why your answer is correct or provide additional context.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image URL */}
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Image URL (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...getFieldProps(field)}
                    placeholder="https://example.com/image.jpg"
                    type="url"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  For visual riddles, provide a direct URL to your image. You can leave this empty.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Creator Name */}
          <FormField
            control={form.control}
            name="creatorName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Creator Name</FormLabel>
                <FormControl>
                  <Input
                    {...getFieldProps(field)}
                    placeholder="Your name or nickname"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>
                  Let others know who created this riddle.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Riddle"}
          </Button>
        </form>
      </Form>
    </div>
  );
}