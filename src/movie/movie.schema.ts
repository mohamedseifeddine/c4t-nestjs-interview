import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes} from 'mongoose';
import { AbstractModel } from '../abstract/abstract.model';
import { GenderEnum} from './interfaces/movie.interface';


@Schema({
  timestamps: true,
})
export class Movie extends AbstractModel {
  @Prop({ required: true, type: SchemaTypes.String })
  title: string;
  @Prop({ required: true, type: SchemaTypes.String })
  description: string;
  @Prop({ required: true, type: SchemaTypes.Date })
  releaseDate: Date;
  @Prop({ required: true, type: SchemaTypes.Number })
  rating: number;
  @Prop({ required: true, enum: GenderEnum, })
  gender: GenderEnum;
  @Prop({ required: true, type: SchemaTypes.Array })
  actors: Array<string>;
  @Prop({ required: true, type: SchemaTypes.String })
  poster: string;
  @Prop({ required: true, type: SchemaTypes.ObjectId })
  created_by: string;
}

const MovieSchema = SchemaFactory.createForClass(Movie);

export { MovieSchema };
