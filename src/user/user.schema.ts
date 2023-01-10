import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { AbstractModel } from '../abstract/abstract.model';
export enum Role {
  Admin = 'admin',
  User = 'user',
}

@Schema({
  timestamps: true,
})
export class User extends AbstractModel {
  @Prop({
    type: SchemaTypes.String,
    required: true,
  })
  email: string;

  @Prop({ type: SchemaTypes.String, required: true })
  password: string;
  @Prop({ required: true, enum: Role })
  role: Role;
}

const UserSchema = SchemaFactory.createForClass(User);

export { UserSchema };
