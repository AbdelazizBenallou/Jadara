import { postData } from "./http";

export function submitRegistrationDemand(formData: FormData): Promise<void> {
  return postData<void>("/registration-demands", formData);
}
