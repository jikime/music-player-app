"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema } from "@/lib/schemas"
import type { z } from "zod"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type LoginFormData = z.infer<typeof loginSchema>

export default function SignInPage() {
  const { login, loginWithGoogle, error: authError, isLoading } = useAuth()
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data);
      
      if (result.success) {
        toast.success("로그인에 성공했습니다!");
        router.push("/");
      } else {
        setError("root", { 
          type: "manual", 
          message: result.message 
        });
      }
    } catch (error) {
      setError("root", { 
        type: "manual", 
        message: "로그인 중 오류가 발생했습니다." 
      });
    }
  }

  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md space-y-6 p-8 bg-card rounded-lg border border-border shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">로그인</h1>
          <p className="text-sm text-muted-foreground">아래 정보를 입력하여 로그인해주세요.</p>
        </div>

        {errors.root && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
            {errors.root.message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              이메일
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              className={errors.email ? "border-destructive focus:ring-destructive" : ""}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-foreground">
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              className={errors.password ? "border-destructive focus:ring-destructive" : ""}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "처리 중..." : "로그인"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">또는</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          구글 계정으로 로그인
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="font-medium text-primary hover:text-primary/80 underline">
            회원 가입
          </Link>
        </div>
      </div>
    </div>
  )
}
