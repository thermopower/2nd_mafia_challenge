"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useSignupMutationWithError } from "@/features/auth/hooks/use-signup-mutation";
import { useLatestTermsVersionQueryWithError } from "@/features/auth/hooks/use-latest-terms-query";
import { SignupRequestSchema } from "@/features/auth/lib/signup-dto";

const signupFormSchema = SignupRequestSchema.omit({ termsVersionId: true })
  .extend({
    termsVersionId: z.string().optional().default(""),
    passwordConfirmation: z.string().min(6, {
      message: "비밀번호 확인은 최소 6자 이상이어야 합니다.",
    }),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "약관에 동의해야 합니다.",
    }),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirmation"],
  });

type SignupFormValues = z.infer<typeof signupFormSchema>;

export const SignupForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const signupMutation = useSignupMutationWithError();
  const termsQuery = useLatestTermsVersionQueryWithError();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
      fullName: "",
      mobilePhone: "",
      role: undefined,
      termsVersionId: "",
      termsAccepted: false,
    },
  });

  useEffect(() => {
    if (termsQuery.data?.id) {
      form.setValue("termsVersionId", termsQuery.data.id);
    }
  }, [termsQuery.data, form]);

  useEffect(() => {
    if (termsQuery.error) {
      console.error("Terms query error:", termsQuery.error);
    }
  }, [termsQuery.error]);

  const onSubmit = async (values: SignupFormValues) => {
    console.log("Form submitted with values:", values);

    let termsVersionId = values.termsVersionId;

    if (!termsVersionId && termsQuery.data?.id) {
      termsVersionId = termsQuery.data.id;
      console.log("Using terms version from query:", termsVersionId);
    }

    if (!termsVersionId) {
      console.error("No terms version available");
      toast({
        title: "오류",
        description: "약관 버전을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return;
    }

    const { passwordConfirmation, termsAccepted, ...payload } = values;
    payload.termsVersionId = termsVersionId;

    console.log("Submitting signup payload:", { ...payload, password: "***" });

    signupMutation.mutate(payload, {
      onSuccess: (data) => {
        console.log("Signup success:", data);
        toast({
          title: "회원가입 성공",
          description: "환영합니다!",
        });

        form.reset();

        if (data.role === "learner") {
          router.push("/courses");
        } else if (data.role === "instructor") {
          router.push("/instructor/dashboard");
        }
      },
      onError: (error) => {
        console.error("Signup error:", error);
        toast({
          title: "회원가입 실패",
          description:
            signupMutation.errorMessage ||
            "회원가입 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      },
    });
  };

  const showTermsLoading = termsQuery.isLoading;
  const termsVersionDisplay = termsQuery.data?.versionCode || "v1.0 (기본)";

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">회원가입</h1>
        <p className="text-muted-foreground">
          계정을 생성하여 시작하세요.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="example@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••" {...field} />
                </FormControl>
                <FormDescription>최소 6자 이상 입력하세요.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호 확인</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이름</FormLabel>
                <FormControl>
                  <Input placeholder="홍길동" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mobilePhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>휴대전화</FormLabel>
                <FormControl>
                  <Input placeholder="010-1234-5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>역할</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="역할을 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="learner">학습자</SelectItem>
                    <SelectItem value="instructor">강사</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="termsAccepted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={showTermsLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    약관에 동의합니다{" "}
                    <span className="text-muted-foreground text-sm">
                      (버전: {termsVersionDisplay})
                    </span>
                  </FormLabel>
                  <FormDescription>
                    {termsQuery.data?.description ||
                      "서비스 이용 약관 및 개인정보 처리방침에 동의합니다."}
                  </FormDescription>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? "가입 중..." : "가입하기"}
          </Button>
        </form>
      </Form>
    </div>
  );
};
