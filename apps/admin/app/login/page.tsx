"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      await login(String(fd.get("email")), String(fd.get("password")));
      router.push("/");
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Control Tower</h1>
        <p className="login-sub">admin@demo.local / admin1234</p>
        <label>
          이메일
          <input name="email" type="email" defaultValue="admin@demo.local" required />
        </label>
        <label>
          비밀번호
          <input name="password" type="password" defaultValue="admin1234" required />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </main>
  );
}
