export enum Role {
  Admin = 'admin',
  Customer = 'customer',
}

type User = {
  id: string;
  userName: string;
  password: string;
  role: Role;
};

export class AccessTokenResponseType {
  access_token: string;
}

