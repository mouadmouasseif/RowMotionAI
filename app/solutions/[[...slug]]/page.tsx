import { PublicRoute } from "@/components/public/PublicRoute";
export default async function Page({params}:{params:Promise<{slug?:string[]}>}){const {slug=[]}=await params;return <PublicRoute path={["solutions",...slug].join("/")}/>;}
