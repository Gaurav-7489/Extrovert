"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Pencil, Save, X, Loader2 } from "lucide-react";
import { updateProfileIdentity, type IdentityUpdateState } from "./identity-actions";

interface Identity {
  displayName: string;
  dateOfBirth: string;
  gender: string;
  identityType: string;
  institutionName: string | null;
  fieldOfStudy: string | null;
  department: string | null;
  academicYear: string | null;
  jobTitle: string | null;
  employerName: string | null;
  roleDescription: string | null;
  verificationStatus: string | null;
}

export function IdentityEditor({ identity }: { identity: Identity }) {
  const router = useRouter();
  const verified = identity.verificationStatus === "verified";
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<IdentityUpdateState, FormData>(
    updateProfileIdentity,
    {}
  );
  const [name, setName] = useState(identity.displayName);
  const [dob, setDob] = useState(identity.dateOfBirth);
  const [gender, setGender] = useState(identity.gender);
  const [institution, setInstitution] = useState(identity.institutionName ?? "");
  const [field, setField] = useState(identity.fieldOfStudy ?? "");
  const [department, setDepartment] = useState(identity.department ?? "");
  const [year, setYear] = useState(identity.academicYear ?? "");
  const [job, setJob] = useState(identity.jobTitle ?? "");
  const [employer, setEmployer] = useState(identity.employerName ?? "");
  const [role, setRole] = useState(identity.roleDescription ?? "");

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  const student = identity.identityType === "student";
  const professional = identity.identityType === "professional";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-bold text-zinc-700 shadow-2xs transition hover:border-[#550000]/30 hover:text-[#550000] active:scale-95 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-200 dark:hover:border-[#550000]/40 dark:hover:text-red-400"
      >
        <Pencil className="h-3 w-3" />
        <span>Update</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100000] grid place-items-center bg-black/60 p-3 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-zinc-200/90 bg-white p-5 shadow-2xl transition-colors no-scrollbar dark:border-white/10 dark:bg-[#121216] sm:p-6 font-sans">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#550000] dark:text-red-400">
                  Profile details
                </p>
                <h2 className="mt-0.5 text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                  Update your details
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800 dark:bg-[#1a1a22] dark:text-zinc-400 dark:hover:bg-[#242430] dark:hover:text-zinc-200"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {state.error && (
              <div className="mt-4 rounded-2xl border border-rose-200/90 bg-rose-50/90 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                {state.error}
              </div>
            )}

            <form action={action} className="mt-5 space-y-4">
              <div className="rounded-2xl border border-[#550000]/20 bg-[#550000]/5 p-3.5 text-[11px] leading-relaxed text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/15 dark:text-red-300">
                {verified
                  ? "Official ID verification is complete. Name, gender, and date of birth are permanently locked."
                  : "Name, gender, and date of birth can be updated freely until official ID verification is completed."}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2 block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Name
                  </span>
                  <input
                    name="display_name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={verified}
                    className="mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-bold text-zinc-900 transition focus:border-[#550000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#550000]/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Gender
                  </span>
                  <select
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={verified}
                    className="mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-bold text-zinc-900 transition focus:border-[#550000] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                  >
                    <option value="man">Man</option>
                    <option value="woman">Woman</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Date of birth
                  </span>
                  <input
                    name="date_of_birth"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    disabled={verified}
                    className="mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-bold text-zinc-900 transition focus:border-[#550000] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#550000]/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                  />
                </label>
              </div>

              {student && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      College / university
                    </span>
                    <input
                      name="institution_name"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-bold text-zinc-900 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Course / department
                    </span>
                    <input
                      name="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-bold text-zinc-900 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Field of study
                    </span>
                    <input
                      name="field_of_study"
                      value={field}
                      onChange={(e) => setField(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-bold text-zinc-900 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Academic year
                    </span>
                    <select
                      name="academic_year"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-bold text-zinc-900 transition focus:border-[#550000] focus:outline-none dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                    >
                      <option value="">Not set</option>
                      <option value="1st-year">1st year</option>
                      <option value="2nd-year">2nd year</option>
                      <option value="3rd-year">3rd year</option>
                      <option value="4th-year">4th year</option>
                      <option value="5th-year">5th year</option>
                      <option value="postgraduate">Postgraduate</option>
                    </select>
                  </label>
                </div>
              )}

              {professional && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Job / role
                    </span>
                    <input
                      name="job_title"
                      value={job}
                      onChange={(e) => setJob(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-bold text-zinc-900 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                    />
                  </label>

                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Company / organisation
                    </span>
                    <input
                      name="employer_name"
                      value={employer}
                      onChange={(e) => setEmployer(e.target.value)}
                      className="mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-bold text-zinc-900 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                    />
                  </label>

                  <label className="sm:col-span-2 block">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      About the role
                    </span>
                    <textarea
                      name="role_description"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      rows={3}
                      className="mt-1.5 w-full resize-none rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3 text-xs font-medium text-zinc-900 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                    />
                  </label>
                </div>
              )}

              {!student && !professional && (
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    What you do
                  </span>
                  <textarea
                    name="role_description"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-2xl border border-zinc-200/90 bg-zinc-50/70 p-3 text-xs font-medium text-zinc-900 transition focus:border-[#550000] focus:bg-white focus:outline-none dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100 dark:focus:border-[#550000]"
                  />
                </label>
              )}

              <button
                type="submit"
                disabled={pending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#550000]/30 bg-[#550000] text-xs font-bold text-white shadow-md shadow-[#550000]/25 transition hover:bg-[#680202] active:scale-[0.98] disabled:opacity-50 dark:bg-[#550000] dark:hover:bg-[#6e0303]"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save changes</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {verified && (
        <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[9px] font-bold text-zinc-500 shadow-2xs dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
          <LockKeyhole className="h-3 w-3 text-[#550000] dark:text-red-400" />
          <span>ID verified fields locked</span>
        </span>
      )}
    </>
  );
}