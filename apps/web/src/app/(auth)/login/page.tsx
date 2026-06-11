import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Moderation Platform</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>
        <div className="card">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          Demo accounts: admin@platform.com / admin123 &bull; mod1@platform.com / mod123
        </p>
      </div>
    </main>
  );
}
