import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CreateMovieDto} from './movie.dto';
import { MovieService } from './movie.service';
import { ResponseObject } from '../abstract/response.object';
import { Movie } from './movie.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@Controller('movie')
@ApiTags('Movie')
export class MovieController {
  constructor(private movieService: MovieService) {}

  
  @Get('')
  async listAllMovies(
  ): Promise<ResponseObject<Movie[]>> {
    const data = await this.movieService.find()
    return new ResponseObject('MOVIES_FOUND', data);
  } 

  @UseGuards(JwtAuthGuard)
  @Post('')
  async createMovie(
    @Body() movie: CreateMovieDto,
    @Request() req,
  ): Promise<ResponseObject<Movie>> {
    const data = await this.movieService.createMovie(req.auth.user, movie);    
    return new ResponseObject('MOVIE_CREATED', data);
  }


}
