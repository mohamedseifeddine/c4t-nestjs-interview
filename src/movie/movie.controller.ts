import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags,ApiParam } from '@nestjs/swagger';
import { CreateMovieDto, UpdateMovieDto} from './movie.dto';
import { MovieService } from './movie.service';
import { ResponseObject } from '../abstract/response.object';
import { Movie } from './movie.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from '../guards/roles.decorator';
import { Role } from '../auth/interfaces/user.interface';
import { PermissionGuard } from '../guards/permission.guard';

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


  @Patch('update/:id')
  @Roles(Role.Admin,Role.User)
  @UseGuards(JwtAuthGuard,RoleGuard,PermissionGuard)
  @ApiParam({ name: 'id', type: String })
  async updateMovie(
    @Request() req,
    @Body() UpdateMovieDto: UpdateMovieDto,
  ): Promise<ResponseObject<Movie>> { 
    const data = await this.movieService.updateMovie(
      req.params.id,
      UpdateMovieDto,
    );
    return new ResponseObject('MOVIE_UPDATED', data);
  }

  @Delete('delete/:id')
  @Roles(Role.Admin,Role.User)
  @UseGuards(JwtAuthGuard,RoleGuard,PermissionGuard)
  @ApiParam({ name: 'id', type: String })
  async deleteMovie(
    @Request() req,
  ): Promise<ResponseObject<Movie>> { 
    const data = await this.movieService.deleteMovie(req.params.id);
    return new ResponseObject('MOVIE_DELETED', data);
  }

}
