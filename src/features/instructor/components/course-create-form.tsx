"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateCourseMutation } from "../hooks/useCreateCourseMutation";
import {
  INSTRUCTOR_COURSE_CATEGORIES,
  INSTRUCTOR_COURSE_DIFFICULTIES,
} from "../constants/course-options";
import { extractApiErrorMessage } from "@/lib/remote/api-client";

const courseFormSchema = z.object({
  title: z
    .string()
    .min(1, "제목은 필수입니다")
    .max(200, "제목은 200자 이하여야 합니다"),
  description: z
    .string()
    .min(1, "설명은 필수입니다")
    .max(5000, "설명은 5000자 이하여야 합니다"),
  category: z.string().min(1, "카테고리를 선택해주세요"),
  difficulty: z.string().min(1, "난이도를 선택해주세요"),
  thumbnailUrl: z
    .string()
    .url("유효한 URL을 입력해주세요")
    .nullable()
    .optional()
    .or(z.literal("")),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

export const CourseCreateForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateCourseMutation();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      difficulty: "",
      thumbnailUrl: "",
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    try {
      const result = await createMutation.mutateAsync({
        ...data,
        thumbnailUrl: data.thumbnailUrl || null,
      });

      toast({
        title: "코스 생성 성공",
        description: "새 코스가 성공적으로 생성되었습니다.",
      });

      // 생성된 코스의 상세 페이지로 이동
      router.push(`/instructor/courses/${result.id}`);
    } catch (error) {
      const message = extractApiErrorMessage(error, "코스 생성에 실패했습니다.");
      toast({
        title: "코스 생성 실패",
        description: message,
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>코스 제목 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="예: Next.js 완벽 가이드"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>코스 설명 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="코스에 대한 상세한 설명을 입력하세요"
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                학습자가 이 코스에서 무엇을 배울 수 있는지 설명해주세요
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>카테고리 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INSTRUCTOR_COURSE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
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
                <FormLabel>난이도 *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="난이도 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INSTRUCTOR_COURSE_DIFFICULTIES.map((difficulty) => (
                      <SelectItem
                        key={difficulty.value}
                        value={difficulty.value}
                      >
                        {difficulty.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>썸네일 URL (선택)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                비워두면 기본 placeholder 이미지가 사용됩니다
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/instructor/dashboard")}
            disabled={createMutation.isPending}
          >
            취소
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            코스 생성
          </Button>
        </div>
      </form>
    </Form>
  );
};
