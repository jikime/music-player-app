"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signupSchema } from "@/lib/schemas"
import type { z } from "zod"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

type SignupFormData = z.infer<typeof signupSchema>

export default function SignUpPage() {
  const { isLoading } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // API 에러 처리
        if (result.message.includes("이미 사용 중인 이메일")) {
          setError("email", { 
            type: "manual", 
            message: "이미 사용 중인 이메일입니다." 
          })
        } else {
          // 다른 에러 메시지 처리
          setError("root", { 
            type: "manual", 
            message: result.message || "회원가입에 실패했습니다." 
          })
        }
        return
      }

      // 회원가입 성공
      toast.success("회원가입이 완료되었습니다!", {
        description: "로그인 페이지로 이동합니다.",
      })
      
      // 로그인 페이지로 이동
      setTimeout(() => {
        router.push("/auth/signin")
      }, 1500)
    } catch (error) {
      console.error(error)
      setError("root", { 
        type: "manual", 
        message: "회원가입 중 오류가 발생했습니다." 
      })
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-background ${
      isMobile ? 'px-3 py-4' : 'px-4'
    }`}>
      <div className={`w-full max-w-md bg-card rounded-lg border border-border shadow-lg ${
        isMobile ? 'space-y-4 p-6' : 'space-y-6 p-8'
      }`}>
        <div className={`text-center ${
          isMobile ? 'space-y-1' : 'space-y-2'
        }`}>
          <h1 className={`font-bold text-foreground ${
            isMobile ? 'text-xl' : 'text-2xl'
          }`}>회원가입</h1>
          <p className={`text-muted-foreground ${
            isMobile ? 'text-xs' : 'text-sm'
          }`}>아래 정보를 입력하여 계정을 만드세요</p>
        </div>

        {errors.root && (
          <div className={`bg-destructive/10 border border-destructive/20 text-destructive rounded-lg ${
            isMobile ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm'
          }`}>
            {errors.root.message}
          </div>
        )}

        <form className={isMobile ? 'space-y-3' : 'space-y-4'} onSubmit={handleSubmit(onSubmit)}>
          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <Label htmlFor="name" className={`font-medium text-foreground ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              이름
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              className={`${errors.name ? "border-destructive focus:ring-destructive" : ""} ${
                isMobile ? 'text-sm' : ''
              }`}
              {...register("name")}
            />
            {errors.name && (
              <p className={`text-destructive ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>{errors.name.message}</p>
            )}
          </div>

          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <Label htmlFor="email" className={`font-medium text-foreground ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              이메일
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              className={`${errors.email ? "border-destructive focus:ring-destructive" : ""} ${
                isMobile ? 'text-sm' : ''
              }`}
              {...register("email")}
            />
            {errors.email && (
              <p className={`text-destructive ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>{errors.email.message}</p>
            )}
          </div>

          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <Label htmlFor="password" className={`font-medium text-foreground ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              className={`${errors.password ? "border-destructive focus:ring-destructive" : ""} ${
                isMobile ? 'text-sm' : ''
              }`}
              {...register("password")}
            />
            {errors.password && (
              <p className={`text-destructive ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>{errors.password.message}</p>
            )}
          </div>

          <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
            <Label htmlFor="confirmPassword" className={`font-medium text-foreground ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              비밀번호 확인
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              className={`${errors.confirmPassword ? "border-destructive focus:ring-destructive" : ""} ${
                isMobile ? 'text-sm' : ''
              }`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className={`text-destructive ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            size={isMobile ? "sm" : "default"}
            disabled={isLoading}
          >
            {isLoading ? "처리 중..." : "가입하기"}
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
          className={`w-full flex items-center justify-center ${
            isMobile ? 'gap-2 text-sm' : 'gap-2'
          }`}
          size={isMobile ? "sm" : "default"}
          onClick={() => {
            // 구글 로그인 로직
          }}
          disabled={isLoading}
        >
          <svg className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} viewBox="0 0 24 24">
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
          구글 계정으로 가입
        </Button>

        <div className={`text-center text-muted-foreground ${
          isMobile ? 'text-xs' : 'text-sm'
        }`}>
          이미 계정이 있으신가요?{" "}
          <Link href="/signin" className="font-medium text-primary hover:text-primary/80 underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}
