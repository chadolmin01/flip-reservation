"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { colorForUser } from "@/lib/colors";
import { CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { loginOrRegister } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<{ id: string; isNew: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pin.length !== 4 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { user, isNew } = await loginOrRegister(name.trim(), pin);
      setResult({ id: user.employeeId, isNew });
      setTimeout(() => router.replace("/"), 1300);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다");
      setSubmitting(false);
    }
  }

  if (result) {
    const c = colorForUser(result.id);
    return (
      <div className="mx-auto max-w-[420px] px-6 py-20 text-center">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ background: `${c.fill}1a` }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: c.fill }} />
        </div>
        <h1 className="text-display-xl text-ink">
          {result.isNew ? "사번이 발급되었습니다" : "다시 오셨네요"}
        </h1>
        <p className="text-body-md text-muted mt-2">
          {name}님의 사번은 <span className="font-medium text-ink">{result.id}</span> 입니다.
        </p>
        <p className="text-caption-sm text-muted mt-1">
          다음 로그인부터 같은 이름·PIN으로 같은 사번이 유지됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[420px] px-6 py-16">
      <div className="text-center mb-10">
        <Image
          src="/flip-mark.png"
          alt="FLIP"
          width={56}
          height={56}
          priority
          className="mx-auto mb-4 w-14 h-14 object-contain"
        />
        <h1 className="text-display-xl text-ink">안녕하세요!</h1>
        <p className="text-body-md text-muted mt-2">
          이름과 4자리 PIN을 입력해 로그인해 보세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block">
          <span className="block text-caption-sm text-muted mb-1.5">이름</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="w-full h-12 rounded-sm border border-hairline px-3.5 text-body-md placeholder:text-muted-soft focus:outline-none focus:border-2 focus:border-ink focus:px-[13px] transition"
          />
        </label>

        <div>
          <span className="block text-caption-sm text-muted mb-1.5 text-center">PIN · 4자리 숫자</span>
          <PinInput value={pin} onChange={setPin} />
        </div>

        {error && (
          <p className="text-caption-sm text-error text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={!name.trim() || pin.length !== 4 || submitting}
          className="w-full h-12 rounded-sm bg-rausch text-white text-button-md hover:bg-rausch-active disabled:bg-rausch-disabled transition"
        >
          {submitting ? "확인 중…" : "시작하기"}
        </button>

        <p className="text-caption-sm text-muted text-center pt-2">
          기존 사용자는 같은 이름·PIN으로 다시 로그인합니다.
        </p>
      </form>
    </div>
  );
}

function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(i: number, digit: string) {
    const d = digit.replace(/\D/g, "").slice(-1);
    const chars = [...value.padEnd(4, " ")];
    chars[i] = d || " ";
    const next = chars.join("").trimEnd().slice(0, 4);
    onChange(next);
    if (d && i < 3) refs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (digits.length > 0) {
      e.preventDefault();
      onChange(digits);
      refs.current[Math.min(digits.length, 3)]?.focus();
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-14 h-16 rounded-sm border border-hairline text-center text-display-md text-ink focus:outline-none focus:border-2 focus:border-ink tabular-nums"
        />
      ))}
    </div>
  );
}
