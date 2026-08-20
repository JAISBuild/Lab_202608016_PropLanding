"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getMessages } from "@/lib/api";
import { AdminShell } from "@/components/AdminShell";

type MessageRow = {
  id: string;
  channel: string;
  methodLabel: string;
  recipient: string;
  subject: string | null;
  body: string;
  status: string;
  provider: string | null;
  sentAt: string | null;
  createdAt: string;
  errorMessage?: string | null;
  inquiry?: { id: string; fullName: string } | null;
};

export default function MessagesPage() {
  const ready = useAuth();
  const [items, setItems] = useState<MessageRow[]>([]);

  useEffect(() => {
    if (!ready) return;
    getMessages().then((d) => setItems(d as MessageRow[]));
  }, [ready]);

  if (!ready) return null;

  return (
    <AdminShell>
      <h1>안내 발송 로그</h1>
      <p className="lead">문의 접수 시 자동으로 보낸 카카오톡 채널·문자 내역입니다.</p>
      <table className="data-table">
        <thead>
          <tr>
            <th>일시</th>
            <th>고객</th>
            <th>방법</th>
            <th>수신</th>
            <th>상태</th>
            <th>내용</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.id}>
              <td>
                {new Date(m.sentAt ?? m.createdAt).toLocaleString("ko-KR", {
                  timeZone: "Asia/Seoul",
                })}
              </td>
              <td>
                {m.inquiry ? (
                  <Link href={`/inquiries/${m.inquiry.id}`}>{m.inquiry.fullName}</Link>
                ) : (
                  "—"
                )}
              </td>
              <td>
                {m.methodLabel}
                {m.provider ? ` (${m.provider})` : ""}
              </td>
              <td>{m.recipient}</td>
              <td>
                <span className={`badge badge-${m.status}`}>{m.status}</span>
              </td>
              <td>
                <details>
                  <summary>{m.subject ?? "본문 보기"}</summary>
                  <pre className="message-body">{m.body}</pre>
                  {m.errorMessage ? <p className="error-text">{m.errorMessage}</p> : null}
                </details>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <p className="empty">발송 기록이 없습니다.</p>}
    </AdminShell>
  );
}
