import { Injectable } from '@nestjs/common';

@Injectable()
export class CommandHandler{
	handle(cmd: string){
		console.log(cmd);
	}
}