import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('/docs')
  redirect(@Res() res) {
    return res.redirect('/docs');
  } 
  @Get('/')
  getHello(): string {
    return 'Hello World :D !';
  }
}
