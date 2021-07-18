import { Controller, Get, Header, Param, Res } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/identicon/:name')
  @Header('content-type', 'image/png')
  @Header('accept-ranges', 'bytes')
  @Header('Cache-Control', 'public, max-age=' + 30 * 24 * 60 * 60)
  async identicon(@Res() res, @Param('name') name) {
    const _identiconBuffer = await this.appService.identicon(
      name.toLocaleLowerCase()
    )
    res.send(_identiconBuffer)
  }
}
