import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { AbstractModel } from '../abstract/abstract.model';

@Schema({
  timestamps: true,
  autoIndex: true,
  autoCreate: true,
})
export class Auth extends AbstractModel {
  @Prop({
    type: SchemaTypes.String,
    required: true,
  })
  email: string;

  @Prop({ type: SchemaTypes.String, required: true })
  password: string;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'Users',
    index: true,
    required: true,
  })
  user: Types.ObjectId;
}

const AuthSchema = SchemaFactory.createForClass(Auth);
AuthSchema.index(
  { email: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
export { AuthSchema };
