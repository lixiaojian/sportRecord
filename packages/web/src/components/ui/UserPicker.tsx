import { useEffect, useRef, useState } from 'react';
import type { UserSearchItem } from '@sport-record/shared';
import { useUserSearch } from '../../features/match/hooks';
import { Field, FieldLabel, FieldError } from './field';
import { cn } from '../../lib/utils';

interface SingleProps {
  mode: 'single';
  value: string | null;
  onChange: (id: string | null) => void;
}

interface MultipleProps {
  mode: 'multiple';
  value: string[];
  onChange: (ids: string[]) => void;
}

interface CommonProps {
  label: string;
  placeholder?: string;
  error?: string;
  /** 选中的用户 id → 展示名映射（用于回显已选用户） */
  selectedMap?: Record<string, { username: string; nickname: string }>;
}

type Props = CommonProps & (SingleProps | MultipleProps);

/**
 * 用户搜索选择器：输入关键字 → 下拉候选 → 选中。
 * single 用于搭档（1 个），multiple 用于对手（多个）。
 * 已选用户通过 selectedMap 回显名称（避免只有 id）。
 */
export function UserPicker(props: Props) {
  const { label, placeholder, error, selectedMap } = props;
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const { data, isFetching } = useUserSearch(q.trim());

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const candidates = data ?? [];

  function displayName(u: { username: string; nickname: string }) {
    return u.nickname ? `${u.nickname}（${u.username}）` : u.username;
  }

  function isSelected(id: string) {
    return props.mode === 'single' ? props.value === id : props.value.includes(id);
  }

  function pick(u: UserSearchItem) {
    if (props.mode === 'single') {
      props.onChange(u.id);
      setOpen(false);
      setQ('');
    } else {
      if (!props.value.includes(u.id)) props.onChange([...props.value, u.id]);
    }
  }

  function removeSingle() {
    if (props.mode === 'single') props.onChange(null);
  }

  function removeMultiple(id: string) {
    if (props.mode === 'multiple') props.onChange(props.value.filter((v) => v !== id));
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>

      {props.mode === 'single' && props.value && selectedMap?.[props.value] && (
        <div className="flex items-center gap-2 rounded-md border bg-accent/40 px-3 py-1.5 text-sm">
          <span>{displayName(selectedMap[props.value])}</span>
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground"
            onClick={removeSingle}
          >
            ×
          </button>
        </div>
      )}

      {props.mode === 'multiple' && props.value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {props.value.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1 rounded-md border bg-accent/40 px-2 py-1 text-xs"
            >
              {selectedMap?.[id] ? displayName(selectedMap[id]) : id.slice(0, 8)}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => removeMultiple(id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div ref={boxRef} className="relative">
        <input
          value={q}
          placeholder={placeholder}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {open && q.trim() && (
          <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
            {isFetching && <div className="px-3 py-2 text-sm text-muted-foreground">搜索中…</div>}
            {!isFetching && candidates.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">无匹配用户</div>
            )}
            {candidates.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={isSelected(u.id)}
                onClick={() => pick(u)}
                className={cn(
                  'block w-full px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-40',
                  isSelected(u.id) && 'cursor-not-allowed',
                )}
              >
                {displayName(u)}
              </button>
            ))}
          </div>
        )}
      </div>
      <FieldError>{error}</FieldError>
    </Field>
  );
}
