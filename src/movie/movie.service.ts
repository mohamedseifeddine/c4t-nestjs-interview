import { Inject, Injectable } from '@nestjs/common';
import { AbstractService } from '../abstract/abstract.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { Movie } from './movie.schema';
import { CreateMovieDto, UpdateMovieDto} from './movie.dto';


@Injectable()
export class MovieService extends AbstractService<Movie> {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<Movie>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super(movieModel, logger);
  }
  protected modelName = Movie.name;

  async getMovie(id:Types.ObjectId): Promise<Movie> {
    return await this.findById(id);
  }

  async createMovie(user: Types.ObjectId, movie: CreateMovieDto): Promise<Movie> {
    const data = await this.create({
      ...movie,
      created_by:user,
    });

    return data;
  }
  async updateMovie(id:Types.ObjectId, movie: UpdateMovieDto): Promise<Movie> {
    return await this.findByIdAndUpdate(id, movie, { new: true })
}
  async deleteMovie(id:Types.ObjectId): Promise<Movie> {
      return await this.findByIdAndDelete(id);
  }

}
