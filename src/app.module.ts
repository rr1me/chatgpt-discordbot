import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DsBotModule } from './dsbot/dsBot.module';
import { DsBotService } from './dsbot/dsBot.service';

@Module({
	imports: [ConfigModule.forRoot({
		isGlobal: true,
		envFilePath: 'keys.env'
	}), DsBotModule],
	controllers: [],
	providers: [],
})
export class AppModule implements OnModuleInit {
	constructor(private readonly dsBotService: DsBotService) {
	}

	async onModuleInit(): Promise<any> {
		await this.dsBotService.init();
	}
}
