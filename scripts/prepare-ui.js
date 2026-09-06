const fs = require("fs");
const path = require("path");

const root = process.cwd();

function patch(relativePath, transform) {
  const filePath = path.join(root, relativePath);
  let source = fs.readFileSync(filePath, "utf8");
  const next = transform(source);
  if (next !== source) {
    fs.writeFileSync(filePath, next);
    console.log(`[prepare-ui] patched ${relativePath}`);
  }
}

// Explore is intentionally a fixed, non-interactive viewport over the three
// supported areas. Coordinates are projected against the fixed OSM bbox.
patch("src/app/(app)/app/social/explore-map.tsx", (source) => source
  .replace(
    /const anchors:Record<string,\{left:number;top:number\}>=\{[^;]+\};/,
    'const anchors:Record<string,{left:number;top:number}>={Waknaghat:{left:38.16,top:48.81},Solan:{left:46.68,top:79.19},Shimla:{left:77.36,top:14.58}};'
  )
  .replace(
    'className="absolute inset-0 h-full w-full border-0" loading="lazy"',
    'className="pointer-events-none absolute inset-0 h-full w-full border-0" loading="lazy"'
  )
);

// Discover: make the swipe gesture high-sensitivity while retaining a
// deliberate final threshold so accidental taps do not pass/like profiles.
patch("src/app/(app)/app/discover/discover-client.tsx", (source) => source
  .replace('useTransform(x,[-260,0,260],[-13,0,13])', 'useTransform(x,[-220,0,220],[-16,0,16])')
  .replace('useTransform(x,[30,120], [0,1])', 'useTransform(x,[12,55], [0,1])')
  .replace('useTransform(x,[-120,-30],[1,0])', 'useTransform(x,[-55,-12],[1,0])')
  .replace('dragElastic={.18}', 'dragElastic={.32}')
  .replace('Math.abs(i.offset.x)>120', 'Math.abs(i.offset.x)>55')
  .replace(
    '{area&&<span className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/15 px-2.5 py-1.5 text-[9px] font-black backdrop-blur"><MapPin className="h-3 w-3"/>{profile.area_name||"Area verified"}</span>}',
    '{area&&<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-500/85 px-2.5 py-1.5 text-[9px] font-black text-white shadow-lg backdrop-blur"><MapPin className="h-3 w-3"/>Area verified{profile.area_name?` · ${profile.area_name}`:""}</span>}'
  )
);

// Pass verification state into the profile editor. Name/DOB/gender are
// editable before identity verification and locked after verification.
patch("src/app/(app)/app/profile/setup/page.tsx", (source) => source.replace(
  'areaName:area?.name??""}}/>',
  'areaName:area?.name??"",identityVerified:identity.verification_status==="verified"}}/>'
));

patch("src/app/(app)/app/profile/setup/profile-form-loader.tsx", (source) => source.replace(
  'areaName?:string}',
  'areaName?:string;identityVerified?:boolean}'
));

