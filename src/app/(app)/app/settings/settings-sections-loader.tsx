"use client";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
const DevicePreferences=dynamic(()=>import("@/components/settings/device-preferences").then(m=>m.DevicePreferences),{ssr:false});
const CredentialsPanel=dynamic(()=>import("./credentials-panel").then(m=>m.CredentialsPanel),{ssr:false});
const SettingsControls=dynamic(()=>import("./settings-controls").then(m=>m.SettingsControls),{ssr:false});
const DeleteAccount=dynamic(()=>import("./delete-account").then(m=>m.DeleteAccount),{ssr:false});
interface BlockedProfile{id:string;display_name:string;department:string}
export function SettingsSectionsLoader({hasPassword,currentEmail,initialGhostMode,blockedUsers,isPro}:{hasPassword:boolean;currentEmail:string;initialGhostMode:boolean;blockedUsers:BlockedProfile[];isPro:boolean}){return <div className="space-y-3"><DevicePreferences/>{hasPassword&&<CredentialsPanel currentEmail={currentEmail} hasPassword={hasPassword}/>}<SettingsControls initialGhostMode={initialGhostMode} blockedUsers={blockedUsers} isPro={isPro}/><DeleteAccount/><div className="flex items-center justify-center pt-1 text-[9px] text-zinc-400"><Loader2 className="mr-1.5 h-3 w-3 animate-spin"/>Account controls load on demand</div></div>}
