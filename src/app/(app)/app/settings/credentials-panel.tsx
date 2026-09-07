"use client";

import { useId, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";

interface CredentialsPanelProps {
  currentEmail: string;
  hasPassword: boolean;
}

function Message({
  type,
  text,
}: {
  type: "success" | "error";
  text: string;
}) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-2xl border p-3 text-xs font-semibold transition-colors ${
        type === "success"
          ? "border-[#550000]/20 bg-[#550000]/5 text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/15 dark:text-red-300"
          : "border-rose-200/90 bg-rose-50/90 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/25 dark:text-rose-300"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#550000] dark:text-red-400" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
      )}
      <span className="leading-relaxed">{text}</span>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <div className="space-y-1.5 font-sans">
      <label
        htmlFor={id}
        className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-3 pr-11 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#550000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#550000]/15 dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-[#550000] dark:focus:bg-[#121216]"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          {visible ? (
            <EyeOff className="h-3.5 w-3.5" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

export function CredentialsPanel({
  currentEmail,
  hasPassword,
}: CredentialsPanelProps) {
  const emailId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const [email, setEmail] = useState(currentEmail);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function changeEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (emailLoading) return;
    const nextEmail = email.trim().toLowerCase();
    setEmailMessage(null);

    if (!nextEmail) {
      setEmailMessage({
        type: "error",
        text: "Enter the new email address.",
      });
      return;
    }
    if (nextEmail === currentEmail.trim().toLowerCase()) {
      setEmailMessage({
        type: "error",
        text: "That is already your current email address.",
      });
      return;
    }

    setEmailLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ email: nextEmail });
      if (error) {
        setEmailMessage({
          type: "error",
          text: `We couldn't change your email: ${error.message}`,
        });
        return;
      }
      setEmailMessage({
        type: "success",
        text: "Check your email to confirm the change. Your current email stays active until confirmation is complete.",
      });
    } catch {
      setEmailMessage({
        type: "error",
        text: "Something went wrong while changing your email. Please try again.",
      });
    } finally {
      setEmailLoading(false);
    }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordLoading) return;
    setPasswordMessage(null);

    if (hasPassword && !currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Enter your current password.",
      });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Your new password must be at least 8 characters.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "The new passwords do not match.",
      });
      return;
    }
    if (hasPassword && newPassword === currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Your new password must be different from the current password.",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const supabase = createClient();
      if (hasPassword) {
        const { error } = await supabase.auth.signInWithPassword({
          email: currentEmail,
          password: currentPassword,
        });
        if (error) {
          setPasswordMessage({
            type: "error",
            text: "Your current password is incorrect.",
          });
          return;
        }
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        setPasswordMessage({
          type: "error",
          text: `We couldn't ${
            hasPassword ? "change" : "set"
          } your password: ${error.message}`,
        });
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setPasswordMessage({
        type: "success",
        text: hasPassword
          ? "Your password was changed successfully."
          : "Password added. You can now sign in with your email and password.",
      });
    } catch {
      setPasswordMessage({
        type: "error",
        text: "Something went wrong while updating your password. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <section className="space-y-6 rounded-[1.75rem] border border-zinc-200/90 bg-white p-4 shadow-2xs transition-colors dark:border-white/10 dark:bg-[#121216] sm:p-5">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-950 dark:text-zinc-50 sm:text-base">
          <Lock className="h-4 w-4 text-[#550000] dark:text-red-400" />
          <span>Account credentials</span>
        </h2>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          Manage your DateBu login credentials securely.
        </p>
      </div>

      {/* Email Change Section */}
      <form onSubmit={changeEmail} className="space-y-3 font-sans">
        <div className="space-y-1.5">
          <label
            htmlFor={emailId}
            className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
          >
            Email address
          </label>
          <div className="relative">
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailMessage(null);
              }}
              autoComplete="email"
              disabled={emailLoading}
              className="w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-3 pr-11 text-xs text-zinc-900 placeholder:text-zinc-400 transition focus:border-[#550000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#550000]/15 disabled:opacity-60 dark:border-white/10 dark:bg-[#141419] dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-[#550000] dark:focus:bg-[#121216]"
            />
            <Mail className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={
            emailLoading ||
            !email.trim() ||
            email.trim().toLowerCase() === currentEmail.trim().toLowerCase()
          }
          className="w-full rounded-2xl border border-[#550000]/30 bg-[#550000] py-3 text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-[0.98] disabled:opacity-50 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
        >
          {emailLoading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              <span>Updating email…</span>
            </>
          ) : (
            "Change email"
          )}
        </Button>

        {emailMessage && (
          <Message type={emailMessage.type} text={emailMessage.text} />
        )}
      </form>

      <div className="border-t border-zinc-100 dark:border-white/5" />

      {/* Password Change Section */}
      <form onSubmit={changePassword} className="space-y-3 font-sans">
        <div>
          <h3 className="text-xs font-bold text-zinc-950 dark:text-zinc-100 sm:text-sm">
            {hasPassword ? "Change password" : "Set a password"}
          </h3>
          <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            {hasPassword
              ? "Enter your current password before choosing a new one."
              : "Add a password so you can also use email login."}
          </p>
        </div>

        {hasPassword && (
          <PasswordField
            id={currentPasswordId}
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            visible={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            autoComplete="current-password"
          />
        )}

        <PasswordField
          id={newPasswordId}
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          visible={showNew}
          onToggle={() => setShowNew((v) => !v)}
          autoComplete="new-password"
        />

        <PasswordField
          id={confirmPasswordId}
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={showConfirm}
          onToggle={() => setShowConfirm((v) => !v)}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          disabled={
            passwordLoading ||
            newPassword.length < 8 ||
            !confirmPassword ||
            (hasPassword && !currentPassword)
          }
          className="w-full rounded-2xl border border-[#550000]/30 bg-[#550000] py-3 text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-[0.98] disabled:opacity-50 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
        >
          {passwordLoading ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              <span>Updating password…</span>
            </>
          ) : hasPassword ? (
            "Change password"
          ) : (
            "Set password"
          )}
        </Button>

        {passwordMessage && (
          <Message type={passwordMessage.type} text={passwordMessage.text} />
        )}
      </form>
    </section>
  );
}