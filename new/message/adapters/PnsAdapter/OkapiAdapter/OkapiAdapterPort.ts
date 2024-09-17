
export interface OkapiAdapterPort{
    getTokenFromOkapi():Promise<string>
}