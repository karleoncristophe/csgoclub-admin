import { useState, type FocusEvent } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Input } from '@/components/ui/Input'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useSignInMutation } from '@/redux/store/api/auth/api.auth'
import { setCredentials } from '@/redux/store/slices/securitySlice'
import { removeMe } from '@/redux/store/slices/meSlice'
import type { RootState } from '@/redux/store/store'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { maskEmail } from '@/utils/masks'

const loginSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Digite um e-mail válido')
    .required('E-mail é obrigatório'),
  password: Yup.string().required('Senha é obrigatória'),
  remember: Yup.boolean(),
})

type LoginFormValues = Yup.InferType<typeof loginSchema>

const initialValues: LoginFormValues = {
  email: '',
  password: '',
  remember: false,
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
  AUTH_ACCOUNT_INACTIVE:
    'Sua conta administrativa está inativa. Entre em contato com um administrador master.',
  RATE_LIMIT_EXCEEDED:
    'Muitas tentativas em pouco tempo. Aguarde e tente novamente.',
  UNKNOWN_ERROR: 'Nao foi possivel fazer login. Tente novamente.',
}

function normalizeLoginErrorMessage(error: unknown): string {
  const fallback = 'Nao foi possivel fazer login. Tente novamente.'

  if (error && typeof error === 'object' && 'status' in error && 'data' in error) {
    const data = (error as { data?: unknown }).data
    if (data && typeof data === 'object') {
      const payload = data as {
        code?: unknown
        message?: unknown
        retryAfterHuman?: unknown
      }
      const code = typeof payload.code === 'string' ? payload.code.trim() : ''
      const message = typeof payload.message === 'string' ? payload.message.trim() : ''
      const retryAfterHuman =
        typeof payload.retryAfterHuman === 'string'
          ? payload.retryAfterHuman.trim()
          : ''

      const resolvedCode = code || message
      if (resolvedCode && AUTH_ERROR_MESSAGES[resolvedCode]) {
        const base = AUTH_ERROR_MESSAGES[resolvedCode]
        if (resolvedCode === 'RATE_LIMIT_EXCEEDED' && retryAfterHuman) {
          return `${base} (${retryAfterHuman})`
        }
        return base
      }

      if (message) return message
    }
  }

  const raw = getErrorMessage(error).trim()
  if (!raw) return fallback
  if (AUTH_ERROR_MESSAGES[raw]) return AUTH_ERROR_MESSAGES[raw]
  if (
    raw === 'CredentialsSignin' ||
    raw === 'CallbackRouteError' ||
    raw === 'Configuration' ||
    raw.toLowerCase() === 'invalid credentials'
  ) {
    return AUTH_ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS
  }
  return raw
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        className="h-5 w-5 text-zinc-400 dark:text-zinc-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
        />
      </svg>
    )
  }
  return (
    <svg
      className="h-5 w-5 text-zinc-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const accessToken = useSelector((s: RootState) => s.security.accessToken)
  const isAuthenticated = Boolean(accessToken?.trim())
  const [signIn, { isLoading }] = useSignInMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const formik = useFormik<LoginFormValues>({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setSubmitError(null)
      try {
        const data = await signIn({
          email: values.email.trim().toLowerCase(),
          password: values.password,
        }).unwrap()
        dispatch(
          setCredentials({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }),
        )
        dispatch(removeMe())
        navigate('/dashboard')
      } catch (err) {
        setSubmitError(normalizeLoginErrorMessage(err))
      } finally {
        setSubmitting(false)
      }
    },
  })

  const handleEmailBlur = (e: FocusEvent<HTMLInputElement>) => {
    formik.setFieldValue('email', maskEmail(formik.values.email))
    formik.handleBlur(e)
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <Surface variant="loginShell">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:w-1/2">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt=""
            className="h-9 w-9 object-contain"
            draggable={false}
          />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            CS2Club
          </span>
        </div>
        <ThemeToggle />
      </header>

      <div className="grid min-h-dvh lg:grid-cols-2">
        <div className="relative flex flex-col justify-center px-5 py-24 sm:px-12 lg:px-16 xl:px-24">
          <Surface variant="loginCard" className="mx-auto lg:mx-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
              Painel administrativo
            </p>
            <ThemeText
              as="h1"
              tone="primary"
              className="mt-3 text-[2.15rem] font-semibold leading-[1.12] tracking-tight sm:text-5xl"
            >
              Controle a operação do <span className="text-accent">CS2Club</span>.
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="mt-2 text-sm">
              Entre com sua conta administrativa para continuar.
            </ThemeText>

          <form
            className="mt-8 flex flex-col gap-5"
            onSubmit={formik.handleSubmit}
            noValidate
          >
            <Input
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@empresa.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={handleEmailBlur}
              error={
                formik.touched.email && formik.errors.email
                  ? formik.errors.email
                  : undefined
              }
            />

            <Input
              label="Senha"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.password && formik.errors.password
                  ? formik.errors.password
                  : undefined
              }
              endAdornment={
                <button
                  type="button"
                  className={surfaceClass('ghostIconButton')}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <EyeIcon open={showPassword} />
                </button>
              }
            />

            {submitError ? (
              <p className={surfaceClass('errorBanner')}>{submitError}</p>
            ) : null}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Checkbox
                name="remember"
                label="Lembrar de mim"
                checked={formik.values.remember}
                onChange={formik.handleChange}
              />
            </div>

            <Button
              type="submit"
              className="mt-1 w-full"
              size="lg"
              isLoading={formik.isSubmitting || isLoading}
            >
              Entrar
            </Button>
          </form>
          </Surface>
        </div>

        <div className="relative hidden min-h-dvh overflow-hidden lg:block">
          <div className="login-mesh absolute inset-0" aria-hidden />
          <svg
            className="login-silk pointer-events-none absolute -inset-[18%] h-[136%] w-[136%]"
            viewBox="0 0 640 860"
            fill="none"
            aria-hidden
          >
            <defs>
              <linearGradient id="cs2SilkA" x1="12%" y1="8%" x2="92%" y2="88%">
                <stop offset="0%" stopColor="color-mix(in oklab, var(--accent) 78%, white)" />
                <stop offset="44%" stopColor="#38bdf8" />
                <stop offset="74%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="cs2SilkB" x1="80%" y1="0%" x2="10%" y2="100%">
                <stop offset="0%" stopColor="color-mix(in oklab, var(--accent) 85%, #22d3ee)" />
                <stop offset="58%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#fb923c" />
              </linearGradient>
              <filter id="cs2SilkBlur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="22" />
              </filter>
            </defs>
            <g filter="url(#cs2SilkBlur)">
              <path
                fill="url(#cs2SilkA)"
                d="M40 180C120 40 280 20 390 130C510 250 470 390 360 480C240 580 90 620 70 740C52 842 210 860 340 800C520 716 640 520 600 330C560 140 300 -20 80 40C-20 80 -20 280 40 180Z"
              />
              <path
                fill="url(#cs2SilkB)"
                opacity="0.72"
                d="M520 80C620 160 640 340 560 470C470 620 300 680 220 780C140 880 -40 820 40 680C120 540 280 520 340 400C400 280 360 140 250 80C140 20 400 -20 520 80Z"
              />
            </g>
          </svg>
          <div className="login-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/5 to-transparent" />
          <div className="absolute inset-x-10 bottom-12 z-10">
            <p className="max-w-md text-2xl font-semibold leading-tight text-white">
              Catálogo, caixas e operação em um só lugar.
            </p>
            <p className="mt-3 text-xs text-white/60">
              © {new Date().getFullYear()} CS2Club · Acesso restrito
            </p>
          </div>
        </div>
      </div>
    </Surface>
  )
}
