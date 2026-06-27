import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginSchema } from '@sport-record/shared';
import { useLogin } from '../../lib/hooks/useAuth';
import { ApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const login = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ username, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '输入有误');
      return;
    }
    try {
      await login.mutateAsync(parsed.data);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '登录失败，请重试');
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">登录</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          id="username"
          label="用户名"
          inputProps={{
            value: username,
            onChange: (e) => setUsername(e.target.value),
            autoComplete: 'username',
          }}
        />
        <FormField
          id="password"
          label="密码"
          type="password"
          inputProps={{
            value: password,
            onChange: (e) => setPassword(e.target.value),
            autoComplete: 'current-password',
          }}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? '登录中…' : '登录'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        没有账号？{' '}
        <Link to="/register" className="text-primary underline-offset-4 hover:underline">
          注册
        </Link>
      </p>
    </div>
  );
}
