import { apiFetch, apiMutate, type Paginated } from "@/lib/api";

import type { Candidate, CandidateInput } from "./types";

/** Candidatos del usuario autenticado, más recientes primero. */
export function getCandidates(): Promise<Paginated<Candidate>> {
  return apiFetch<Paginated<Candidate>>("/candidates/", { cache: "no-store" });
}

export function getCandidate(id: number): Promise<Candidate> {
  return apiFetch<Candidate>(`/candidates/${id}/`, { cache: "no-store" });
}

export function createCandidate(input: CandidateInput): Promise<Candidate> {
  return apiMutate<Candidate>("/candidates/", "POST", input);
}

export function updateCandidate(
  id: number,
  patch: Partial<CandidateInput>,
): Promise<Candidate> {
  return apiMutate<Candidate>(`/candidates/${id}/`, "PATCH", patch);
}

export function deleteCandidate(id: number): Promise<void> {
  return apiMutate<void>(`/candidates/${id}/`, "DELETE");
}

export function setCandidateStatus(
  id: number,
  status: string,
): Promise<Candidate> {
  return apiMutate<Candidate>(`/candidates/${id}/`, "PATCH", {
    tracking_status: status,
  });
}

export function archiveCandidate(id: number): Promise<Candidate> {
  return apiMutate<Candidate>(`/candidates/${id}/archive/`, "POST");
}

export function unarchiveCandidate(id: number): Promise<Candidate> {
  return apiMutate<Candidate>(`/candidates/${id}/unarchive/`, "POST");
}

export function favoriteCandidate(id: number): Promise<Candidate> {
  return apiMutate<Candidate>(`/candidates/${id}/favorite/`, "POST");
}

export function unfavoriteCandidate(id: number): Promise<Candidate> {
  return apiMutate<Candidate>(`/candidates/${id}/unfavorite/`, "POST");
}
