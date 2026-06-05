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
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl dark:bg-brand-500/10" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-fuchsia-400/15 blur-3xl dark:bg-fuchsia-500/10" />
      </div>

      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        <Surface variant="loginCard">
          <div className="mb-8 text-center sm:text-left">
            <img
              src="/logo.png"
              alt="CS2Club"
              className="mb-4 h-12 w-12 object-contain"
              draggable={false}
            />
            <ThemeText
              as="h1"
              tone="primary"
              className="text-2xl font-semibold tracking-tight"
            >
              Entrar
              <span className="ml-2" aria-hidden>
                👋
              </span>
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="mt-2 text-sm">
              Painel administrativo CS2Club
            </ThemeText>
          </div>

          <form
            className="flex flex-col gap-5"
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
              className="w-full"
              size="lg"
              isLoading={formik.isSubmitting || isLoading}
            >
              Entrar
            </Button>
          </form>
        </Surface>
        <ThemeText as="p" tone="faint" className="mt-6 text-center text-xs">
          © {new Date().getFullYear()} CS2Club
        </ThemeText>
      </div>
    </Surface>
  )
}
