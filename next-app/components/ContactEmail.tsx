"use client";

import { useState } from "react";

export function ContactEmail({ email }: { email: string }) {
  const [message, setMessage] = useState("");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setMessage("メールアドレスをコピーしました。");
    } catch {
      setMessage("コピーできませんでした。上のメールアドレスを選択してコピーしてください。");
    }
  };
  return (
    <div className="contact-email">
      <p className="contact-email__address"><a href={`mailto:${email}`}>{email}</a></p>
      <button type="button" className="support-text-button" onClick={copy}>メールアドレスをコピー</button>
      <p className="contact-email__status" role="status">{message}</p>
      <a className="support-button" href={`mailto:${email}`}>メールを送る <span aria-hidden="true">↗</span></a>
    </div>
  );
}
