import type { Metadata } from 'next';
import MatterSandbox from './sandbox';
export const metadata: Metadata = {title:'AETIMM Matter Engine — Browser Prototype'};
export default function Page(){return <MatterSandbox/>;}
