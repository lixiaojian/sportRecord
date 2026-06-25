import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateProfileSchema,
  changePasswordSchema,
  RACKET_HAND_VALUES,
  MAIN_EVENT_VALUES,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from '@sport-record/shared';
import { useCurrentUser, useLogout } from '../../lib/hooks/useAuth';
import { useUpdateProfile, useChangePassword } from './hooks';
import { useTheme, type Theme } from '../../components/theme/ThemeProvider';
import { ApiError } from '../../lib/api';
import { RACKET_HAND_LABELS, MAIN_EVENT_LABELS } from '../../lib/labels';
import { Button } from '../../components/ui/button';
import { Input, Textarea, Select, Label, FieldError } from '../../components/ui/form-controls';

export function SettingsPage() {
  const user = useCurrentUser();
  const logout = useLogout();

  if (!user) return null;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">设置</h1>

      <ProfileSection />
      <PasswordSection />
      <ThemeSection />
      <ThemeDangerZone onLogout={() => logout.mutate()} />
    </div>
  );
}

function ProfileSection() {
  const user = useCurrentUser()!;
  const update = useUpdateProfile();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      nickname: user.nickname,
      avatar: user.avatar ?? '',
      bio: user.bio ?? '',
      defaultPublic: user.defaultPublic,
      racketHand: user.racketHand,
      mainEvent: user.mainEvent,
    },
  });

  async function onSubmit(data: UpdateProfileInput) {
    setServerError(null);
    setSaved(false);
    try {
      await update.mutateAsync(data);
      setSaved(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : '保存失败，请重试');
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">个人资料</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="nickname">昵称</Label>
          <Input id="nickname" {...register('nickname')} />
          <FieldError>{errors.nickname?.message}</FieldError>
        </div>
        <div className="space-y-1">
          <Label htmlFor="avatar">头像 URL</Label>
          <Input id="avatar" {...register('avatar')} placeholder="https://…" />
          <FieldError>{errors.avatar?.message}</FieldError>
        </div>
        <div className="space-y-1">
          <Label htmlFor="bio">简介</Label>
          <Textarea id="bio" {...register('bio')} />
          <FieldError>{errors.bio?.message}</FieldError>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="racketHand">持拍手</Label>
            <Select id="racketHand" {...register('racketHand')}>
              <option value="">未设置</option>
              {RACKET_HAND_VALUES.map((h) => (
                <option key={h} value={h}>
                  {RACKET_HAND_LABELS[h]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="mainEvent">主项</Label>
            <Select id="mainEvent" {...register('mainEvent')}>
              <option value="">未设置</option>
              {MAIN_EVENT_VALUES.map((m) => (
                <option key={m} value={m}>
                  {MAIN_EVENT_LABELS[m]}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('defaultPublic')} />
          默认公开我发布的记录
        </label>
        {serverError && <FieldError>{serverError}</FieldError>}
        {saved && <p className="text-sm text-emerald-600">已保存</p>}
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? '保存中…' : '保存资料'}
        </Button>
      </form>
    </section>
  );
}

function PasswordSection() {
  const change = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '' },
  });

  async function onSubmit(data: ChangePasswordInput) {
    setServerError(null);
    setSaved(false);
    try {
      await change.mutateAsync(data);
      setSaved(true);
      reset({ oldPassword: '', newPassword: '' });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : '修改失败，请重试');
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">修改密码</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 rounded-md border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="oldPassword">旧密码</Label>
          <Input id="oldPassword" type="password" {...register('oldPassword')} />
          <FieldError>{errors.oldPassword?.message}</FieldError>
        </div>
        <div className="space-y-1">
          <Label htmlFor="newPassword">新密码</Label>
          <Input id="newPassword" type="password" {...register('newPassword')} />
          <FieldError>{errors.newPassword?.message}</FieldError>
          <p className="text-xs text-muted-foreground">至少 8 位，需含字母与数字</p>
        </div>
        {serverError && <FieldError>{serverError}</FieldError>}
        {saved && <p className="text-sm text-emerald-600">密码已修改</p>}
        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? '提交中…' : '修改密码'}
        </Button>
      </form>
    </section>
  );
}

function ThemeSection() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string }[] = [
    { value: 'light', label: '浅色' },
    { value: 'dark', label: '深色' },
    { value: 'system', label: '跟随系统' },
  ];
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">主题</h2>
      <div className="flex gap-2 rounded-md border bg-card p-4">
        {options.map((o) => (
          <Button
            key={o.value}
            variant={theme === o.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme(o.value)}
          >
            {o.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

function ThemeDangerZone({ onLogout }: { onLogout: () => void }) {
  return (
    <section className="space-y-3 border-t pt-4">
      <h2 className="text-lg font-semibold">账号</h2>
      <Button variant="outline" onClick={onLogout}>
        退出登录
      </Button>
    </section>
  );
}
