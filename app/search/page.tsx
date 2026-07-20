import { PublicRoute } from "@/components/public/PublicRoute";
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){return <PublicRoute path="search" query={(await searchParams).q ?? ""}/>;}
