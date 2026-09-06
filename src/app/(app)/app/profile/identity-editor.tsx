"use client";

import { useActionState, useEffect, useState } from "react";
import { LockKeyhole, Pencil, Save, X } from "lucide-react";
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
  const verified = identity.verificationStatus === "verified";
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<IdentityUpdateState, FormData>(updateProfileIdentity, {});
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
    if (state.success) setOpen(false);
  }, [state.success]);

  const student = identity.identityType === "student";
  const professional = identity.identityType === "professional";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-black text-zinc-700 transition hover:border-emerald-200 hover:text-emerald-700"
      >
        <Pencil className="h-3 w-3" />
        Update
      </button>

      {open && (
        <div className="fixed inset-0 z-[100000] grid place-items-center bg-zinc-950/40 p-3 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-600">Profile details</p>
                <h2 className="mt-1 text-xl font-black">Update your details</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-zinc-100 text-zinc-500" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            {state.error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">{state.error}</div>}
            {state.success && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">Updated.</div>}

            <form action={action} className="mt-5 space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 text-[10px] leading-4 text-emerald-900/75">
                {verified ? "Your official ID verification is complete. Name, gender and date of birth are locked to the verified identity." : "Name, gender and date of birth can be changed until official ID verification is completed."}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Name</span><input name="display_name" value={name} onChange={e => setName(e.target.value)} disabled={verified} className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500" /></label>
                <label><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Gender</span><select name="gender" value={gender} onChange={e => setGender(e.target.value)} disabled={verified} className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500"><option value="man">Man</option><option value="woman">Woman</option><option value="non-binary">Non-binary</option></select></label>
                <label><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Date of birth</span><input name="date_of_birth" type="date" value={dob} onChange={e => setDob(e.target.value)} disabled={verified} className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500" /></label>
              </div>

              {student && <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">College / university</span><input name="institution_name" value={institution} onChange={e => setInstitution(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm font-bold" /></label>
                <label><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Course / department</span><input name="department" value={department} onChange={e => setDepartment(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm font-bold" /></label>
                <label><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Field of study</span><input name="field_of_study" value={field} onChange={e => setField(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm font-bold" /></label>
                <label><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Academic year</span><select name="academic_year" value={year} onChange={e => setYear(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm font-bold"><option value="">Not set</option><option value="1st-year">1st year</option><option value="2nd-year">2nd year</option><option value="3rd-year">3rd year</option><option value="4th-year">4th year</option><option value="5th-year">5th year</option><option value="postgraduate">Postgraduate</option></select></label>
              </div>}

              {professional && <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Job / role</span><input name="job_title" value={job} onChange={e => setJob(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm font-bold" /></label>
                <label><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Company / organisation</span><input name="employer_name" value={employer} onChange={e => setEmployer(e.target.value)} className="mt-1.5 w-full rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm font-bold" /></label>
                <label className="sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">About the role</span><textarea name="role_description" value={role} onChange={e => setRole(e.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm font-bold" /></label>
              </div>}

              {!student && !professional && <label><span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">What you do</span><textarea name="role_description" value={role} onChange={e => setRole(e.target.value)} rows={3} className="mt-1.5 w-full resize-none rounded-2xl border border-zinc-200 px-3 py-2.5 text-sm font-bold" /></label>}

              <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-xs font-black text-white shadow-lg disabled:opacity-60">
                {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Save className="h-4 w-4" />}
                {pending ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {verified && <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1.5 text-[9px] font-bold text-zinc-500"><LockKeyhole className="h-3 w-3" />ID verified fields locked</span>}
    </>
  );
}
