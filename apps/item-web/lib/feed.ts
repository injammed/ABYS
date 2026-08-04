export type FeedLane = "aetimm" | "slatra" | "unjudged";

export type AiOrigin = {
  declaredByCreator: boolean;
  generator?: string;
  model?: string;
  provenanceNote: string;
  confidence: "declared" | "metadata-supported" | "reviewed";
};

export type FeedArtifact = {
  id: string;
  title: string;
  creator: string;
  lane: FeedLane;
  summary: string;
  modalLead: string;
  aiOrigin: AiOrigin;
  gradient: string;
  score: number;
};

export const seedArtifacts: FeedArtifact[] = [
  {
    id: "ITEM-SEED-0001",
    title: "The First Solar Reliquary",
    creator: "AETIMM Genesis",
    lane: "aetimm",
    summary: "A symbolic archive designed to preserve a civilization's memory through stellar decline.",
    modalLead: "Symbolic · Visual · Narrative",
    aiOrigin: {
      declaredByCreator: true,
      generator: "Generative image system",
      provenanceNote: "AI-generated seed artifact with human-directed doctrine and curation.",
      confidence: "reviewed"
    },
    gradient: "radial-gradient(circle at 50% 42%, #fff1a8 0 2%, #d7a52b 3%, #3b2606 18%, #060606 54%), conic-gradient(from 40deg, #070707, #6d4b0e, #070707)",
    score: 94
  },
  {
    id: "SLOP-SEED-0001",
    title: "Infinite Golden Space Crown #88421",
    creator: "Anonymous Swarm",
    lane: "slatra",
    summary: "High spectacle, duplicate composition, no provenance, no doctrine, no reason to persist.",
    modalLead: "Visual-only residue",
    aiOrigin: {
      declaredByCreator: true,
      generator: "Unknown image model",
      provenanceNote: "AI origin declared; process and authorship context absent.",
      confidence: "declared"
    },
    gradient: "radial-gradient(circle at 50% 18%, #d1bd79 0 1%, #5b4d1f 2%, transparent 22%), repeating-radial-gradient(ellipse at center, #0a0d09 0 9px, #313421 10px 12px)",
    score: 18
  },
  {
    id: "ITEM-SEED-0002",
    title: "Black-Hole Civic Memory Loom",
    creator: "Public Canon Lab",
    lane: "unjudged",
    summary: "A full-mode proposal linking image, civic doctrine, orbital simulation, and archival interface.",
    modalLead: "Simulation · Interface · Symbolic",
    aiOrigin: {
      declaredByCreator: true,
      generator: "Multimodal model stack",
      provenanceNote: "AI-generated structure with human-provided diagrams, text fragments, and selection history.",
      confidence: "metadata-supported"
    },
    gradient: "radial-gradient(circle at 48% 46%, #000 0 13%, #a56f21 14%, #1b120a 17%, #030303 39%), repeating-conic-gradient(from 15deg, #030303 0 8deg, #34210d 9deg 10deg)",
    score: 71
  },
  {
    id: "SLOP-SEED-0002",
    title: "Hypercosmic Divine Luxury Portal",
    creator: "Prompt Farm 7",
    lane: "slatra",
    summary: "Keyword pileup, derivative luxury cues, no coherent modal hierarchy, engagement-bait title.",
    modalLead: "Engagement bait",
    aiOrigin: {
      declaredByCreator: true,
      generator: "Image generator",
      provenanceNote: "AI-generated; no reliable generation log supplied.",
      confidence: "declared"
    },
    gradient: "linear-gradient(135deg, #050505 0 30%, #6c3d00 31%, #f6c247 34%, #241300 39%, #050505 70%), radial-gradient(circle, #fff, transparent 30%)",
    score: 9
  }
];

export function makeFeedBatch(batch: number): FeedArtifact[] {
  return seedArtifacts.map((artifact, index) => ({
    ...artifact,
    id: `${artifact.id}-${batch}-${index}`,
    score: Math.max(0, Math.min(100, artifact.score + ((batch + index) % 7) - 3))
  }));
}
