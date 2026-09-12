import type {Metadata} from "next";
import {SiteHeader} from "@/components/SiteHeader";
import {PrimaryNavigation} from "@/components/PrimaryNavigation";
import {ArgusEye} from "@/components/ArgusEye";
export const metadata:Metadata={title:"Argus · The Eye Remains Open · AETIMM",description:"The Eye of Argus. Examine machine activity, declared objectives and gaps in visibility. An observation prototype by AETIMM."};
export default function ArgusPage(){return <main className="about-page"><SiteHeader mode="argus"/><ArgusEye/><PrimaryNavigation mode="argus"/></main>;}
