import { GatewayIntentBits, REST } from 'discord.js';
import { Module } from '@nestjs/common';
import { DsBotService } from './dsBot.service';
import { CommandHandler } from './command.handler';
import { GptModule } from '../gpt/gpt.module';

@Module({
	imports: [GptModule],
	controllers: [],
	providers: [DsBotService, CommandHandler],
	exports: [DsBotService],
})
export class DsBotModule {
}