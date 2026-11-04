import { dashboardRepository } from "./dashboard.repository.js";

export const dashboardService = {
  getSummary: async () => {
    return dashboardRepository.getSummary();
  },
};
