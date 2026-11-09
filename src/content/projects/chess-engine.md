---
title: 'A small chess engine'
description: 'An example project notebook for building a chess engine from first principles: rules, search, evaluation, and a little patience.'
date: 2026-10-20
tags: [algorithms, software-engineering]
status: Idea
visual: chess
example: true
featured: true
---

## The question

What would it take to build a chess engine that is small enough to understand from end to end? This example project brief lays out a possible approach. There is no completed engine or benchmark attached to it.

## Scope and starting point

Begin with a command-line program and a clear position representation. The first milestone is a correct move generator, including castling, en passant, and promotion. Search comes after rules are dependable.

- Represent a position and apply legal moves.
- Verify move generation against established perft positions.
- Add a simple evaluation function and fixed-depth negamax.
- Compare alpha-beta search with the unpruned version.
- Add a UCI interface only when the core is stable.

## Design notes

Keep the position representation independent from search policy. A direct array-based board makes debugging approachable. Bitboards are an alternative worth considering after profiling identifies a reason to change.

The companion note, [A chess engine starts with a question](../../writing/chess-search/), walks through the basic search loop.

## What success would look like

The first useful result would be a reproducible test suite, legal play, and documented design decisions. Playing strength is a later question. Record the hardware, search depth, time budget, and test positions alongside any future measurements.

## Open questions

How should terminal states be scored? What is the simplest undo strategy that remains correct? When does a transposition table become worth the extra bookkeeping?

A real project entry can add repository and demo URLs in frontmatter. The layout will show those links automatically.
