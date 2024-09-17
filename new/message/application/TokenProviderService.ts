// WIP: either we will implement only factory design pattenr or we will associte with one of behavioral Design Patterns
export class TokenProviderService {
  createTOkenProvider(provider: string) {
    switch (provider) {
      case "odi":
        break;
      case "okapi":
        break;
      default:
        throw new Error("No service provider match");
    }
  }
}
