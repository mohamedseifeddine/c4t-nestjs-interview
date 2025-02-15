export enum Role {
  Admin = 'admin',
  User = 'user',
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

