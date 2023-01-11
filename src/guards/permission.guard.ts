import { Injectable, CanActivate, ExecutionContext} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { MovieService } from 'src/movie/movie.service';
import { Types } from 'mongoose';
import { Role } from 'src/auth/interfaces/user.interface';



@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private userService:UserService,private movieService:MovieService) {}

  getUser(id:Types.ObjectId) { 
    return this.userService.getUser(id)
  }
  getMovie(id:Types.ObjectId) { 
    return this.movieService.findById(id)
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const role = await this.getUser(request.auth.user).then(user => {
      return user.role;
    })
    const creator = await this.getMovie(request.params.id).then(movie => {  
      return movie.created_by;
    })
    if(role !== Role.User){
      return true
    } 
    if(role === Role.User){
      return creator.toString() === request.auth.user // only author has permission 
    }
  }
}
