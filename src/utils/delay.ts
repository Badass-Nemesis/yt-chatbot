// Function to introduce a delay in execution
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
