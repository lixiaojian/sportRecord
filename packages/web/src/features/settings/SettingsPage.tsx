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
import { Card, CardContent, CardFooter } from '../../components/ui/card';
import { FieldGroup } from '../../components/ui/field';
import { FormField } from '../../components/ui/form-field';
import { FormTextarea } from '../../components/ui/form-textarea';
import { FormSelect } from '../../components/ui/form-select';
import { Grid } from '../../components/ui/layout';

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
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-4">
            <FieldGroup>
              <FormField
                id="nickname"
                label="昵称"
                error={errors.nickname?.message}
                register={register('nickname')}
              />
              <FormField
                id="avatar"
                label="头像 URL"
                placeholder="https://…"
                error={errors.avatar?.message}
                register={register('avatar')}
              />
              <FormTextarea
                id="bio"
                label="简介"
                error={errors.bio?.message}
                register={register('bio')}
              />
              <Grid colsMd={2} gap={3}>
                <FormSelect
                  id="racketHand"
                  label="持拍手"
                  register={register('racketHand')}
                  options={[
                    { value: '', label: '未设置' },
                    ...RACKET_HAND_VALUES.map((h) => ({ value: h, label: RACKET_HAND_LABELS[h] })),
                  ]}
                />
                <FormSelect
                  id="mainEvent"
                  label="主项"
                  register={register('mainEvent')}
                  options={[
                    { value: '', label: '未设置' },
                    ...MAIN_EVENT_VALUES.map((m) => ({ value: m, label: MAIN_EVENT_LABELS[m] })),
                  ]}
                />
              </Grid>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('defaultPublic')} />
                默认公开我发布的记录
              </label>
              {serverError && <div className="text-xs text-destructive">{serverError}</div>}
              {saved && <p className="text-sm text-emerald-600">已保存</p>}
            </FieldGroup>
          </CardContent>
          <CardFooter className="px-4 pb-4 pt-0">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? '保存中…' : '保存资料'}
            </Button>
          </CardFooter>
        </form>
      </Card>
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
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="p-4">
            <FieldGroup>
              <FormField
                id="oldPassword"
                label="旧密码"
                type="password"
                error={errors.oldPassword?.message}
                register={register('oldPassword')}
              />
              <FormField
                id="newPassword"
                label="新密码"
                type="password"
                hint="至少 8 位，需含字母与数字"
                error={errors.newPassword?.message}
                register={register('newPassword')}
              />
              {serverError && <div className="text-xs text-destructive">{serverError}</div>}
              {saved && <p className="text-sm text-emerald-600">密码已修改</p>}
            </FieldGroup>
          </CardContent>
          <CardFooter className="px-4 pb-4 pt-0">
            <Button type="submit" disabled={change.isPending}>
              {change.isPending ? '提交中…' : '修改密码'}
            </Button>
          </CardFooter>
        </form>
      </Card>
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