patch("src/app/(app)/app/profile/setup/dating-profile-form.tsx", (source) => {
  let next = source.replace(
    'areaName?:string}interface Props',
    'areaName?:string;identityVerified?:boolean}interface Props'
  );

  const identityCardPattern = /<Card className="p-4 sm:p-5"><Title icon=\{<ShieldCheck className="h-4 w-4 text-emerald-600"\/>\} title="Who are you\?"[\s\S]*?<\/Card>/;
  const identityCard = `<Card className="p-4 sm:p-5"><Title icon={<ShieldCheck className="h-4 w-4 text-emerald-600"/>} title="Who are you?" subtitle={identity.identityVerified?"Government-ID verified details are locked so nobody can alter verified identity information.":"Your identity is editable until verification. Once your government ID is verified, name, age and gender become locked."}/><div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">{identity.identityVerified?<><ReadOnly label="Verified name" value={identity.displayName}/><ReadOnly label="Verified age" value={identity.dateOfBirth?String(new Date().getFullYear()-new Date(identity.dateOfBirth).getFullYear()):"Not set"}/><ReadOnly label="Verified gender" value={identity.gender}/></>:<><label className="block"><span className="label">Name</span><input name="display_name" required maxLength={80} defaultValue={identity.displayName} className="input mt-2"/></label><label className="block"><span className="label">Date of birth</span><input name="date_of_birth" required type="date" defaultValue={identity.dateOfBirth} className="input mt-2"/></label><label className="block"><span className="label">Gender</span><select name="gender" required defaultValue={identity.gender} className="input mt-2"><option value="">Choose gender</option><option value="man">Man</option><option value="woman">Woman</option><option value="non-binary">Non-binary</option><option value="other">Other</option></select></label></>}<ReadOnly label="Type" value={identity.identityType}/><ReadOnly label="Area" value={identity.areaName??"Area not set"}/></div><div className="mt-2.5 rounded-2xl border border-border bg-muted/20 px-3 py-2.5 text-[10px] leading-4 text-muted-foreground">{identity.identityVerified?"Verified identity details are controlled by the verification record. Other dating details remain editable.":"You can correct your name, date of birth or gender now. Verification will lock those three fields to the government-ID result."}</div></Card>`;
  next = next.replace(identityCardPattern, identityCard);

  const contextPattern = /<Card className="p-4 sm:p-5"><Title icon=\{isStudent\?<GraduationCap className="h-4 w-4 text-emerald-600"\/>:<Briefcase className="h-4 w-4 text-emerald-600"\/>\} title=\{contextTitle\}[\s\S]*?<\/Card>/;
  const contextCard = `<Card className="p-4 sm:p-5"><Title icon={isStudent?<GraduationCap className="h-4 w-4 text-emerald-600"/>:<Briefcase className="h-4 w-4 text-emerald-600"/>} title={contextTitle} subtitle="Academic/work context can be edited as part of your dating profile."/>{isStudent?<div className="grid grid-cols-2 gap-2.5"><ReadOnly label="College / university" value={identity.institutionName??"Verified campus"}/><label><span className="label">Course / department</span><input name="department" defaultValue={identity.department??""} className="input mt-2"/></label><label><span className="label">Academic year</span><select name="academic_year" defaultValue={identity.academicYear??""} className="input mt-2"><option value="">Prefer not to say</option><option value="1st-year">1st year</option><option value="2nd-year">2nd year</option><option value="3rd-year">3rd year</option><option value="4th-year">4th year</option><option value="5th-year">5th year</option><option value="postgraduate">Postgraduate</option></select></label><ReadOnly label="Field of study" value={identity.fieldOfStudy??"Not set"}/></div>:identity.identityType==="professional"?<div className="grid grid-cols-2 gap-2.5"><ReadOnly label="Job / role" value={identity.jobTitle??"Not set"}/><ReadOnly label="Company / organisation" value={identity.employerName??"Not set"}/></div>:<ReadOnly label="What you do" value={identity.roleDescription??"Not set"}/>}</Card>`;
  next = next.replace(contextPattern, contextCard);
  return next;
});

// Server-side enforcement: browser-submitted identity values are accepted only
// while verification is not complete. Once verified, the database identity wins.
patch("src/app/(app)/app/profile/setup/actions.ts", (source) => {
  let next = source;
  next = next.replace(
    'const dob=String(identity.date_of_birth??"");const age=',
    'const identityVerified=identity.verification_status==="verified";const submittedName=String(formData.get("display_name")??"").trim();const submittedDob=String(formData.get("date_of_birth")??"").trim();const submittedGender=String(formData.get("gender")??"").trim();const submittedDepartment=String(formData.get("department")??"").trim();const submittedAcademicYear=String(formData.get("academic_year")??"").trim();const effectiveName=identityVerified?String(identity.display_name??""):submittedName||String(identity.display_name??"");const effectiveDob=identityVerified?String(identity.date_of_birth??""):submittedDob||String(identity.date_of_birth??"");const effectiveGender=identityVerified?String(identity.gender??""):submittedGender||String(identity.gender??"");const effectiveDepartment=submittedDepartment||String(identity.department??"");const effectiveAcademicYear=submittedAcademicYear||String(identity.academic_year??"");const dob=effectiveDob;const age='
  );
  next = next.replace(
    'const bio=String(formData.get("bio")??"").trim();',
    'if(!effectiveName||!effectiveDob||!effectiveGender)return{error:"Name, date of birth and gender are required."};if(!["man","woman","non-binary","other","prefer-not-to-say"].includes(effectiveGender))return{error:"Please choose a valid gender."};const bio=String(formData.get("bio")??"").trim();'
  );
  next = next.replace(
    'const campusResidency=',
    'if(!identityVerified){const {error:identityUpdateError}=await supabase.from("extrovert_profiles").update({display_name:effectiveName,date_of_birth:effectiveDob,gender:effectiveGender,department:effectiveDepartment||null,academic_year:effectiveAcademicYear||null,updated_at:new Date().toISOString()}).eq("id",user.id);if(identityUpdateError)return{error:"We could not update your identity details. Please try again."};}const campusResidency='
  );
  next = next.replace(
    'display_name:identity.display_name,date_of_birth:identity.date_of_birth,gender:identity.gender,department:identity.department,academic_year:identity.academic_year,',
    'display_name:effectiveName,date_of_birth:effectiveDob,gender:effectiveGender,department:effectiveDepartment||null,academic_year:effectiveAcademicYear||null,'
  );
  return next;
});
