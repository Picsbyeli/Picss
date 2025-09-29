import { type Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type RiddleCategoriesProps = {
  categories: Category[];
  selectedCategory: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  isLoading: boolean;
};

export default function RiddleCategories({
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading
}: RiddleCategoriesProps) {
  if (isLoading) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold font-poppins text-dark mb-3">Categories</h2>
        <div className="flex overflow-x-auto pb-2 space-x-3">
          <Skeleton className="h-10 w-24 rounded-full flex-shrink-0" />
          <Skeleton className="h-10 w-32 rounded-full flex-shrink-0" />
          <Skeleton className="h-10 w-28 rounded-full flex-shrink-0" />
          <Skeleton className="h-10 w-30 rounded-full flex-shrink-0" />
        </div>
      </div>
    );
  }
  
  // All categories are enabled
  const disableNonSelected = false;

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold font-poppins text-dark mb-3">Categories</h2>
      <div className="flex overflow-x-auto pb-2 space-x-3 scrollbar-hide">
        {/* Only show All Types if we're not currently viewing Fan Made */}
        {!disableNonSelected && (
          <button 
            className={cn(
              "category-pill flex-shrink-0 transition-all duration-200 px-4 py-2 rounded-full",
              selectedCategory === null 
                ? "bg-primary text-white" 
                : "bg-white border border-light-gray hover:bg-light text-dark-light"
            )}
            onClick={() => onSelectCategory(null)}
          >
            All Types
          </button>
        )}
        
        {categories.map((category) => (
          <button 
            key={category.id}
            className={cn(
              "category-pill flex-shrink-0 transition-all duration-200 px-4 py-2 rounded-full",
              selectedCategory === category.id
                ? "bg-primary text-white" 
                : "bg-white border border-light-gray hover:bg-light text-dark-light"
            )}
            onClick={() => onSelectCategory(category.id)}
            disabled={disableNonSelected && category.id !== selectedCategory}
            style={{
              opacity: disableNonSelected && category.id !== selectedCategory ? 0.5 : 1
            }}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
