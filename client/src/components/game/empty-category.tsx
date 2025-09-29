import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type EmptyCategoryProps = {
  categoryName: string;
  description: string;
  actionLink?: string;
  actionText?: string;
};

export default function EmptyCategory({
  categoryName,
  description,
  actionLink,
  actionText
}: EmptyCategoryProps) {
  return (
    <Card className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{categoryName}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <div className="py-10 flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4 text-gray-300">
            <i className="ri-inbox-line"></i>
          </div>
          <p className="text-gray-500 mb-6">{description}</p>
          
          {actionLink && actionText && (
            <Link href={actionLink}>
              <Button className="bg-primary hover:bg-primary/90">
                {actionText}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}