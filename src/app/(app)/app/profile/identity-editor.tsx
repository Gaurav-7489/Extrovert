"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Save, X, Loader2, ShieldCheck, MapPin, ArrowRight } from "lucide-react";
import { updateProfileIdentity, type IdentityUpdateState } from "./identity-actions";

interface Identity { displayName: string; dateOfBirth: string; gender: string; identityType: string; institutionName: string | null; fieldOfStudy: string | null; department: string | null; academicYear: string | null; jobTitle: string | null; employerName: string | null; roleDescription: string | null; verificationStatus: string | null; areaVerificationStatus?: string | null; }

export function IdentityEditor({ identity }: { identity: Identity }) {
  const router = useRouter(); const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<IdentityUpdateState, FormData>(updateProfileIdentity, {});
  const [name, setName] = useState(identity.displayName); const [dob, setDob] = useState(identity.dateOfBirth); const [gender, setGender] = useState(identity.gender);
  const [institution, setInstitution] = useState(identity.institutionName ?? ""); const [field, setField] = useState(identity.fieldOfStudy ?? ""); const [department, setDepartment] = useState(identity.department ?? ""); const [year, setYear] = useState(identity.academicYear ?? ""); const [job, setJob] = useState(identity.jobTitle ?? ""); const [employer, setEmployer] = useState(identity.employerName ?? ""); const [role, setRole] = useState(identity.roleDescription ?? "");
  useEffect(() => { if (state.success) { setOpen(false); router.refresh(); } }, [state.success, router]);
  const student = identity.identityType === "student"; const professional = identity.identityType === "professional";
  const faceVerified = identity.verificationStatus === "verified";
  const areaVerified = identity.areaVerificationStatus === "verified";
  const input = "mt-1.5 w-full rounded-2xl border border-zinc-200/90 bg-zinc-50/70 px-3.5 py-2.5 text-xs font-bold text-zinc-900 outline-none focus:border-[#550000] dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-100";
  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-bold text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-[#16161d] dark:text-zinc-200"><Pencil className="h-3 w-3" />Update</button>
    {open && <div className="fixed inset-0 z-[100000] grid place-items-center bg-black/60 p-3 backdrop-blur-xs"><div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[2rem] border border-zinc-200/90 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#121216] sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#550000] dark:text-red-400">Profile details</p><h2 className="mt-0.5 text-xl font-bold tracking-tight dark:text-zinc-50">Update your details</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5 text-zinc-500" /></button></div>
      <div className="mt-4 rounded-2xl border border-[#550000]/20 bg-[#550000]/5 p-3.5 text-[11px] leading-relaxed text-[#550000] dark:border-[#550000]/30 dark:bg-[#550000]/15 dark:text-red-300">Face verification confirms a live person is behind the account. It does not lock your profile details or require a government document.</div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/verification?from=profile" onClick={() => setOpen(false)} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 transition hover:border-[#550000]/30 dark:border-white/10 dark:bg-[#16161d]">
          <div className="flex items-center gap-2"><ShieldCheck className={`h-4 w-4 ${faceVerified ? "text-emerald-500" : "text-[#550000] dark:text-red-400"}`} /><span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">Face verification</span></div>
          <p className="mt-1 text-[9px] leading-4 text-zinc-500 dark:text-zinc-400">{faceVerified ? "Verified · review" : "Verify now or later"}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-[#550000] dark:text-red-400">{faceVerified ? "Review" : "Verify"}<ArrowRight className="h-3 w-3" /></span>
        </Link>
        <Link href="/verification?from=profile" onClick={() => setOpen(false)} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 transition hover:border-[#550000]/30 dark:border-white/10 dark:bg-[#16161d]">
          <div className="flex items-center gap-2"><MapPin className={`h-4 w-4 ${areaVerified ? "text-emerald-500" : "text-[#550000] dark:text-red-400"}`} /><span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">Area verification</span></div>
          <p className="mt-1 text-[9px] leading-4 text-zinc-500 dark:text-zinc-400">{areaVerified ? "Verified · refresh" : "Verify your current area"}</p>
          <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-[#550000] dark:text-red-400">{areaVerified ? "Refresh" : "Verify"}<ArrowRight className="h-3 w-3" /></span>
        </Link>
      </div>
      {state.error && <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{state.error}</div>}
      <form action={action} className="mt-5 space-y-4">
        <label className="block"><span className="text-[10px] font-bold uppercase text-zinc-500">Name</span><input name="display_name" value={name} onChange={e=>setName(e.target.value)} className={input} maxLength={80} /></label>
        <div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-bold uppercase text-zinc-500">Gender</span><select name="gender" value={gender} onChange={e=>setGender(e.target.value)} className={input}><option value="man">Man</option><option value="woman">Woman</option><option value="non-binary">Non-binary</option><option value="other">Other</option><option value="prefer-not-to-say">Prefer not to say</option></select></label><label><span className="text-[10px] font-bold uppercase text-zinc-500">Date of birth</span><input name="date_of_birth" type="date" value={dob} onChange={e=>setDob(e.target.value)} className={input} /></label></div>
        {student && <div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-bold uppercase text-zinc-500">College / university</span><input name="institution_name" value={institution} onChange={e=>setInstitution(e.target.value)} className={input} /></label><label><span className="text-[10px] font-bold uppercase text-zinc-500">Course / department</span><input name="department" value={department} onChange={e=>setDepartment(e.target.value)} className={input} /></label><label><span className="text-[10px] font-bold uppercase text-zinc-500">Field of study</span><input name="field_of_study" value={field} onChange={e=>setField(e.target.value)} className={input} /></label><label><span className="text-[10px] font-bold uppercase text-zinc-500">Academic year</span><select name="academic_year" value={year} onChange={e=>setYear(e.target.value)} className={input}><option value="">Not set</option><option value="1st-year">1st year</option><option value="2nd-year">2nd year</option><option value="3rd-year">3rd year</option><option value="4th-year">4th year</option><option value="5th-year">5th year</option><option value="postgraduate">Postgraduate</option></select></label></div>}
        {professional && <div className="grid grid-cols-2 gap-3"><label><span className="text-[10px] font-bold uppercase text-zinc-500">Job / role</span><input name="job_title" value={job} onChange={e=>setJob(e.target.value)} className={input} /></label><label><span className="text-[10px] font-bold uppercase text-zinc-500">Company / organisation</span><input name="employer_name" value={employer} onChange={e=>setEmployer(e.target.value)} className={input} /></label><label className="col-span-2"><span className="text-[10px] font-bold uppercase text-zinc-500">About the role</span><textarea name="role_description" value={role} onChange={e=>setRole(e.target.value)} rows={3} className={input} /></label></div>}
        {!student && !professional && <label><span className="text-[10px] font-bold uppercase text-zinc-500">What you do</span><textarea name="role_description" value={role} onChange={e=>setRole(e.target.value)} rows={3} className={input} /></label>}
        <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#550000] text-xs font-bold text-white disabled:opacity-50">{pending ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />Save changes</>}</button>
      </form>
    </div></div>}
  </>;
}
