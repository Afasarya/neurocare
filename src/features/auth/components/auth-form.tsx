"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  loginSchema,
  registrationSchema,
  type LoginInput,
  type RegistrationInput,
} from "@/features/auth/auth.contract";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath: string;
  initialError?: string;
};

type ApiResponse = {
  ok: boolean;
  message?: string;
  next?: string;
  requiresEmailConfirmation?: boolean;
};

type AuthFormValues = {
  email: string;
  password: string;
  confirmPassword?: string;
  next?: string;
};

export function AuthForm({ mode, nextPath, initialError }: AuthFormProps) {
  const isRegister = mode === "register";
  const [serverMessage, setServerMessage] = useState(initialError ?? "");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(isRegister ? registrationSchema : loginSchema),
    defaultValues: {
      email: "",
      password: "",
      ...(isRegister ? { confirmPassword: "" } : {}),
      next: nextPath,
    },
  });

  async function onSubmit(values: LoginInput | RegistrationInput) {
    setServerMessage("");
    setConfirmationSent(false);

    try {
      const response = await fetch(`/api/auth/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.ok) {
        setServerMessage(result.message ?? "Permintaan belum berhasil. Coba lagi.");
        return;
      }

      if (result.requiresEmailConfirmation) {
        setConfirmationSent(true);
        return;
      }

      window.location.assign(result.next ?? "/app/dashboard");
    } catch {
      setServerMessage("Tidak dapat terhubung. Periksa koneksi lalu coba lagi.");
    }
  }

  const emailError = form.formState.errors.email?.message;
  const passwordError = form.formState.errors.password?.message;
  const confirmationError = isRegister
    ? form.formState.errors.confirmPassword?.message
    : undefined;

  if (confirmationSent) {
    return (
      <div className="rounded-3xl border border-neuro-olive/50 bg-neuro-green/50 p-6" role="status">
        <h2 className="text-xl font-semibold text-neuro-slate">Periksa email kamu</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Tautan konfirmasi telah diminta. Setelah mengonfirmasi email, kamu akan diarahkan kembali ke NeuroCare.
        </p>
        <Link href="/login" className="primary-action mt-5">Kembali ke halaman masuk</Link>
      </div>
    );
  }

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {serverMessage ? (
        <div className="rounded-2xl bg-[#fff1f1] p-4 text-sm text-[#8b2028]" role="alert">
          {serverMessage}
        </div>
      ) : null}

      <div>
        <label htmlFor={`${mode}-email`} className="text-sm font-semibold text-neuro-slate">Email</label>
        <input
          id={`${mode}-email`}
          type="email"
          autoComplete="email"
          className="field-control mt-2"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? `${mode}-email-error` : undefined}
          {...form.register("email")}
        />
        {emailError ? <p id={`${mode}-email-error`} className="mt-2 text-sm text-destructive">{emailError}</p> : null}
      </div>

      <div>
        <label htmlFor={`${mode}-password`} className="text-sm font-semibold text-neuro-slate">Kata sandi</label>
        <input
          id={`${mode}-password`}
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          className="field-control mt-2"
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? `${mode}-password-error` : undefined}
          {...form.register("password")}
        />
        {passwordError ? <p id={`${mode}-password-error`} className="mt-2 text-sm text-destructive">{passwordError}</p> : null}
      </div>

      {isRegister ? (
        <div>
          <label htmlFor="register-confirm-password" className="text-sm font-semibold text-neuro-slate">Ulangi kata sandi</label>
          <input
            id="register-confirm-password"
            type="password"
            autoComplete="new-password"
            className="field-control mt-2"
            aria-invalid={Boolean(confirmationError)}
            aria-describedby={confirmationError ? "register-confirm-password-error" : undefined}
            {...form.register("confirmPassword")}
          />
          {confirmationError ? <p id="register-confirm-password-error" className="mt-2 text-sm text-destructive">{confirmationError}</p> : null}
        </div>
      ) : null}

      <input type="hidden" {...form.register("next")} />
      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-neuro-slate px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
      >
        {form.formState.isSubmitting ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
        {isRegister ? "Buat akun" : "Masuk"}
        {!form.formState.isSubmitting ? <ArrowRight className="size-4" aria-hidden="true" /> : null}
      </button>
    </form>
  );
}
