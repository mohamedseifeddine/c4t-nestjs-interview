import { Inject, Injectable } from '@nestjs/common';
import { AbstractService } from '../abstract/abstract.service';
import { User } from './user.schema';
import { Model, Types } from 'mongoose';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './user.dto';

@Injectable()
export class UserService extends AbstractService<User> {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {
    super(userModel, logger);
  }
  protected modelName = User.name;

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.create(createUserDto);
  }

}
