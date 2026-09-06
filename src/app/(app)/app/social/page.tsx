import type {Metadata} from "next";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import ExplorePlans from "./explore-plans";

export const metadata:Metadata={title:"Explore | Extrovert"};

export default async function ExplorePage(){
 const supabase=await createServerSupabaseClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user)return null;
 return <ExplorePlans/>;
}
