import type {Metadata} from "next";
import {SiteHeader} from "@/components/SiteHeader";
import {PrimaryNavigation} from "@/components/PrimaryNavigation";
import {ApyocEye} from "@/components/ApyocEye";
export const metadata:Metadata={title:"Apyoc · The Eye Remains Open · AETIMM",description:"The Eye of Apyoc. Examine machine activity, declared objectives and gaps in visibility. An observation prototype by AETIMM."};
export default function ApyocPage(){return <main className="about-page"><SiteHeader mode="apyoc"/><ApyocEye/><PrimaryNavigation mode="apyoc"/></main>;}
