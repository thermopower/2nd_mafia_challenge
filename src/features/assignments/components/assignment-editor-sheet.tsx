"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCreateAssignment } from "../hooks/useCreateAssignment";
import { useUpdateAssignment } from "../hooks/useUpdateAssignment";
import { AssignmentDetail } from "../lib/dto";

const formSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  description: z.string().min(1, "설명을 입력해주세요"),
  dueAt: z.date({
    required_error: "마감일을 선택해주세요",
  }).refine((date) => date > new Date(), "마감일은 현재 이후여야 합니다"),
  weight: z.number().min(0).max(100, "점수 비중은 0~100 사이여야 합니다"),
  allowLate: z.boolean(),
  allowResubmission: z.boolean(),
  gradingRubric: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

interface AssignmentEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  assignment?: AssignmentDetail;
  mode: "create" | "edit";
}

export function AssignmentEditorSheet({
  open,
  onOpenChange,
  courseId,
  assignment,
  mode,
}: AssignmentEditorSheetProps) {
  const createMutation = useCreateAssignment(courseId);
  const updateMutation = useUpdateAssignment(
    assignment?.id || "",
    courseId
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: assignment
      ? {
          title: assignment.title,
          description: assignment.description,
          dueAt: new Date(assignment.dueAt),
          weight: assignment.weight,
          allowLate: assignment.allowLate,
          allowResubmission: assignment.allowResubmission,
          gradingRubric: assignment.gradingRubric || "",
        }
      : {
          title: "",
          description: "",
          dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          weight: 10,
          allowLate: false,
          allowResubmission: false,
          gradingRubric: "",
        },
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      dueAt: values.dueAt.toISOString(),
    };

    if (mode === "create") {
      await createMutation.mutateAsync(payload);
    } else {
      await updateMutation.mutateAsync(payload);
    }

    onOpenChange(false);
    form.reset();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {mode === "create" ? "새 과제 생성" : "과제 수정"}
          </SheetTitle>
          <SheetDescription>
            {mode === "create"
              ? "새로운 과제를 생성합니다."
              : "과제 정보를 수정합니다."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input placeholder="과제 제목" {...field} />
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
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="과제 설명"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>마감일</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>날짜 선택</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>점수 비중 (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    전체 성적에서 이 과제가 차지하는 비중 (0~100)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowLate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">지각 제출 허용</FormLabel>
                    <FormDescription>
                      마감일 이후에도 제출을 허용합니다
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

            <FormField
              control={form.control}
              name="allowResubmission"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">재제출 허용</FormLabel>
                    <FormDescription>
                      학습자가 여러 번 제출할 수 있습니다
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

            <FormField
              control={form.control}
              name="gradingRubric"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>채점 기준 (선택)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="채점 기준을 입력하세요"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1"
              >
                {mode === "create" ? "생성" : "수정"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
