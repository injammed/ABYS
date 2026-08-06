# AETIMM Museum Interaction Model

## Purpose

The Museum is the deliberate counter-environment to the Slop Trough.

```txt
Trough: succession
Museum: orientation

Trough: vertical infinity
Museum: bounded spatial choice

Trough: judge and continue
Museum: select, inspect, compare, return
```

The Museum must not be implemented as a second ArtifactFeed with different colors.

---

## Primary Interaction Grammar

A Museum visitor should be able to:

1. enter a room;
2. see a bounded arrangement of works;
3. move sideways or spatially between neighboring works;
4. select one work;
5. open a detail surface;
6. inspect provenance, revisions, traits, lineage, and preservation evidence;
7. close the detail surface;
8. return to the exact room position;
9. move into another room or return to the Trough.

The interface should preserve orientation throughout this sequence.

---

## Candidate Structures

The first implementation may use one or combine several of these patterns:

### Rooms

Named spaces organized by artifact domain, canon purpose, or exhibition thesis.

Examples:

- Image
- Film
- Sound
- Writing
- Code
- Mathematics
- Simulation
- Physical Design
- Currency
- Mechanism

### Walls

A bounded horizontal sequence of works. Arrow keys, buttons, swipe, or drag move between neighboring works.

### Shelves

Grouped artifact families, editions, revisions, or related lineages.

### Cases

Focused displays for one complex artifact with selectable layers or components.

### Books

Page- or chapter-based navigation for text-heavy, procedural, mathematical, or historical collections.

### Maps

A visible overview of rooms, clusters, or artifact lineage. The visitor can always identify the current location.

---

## Interaction Requirements

- No endless vertical discovery feed.
- No unknown-position infinite carousel.
- No autoplay that moves the visitor without consent.
- Every selection has a clear close or back action.
- Opening an artifact preserves the visitor's prior room and position.
- Keyboard, touch, pointer, and assistive technology receive equivalent navigation.
- Reduced-motion mode removes spatial animation without removing spatial structure.
- URLs or durable state should identify rooms and selected artifacts where practical.
- Museum entry and exit should preserve the visitor's prior Trough lane and scroll position.

---

## Information Hierarchy

### Room level

- room title;
- curatorial thesis;
- number and arrangement of works;
- neighboring rooms;
- current position.

### Work level

- artifact title and creator;
- medium and preserved form;
- preservation reason;
- provenance confidence;
- revision and lineage summary;
- traits or contributions that entered the wider canon;
- controls to inspect, compare, or close.

### Deep evidence level

- append-only artifact events;
- curator decisions and notes where publishable;
- source lineage;
- transformations and revisions;
- licenses, attribution, and commercial permissions where applicable;
- physical-digital edition information where applicable.

---

## First Museum Fold

The first real Museum implementation should be deliberately bounded:

```txt
Museum entrance
→ three rooms
→ finite works per room
→ horizontal movement
→ open/close artifact detail
→ return to exact position
→ return to Trough
```

It should prove the interaction contrast before attempting a massive institution.

---

## Acceptance Test

A new visitor should feel the mode change immediately:

```txt
Trough: one more artifact
Museum: where am I, what is this, what is beside it?
```

The Museum succeeds when discovery feels deliberate rather than compulsive, while remaining fluid enough that exploration does not become work.
