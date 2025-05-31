import { create } from "zustand";

interface PresentationState {
  currentStep: number;
  isPresenting: boolean;
  setStep: (step: number) => void;
  startPresentation: () => void;
  stopPresentation: () => void;
}

export const usePresentationStore = create<PresentationState>((set) => ({
  currentStep: 0,
  isPresenting: false,
  setStep: (step) => set({ currentStep: step }),
  startPresentation: () => set({ isPresenting: true, currentStep: 0 }),
  stopPresentation: () => set({ isPresenting: false }),
}));
