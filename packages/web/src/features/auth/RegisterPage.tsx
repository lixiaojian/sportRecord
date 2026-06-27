import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerSchema } from '@sport-record/shared';
import { useRegister } from '../../lib/hooks/useAuth';
import { ApiError } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = registerSchema.safeParse({
      username,
      password,
      nickname: nickname || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '输入有误');
      return;
    }
    try {
      await register.mutateAsync(parsed.data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '注册失败，请重试');
    }
  }

  return (
    <div className="mx-auto mt-12 max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">注册</h1>
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
          hint="至少 8 位，含字母和数字"
          inputProps={{
            value: password,
            onChange: (e) => setPassword(e.target.value),
            autoComplete: 'new-password',
          }}
        />
        <FormField
          id="nickname"
          label="昵称（可选）"
          inputProps={{ value: nickname, onChange: (e) => setNickname(e.target.value) }}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={register.isPending}>
          {register.isPending ? '注册中…' : '注册'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        已有账号？{' '}
        <Link to="/login" className="text-primary underline-offset-4 hover:underline">
          登录
        </Link>
      </p>
    </div>
  );
}
